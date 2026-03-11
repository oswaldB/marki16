## Architecture

Tout se passe côté frontend, dans `frontend/app/pages/sequences/[id].vue`. Aucun composant séparé n'est créé car le drawer est spécifique à cette page et sa logique réutilise les refs déjà présentes (`groupesRegles`, `$parse`).

## Modifications dans sequences/[id].vue

### État ajouté

```js
const showCandidatsDrawer = ref(false)
const candidats = ref([])          // Array d'objets plain { objectId, nfacture, payeur, reste_a_payer, statut, sequenceNom }
const candidatsLoading = ref(false)
const candidatsTotal = ref(0)      // = apercuConcernes (déjà calculé)
```

### Fonction chargerCandidats()

Réutilise exactement la même logique de construction de `finalQuery` que `calculerApercu()`, mais appelle `.find()` avec `include: ['payeur']` (limit 100 pour le drawer, sans pagination complexe). Les résultats sont mappés en objets plain pour le template.

```js
async function chargerCandidats() {
  candidatsLoading.value = true
  try {
    // même construction finalQuery que calculerApercu()
    // ...
    finalQuery.limit(100)
    finalQuery.include('payeur')
    finalQuery.ascending('nfacture')
    const results = await finalQuery.find()
    candidats.value = results.map(imp => ({
      objectId: imp.id,
      nfacture: imp.get('nfacture'),
      payeur: imp.get('payeur')?.get('nom') ?? '—',
      reste_a_payer: imp.get('reste_a_payer'),
      statut: imp.get('statut'),
      sequenceNom: imp.get('sequence')?.get('nom') ?? null,
    }))
  } finally {
    candidatsLoading.value = false
  }
}
```

### Bouton déclencheur

Remplace le `<NuxtLink>` existant dans l'aperçu live :

```vue
<UButton
  v-if="apercuConcernes > 0"
  variant="ghost"
  color="sky"
  size="xs"
  icon="i-heroicons-eye"
  :loading="candidatsLoading"
  @click="showCandidatsDrawer = true; chargerCandidats()"
>
  Voir les {{ apercuConcernes }} impayés
</UButton>
```

## UI du Drawer

```
┌──────────────────────────────────────────────────────┐
│  Candidats — Règles d'attribution              [×]   │
│  100 impayés correspondent aux règles actuelles      │
├──────────────────────────────────────────────────────┤
│  Facture      Payeur              Montant   Statut   │
│  FAC-2024-001 Martin Jean         1 250 €   impayé   │
│  FAC-2024-002 Durand Sophie       890 €     en cours │
│  FAC-2024-003 Bernard Paul        2 100 €   impayé   │
│  ...                                                 │
├──────────────────────────────────────────────────────┤
│  Limité aux 100 premiers résultats                   │
└──────────────────────────────────────────────────────┘
```

- Table Nuxt UI (`UTable`) avec colonnes : Facture, Payeur, Montant (formaté €), Statut (badge coloré), Séquence actuelle (badge sky si assignée, "—" sinon)
- Chaque ligne a un lien icône `i-heroicons-arrow-top-right-on-square` vers `/impayes/[objectId]` (target `_blank`)
- Spinner centré pendant `candidatsLoading`
- Note en bas de drawer si `candidats.length >= 100` : "Limité aux 100 premiers résultats"
- Le drawer se rafraîchit si l'utilisateur le rouvre après avoir modifié les règles (pas de sync automatique pour éviter des requêtes inutiles)

## Pas de refactoring de calculerApercu()

La logique de construction de requête est dupliquée intentionnellement dans `chargerCandidats()` pour éviter une abstraction prématurée. Une refactorisation ultérieure (extraire `buildFinalQuery()`) peut être faite séparément.
