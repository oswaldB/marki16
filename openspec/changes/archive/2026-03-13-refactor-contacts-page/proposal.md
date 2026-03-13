## Why

La page `contacts/index.vue` fait ~790 lignes et mélange dans un seul fichier : le tableau de contacts paginé, la vue par entité, le drawer d'édition, la modal de suppression, et la logique de synchronisation. Elle contenait aussi des marqueurs de conflit git non résolus (lignes 84–92) qui causaient une erreur Vite :

> `[plugin:vite:vue] Extraneous children found when component already has explicitly named default slot`

Le bug a été corrigé immédiatement (suppression des marqueurs `=======`). Le reste de ce changement est un refactoring de la page pour la rendre lisible et maintenable.

## What Changes

### Composables extraits

- **`useContacts.js`** — état et logique de la liste principale : `contacts`, `total`, `sansEmailCount`, `loading`, `page`, filtres (`search`, `filtreSource`, `filtreType`, `filtreSansEmail`), `charger()`, `chargerSansEmailCount()`, `buildQuery()`, `resetEtCharger()`, `onSearchInput()`, `impayesCountMap`, `rows` (computed)
- **`useContactsEntites.js`** — chargement de la vue par entité : `entitesGroupes`, `loadingEntites`, `chargerEntitesGroupes()`
- **`useContactEditor.js`** — drawer d'édition / suppression : `showDrawer`, `contactSelectionne`, `formEdition`, `impayelsDuContact`, `showDeleteModal`, `saving`, `deleting`, `ouvrirDrawer()`, `fermerDrawer()`, `enregistrer()`, `confirmerSuppression()`, `supprimerContact()`
- **`useContactsSync.js`** — synchronisation externe : `syncing`, `syncResult`, `syncResultMessage`, `lancerSync()`

### Composants extraits

- **`ContactsDrawer.vue`** — drawer `USlideover` complet (formulaire + impayés liés + footer sauvegarder/supprimer)
- **`ContactDeleteModal.vue`** — modal `UModal` de confirmation de suppression

### Page résultante

`contacts/index.vue` se réduit à ~80 lignes : template de mise en page (header, onglets, filtres, tableau, pagination, vue entité), orchestration des composants et appels aux composables.

## Capabilities

### Modified Capabilities

- `contacts-list` : même comportement utilisateur exact — liste paginée, filtres, onglets (tous / sans-email / par-entité), drawer édition, suppression, sync

## Impact

- **Frontend uniquement** — aucun changement backend ni de schéma de données
- Fichiers créés : ~6 nouveaux fichiers dans `components/` et `composables/`
- Fichier réduit : `contacts/index.vue` passe de ~790 à ~80 lignes
- Bug corrigé en amont : marqueurs de conflit git supprimés
