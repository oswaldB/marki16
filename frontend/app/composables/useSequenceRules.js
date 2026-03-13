import { useDynamicOptions } from '~/composables/useDynamicOptions'

export function useSequenceRules(parse) {
  const toast = useToast()
  const { getOptions } = useDynamicOptions()

  // ── State ────────────────────────────────────────────────────
  const groupesRegles = ref([])
  const attributionAutomatique = ref(false)
  const validationObligatoire = ref(false)

  const apercuConcernes = ref(0)
  const apercuExclus = ref(0)
  const impayesConcernes = ref([])
  const showImpayesTable = ref(false)

  const optionsPourChamps = ref({
    payeur_type: [],
    statut: [],
    statut_dossier: [],
    ville: [],
    code_postal: []
  })

  // ── Options dynamiques ────────────────────────────────────────
  async function loadOptionsForChamp(champ, regle) {
    try {
      const numericFields = ['reste_a_payer']
      if (numericFields.includes(champ)) {
        regle.options = []
        return
      }
      const options = await getOptions(champ, false)
      regle.options = options
    } catch (error) {
      console.error(`Failed to load options for ${champ}:`, error)
      regle.options = []
    }
  }

  async function loadAllOptions() {
    for (const groupe of groupesRegles.value) {
      for (const regle of groupe.regles) {
        await loadOptionsForChamp(regle.champ, regle)
      }
    }
  }

  async function chargerOptionsPourChamp(regle) {
    await loadOptionsForChamp(regle.champ, regle)
  }

  // ── Construction de requête Parse (source unique) ─────────────
  function buildImpayeQuery(groupes) {
    const queriesParGroupe = []

    for (const groupe of groupes) {
      const conditions = []

      for (const regle of groupe.regles) {
        if (!regle.champ || regle.valeur === '' || !regle.valeur) continue

        const q = new parse.Query('Impaye')

        switch (regle.operateur) {
          case 'egal':
            Array.isArray(regle.valeur)
              ? q.containedIn(regle.champ, regle.valeur)
              : q.equalTo(regle.champ, regle.valeur)
            break
          case 'different':
            Array.isArray(regle.valeur)
              ? q.notContainedIn(regle.champ, regle.valeur)
              : q.notEqualTo(regle.champ, regle.valeur)
            break
          case 'superieur':
            q.greaterThan(regle.champ, Number(regle.valeur))
            break
          case 'inferieur':
            q.lessThan(regle.champ, Number(regle.valeur))
            break
          case 'contient':
            q.contains(regle.champ, regle.valeur)
            break
          case 'ne_contient_pas':
            q.doesNotMatchKeyInQuery(regle.champ, regle.valeur, new parse.Query('Impaye').contains(regle.champ, regle.valeur))
            break
          case 'commence_par':
            q.startsWith(regle.champ, regle.valeur)
            break
          case 'ne_commence_pas_par':
            q.doesNotMatchKeyInQuery(regle.champ, regle.valeur, new parse.Query('Impaye').startsWith(regle.champ, regle.valeur))
            break
          case 'se_termine_par':
            q.endsWith(regle.champ, regle.valeur)
            break
          case 'ne_se_termine_pas_par':
            q.doesNotMatchKeyInQuery(regle.champ, regle.valeur, new parse.Query('Impaye').endsWith(regle.champ, regle.valeur))
            break
        }

        conditions.push(q)
      }

      if (conditions.length > 0) {
        let groupeFinalQuery = conditions[0]
        for (let i = 1; i < conditions.length; i++) {
          groupeFinalQuery = parse.Query.and(groupeFinalQuery, conditions[i])
        }
        queriesParGroupe.push(groupeFinalQuery)
      }
    }

    if (queriesParGroupe.length === 0) return null

    let finalQuery = queriesParGroupe[0]
    for (let i = 1; i < queriesParGroupe.length; i++) {
      finalQuery = parse.Query.or(finalQuery, queriesParGroupe[i])
    }
    return finalQuery
  }

  // ── Aperçu ────────────────────────────────────────────────────
  async function calculerApercu() {
    try {
      const finalQuery = buildImpayeQuery(groupesRegles.value)

      if (!finalQuery) {
        apercuConcernes.value = 0
        apercuExclus.value = 0
        impayesConcernes.value = []
        return
      }

      const [concernes, total] = await Promise.all([
        finalQuery.count(),
        new parse.Query('Impaye').count(),
      ])
      apercuConcernes.value = concernes
      apercuExclus.value = total - concernes

      if (showImpayesTable.value && concernes > 0) {
        await _chargerImpayesConcernes(finalQuery)
      }
    } catch (err) {
      console.error('Erreur calcul aperçu:', err)
      toast.add({ title: 'Erreur', description: "Impossible de calculer l'aperçu", color: 'red' })
    }
  }

  async function _chargerImpayesConcernes(query) {
    try {
      query.limit(100)
      query.include(['payeur', 'dossier'])
      query.ascending('nfacture')
      const results = await query.find()
      impayesConcernes.value = results.map(impaye => ({
        id: impaye.id,
        nfacture: impaye.get('nfacture') || 'N/A',
        payeur_nom: impaye.get('payeur_nom') || 'Inconnu',
        reste_a_payer: impaye.get('reste_a_payer') || '0',
        date_echeance: impaye.get('date_echeance') || 'N/A',
        statut: impaye.get('statut') || 'inconnu',
        dejaDansSequence: false
      }))
    } catch (err) {
      console.error('Erreur chargement impayés concernés:', err)
      toast.add({ title: 'Erreur', description: 'Impossible de charger les impayés concernés', color: 'red' })
    }
  }

  // ── Watcher unique sur showImpayesTable ───────────────────────
  watch(showImpayesTable, async (newVal) => {
    if (!newVal || apercuConcernes.value === 0) return
    const finalQuery = buildImpayeQuery(groupesRegles.value)
    if (finalQuery) await _chargerImpayesConcernes(finalQuery)
  })

  // ── Debounce sur les règles ───────────────────────────────────
  let debounceTimer = null
  watch(groupesRegles, () => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(calculerApercu, 600)
  }, { deep: true })

  onUnmounted(() => clearTimeout(debounceTimer))

  // ── Manipulation des groupes ──────────────────────────────────
  async function ajouterGroupeRegles() {
    const newRegle = { champ: 'payeur_type', operateur: 'egal', valeur: [], options: [] }
    await loadOptionsForChamp('payeur_type', newRegle)
    groupesRegles.value.push({ logique: 'ET', regles: [newRegle] })
  }

  function supprimerGroupe(groupeIdx) {
    if (groupesRegles.value.length > 1) {
      groupesRegles.value.splice(groupeIdx, 1)
    } else {
      toast.add({ title: 'Avertissement', description: 'Une séquence doit avoir au moins un groupe de règles', color: 'amber' })
    }
  }

  async function ajouterRegleAuGroupe(groupeIdx) {
    const newRegle = { champ: 'payeur_type', operateur: 'egal', valeur: [], options: [] }
    await loadOptionsForChamp('payeur_type', newRegle)
    groupesRegles.value[groupeIdx].regles.push(newRegle)
  }

  function supprimerRegle(groupeIdx, regleIdx) {
    const groupe = groupesRegles.value[groupeIdx]
    if (groupe.regles.length > 1) {
      groupe.regles.splice(regleIdx, 1)
    } else {
      toast.add({ title: 'Avertissement', description: 'Un groupe doit avoir au moins une règle', color: 'amber' })
    }
  }

  return {
    groupesRegles,
    attributionAutomatique,
    validationObligatoire,
    apercuConcernes,
    apercuExclus,
    impayesConcernes,
    showImpayesTable,
    calculerApercu,
    buildImpayeQuery,
    loadAllOptions,
    chargerOptionsPourChamp,
    ajouterGroupeRegles,
    supprimerGroupe,
    ajouterRegleAuGroupe,
    supprimerRegle,
  }
}
