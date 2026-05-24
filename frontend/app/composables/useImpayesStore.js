import { useImpayesStore } from "~/stores/impayesStore";

export function useImpayesStoreComposable() {
    const store = useImpayesStore();
    const { $parse } = useNuxtApp();
    const toast = useToast();
    const route = useRoute();
    const router = useRouter();

    // État local pour les filtres
    const search = ref("");
    const filtreSequence = ref("all");
    const sortColumn = ref("date_piece");
    const sortDirection = ref("desc");

    // Synchroniser la vue active avec l'URL
    const activeView = ref(route.query.vue || "unitaire");

    // Synchroniser filtreSequence avec activeView
    // Quand on est sur la vue "sans-sequence", forcer filtreSequence à "none"
    // Quand on quit la vue "sans-sequence", réinitialiser à "all"
    watch(activeView, (newView) => {
        if (newView === "sans-sequence") {
            filtreSequence.value = "none";
        } else if (filtreSequence.value === "none") {
            filtreSequence.value = "all";
        }
    }, { immediate: true });

    // Synchroniser activeView avec filtreSequence
    // Quand on sélectionne "Sans séquence" dans le filtre, basculer vers la vue
    watch(filtreSequence, (newFiltre) => {
        if (newFiltre === "none" && activeView.value !== "sans-sequence") {
            activeView.value = "sans-sequence";
        }
    });

    // Données réactives
    const impayes = computed(() => {
        return store.viewsData[activeView.value]?.data || [];
    });

    const loading = computed(() => store.loading);
    const sequences = computed(() => store.sequences);
    const sequencesLoading = computed(() => store.sequencesLoading);

    // Charger les données pour la vue active
    async function charger() {
        await store.getViewData(
            activeView.value,
            search.value,
            filtreSequence.value,
            sortColumn.value,
            sortDirection.value,
        );
    }

    // Charger toutes les séquences
    async function chargerSequences() {
        await store.fetchSequences();
    }

    // Gestion du changement de vue
    watch(activeView, async (newView) => {
        // Mettre à jour l'URL avec le paramètre de query
        await router.replace({
            query: {
                ...route.query,
                vue: newView === "unitaire" ? undefined : newView,
            },
        });
        await charger();
    });

    // Synchroniser avec les changements d'URL (ex: retour arrière/avant)
    watch(
        () => route.query.vue,
        (newVue) => {
            const targetView = newVue || "unitaire";
            if (targetView !== activeView.value) {
                activeView.value = targetView;
            }
        },
        { immediate: true },
    );

    // Recherche avec debounce
    let searchTimer = null;
    function onSearchInput() {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            charger();
        }, 400);
    }

    // Tri
    function toggleSortDirection() {
        sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
        charger();
    }

    // Actions sur les impayés
    async function marquerPaye(row) {
        try {
            row._parse.set("statut", "payé");
            await row._parse.save();
            row.statut = "payé";
            toast.add({ title: "Facture marquée comme payée", color: "green" });
            // Rafraîchir les données
            await store.fetchAllImpayes(true);
            await charger();
        } catch (err) {
            toast.add({
                title: "Erreur",
                description: err.message,
                color: "red",
            });
        }
    }

    async function marquerPayesGroupes(selection) {
        try {
            const parseObjs = selection.map((r) => r._parse);
            parseObjs.forEach((o) => o.set("statut", "payé"));
            await $parse.Object.saveAll(parseObjs);
            toast.add({
                title: `${parseObjs.length} facture(s) marquées comme payées`,
                color: "green",
            });
            // Rafraîchir les données
            await store.fetchAllImpayes(true);
            await charger();
        } catch (err) {
            toast.add({
                title: "Erreur",
                description: err.message,
                color: "red",
            });
        }
    }

    async function assignerSequence(impayesCibles, sequenceId) {
        try {
            const cibles = impayesCibles.length
                ? impayesCibles
                : selection.value.map((r) => r._parse);

            for (const impayeObj of cibles) {
                // Mise à jour directe en frontend au lieu d'appeler le cloud
                const sequenceObj =
                    $parse.Object.extend("Sequence").createWithoutData(
                        sequenceId,
                    );
                impayeObj.set("sequence", sequenceObj);
                await impayeObj.save();

                // Mettre à jour directement dans le store pour la réactivité
                const impayeIndex = store.allImpayes.findIndex(
                    (i) => i.objectId === impayeObj.id,
                );
                if (impayeIndex !== -1) {
                    store.allImpayes[impayeIndex] = store.rowToPlain(impayeObj);
                }
            }

            // Créer les relances en utilisant Parse SDK directement pour chaque impayé
            const relancesPromises = cibles.map(async (impayeObj) => {
                try {
                    const Relance = $parse.Object.extend("Relance");
                    const relance = new Relance();
                    const impayePtr = $parse.Object.extend(
                        "Impaye",
                    ).createWithoutData(impayeObj.id);
                    const sequencePtr =
                        $parse.Object.extend("Sequence").createWithoutData(
                            sequenceId,
                        );

                    relance.set("impaye", impayePtr);
                    relance.set("sequence", sequencePtr);
                    relance.set("statut", "En attente de generation");

                    await relance.save();
                    console.log(`Relance créée pour l'impayé ${impayeObj.id}`);
                    return { success: true, relanceId: relance.id };
                } catch (error) {
                    console.error(
                        `Erreur création relance pour ${impayeObj.id}:`,
                        error,
                    );
                    return { success: false, error: error.message };
                }
            });

            // Attendre que toutes les créations de relances soient terminées
            const relancesResults = await Promise.all(relancesPromises);
            const successfulRelances = relancesResults.filter(
                (r) => r.success,
            ).length;

            toast.add({
                title: "Séquence assignée",
                description:
                    successfulRelances > 0
                        ? `${successfulRelances} relance(s) créée(s)`
                        : "Aucune relance créée",
                color: "green",
            });

            // Forcer le rechargement des vues basées sur allImpayes
            for (const viewKey in store.viewsData) {
                store.viewsData[viewKey].loaded = false;
            }

            // Recharger la vue active
            await charger();
        } catch (err) {
            toast.add({
                title: "Erreur",
                description: err.message,
                color: "red",
            });
        }
    }

    // Options pour les sélecteurs
    const sequenceOptions = computed(() => [
        { label: "Toutes les séquences", value: "all" },
        { label: "Sans séquence", value: "none" },
        ...sequences.value.map((s) => ({ label: s.get("nom"), value: s.id })),
    ]);

    const sortOptions = [
        { label: "Date pièce", value: "date_piece" },
        { label: "Montant", value: "reste_a_payer" },
        { label: "Payeur", value: "payeur_nom" },
        { label: "N° Facture", value: "nfacture" },
    ];

    const vues = [
        { key: "unitaire", label: "Unitaire" },
        { key: "payeur", label: "Par payeur" },
        { key: "contact", label: "Par contact" },
        { key: "sans-sequence", label: "Sans séquence" },
    ];

    return {
        // État
        search,
        filtreSequence,
        sortColumn,
        sortDirection,
        activeView,

        // Données
        impayes,
        loading,
        sequences,
        sequencesLoading,

        // Fonctions
        charger,
        chargerSequences,
        onSearchInput,
        toggleSortDirection,
        marquerPaye,
        marquerPayesGroupes,
        assignerSequence,

        // Options
        sequenceOptions,
        sortOptions,
        vues,
    };
}
