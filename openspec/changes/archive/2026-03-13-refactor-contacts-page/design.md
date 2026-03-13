## Architecture

La page `contacts/index.vue` est découpée en 4 composables et 2 composants. La page elle-même ne garde que la mise en page et l'orchestration.

---

## UTable — usage par vue

La documentation Nuxt UI `UTable` (TanStack Table) est utilisée pour les trois vues. Chaque vue tire parti de features différentes.

### Vue "Tous les contacts" / "Sans email"

Tri serveur-side, pagination serveur-side, filtres via inputs liés au composable.

```vue
<UTable
  :data="rows"
  :columns="colonnes"
  :loading="loading"
  :sorting="sorting"
  :empty="{ label: 'Aucun contact trouvé' }"
  sticky="header"
  @update:sorting="onSortingChange"
  @select="ouvrirDrawer"
>
  <!-- Cellule nom : bouton cliquable -->
  <template #nom-cell="{ row }">
    <button class="text-sky-700 hover:underline font-medium" @click="ouvrirDrawer(row.original)">
      {{ row.original.nom }}
    </button>
  </template>

  <!-- Cellule email : badge rouge si absent -->
  <template #email-cell="{ row }">
    <span v-if="row.original.email" class="text-sm text-gray-700">{{ row.original.email }}</span>
    <UBadge v-else color="red" variant="subtle" size="xs">Manquant</UBadge>
  </template>

  <!-- Cellule type : badge neutre -->
  <template #type-cell="{ row }">
    <UBadge v-if="row.original.type" color="neutral" variant="subtle" size="xs">{{ row.original.type }}</UBadge>
    <span v-else class="text-gray-400 text-sm">—</span>
  </template>

  <!-- Cellule source : badge bleu/violet -->
  <template #source-cell="{ row }">
    <UBadge :color="row.original.source === 'db_externe' ? 'blue' : 'violet'" variant="subtle" size="xs">
      {{ row.original.source === 'db_externe' ? 'BD externe' : 'Upload' }}
    </UBadge>
  </template>

  <!-- Cellule nb_impayes : gras si > 0 -->
  <template #nb_impayes-cell="{ row }">
    <span :class="row.original.nb_impayes > 0 ? 'font-semibold text-gray-900' : 'text-gray-400'">
      {{ row.original.nb_impayes }}
    </span>
  </template>

  <!-- Cellule actions : bouton édition (upload seulement) -->
  <template #actions-cell="{ row }">
    <UButton
      v-if="row.original.source !== 'db_externe'"
      icon="i-heroicons-pencil-square"
      color="neutral" variant="ghost" size="xs"
      @click.stop="ouvrirDrawer(row.original)"
    />
  </template>
</UTable>
```

**Définition des colonnes** (dans `useContacts.js`) :

```js
const colonnes = [
  {
    accessorKey: 'nom',
    header: ({ column }) => h(UButton, {
      variant: 'ghost', color: 'neutral', size: 'xs',
      label: 'Nom',
      trailingIcon: column.getIsSorted()
        ? (column.getIsSorted() === 'asc' ? 'i-heroicons-bars-arrow-up' : 'i-heroicons-bars-arrow-down')
        : 'i-heroicons-bars-arrow-up',
      onClick: () => column.toggleSorting()
    })
  },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'telephone', header: 'Téléphone' },
  {
    accessorKey: 'type',
    header: ({ column }) => h(UButton, { /* même pattern tri */ onClick: () => column.toggleSorting() })
  },
  { accessorKey: 'source', header: 'Source' },
  {
    accessorKey: 'nb_impayes',
    header: ({ column }) => h(UButton, { /* même pattern tri */ onClick: () => column.toggleSorting() })
  },
  { id: 'actions', header: '', meta: { class: { td: 'w-10' } } }
]
```

**Tri** : le tri est client-side via UTable (TanStack Table gère le tri sur les données déjà chargées). Colonnes triables : `nom`, `type`, `nb_impayes`. Plus besoin de re-fetch sur changement de tri.

**Pagination** : supprimée. `limit(9999)` côté Parse — tous les contacts sont chargés en une seule requête. UTable affiche tout sans pagination.

**État vide** : prop `empty` avec label contextuel selon l'onglet actif (`'Aucun contact sans email'` vs `'Aucun contact trouvé'`).

**Loading** : prop `:loading="loading"` — UTable affiche un skeleton automatiquement.

---

### Vue "Par entité"

UTable hiérarchique avec `getSubRows` + lignes expansibles. Les données sont chargées en une seule passe (entités + leurs employés) et structurées en arbre.

**Structure de données** (dans `useContactsEntites.js`) :

```js
// Format attendu par getSubRows
const entitesRows = computed(() => entitesGroupes.value.map(g => ({
  ...g.entite,
  isEntite: true,
  subRows: g.employes.map(e => ({ ...e, isEntite: false, subRows: [] }))
})))
```

```vue
<UTable
  :data="entitesFiltrees"
  :columns="colonnesEntites"
  :loading="loadingEntites"
  :get-sub-rows="row => row.subRows"
  :expanded="expandedEntites"
  :empty="{ label: 'Aucune entité trouvée' }"
  sticky="header"
  @update:expanded="expandedEntites = $event"
>
  <!-- Cellule nom : indentation + icône expand pour les entités -->
  <template #nom-cell="{ row }">
    <div class="flex items-center gap-2" :style="{ paddingLeft: `${row.depth * 1.5}rem` }">
      <UButton
        v-if="row.getCanExpand()"
        :icon="row.getIsExpanded() ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
        color="neutral" variant="ghost" size="xs"
        @click.stop="row.toggleExpanded()"
      />
      <UIcon v-else name="i-heroicons-user-circle" class="size-4 text-gray-400 flex-shrink-0" />
      <span :class="row.original.isEntite ? 'font-semibold text-gray-900' : 'text-gray-700'">
        {{ row.original.nom }}
      </span>
      <UBadge v-if="row.original.isEntite" color="neutral" variant="subtle" size="xs">
        {{ row.original.subRows.length }} contact(s)
      </UBadge>
    </div>
  </template>

  <!-- Email -->
  <template #email-cell="{ row }">
    <span v-if="row.original.email" class="text-sm text-gray-700">{{ row.original.email }}</span>
    <span v-else class="text-sm text-gray-400 italic">—</span>
  </template>

  <!-- Actions : édition (upload seulement) -->
  <template #actions-cell="{ row }">
    <UButton
      v-if="row.original.source !== 'db_externe'"
      icon="i-heroicons-pencil-square"
      color="neutral" variant="ghost" size="xs"
      @click.stop="ouvrirDrawer(row.original)"
    />
  </template>
</UTable>
```

**Colonnes** (`colonnesEntites`) :

```js
[
  { accessorKey: 'nom', header: 'Nom / Entité' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'telephone', header: 'Téléphone' },
  { id: 'actions', header: '', meta: { class: { td: 'w-10' } } }
]
```

**Filtrage** : le `search` existant filtre `entitesRows` côté client (computed `entitesFiltrees`) — entités dont le nom OU un employé correspondant.

**Expansion** : toutes les entités déployées par défaut à l'initialisation (`expandedEntites` initialisé avec les IDs de toutes les entités).

**Pagination** : non nécessaire (< 1000 entités), UTable affiche tout.

---

## Composables

### `useContacts.js`

```js
// State
const loading, contacts, total, sansEmailCount
const search, filtreSource, filtreType, filtreSansEmail
const impayesCountMap

// Computed
const rows  // contacts mappés pour UTable (filtrés client-side par search/source/type si onglet sans-email)

// Functions
charger()                    // limit(9999), charge tout d'un coup
chargerSansEmailCount()
buildQuery()
resetEtCharger()
onSearchInput()              // debounce 300ms → resetEtCharger
```

Reçoit `$parse` en paramètre.

### `useContactsEntites.js`

```js
const entitesGroupes, loadingEntites
const expandedEntites = ref({})     // état expand/collapse UTable
const entitesRows                   // computed — arbre pour getSubRows
const entitesFiltrees               // computed — filtrées par search

chargerEntitesGroupes()
initExpanded()                      // déploie toutes les entités au chargement
```

### `useContactEditor.js`

```js
const showDrawer, contactSelectionne, formEdition
const impayelsDuContact, loadingImpayes
const showDeleteModal, saving, deleting

ouvrirDrawer(row), fermerDrawer()
enregistrer(), confirmerSuppression(), supprimerContact()
formatMontant(), statutColor()
```

Émet un callback `onRefresh`.

### `useContactsSync.js`

```js
const syncing, syncResult
const syncResultMessage  // computed
lancerSync()
```

---

## Composants

### `ContactsDrawer.vue`
Props : `contact`, `impayes`, `loadingImpayes`, `saving`, `deleting`
v-model : `open`, `form`
Emits : `save`, `delete`, `close`

### `ContactDeleteModal.vue`
Props : `contact`, `impayesCount`
v-model : `open`
Emits : `confirm`, `cancel`

---

## Page `contacts/index.vue` (~80 lignes)

```vue
<template>
  <div class="p-6 space-y-4">
    <!-- Header + bouton Sync -->
    <!-- UTabs (tous / sans-email / par-entite) -->
    <!-- UAlert syncResult -->
    <!-- Vue tous/sans-email : UInput search + selects source/type + UTable (tout chargé, pas de pagination) -->
    <!-- Vue par-entite : UInput search + UTable hiérarchique (getSubRows) -->
    <!-- ContactsDrawer -->
    <!-- ContactDeleteModal -->
  </div>
</template>
```

---

## Fichiers à créer

```
frontend/app/composables/useContacts.js
frontend/app/composables/useContactsEntites.js
frontend/app/composables/useContactEditor.js
frontend/app/composables/useContactsSync.js
frontend/app/components/ContactsDrawer.vue
frontend/app/components/ContactDeleteModal.vue
```
