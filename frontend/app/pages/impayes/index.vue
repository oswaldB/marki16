<template>
  <div class="p-6 space-y-4">

    <!-- Barre du haut -->
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div class="flex items-center gap-3 flex-wrap">
        <!-- Onglets vues -->
        <div class="flex rounded-lg border border-gray-200 bg-gray-50 p-1 gap-1">
          <button
            v-for="vue in vues"
            :key="vue.key"
            class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
            :class="activeView === vue.key
              ? 'bg-white text-sky-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'"
            @click="activeView = vue.key"
          >
            {{ vue.label }}
          </button>
        </div>

        <!-- Recherche -->
        <UInput
          v-model="search"
          icon="i-heroicons-magnifying-glass"
          placeholder="Rechercher (payeur, facture, référence, adresse...)"
          class="w-64"
          @input="onSearchInput"
        />

        <!-- Filtre séquence -->
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-gray-700">Séquence:</span>
          <USelect
            v-model="filtreSequence"
            :items="sequenceOptions"
            class="w-44"
            @change="() => { page.value = 1; charger() }"
            :loading="sequencesLoading"
            placeholder="Toutes les séquences"
          />
        </div>

        <!-- Tri -->
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-gray-700">Trier par:</span>
          <USelect
            v-model="sortColumn"
            :items="sortOptions"
            class="w-36"
            @change="() => { page.value = 1; charger() }"
            title="Choisir un critère de tri"
            placeholder="Sélectionner..."
          />
          <UButton
            :icon="sortDirection === 'asc' ? 'i-heroicons-arrow-up' : 'i-heroicons-arrow-down'"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="toggleSortDirection"
            title="Changer l'ordre de tri"
          />
        </div>

      </div>
    </div>

    <!-- Sélecteur de colonnes optionnelles (vue unitaire) -->
    <div v-if="activeView === 'unitaire'" class="flex items-center gap-2 flex-wrap">
      <span class="text-xs text-gray-500">Colonnes :</span>
      <label
        v-for="col in colonnesOptionnelles"
        :key="col.key"
        class="flex items-center gap-1 text-xs text-gray-600 cursor-pointer select-none"
      >
        <input
          type="checkbox"
          :checked="colonnesVisibles.includes(col.key)"
          class="rounded"
          @change="toggleColonne(col.key)"
        />
        {{ col.label }}
      </label>
    </div>

    <!-- ── Vue unitaire ── -->
    <div v-if="activeView === 'unitaire'" class="space-y-3">
      <UCard :ui="{ body: { padding: 'p-0' } }" class="max-h-[60vh] !overflow-x-auto !overflow-y-auto">
        <UTable
          :data="impayes"
          :columns="colonnesAffichees"
          :loading="loading"
          class="[&_td]:!whitespace-normal [&_td]:!break-words"
        >
          <!-- Checkbox sélection -->
          <template #select-cell="{ row }">
            <input
              type="checkbox"
              :checked="isSelected(row.original)"
              class="rounded"
              @change="toggleSelection(row.original)"
            />
          </template>

          <!-- Retard -->
          <template #retard-cell="{ row }">
            <span
              class="font-medium text-sm"
              :class="row.original.retard > 30 ? 'text-red-600' : row.original.retard > 7 ? 'text-orange-500' : 'text-gray-600'"
            >
              {{ row.original.retard }}j
            </span>
          </template>

          <!-- Reste à payer -->
          <template #reste_a_payer-cell="{ row }">
            <span class="font-medium">{{ formatMontant(row.original.reste_a_payer) }}</span>
          </template>

          <!-- Total HT -->
          <template #total_ht-cell="{ row }">{{ formatMontant(row.original.total_ht) }}</template>

          <!-- Total TTC -->
          <template #total_ttc-cell="{ row }">{{ formatMontant(row.original.total_ttc) }}</template>

          <!-- Date pièce -->
          <template #date_piece-cell="{ row }">{{ formatDate(row.original.date_piece) }}</template>

          <!-- Date intervention -->
          <template #date_debut_mission-cell="{ row }">{{ formatDate(row.original.date_debut_mission) }}</template>

          <!-- Commentaire -->
          <template #commentaire_piece-cell="{ row }">
            <span class="text-sm">{{ row.original.commentaire_piece || '—' }}</span>
          </template>

          <!-- Séquence -->
          <template #sequence-cell="{ row }">
            <span v-if="row.original.sequenceNom" class="text-sm text-sky-700">{{ row.original.sequenceNom }}</span>
            <span v-else class="text-gray-400 text-sm">—</span>
          </template>

          <!-- Actions -->
          <template #actions-cell="{ row }">
            <div class="flex items-center gap-1">
              <UButton
                icon="i-heroicons-document"
                color="neutral"
                variant="ghost"
                size="xs"
                title="Voir PDF"
                @click="ouvrirPdf(row.original)"
              />
              <UDropdownMenu :items="menuItems(row.original)">
                <UButton icon="i-heroicons-ellipsis-vertical" color="neutral" variant="ghost" size="xs" />
              </UDropdownMenu>
            </div>
          </template>
        </UTable>
      </UCard>

      <!-- Load all records (no pagination) -->
      <div class="flex justify-end text-sm text-gray-500">
        {{ impayes.length }} impayés chargés
      </div>
    </div>

    <!-- ── Vue par payeur ── -->
    <div v-else-if="activeView === 'payeur'" class="space-y-3">
      <div v-if="loading" class="text-center py-8 text-gray-400">Chargement...</div>
      <template v-else>
        <UCard :ui="{ body: { padding: 'p-0' } }" class="max-h-[65vh] !overflow-x-auto !overflow-y-auto">
          <UTable
            :data="impayes"
            :columns="colonnesPayeur"
            :grouping="['payeur_nom']"
            :grouping-options="groupingOptions"
            :ui="{ td: 'empty:p-0' }"
          >
            <!-- Expand / nom du payeur -->
            <template #title-cell="{ row }">
              <div v-if="row.getIsGrouped()" class="flex items-center gap-2 w-full">
                <UButton
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  :icon="row.getIsExpanded() ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
                  @click="row.toggleExpanded()"
                />
                <span class="font-semibold text-gray-900">{{ row.getValue('payeur_nom') || '(inconnu)' }}</span>
                <UBadge color="neutral" variant="subtle">
                  {{ row.getLeafRows().length }} facture{{ row.getLeafRows().length > 1 ? 's' : '' }}
                </UBadge>
                <div class="flex-1" />
                <UButton
                  size="xs"
                  variant="soft"
                  color="sky"
                  icon="i-heroicons-queue-list"
                  @click.stop="ouvrirDrawerAssignation(row)"
                >
                  Attribuer séquence
                </UButton>
              </div>
            </template>

            <template #nfacture-cell="{ row }">
              <span v-if="!row.getIsGrouped()" class="font-mono text-sm">{{ row.original.nfacture }}</span>
            </template>

            <template #date_piece-cell="{ row }">
              <span v-if="!row.getIsGrouped()">{{ formatDate(row.original.date_piece) }}</span>
            </template>

            <template #retard-cell="{ row }">
              <span
                class="font-medium text-sm"
                :class="(row.getIsGrouped() ? row.getValue('retard') : row.original.retard) > 30 ? 'text-red-600' : (row.getIsGrouped() ? row.getValue('retard') : row.original.retard) > 7 ? 'text-orange-500' : 'text-gray-600'"
              >
                {{ row.getIsGrouped() ? row.getValue('retard') + 'j max' : row.original.retard + 'j' }}
              </span>
            </template>

            <template #reste_a_payer-cell="{ row }">
              <span :class="row.getIsGrouped() ? 'font-bold text-gray-900' : 'font-medium'">
                {{ formatMontant(row.getValue('reste_a_payer')) }}
              </span>
            </template>

            <template #sequenceNom-cell="{ row }">
              <template v-if="!row.getIsGrouped()">
                <span v-if="row.original.sequenceNom" class="text-sm text-sky-700">{{ row.original.sequenceNom }}</span>
                <span v-else class="text-gray-400 text-sm">—</span>
              </template>
            </template>

            <template #actions-cell="{ row }">
              <div v-if="!row.getIsGrouped()" class="flex items-center gap-1">
                <UButton icon="i-heroicons-document" color="neutral" variant="ghost" size="xs" @click="ouvrirPdf(row.original)" />
                <UDropdownMenu :items="menuItems(row.original)">
                  <UButton icon="i-heroicons-ellipsis-vertical" color="neutral" variant="ghost" size="xs" />
                </UDropdownMenu>
              </div>
            </template>
          </UTable>
        </UCard>
        <div class="flex justify-end text-sm text-gray-500">
          {{ groupesPayeur.length }} payeurs · {{ impayes.length }} impayés
        </div>
      </template>
    </div>

    <!-- ── Vue par contact ── -->
    <div v-else class="space-y-3">
      <div v-if="loading" class="text-center py-8 text-gray-400">Chargement...</div>
      <template v-else>
        <UCard :ui="{ body: { padding: 'p-0' } }" class="max-h-[65vh] !overflow-x-auto !overflow-y-auto">
          <UTable
            :data="impayesContactFlat"
            :columns="colonnesContact"
            :grouping="['contact_nom', 'contact_role']"
            :grouping-options="groupingOptions"
            :ui="{ td: 'empty:p-0' }"
          >
            <!-- Expand / nom du contact / rôle -->
            <template #title-cell="{ row }">
              <div
                v-if="row.getIsGrouped()"
                class="flex items-center gap-2"
                :style="{ paddingLeft: `${row.depth * 1.25}rem` }"
              >
                <UButton
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  :icon="row.getIsExpanded() ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
                  @click="row.toggleExpanded()"
                />
                <span v-if="row.groupingColumnId === 'contact_nom'" class="font-semibold text-gray-900">
                  {{ row.getValue('contact_nom') }}
                </span>
                <span v-else class="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {{ row.getValue('contact_role') }}
                </span>
                <UBadge color="neutral" variant="subtle">
                  {{ countContactGroup(row) }} facture{{ countContactGroup(row) > 1 ? 's' : '' }}
                </UBadge>
              </div>
            </template>

            <template #nfacture-cell="{ row }">
              <span v-if="!row.getIsGrouped()" class="font-mono text-sm">{{ row.original.nfacture }}</span>
            </template>

            <template #date_piece-cell="{ row }">
              <span v-if="!row.getIsGrouped()">{{ formatDate(row.original.date_piece) }}</span>
            </template>

            <template #retard-cell="{ row }">
              <span
                class="font-medium text-sm"
                :class="(row.getIsGrouped() ? row.getValue('retard') : row.original.retard) > 30 ? 'text-red-600' : (row.getIsGrouped() ? row.getValue('retard') : row.original.retard) > 7 ? 'text-orange-500' : 'text-gray-600'"
              >
                {{ row.getIsGrouped() ? row.getValue('retard') + 'j max' : row.original.retard + 'j' }}
              </span>
            </template>

            <template #reste_a_payer-cell="{ row }">
              <span :class="row.getIsGrouped() ? 'font-bold text-gray-900' : 'font-medium'">
                {{ formatMontant(row.getValue('reste_a_payer')) }}
              </span>
            </template>

            <template #actions-cell="{ row }">
              <div v-if="!row.getIsGrouped()" class="flex items-center gap-1">
                <UButton icon="i-heroicons-document" color="neutral" variant="ghost" size="xs" @click="ouvrirPdf(row.original)" />
                <UDropdownMenu :items="menuItems(row.original)">
                  <UButton icon="i-heroicons-ellipsis-vertical" color="neutral" variant="ghost" size="xs" />
                </UDropdownMenu>
              </div>
            </template>
          </UTable>
        </UCard>
        <div class="flex justify-end text-sm text-gray-500">
          {{ groupesContact.length }} contacts
        </div>
      </template>
    </div>

    <!-- Barre de sélection groupée -->
    <Teleport to="body">
      <div
        v-if="selection.length > 0"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl"
      >
        <span class="text-sm font-medium">{{ selection.length }} sélectionné{{ selection.length > 1 ? 's' : '' }}</span>
        <UButton size="sm" color="primary" variant="solid" @click="modalAssignerOuvert = true">
          Assigner une séquence
        </UButton>
        <UButton size="sm" color="success" variant="solid" @click="marquerPayesGroupes">
          Marquer payé
        </UButton>
        <UButton size="sm" color="neutral" variant="ghost" @click="selection = []">
          Annuler
        </UButton>
      </div>
    </Teleport>

    <!-- Modal PDF -->
    <ImpayeDrawerPdf v-model="pdfOuvert" :impayelId="pdfImpayelId" />

    <!-- Drawer assignation séquence par groupe payeur -->
    <DrawerAssignSequence
      v-model:open="drawerAssignOpen"
      :payeur="drawerAssignPayeur"
      :impayes="drawerAssignImpayes"
      :sequences="sequences"
      @assigned="chargerTout"
    />

    <!-- Modal assigner séquence (ligne) -->
    <UModal v-model:open="modalAssignerOuvert" title="Assigner une séquence">
      <template #body>
        <div class="space-y-4">
          <USelect
            v-model="sequenceChoisie"
            :items="sequenceOptionsModal"
            placeholder="Choisir une séquence..."
          />

          <!-- Message si aucune séquence disponible -->
          <UAlert
            v-if="sequences.length === 0"
            icon="i-heroicons-information-circle"
            color="primary"
            variant="subtle"
            class="mt-4"
          >
            <template #description>
              Aucune séquence disponible.
              <NuxtLink to="/sequences" class="font-medium text-primary-600 hover:text-primary-700 underline">
                Créer une séquence
              </NuxtLink>
            </template>
          </UAlert>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="modalAssignerOuvert = false">Annuler</UButton>
          <UButton :loading="assignant" :disabled="!sequenceChoisie" @click="assignerSequence">Assigner</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup>
import { getGroupedRowModel } from '@tanstack/vue-table'
const { $parse } = useNuxtApp()
const toast = useToast()
const router = useRouter()

// Import manuel des composants pour s'assurer qu'ils sont disponibles
import ImpayeDrawerPdf from '~/components/ImpayeDrawerPdf.vue'
import DrawerAssignSequence from '~/components/DrawerAssignSequence.vue'

// ── État ──
const activeView = ref('unitaire')
const search = ref('')
const filtreSequence = ref('all')
const page = ref(1)
const pageSize = 9999
const total = ref(0)
const loading = ref(false)
const impayes = ref([])
const selection = ref([])
const sequences = ref([])
const sequencesLoading = ref(false)

// Tri
const sortColumn = ref('date_piece')
const sortDirection = ref('desc')

// PDF
const pdfOuvert = ref(false)
const pdfImpayelId = ref(null)

// Drawer assignation séquence par groupe
const drawerAssignOpen = ref(false)
const drawerAssignPayeur = ref('')
const drawerAssignImpayes = ref([])

// Modal assigner séquence
const modalAssignerOuvert = ref(false)
const sequenceChoisie = ref(null)
const assignant = ref(false)
const impayesCibles = ref([]) // items Parse visés par l'assignation

// ── Options groupement (TanStack Table) ──
const groupingOptions = ref({
  groupedColumnMode: 'remove',
  getGroupedRowModel: getGroupedRowModel(),
})

// ── Colonnes vue par payeur ──
const colonnesPayeur = [
  { id: 'title' },
  { accessorKey: 'payeur_nom' },
  { accessorKey: 'nfacture',      header: 'N° Facture', cell: ({ row }) => row.getIsGrouped() ? null : undefined },
  { accessorKey: 'date_piece',    header: 'Date pièce', cell: ({ row }) => row.getIsGrouped() ? null : undefined },
  { accessorKey: 'retard',        header: 'Retard',     aggregationFn: 'max' },
  { accessorKey: 'reste_a_payer', header: 'Reste à payer', aggregationFn: 'sum' },
  { accessorKey: 'sequenceNom',   header: 'Séquence' },
  { id: 'actions' },
]

// ── Colonnes vue par contact ──
const colonnesContact = [
  { id: 'title' },
  { accessorKey: 'contact_nom' },
  { accessorKey: 'contact_role' },
  { accessorKey: 'nfacture',      header: 'N° Facture', cell: ({ row }) => row.getIsGrouped() ? null : undefined },
  { accessorKey: 'date_piece',    header: 'Date pièce', cell: ({ row }) => row.getIsGrouped() ? null : undefined },
  { accessorKey: 'retard',        header: 'Retard',     aggregationFn: 'max' },
  { accessorKey: 'reste_a_payer', header: 'Reste à payer', aggregationFn: 'sum' },
  { id: 'actions' },
]

// ── Données aplaties pour la vue par contact ──
const impayesContactFlat = computed(() => {
  const result = []
  for (const item of impayes.value) {
    if (item.payeur_nom) {
      result.push({ ...item, contact_nom: item.payeur_nom, contact_role: 'Ses propres impayés' })
    }
    if (item.apporteur_nom && item.apporteur_nom !== item.payeur_nom) {
      result.push({ ...item, contact_nom: item.apporteur_nom, contact_role: "Apporteur d'affaire pour" })
    }
  }
  return result
})

// Colonnes (format Nuxt UI v4 / TanStack Table)
const colonnesParDefaut = [
  { id: 'select',              header: ' ' },
  { accessorKey: 'nfacture',          header: 'N° Facture' },
  { accessorKey: 'date_piece',        header: 'Date pièce' },
  { accessorKey: 'numero_dossier',    header: 'N° Dossier' },
  { accessorKey: 'adresse_bien',      header: 'Adresse du bien' },
  { accessorKey: 'payeur_nom',        header: 'Payeur' },
  { accessorKey: 'retard',            header: 'Retard' },
  { accessorKey: 'reste_a_payer',     header: 'Reste à payer' },
  { accessorKey: 'date_debut_mission',header: 'Date intervention' },
  { accessorKey: 'sequence',          header: 'Séquence' },
  { id: 'actions',                    header: ' ' },
]

const colonnesOptionnelles = [
  { key: 'reference',         accessorKey: 'reference',         label: 'Référence',     header: 'Référence' },
  { key: 'reference_externe', accessorKey: 'reference_externe', label: 'Réf externe',   header: 'Réf externe' },
  { key: 'statut_dossier',    accessorKey: 'statut_dossier',    label: 'Statut dossier',header: 'Statut dossier' },
  { key: 'total_ht',          accessorKey: 'total_ht',          label: 'Total HT',      header: 'Total HT' },
  { key: 'total_ttc',         accessorKey: 'total_ttc',         label: 'Total TTC',     header: 'Total TTC' },
  { key: 'apporteur_nom',     accessorKey: 'apporteur_nom',     label: 'Apporteur',     header: 'Apporteur' },
  { key: 'commentaire_piece', accessorKey: 'commentaire_piece', label: 'Commentaire',   header: 'Commentaire' },
  { key: 'numero_lot',        accessorKey: 'numero_lot',        label: 'Lot',           header: 'Lot' },
  { key: 'etage',             accessorKey: 'etage',             label: 'Étage',         header: 'Étage' },
  { key: 'porte',             accessorKey: 'porte',             label: 'Porte',         header: 'Porte' },
]

const colonnesVisibles = ref([])
const colonnesAffichees = computed(() => {
  const optKeys = new Set(colonnesVisibles.value)
  const extras = colonnesOptionnelles.filter(c => optKeys.has(c.key))
  const idx = colonnesParDefaut.findIndex(c => c.id === 'actions')
  return [
    ...colonnesParDefaut.slice(0, idx),
    ...extras,
    colonnesParDefaut[idx],
  ]
})

function toggleColonne(key) {
  const idx = colonnesVisibles.value.indexOf(key)
  if (idx === -1) colonnesVisibles.value.push(key)
  else colonnesVisibles.value.splice(idx, 1)
}

// ── Sélection manuelle ──
function isSelected(item) {
  return selection.value.some(s => s.objectId === item.objectId)
}
function toggleSelection(item) {
  const idx = selection.value.findIndex(s => s.objectId === item.objectId)
  if (idx === -1) selection.value.push(item)
  else selection.value.splice(idx, 1)
}

// ── Options filtres ──
const vues = [
  { key: 'unitaire', label: 'Unitaire' },
  { key: 'payeur',   label: 'Par payeur' },
  { key: 'contact',  label: 'Par contact' },
]

const sequenceOptions = computed(() => [
  { label: 'Toutes les séquences', value: 'all' },
  { label: 'Sans séquence',        value: 'none' },
  ...sequences.value.map(s => ({ label: s.get('nom'), value: s.id })),
])

const sequenceOptionsModal = computed(() =>
  sequences.value.map(s => ({ label: s.get('nom'), value: s.id }))
)

// Options de tri
const sortOptions = [
  { label: 'Date pièce',      value: 'date_piece' },
  { label: 'Montant',         value: 'reste_a_payer' },
  { label: 'Payeur',          value: 'payeur_nom' },
  { label: 'N° Facture',      value: 'nfacture' },
]

function toggleSortDirection() {
  sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  charger()
}

// ── Helpers ──
const today = new Date()

function calcRetard(datePiece) {
  if (!datePiece) return 0
  const d = datePiece instanceof Date ? datePiece : new Date(datePiece)
  return Math.floor((today - d) / 86_400_000)
}

function formatDate(val) {
  if (!val) return '—'
  const d = val instanceof Date ? val : new Date(val)
  return d.toLocaleDateString('fr-FR', { dateStyle: 'short' })
}

function formatMontant(val) {
  if (val == null) return '—'
  return Number(val).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

function rowToPlain(r) {
  const seq = r.get('sequence')
  return {
    _parse: r,
    objectId: r.id,
    nfacture:           r.get('nfacture') || '—',
    numero_dossier:     r.get('numero_dossier') || '—',
    adresse_bien:       [r.get('adresse_bien'), r.get('code_postal'), r.get('ville')].filter(Boolean).join(', ') || '—',
    payeur_nom:         r.get('payeur_nom') || '—',
    apporteur_nom:      r.get('apporteur_nom') || null,
    retard:             calcRetard(r.get('date_piece')),
    reste_a_payer:      r.get('reste_a_payer'),
    total_ht:           r.get('total_ht'),
    total_ttc:          r.get('total_ttc'),
    date_piece:         r.get('date_piece'),
    date_debut_mission: r.get('date_debut_mission'),
    reference:          r.get('reference'),
    reference_externe:  r.get('reference_externe'),
    statut_dossier:     r.get('statut_dossier'),
    commentaire_piece:  r.get('commentaire_piece'),
    numero_lot:         r.get('numero_lot'),
    etage:              r.get('etage'),
    porte:              r.get('porte'),
    statut:             r.get('statut'),
    url_pdf:            r.get('url_pdf'),
    sequenceNom:        seq ? seq.get('nom') : null,
    sequenceId:         seq ? seq.id : null,
  }
}

// ── Charger les données ──
let searchTimer = null
function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 1; charger() }, 400)
}

async function charger() {
  loading.value = true
  try {
    const q = new $parse.Query('Impaye')
    q.include('sequence')

    // Appliquer le tri
    if (sortColumn.value === 'reste_a_payer') {
      if (sortDirection.value === 'asc') q.ascending('reste_a_payer')
      else q.descending('reste_a_payer')
    } else if (sortColumn.value === 'retard') {
      if (sortDirection.value === 'asc') q.ascending('retard')
      else q.descending('retard')
    } else if (sortColumn.value === 'payeur_nom') {
      if (sortDirection.value === 'asc') q.ascending('payeur_nom')
      else q.descending('payeur_nom')
    } else if (sortColumn.value === 'nfacture') {
      if (sortDirection.value === 'asc') q.ascending('nfacture')
      else q.descending('nfacture')
    } else {
      // Default: date_piece
      if (sortDirection.value === 'asc') q.ascending('date_piece')
      else q.descending('date_piece')
    }

    q.limit(pageSize)

    if (search.value) {
      const queries = []

      // Recherche sur plusieurs champs (case-insensitive)
      const fieldsToSearch = ['payeur_nom', 'nfacture', 'reference', 'reference_externe', 'adresse_bien', 'apporteur_nom', 'commentaire_piece', 'numero_dossier', 'numero_lot']
      const searchLower = search.value.toLowerCase()

      fieldsToSearch.forEach(field => {
        const q = new $parse.Query('Impaye')
        q.matches(field, searchLower, 'i') // 'i' flag for case-insensitive regex
        queries.push(q)
      })

      const combined = $parse.Query.or(...queries)
      combined.include('sequence')

      // Appliquer le tri à la requête combinée
      if (sortColumn.value === 'reste_a_payer') {
        if (sortDirection.value === 'asc') combined.ascending('reste_a_payer')
        else combined.descending('reste_a_payer')
      } else if (sortColumn.value === 'retard') {
        if (sortDirection.value === 'asc') combined.ascending('retard')
        else combined.descending('retard')
      } else if (sortColumn.value === 'payeur_nom') {
        if (sortDirection.value === 'asc') combined.ascending('payeur_nom')
        else combined.descending('payeur_nom')
      } else if (sortColumn.value === 'nfacture') {
        if (sortDirection.value === 'asc') combined.ascending('nfacture')
        else combined.descending('nfacture')
      } else {
        if (sortDirection.value === 'asc') combined.ascending('date_piece')
        else combined.descending('date_piece')
      }

      combined.limit(pageSize)
      if (filtreSequence.value === 'none') combined.doesNotExist('sequence')
      else if (filtreSequence.value !== 'all') {
        const seqPtr = $parse.Object.extend('Sequence').createWithoutData(filtreSequence.value)
        combined.equalTo('sequence', seqPtr)
      }
      const [results, count] = await Promise.all([combined.find(), combined.count()])
      impayes.value = results.map(rowToPlain)
      total.value = count
    } else {
      if (filtreSequence.value === 'none') q.doesNotExist('sequence')
      else if (filtreSequence.value !== 'all') {
        const seqPtr = $parse.Object.extend('Sequence').createWithoutData(filtreSequence.value)
        q.equalTo('sequence', seqPtr)
      }

      const [results, count] = await Promise.all([q.find(), q.count()])
      impayes.value = results.map(rowToPlain)
      total.value = count
    }

    console.log('=== LOAD ALL RECORDS ===')
    console.log('Limit:', pageSize, '(loading all records)')
    console.log('Filters:', { search: search.value, filtreSequence: filtreSequence.value, sortColumn: sortColumn.value, sortDirection: sortDirection.value })
    console.log('Records loaded:', impayes.value.length, '| Total in DB:', total.value)
    console.log('========================')
  } catch (err) {
    toast.add({ title: 'Erreur chargement', description: err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

async function chargerSequences() {
  try {
    sequencesLoading.value = true
    const q = new $parse.Query('Sequence')
    q.limit(200)
    sequences.value = await q.find()
  } catch {
    console.error('Failed to load sequences')
  } finally {
    sequencesLoading.value = false
  }
}

// ── Vues groupées (pour les compteurs dans les footers) ──
const groupesPayeur = computed(() => {
  const map = new Map()
  for (const item of impayes.value) {
    const key = item.payeur_nom || '(inconnu)'
    if (!map.has(key)) map.set(key, true)
  }
  return [...map.keys()]
})

const groupesContact = computed(() => {
  const noms = new Set()
  for (const item of impayes.value) {
    if (item.payeur_nom) noms.add(item.payeur_nom)
    if (item.apporteur_nom && item.apporteur_nom !== item.payeur_nom) noms.add(item.apporteur_nom)
  }
  return [...noms]
})

// Compte les factures pour une ligne de groupe dans la vue par contact
function countContactGroup(row) {
  return row.groupingColumnId === 'contact_nom'
    ? row.subRows.reduce((s, sr) => s + sr.subRows.length, 0)
    : row.subRows.length
}

// ── Actions ──
function ouvrirDrawerAssignation(row) {
  drawerAssignPayeur.value = row.getValue('payeur_nom') || '(inconnu)'
  drawerAssignImpayes.value = row.getLeafRows().map(r => r.original)
  drawerAssignOpen.value = true
}

function ouvrirPdf(row) {
  pdfImpayelId.value = row.objectId
  pdfOuvert.value = true
}

function menuItems(row) {
  return [
    {
      label: 'Voir le détail',
      icon: 'i-heroicons-eye',
      onSelect: () => router.push(`/impayes/${row.objectId}`),
    },
    {
      label: 'Assigner une séquence',
      icon: 'i-heroicons-queue-list',
      onSelect: () => {
        impayesCibles.value = [row._parse]
        sequenceChoisie.value = null
        modalAssignerOuvert.value = true
      },
    },
    {
      label: 'Marquer payé',
      icon: 'i-heroicons-check-circle',
      onSelect: () => marquerPaye(row),
    },
  ]
}

async function marquerPaye(row) {
  try {
    row._parse.set('statut', 'payé')
    await row._parse.save()
    row.statut = 'payé'
    toast.add({ title: 'Facture marquée comme payée', color: 'green' })
  } catch (err) {
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
  }
}

async function marquerPayesGroupes() {
  try {
    const parseObjs = selection.value.map(r => r._parse)
    parseObjs.forEach(o => o.set('statut', 'payé'))
    await $parse.Object.saveAll(parseObjs)
    toast.add({ title: `${parseObjs.length} facture(s) marquées comme payées`, color: 'green' })
    selection.value = []
    await charger()
  } catch (err) {
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
  }
}

async function assignerSequence() {
  if (!sequenceChoisie.value) return
  assignant.value = true
  try {
    const cibles = impayesCibles.value.length ? impayesCibles.value : selection.value.map(r => r._parse)

    for (const impayeObj of cibles) {
      await $parse.Cloud.run('assignerSequence', {
        impayelId:  impayeObj.id,
        sequenceId: sequenceChoisie.value,
      })
    }

    toast.add({ title: 'Séquence assignée', color: 'green' })
    selection.value = []
    impayesCibles.value = []
    modalAssignerOuvert.value = false
    await charger()
  } catch (err) {
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
  } finally {
    assignant.value = false
  }
}

// ── Charger au montage ──
watch(activeView, () => {
  if (activeView.value !== 'unitaire') {
    chargerTout()
  } else {
    charger()
  }
})

async function chargerTout() {
  loading.value = true
  try {
    const q = new $parse.Query('Impaye')
    q.include('sequence')
    q.descending('date_piece')
    q.limit(1000)
    const results = await q.find()
    impayes.value = results.map(rowToPlain)
    total.value = results.length
  } catch (err) {
    toast.add({ title: 'Erreur chargement', description: err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  charger()
  chargerSequences()
})
</script>
