## 1. Composable `useContacts.js`

- [x] 1.1 Créer `frontend/app/composables/useContacts.js` — accepte `$parse` en paramètre
- [x] 1.2 Porter : `loading`, `contacts`, `total`, `sansEmailCount`, `search`, `filtreSource`, `filtreType`, `filtreSansEmail`, `impayesCountMap` — supprimer `page` et `pageSize`
- [x] 1.3 Porter : `charger()` avec `q.limit(9999)` (pas de `skip`), batch count impayés, `chargerSansEmailCount()`, `buildQuery()`, `resetEtCharger()`, `onSearchInput()` (debounce 300ms)
- [x] 1.4 Définir `colonnes` pour UTable avec tri client-side activé sur `nom`, `type`, `nb_impayes` via `enableSorting: true` — les headers tri sont gérés via slots dans la page
- [x] 1.6 Porter `sourceOptions`, `typeOptions`, `typeOptionsForm`
- [x] 1.7 Porter le computed `rows` (mapping contacts → objets plats pour UTable)
- [x] 1.8 Exporter toutes les refs, computeds et fonctions

## 2. Composable `useContactsEntites.js`

- [x] 2.1 Créer `frontend/app/composables/useContactsEntites.js` — accepte `($parse, search)` en paramètre (`search` est la ref partagée de recherche)
- [x] 2.2 Porter : `entitesGroupes`, `loadingEntites`
- [x] 2.3 Porter `chargerEntitesGroupes()` — requête type_personne='M', puis relation 'employes' par entité
- [x] 2.4 Ajouter le computed `entitesRows` — structure arbre pour `getSubRows` : chaque entité a `{ ...entite, isEntite: true, subRows: employes[] }`
- [x] 2.5 Ajouter le computed `entitesFiltrees` — filtre `entitesRows` par `search` côté client : inclut une entité si son nom OU le nom d'un de ses employés correspond (insensible à la casse)
- [x] 2.6 Ajouter `expandedEntites = ref({})` et `initExpanded()` — déploie toutes les entités par défaut (remplit `expandedEntites` avec `{ [entite.id]: true }` pour chaque entité)
- [x] 2.7 Définir `colonnesEntites` : `nom` (avec logique expand/indentation dans le slot), `email`, `telephone`, `actions`
- [x] 2.8 Exporter : `entitesGroupes`, `loadingEntites`, `entitesFiltrees`, `colonnesEntites`, `expandedEntites`, `chargerEntitesGroupes`, `initExpanded`

## 3. Composable `useContactEditor.js`

- [x] 3.1 Créer `frontend/app/composables/useContactEditor.js` — accepte `($parse, onRefresh)` en paramètre
- [x] 3.2 Porter : `showDrawer`, `contactSelectionne`, `impayelsDuContact`, `loadingImpayes`, `showDeleteModal`, `saving`, `deleting` (formEdition géré dans ContactsDrawer.vue)
- [x] 3.3 Porter : `ouvrirDrawer(row)`, `fermerDrawer()`, `enregistrer(formData)`, `confirmerSuppression()`, `supprimerContact()`
- [x] 3.4 Porter les helpers : `formatMontant()`, `statutColor()`
- [x] 3.5 Appeler `onRefresh()` après `enregistrer()` et `supprimerContact()` réussis

## 4. Composable `useContactsSync.js`

- [x] 4.1 Créer `frontend/app/composables/useContactsSync.js` — accepte `($parse, onRefresh)` en paramètre
- [x] 4.2 Porter : `syncing`, `syncResult`
- [x] 4.3 Porter : `syncResultMessage` (computed), `lancerSync()` — appelle `$parse.Cloud.run('syncNow')` puis `onRefresh()`

## 5. Composant `ContactsDrawer.vue`

- [x] 5.1 Créer `frontend/app/components/ContactsDrawer.vue`
- [x] 5.2 Props : `contact`, `impayes`, `loadingImpayes`, `saving`, `deleting` ; v-model : `open` ; emits : `save(localForm)`, `delete`, `close` — localForm interne initialisé par watch(contact)
- [x] 5.3 Porter le template `USlideover` : header (nom + badge source + bouton X), body (alert lecture seule si db_externe, grille champs nom/type/email/téléphone, liste impayés liés avec liens NuxtLink), footer (bouton supprimer + bouton enregistrer)

## 6. Composant `ContactDeleteModal.vue`

- [x] 6.1 Créer `frontend/app/components/ContactDeleteModal.vue`
- [x] 6.2 Props : `contact` (Object), `impayesCount` (Number), `deleting` (Boolean) ; v-model : `open` ; emits : `confirm`, `cancel`
- [x] 6.3 Porter le template `UModal` avec alerte conditionnelle si impayés associés

## 7. Refactor de la page `contacts/index.vue`

- [x] 7.1 Remplacer le `<script setup>` par les imports des 4 composables ; définir `refresh()` appelant `charger()` + `chargerSansEmailCount()`
- [x] 7.2 Garder le computed `onglets` dans la page (dépend de `total` et `sansEmailCount`)
- [x] 7.3 Garder le watcher `watch(ongletActif, ...)` ; au passage sur `par-entite`, appeler `chargerEntitesGroupes()`

### Vue "Tous les contacts" / "Sans email"

- [x] 7.4 Remplacer `UTable` existant par la version avec `sticky="header"`, `@select="ouvrirDrawer"`, prop `:empty` contextuelle selon l'onglet — le tri est géré client-side par TanStack Table
- [x] 7.5 Câbler les slots de cellules : `#nom-cell` (bouton cliquable), `#email-cell` (UBadge rouge si absent), `#type-cell` (UBadge neutre), `#source-cell` (UBadge bleu/violet), `#nb_impayes-cell` (gras si > 0), `#actions-cell` (bouton édition)
- [x] 7.6 Supprimer entièrement le bloc pagination (plus de `UPagination`, plus de `page`/`pageSize`)

### Vue "Par entité"

- [x] 7.7 Remplacer les `div` de la vue par entité par un `UTable` avec `:data="entitesFiltrees"`, `:columns="colonnesEntites"`, `:get-sub-rows`, `:expanded`, `sticky="header"`
- [x] 7.8 Câbler le slot `#nom-cell` : indentation via `paddingLeft: row.depth * 1.5rem`, bouton expand/collapse, icône user-circle pour les feuilles, badge nb contacts sur les entités
- [x] 7.9 Câbler `#actions-cell` : bouton édition uniquement si `source !== 'db_externe'`

### Finalisation

- [x] 7.10 Remplacer les blocs drawer et modal inline par `<ContactsDrawer>` et `<ContactDeleteModal>` avec bindings corrects
- [ ] 7.11 Smoke test : vérifier les 3 onglets (tri colonne, badge vide email, vue entités expand/collapse), ouvrir un drawer, éditer/sauvegarder un contact upload, supprimer, lancer une sync
