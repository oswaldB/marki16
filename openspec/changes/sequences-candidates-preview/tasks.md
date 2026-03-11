## 1. État et fonction

- [ ] 1.1 Dans `sequences/[id].vue`, ajouter les refs : `showCandidatsDrawer`, `candidats`, `candidatsLoading`
- [ ] 1.2 Créer la fonction `chargerCandidats()` : même construction de `finalQuery` que `calculerApercu()`, puis `.limit(100).include('payeur').ascending('nfacture').find()`, mapper les résultats en objets plain `{ objectId, nfacture, payeur, reste_a_payer, statut, sequenceNom }`

## 2. Bouton déclencheur

- [ ] 2.1 Remplacer le `<NuxtLink>` existant ("Voir les X impayés") par un `<UButton>` `variant="ghost"` `color="sky"` `size="xs"` avec `icon="i-heroicons-eye"` et `:loading="candidatsLoading"`, qui déclenche `showCandidatsDrawer = true; chargerCandidats()`

## 3. Drawer

- [ ] 3.1 Ajouter un `<UDrawer v-model:open="showCandidatsDrawer" direction="right">` dans le template, avec un header "Candidats — Règles d'attribution" et le sous-titre `{{ candidats.length }} impayé(s) correspondent aux règles actuelles`
- [ ] 3.2 Dans le body du drawer, afficher un spinner `<UIcon name="i-heroicons-arrow-path" class="animate-spin" />` centré quand `candidatsLoading`
- [ ] 3.3 Afficher un `<UTable>` avec les colonnes : Facture (`nfacture`), Payeur (`payeur`), Montant (`reste_a_payer` formaté en €), Statut (badge `UBadge` coloré : `impayé`→red, `en cours`→amber, `payé`→green), Séquence (badge sky si `sequenceNom`, sinon "—")
- [ ] 3.4 Ajouter une colonne d'action avec `<NuxtLink :to="'/impayes/' + row.objectId" target="_blank">` contenant `<UIcon name="i-heroicons-arrow-top-right-on-square" />`
- [ ] 3.5 Afficher en bas du drawer une note `<p class="text-xs text-gray-400">Limité aux 100 premiers résultats</p>` si `candidats.length >= 100`
