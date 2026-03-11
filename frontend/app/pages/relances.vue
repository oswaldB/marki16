<template>
  <div class="p-6 space-y-4">

    <!-- ── Barre du haut ── -->
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <h1 class="text-2xl font-semibold text-gray-900">Relances</h1>

      <div class="flex items-center gap-2 flex-wrap">
        <!-- Toggle vue -->
        <div class="flex rounded-lg border border-gray-200 bg-gray-50 p-1 gap-1">
          <button
            class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5"
            :class="vue === 'tableau' ? 'bg-white text-sky-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
            @click="vue = 'tableau'"
          >
            <UIcon name="i-heroicons-table-cells" class="size-4" />
            Tableau
          </button>
          <button
            class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5"
            :class="vue === 'calendrier' ? 'bg-white text-sky-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
            @click="vue = 'calendrier'"
          >
            <UIcon name="i-heroicons-calendar-days" class="size-4" />
            Calendrier
          </button>
          <button
            class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5"
            :class="vue === 'validation' ? 'bg-white text-sky-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
            @click="vue = 'validation'"
          >
            <UIcon name="i-heroicons-check-circle" class="size-4" />
            Validation
          </button>
        </div>

        <!-- Filtres -->
        <USelect
          v-model="filtreStatut"
          :items="statutOptions"
          class="w-36"
          @change="charger"
        />
        <USelect
          v-model="filtreSequence"
          :items="sequenceOptions"
          class="w-44"
          @change="charger"
        />
        <UInput
          v-model="search"
          icon="i-heroicons-magnifying-glass"
          placeholder="Rechercher..."
          class="w-52"
        />
      </div>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-400">Chargement…</div>

    <template v-else>

      <!-- ══════════════════════════════════════
           VUE TABLEAU
      ══════════════════════════════════════ -->
      <div v-if="vue === 'tableau'" class="space-y-3">
        <UCard :ui="{ body: { padding: 'p-0' } }">
          <UTable
            v-model:sorting="sorting"
            :data="relancesFiltrees"
            :columns="colonnes"
          >
            <!-- Date -->
            <template #dateEnvoi-cell="{ row }">
              <span class="text-sm tabular-nums">{{ formatDate(row.original.dateEnvoi) }}</span>
            </template>

            <!-- Objet + badges -->
            <template #objet-cell="{ row }">
              <div class="flex items-center gap-2">
                <span class="text-sm truncate max-w-xs">{{ row.original.objet || '(sans objet)' }}</span>
                <span v-if="row.original.manuelle" title="Relance manuelle" class="text-xs">✋</span>
                <span v-if="!row.original.valide" title="Relance non validée" class="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-full font-medium">non validé</span>
              </div>
            </template>

            <!-- Destinataire -->
            <template #to-cell="{ row }">
              <span class="text-sm text-gray-600 truncate max-w-40">{{ row.original.to }}</span>
            </template>

            <!-- Facture → lien -->
            <template #nfacture-cell="{ row }">
              <NuxtLink
                v-if="row.original.impayelId"
                :to="`/impayes/${row.original.impayelId}`"
                class="text-sky-700 hover:underline text-sm font-mono"
              >
                {{ row.original.nfacture }}
              </NuxtLink>
              <span v-else class="text-sm text-gray-400">{{ row.original.nfacture }}</span>
            </template>

            <!-- Statut -->
            <template #statut-cell="{ row }">
              <UBadge :color="STATUT_CONFIG[row.original.statut]?.color ?? 'neutral'" variant="subtle" size="xs">
                {{ STATUT_CONFIG[row.original.statut]?.label ?? row.original.statut }}
              </UBadge>
            </template>

          </UTable>
        </UCard>

        <!-- Barre sélection groupée -->
        <div v-if="selection.length > 0" class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div class="flex items-center gap-3 bg-gray-900 text-white rounded-xl px-5 py-3 shadow-xl">
            <span class="text-sm font-medium">{{ selection.length }} relance(s) sélectionnée(s)</span>
            <UButton color="red" size="sm" :loading="annulantGroupe" @click="annulerGroupe">
              🗑 Annuler
            </UButton>
            <UButton color="green" size="sm" :loading="validantGroupe" @click="validerGroupe" v-if="selection.some(r => !r.valide)">
              ✓ Valider
            </UButton>
            <UButton color="neutral" variant="ghost" size="sm" class="text-white" @click="selection = []">
              Désélectionner
            </UButton>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════
           VUE CALENDRIER
      ══════════════════════════════════════ -->
      <div v-else-if="vue === 'calendrier'" class="flex gap-4">
        <UCard class="flex-1">
          <ClientOnly>
            <FullCalendar :options="calendarOptions" />
            <template #fallback>
              <div class="py-8 text-center text-gray-400 text-sm">Chargement du calendrier…</div>
            </template>
          </ClientOnly>
        </UCard>

        <!-- Panneau latéral jour sélectionné -->
        <div v-if="jourSelectionne" class="w-80 shrink-0">
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <span class="font-semibold text-sm">{{ formatDate(jourSelectionne) }}</span>
                <UButton icon="i-heroicons-x-mark" color="neutral" variant="ghost" size="xs" @click="jourSelectionne = null" />
              </div>
            </template>
            <div class="space-y-2">
              <div
                v-for="row in relancesJour"
                :key="row.id"
                class="border border-gray-100 rounded-lg p-2 space-y-1"
              >
                <div class="flex items-center justify-between gap-2">
                  <UBadge :color="STATUT_CONFIG[row.statut]?.color ?? 'neutral'" variant="subtle" size="xs">
                    {{ STATUT_CONFIG[row.statut]?.label ?? row.statut }}
                  </UBadge>
                  <div class="flex items-center gap-1">
                    <span v-if="!row.valide" title="Relance non validée" class="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-full font-medium">non validé</span>
                    <span v-if="row.manuelle" class="text-xs">✋</span>
                  </div>
                </div>
                <p class="text-sm font-medium truncate">{{ row.objet || '(sans objet)' }}</p>
                <p class="text-xs text-gray-500 truncate">{{ row.to }}</p>
                <div class="flex gap-1 pt-1">
                  <UButton
                    v-if="row.statut === 'pending' || row.statut === 'échec'"
                    icon="i-heroicons-pencil-square"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    @click="ouvrirDrawer(row, false)"
                  />
                  <UButton
                    v-if="row.statut === 'envoyé'"
                    icon="i-heroicons-eye"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    @click="ouvrirDrawer(row, true)"
                  />
                  <UButton
                    v-if="row.statut === 'échec'"
                    icon="i-heroicons-arrow-path"
                    color="sky"
                    variant="ghost"
                    size="xs"
                    @click="reessayerRelance(row)"
                  />
                </div>
              </div>
              <p v-if="relancesJour.length === 0" class="text-sm text-gray-400 italic">Aucune relance ce jour.</p>
            </div>
          </UCard>
        </div>
      </div>

      <!-- ══════════════════════════════════════
           VUE VALIDATION
      ══════════════════════════════════════ -->
      <div v-else-if="vue === 'validation'" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Colonne de gauche - Liste des relances à valider -->
        <div class="lg:col-span-1 space-y-4">
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <span class="font-semibold">Relances à valider</span>
                <span class="text-sm text-gray-500">{{ relancesAValider.length }} relance(s)</span>
              </div>
            </template>
            <div class="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
              <div
                v-for="(relance, index) in relancesAValider"
                :key="relance.id"
                class="p-3 border border-gray-100 rounded-lg cursor-pointer transition-colors"
                :class="{
                  'bg-blue-50 border-blue-200': relance.id === relanceCourante?.id,
                  'hover:bg-gray-50': relance.id !== relanceCourante?.id
                }"
                @click="selectionnerRelancePourValidation(relance)"
              >
                <div class="flex items-start gap-3">
                  <div class="flex-1">
                    <p class="font-medium text-sm truncate">{{ relance.objet || '(sans objet)' }}</p>
                    <p class="text-xs text-gray-500 truncate">{{ relance.to }}</p>
                    <p class="text-xs text-gray-400">{{ formatDate(relance.dateEnvoi) }}</p>
                  </div>
                  <span class="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-full font-medium shrink-0">{{ index + 1 }}</span>
                </div>
              </div>
              <div v-if="relancesAValider.length === 0" class="p-6 text-center text-gray-400">
                <UIcon name="i-heroicons-check-circle" class="size-8 mx-auto mb-2 text-green-500" />
                <p class="text-sm">Toutes les relances ont été validées !</p>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Colonne du milieu et droite - Détails de la relance (équivalent du drawer) -->
        <div class="lg:col-span-2" v-if="relanceCourante">
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <span class="font-semibold">Validation de la relance</span>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-500">
                    {{ positionRelanceCourante }} / {{ relancesAValider.length }}
                  </span>
                  <UButton
                    color="primary"
                    :loading="validantWorkflow"
                    @click="validerRelanceWorkflow"
                    :disabled="!relanceCourante"
                  >
                    Valider
                  </UButton>
                </div>
              </div>
            </template>

            <div class="space-y-6">
              <!-- Infos de base -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">Date d'envoi</label>
                  <UInput
                    :model-value="formatDate(relanceCourante.dateEnvoi)"
                    readonly
                    class="w-full"
                  />
                </div>
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">À</label>
                  <UInput
                    :model-value="relanceCourante.to"
                    readonly
                    class="w-full"
                  />
                </div>
              </div>

              <div>
                <label class="text-xs text-gray-500 mb-1 block">CC</label>
                <UInput
                  :model-value="relanceCourante.cc"
                  readonly
                  class="w-full"
                />
              </div>

              <div>
                <label class="text-xs text-gray-500 mb-1 block">Objet</label>
                <UInput
                  :model-value="relanceCourante.objet"
                  readonly
                  class="w-full"
                />
              </div>

              <!-- Corps de l'email -->
              <div>
                <label class="text-xs text-gray-500 mb-1 block">Corps de l'email</label>
                <div class="border border-gray-200 rounded-md overflow-hidden bg-white">
                  <ToastuiEditor
                    :initial-value="relanceCourante.corps"
                    :options="{
                      height: '400px',
                      usageStatistics: false,
                      hideModeSwitch: true,
                    }"
                    @change="(html) => relanceCourante.corps = html"
                  />
                </div>
              </div>

              <!-- Callout pièce jointe -->
              <UAlert
                icon="i-heroicons-paper-clip"
                color="info"
                variant="subtle"
                description="La facture sera automatiquement jointe en pièce jointe lors de l'envoi de cet email."
              />

              <!-- Factures liées -->
              <div
                v-for="imp in relanceCourante.impayes"
                :key="imp.id"
                class="rounded-lg border border-gray-200 overflow-hidden"
              >
                <div class="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
                  <div class="flex items-center gap-2 text-xs font-medium text-gray-600">
                    <UIcon name="i-heroicons-document-text" class="size-4 text-gray-400" />
                    <span>Facture {{ imp.nfacture }}</span>
                    <span v-if="imp.payeurNom" class="text-gray-400">· {{ imp.payeurNom }}</span>
                  </div>
                  <a :href="`/api/pdf/${imp.id}`" target="_blank">
                    <UButton icon="i-heroicons-arrow-down-tray" color="neutral" variant="ghost" size="xs">Télécharger</UButton>
                  </a>
                </div>
                <div class="relative" style="height: 300px">
                  <PdfIframe :impaye-id="imp.id" />
                </div>
              </div>

              <!-- Actions -->
              <div class="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <UButton color="neutral" variant="ghost" @click="passerRelanceWorkflow" :disabled="!peutPasser">
                  Passer
                </UButton>
                <UButton color="primary" :loading="validantWorkflow" @click="validerRelanceWorkflow" :disabled="!relanceCourante">
                  Valider cette relance
                </UButton>
              </div>
            </div>
          </UCard>
        </div>

        <div v-else class="lg:col-span-2 flex items-center justify-center py-12">
          <div class="text-center text-gray-400">
            <UIcon name="i-heroicons-inbox" class="size-12 mx-auto mb-4" />
            <p class="text-sm">Sélectionnez une relance à valider</p>
          </div>
        </div>
      </div>

    </template>

    <!-- ══════════════════════════════════════
         SLIDEOVER — Modifier / Voir une relance
    ══════════════════════════════════════ -->
    <USlideover
      v-model:open="showDrawer"
      side="right"
      :ui="{ content: 'w-1/2 max-w-none' }"
    >
      <template #header>
        <div class="flex items-center justify-between w-full">
          <span class="font-semibold text-lg">{{ drawerReadonly ? 'Voir la relance' : 'Modifier la relance' }}</span>
          <UButton v-if="!drawerReadonly && !relanceDrawer?.valide" color="primary" :loading="validantDrawer" @click="validerRelanceDrawer" size="sm">
            Valider
          </UButton>
        </div>
      </template>
      <template v-if="relanceDrawer" #body>
        <div class="space-y-4 py-2">

          <!-- 1 — Partie email -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-gray-500 mb-1 block">Date d'envoi</label>
              <UInput
                v-model="drawerDateEnvoi"
                type="date"
                :disabled="drawerReadonly"
                class="w-full"
              />
            </div>
            <div>
              <label class="text-xs text-gray-500 mb-1 block">À</label>
              <UInput v-model="drawerTo" :disabled="drawerReadonly" class="w-full" />
            </div>
          </div>
          <div>
            <label class="text-xs text-gray-500 mb-1 block">CC</label>
            <UInput v-model="drawerCc" :disabled="drawerReadonly" class="w-full" />
          </div>
          <div>
            <label class="text-xs text-gray-500 mb-1 block">Objet</label>
            <UInput v-model="drawerObjet" :disabled="drawerReadonly" class="w-full" />
          </div>
          <div>
            <label class="text-xs text-gray-500 mb-1 block">Corps</label>
            <div class="border border-gray-200 rounded-md overflow-hidden">
              <ClientOnly>
                <ToastuiEditor
                  v-if="editorVisible"
                  ref="editorDrawerRef"
                  :initial-value="drawerCorps"
                  :options="{ minHeight: '600px', usageStatistics: false, hideModeSwitch: true }"
                  initial-edit-type="wysiwyg"
                />
                <template #fallback>
                  <div class="p-3 text-gray-400 text-sm">Chargement de l'éditeur…</div>
                </template>
              </ClientOnly>
            </div>
          </div>

          <!-- 2 — Callout pièce jointe -->
          <UAlert
            icon="i-heroicons-paper-clip"
            color="info"
            variant="subtle"
            description="La facture sera automatiquement jointe en pièce jointe lors de l'envoi de cet email."
          />

          <!-- 3 — PDFs des factures liées -->
          <div
            v-for="imp in relanceDrawer?.impayes"
            :key="imp.id"
            class="rounded-lg border border-gray-200 overflow-hidden"
          >
            <div class="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
              <div class="flex items-center gap-2 text-xs font-medium text-gray-600">
                <UIcon name="i-heroicons-document-text" class="size-4 text-gray-400" />
                <span>Facture {{ imp.nfacture }}</span>
                <span v-if="imp.payeurNom" class="text-gray-400">· {{ imp.payeurNom }}</span>
              </div>
              <a :href="`/api/pdf/${imp.id}`" target="_blank">
                <UButton icon="i-heroicons-arrow-down-tray" color="neutral" variant="ghost" size="xs">Télécharger</UButton>
              </a>
            </div>
            <div class="relative" style="height: 420px">
              <PdfIframe :impaye-id="imp.id" />
            </div>
          </div>

        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="showDrawer = false">Annuler</UButton>
          <UButton v-if="!drawerReadonly" :loading="savingDrawer" @click="enregistrerDrawer">
            Enregistrer
          </UButton>
        </div>
      </template>
    </USlideover>

  </div>
</template>

<script setup>
import { h } from 'vue'
import { UButton } from '#components'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import ToastuiEditor from '~/components/ToastuiEditor.vue'
const FullCalendar = defineAsyncComponent(() => import('@fullcalendar/vue3').then(m => m.default ?? m))

const { $parse } = useNuxtApp()
const toast = useToast()

// ── State ──────────────────────────────────────────────────────
const vue = ref('tableau')
const loading = ref(false)
const relances = ref([])
const sequences = ref([])
const selection = ref([])
const annulantGroupe = ref(false)
const validantGroupe = ref(false)

// Filtres
const filtreStatut = ref('tous')
const filtreSequence = ref('tous')
const search = ref('')

// Calendrier
const jourSelectionne = ref(null)

// Drawer
const showDrawer = ref(false)
const drawerReadonly = ref(false)
const drawerRow = ref(null)
const drawerDateEnvoi = ref('')
const drawerTo = ref('')
const drawerCc = ref('')
const drawerObjet = ref('')
const drawerCorps = ref('')
const savingDrawer = ref(false)
const validantDrawer = ref(false)
const editorDrawerRef = ref(null)
const editorVisible = ref(false)

// Validation workflow
const relanceCourante = ref(null)
const validantWorkflow = ref(false)

// Computed ref pour le drawer
const relanceDrawer = computed(() => drawerRow.value)

// Computed pour le workflow de validation
const relancesAValider = computed(() => {
  return relances.value.filter(r => !r.valide).sort((a, b) => {
    return new Date(a.dateEnvoi) - new Date(b.dateEnvoi)
  })
})

const positionRelanceCourante = computed(() => {
  if (!relanceCourante.value) return 0
  const index = relancesAValider.value.findIndex(r => r.id === relanceCourante.value.id)
  return index + 1
})

const peutPasser = computed(() => {
  return relancesAValider.value.length > 1
})

// ── Constants ──────────────────────────────────────────────────
const STATUT_CONFIG = {
  pending:  { label: 'En attente', color: 'neutral' },
  'envoyé': { label: 'Envoyé',     color: 'green'   },
  'échec':  { label: 'Échec',      color: 'red'     },
  'annulé': { label: 'Annulé',     color: 'orange'  },
}

function sortableHeader(label) {
  return ({ column }) => {
    const isSorted = column.getIsSorted()
    return h(UButton, {
      color: 'neutral',
      variant: 'ghost',
      label,
      icon: isSorted === 'asc'
        ? 'i-lucide-arrow-up-narrow-wide'
        : isSorted === 'desc'
          ? 'i-lucide-arrow-down-wide-narrow'
          : 'i-lucide-arrow-up-down',
      class: '-mx-2.5',
      onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
    })
  }
}

const colonnes = [
  { accessorKey: 'dateEnvoi',   header: sortableHeader('Date envoi') },
  { accessorKey: 'email_index', header: sortableHeader('Relance n°'), cell: ({ row }) => row.original.email_index != null ? `n° ${row.original.email_index + 1}` : '—' },
  { accessorKey: 'objet',       header: sortableHeader('Objet') },
  { accessorKey: 'to',          header: sortableHeader('Destinataire') },
  { accessorKey: 'nfacture',    header: sortableHeader('Facture') },
  { accessorKey: 'statut',      header: sortableHeader('Statut') },
  {
    id: 'actions',
    header: ' ',
    enableSorting: false,
    cell: ({ row }) => {
      const r = row.original
      const btns = []
      if (r.statut === 'pending') {
        btns.push(h(UButton, { icon: 'i-heroicons-pencil-square', color: 'neutral', variant: 'ghost', size: 'xs', onClick: () => ouvrirDrawer(r, false) }))
        btns.push(h(UButton, { icon: 'i-heroicons-trash', color: 'red', variant: 'ghost', size: 'xs', onClick: () => annulerRelance(r) }))
      } else if (r.statut === 'envoyé') {
        btns.push(h(UButton, { icon: 'i-heroicons-eye', color: 'neutral', variant: 'ghost', size: 'xs', onClick: () => ouvrirDrawer(r, true) }))
      } else if (r.statut === 'échec') {
        btns.push(h(UButton, { icon: 'i-heroicons-pencil-square', color: 'neutral', variant: 'ghost', size: 'xs', onClick: () => ouvrirDrawer(r, false) }))
        btns.push(h(UButton, { icon: 'i-heroicons-arrow-path', color: 'sky', variant: 'ghost', size: 'xs', onClick: () => reessayerRelance(r) }))
      }
      return h('div', { class: 'flex items-center gap-1' }, btns)
    },
  },
]

const sorting = ref([{ id: 'dateEnvoi', desc: false }])

// Options de statut - seront chargées dynamiquement
const { getOptions } = useDynamicOptions()
const statutOptions = ref([
  { label: 'Tous',               value: 'tous' },
  { label: 'En attente',         value: 'pending' },
  { label: 'Envoyé',             value: 'envoyé' },
  { label: 'Échec',              value: 'échec' },
  { label: 'Annulé',             value: 'annulé' },
  { label: 'Non validées',       value: 'non-validees' },
])

// Charger les options dynamiques
onMounted(async () => {
  try {
    const dynamicOptions = await getOptions('statut_relance', false)
    if (dynamicOptions.length > 0) {
      statutOptions.value = [
        { label: 'Tous', value: 'tous' },
        ...dynamicOptions
      ]
    }
  } catch (error) {
    console.error('Failed to load dynamic statut options:', error)
  }
})

// ── Computed ───────────────────────────────────────────────────
const sequenceOptions = computed(() => [
  { label: 'Toutes les séquences', value: 'tous' },
  ...sequences.value.map(s => ({ label: s.get('nom'), value: s.id })),
])

const relancesFiltrees = computed(() => {
  if (!search.value) return relances.value
  const s = search.value.toLowerCase()
  return relances.value.filter(r =>
    r.objet.toLowerCase().includes(s) || r.to.toLowerCase().includes(s)
  )
})

const relancesJour = computed(() => {
  if (!jourSelectionne.value) return []
  const jour = new Date(jourSelectionne.value).toDateString()
  return relancesFiltrees.value.filter(r => {
    const d = r.dateEnvoi ? new Date(r.dateEnvoi).toDateString() : null
    return d === jour
  })
})

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  locale: 'fr',
  headerToolbar: { left: 'prev,next today', center: 'title', right: '' },
  events: relancesFiltrees.value.map(r => {
    // Trouver la date la plus récente parmi toutes les relances pour afficher tout sur un seul jour
    const toutesLesDates = relancesFiltrees.value.map(r => new Date(r.dateEnvoi))
    const dateLaPlusRecente = new Date(Math.max.apply(null, toutesLesDates))
    
    // Définir l'heure à 18h
    const dateA18h = new Date(dateLaPlusRecente)
    dateA18h.setHours(18, 0, 0, 0)
    
    return {
      id: r.id,
      title: (r.to?.split('@')[0] || '?') + ' — ' + (r.objet?.slice(0, 20) || ''),
      start: dateA18h.toISOString(), // Utiliser start au lieu de date pour spécifier l'heure
      backgroundColor: statutCalColor(r.statut),
      borderColor:     statutCalColor(r.statut),
      extendedProps: { row: r },
    }
  }),
  eventClick(info) {
    const row = info.event.extendedProps.row
    jourSelectionne.value = info.event.startStr
  },
  dateClick(info) {
    jourSelectionne.value = info.dateStr
  },
}))

function statutCalColor(s) {
  if (s === 'envoyé') return '#22c55e'
  if (s === 'échec')  return '#ef4444'
  if (s === 'annulé') return '#9ca3af'
  return '#3b82f6'
}

// ── Helpers ────────────────────────────────────────────────────
function formatDate(val) {
  if (!val) return '—'
  const d = val instanceof Date ? val : new Date(val)
  return isNaN(d) ? '—' : d.toLocaleDateString('fr-FR', { dateStyle: 'short' })
}

function toDateInput(val) {
  if (!val) return ''
  const d = val instanceof Date ? val : new Date(val)
  return isNaN(d) ? '' : d.toISOString().slice(0, 10)
}

function parseImpaye(i) {
  if (!i) return null
  return {
    id:           i.id,
    nfacture:     i.get('nfacture') || '—',
    statut:       i.get('statut') || '',
    resteAPayer:  i.get('reste_a_payer') ?? null,
    montantTotal: i.get('total_ttc') ?? null,
    adresseBien:  i.get('adresse_bien') || '',
    payeurNom:    i.get('payeur_nom') || '',
  }
}

function parseRelance(r) {
  // Supporte impayes (array) et impaye (single pointer)
  const impayes = r.get('impayes')   // array de Pointer si peuplé
  const impaye  = r.get('impaye')    // single Pointer fallback

  const impayeliste = Array.isArray(impayes) && impayes.length > 0
    ? impayes.map(parseImpaye).filter(Boolean)
    : impaye ? [parseImpaye(impaye)] : []

  return {
    _parse:      r,
    id:          r.id,
    dateEnvoi:   r.get('dateEnvoi'),
    objet:       r.get('objet') || '',
    to:          r.get('to') || r.get('destinataire') || '',
    cc:          r.get('cc') || '',
    corps:       r.get('corps') || '',
    statut:      r.get('statut') || 'pending',
    manuelle:    r.get('manuelle') || false,
    valide:      r.get('valide') !== false, // par défaut true si non défini
    nfacture:    impayeliste.map(i => i.nfacture).join(', ') || '—',
    impayelId:   impayeliste[0]?.id || null,
    email_index: r.get('email_index') ?? null,
    impayes:     impayeliste,
  }
}

// ── Chargement ────────────────────────────────────────────────
async function charger() {
  loading.value = true
  selection.value = []
  try {
    const q = new $parse.Query('Relance')
    q.include('impaye')
    q.include('impayes')
    q.include('sequence')
    q.descending('dateEnvoi')
    q.limit(500)

    if (filtreStatut.value !== 'tous' && filtreStatut.value !== 'non-validees') {
      q.equalTo('statut', filtreStatut.value)
    }
    
    if (filtreStatut.value === 'non-validees') {
      q.equalTo('valide', false)
    }
    
    if (filtreSequence.value && filtreSequence.value !== 'tous') {
      const ptr = $parse.Object.fromJSON({ __type: 'Pointer', className: 'Sequence', objectId: filtreSequence.value })
      q.equalTo('sequence', ptr)
    }

    const results = await q.find()
    relances.value = results.map(parseRelance)
  } catch (err) {
    toast.add({ title: 'Erreur chargement', description: err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

async function chargerSequences() {
  try {
    const q = new $parse.Query('Sequence')
    q.ascending('nom')
    q.limit(200)
    sequences.value = await q.find()
  } catch {}
}

// ── Actions ────────────────────────────────────────────────────
async function annulerRelance(row) {
  try {
    row._parse.set('statut', 'annulé')
    await row._parse.save()
    row.statut = 'annulé'
    toast.add({ title: 'Relance annulée', color: 'green' })
  } catch (err) {
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
  }
}

async function reessayerRelance(row) {
  try {
    row._parse.set('statut', 'pending')
    row._parse.set('dateEnvoi', new Date())
    await row._parse.save()
    row.statut = 'pending'
    row.dateEnvoi = new Date()
    toast.add({ title: 'Relance remise en attente', color: 'green' })
  } catch (err) {
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
  }
}

async function annulerGroupe() {
  annulantGroupe.value = true
  try {
    for (const row of selection.value) {
      row._parse.set('statut', 'annulé')
    }
    await $parse.Object.saveAll(selection.value.map(r => r._parse))
    for (const row of selection.value) row.statut = 'annulé'
    toast.add({ title: `${selection.value.length} relance(s) annulée(s)`, color: 'green' })
    selection.value = []
  } catch (err) {
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
  } finally {
    annulantGroupe.value = false
  }
}

async function validerGroupe() {
  validantGroupe.value = true
  try {
    const relancesAValider = selection.value.filter(r => !r.valide)
    if (relancesAValider.length === 0) {
      toast.add({ title: 'Aucune relance à valider', color: 'yellow' })
      return
    }

    for (const row of relancesAValider) {
      row._parse.set('valide', true)
      row.valide = true
    }
    await $parse.Object.saveAll(relancesAValider.map(r => r._parse))
    toast.add({ title: `${relancesAValider.length} relance(s) validée(s)`, color: 'green' })
    selection.value = []
  } catch (err) {
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
  } finally {
    validantGroupe.value = false
  }
}

// ── Drawer ────────────────────────────────────────────────────
function ouvrirDrawer(row, readonly) {
  drawerRow.value = row
  drawerReadonly.value = readonly
  drawerDateEnvoi.value = toDateInput(row.dateEnvoi)
  drawerTo.value = row.to
  drawerCc.value = row.cc
  drawerObjet.value = row.objet
  drawerCorps.value = row.corps
  editorVisible.value = false
  showDrawer.value = true
  console.log('[ouvrirDrawer] drawerCorps:', drawerCorps.value?.slice(0, 80))
  // Attendre la fin de l'animation du slideover avant de monter l'éditeur
  setTimeout(() => { editorVisible.value = true }, 300)
}

async function enregistrerDrawer() {
  savingDrawer.value = true
  try {
    const r = drawerRow.value._parse
    r.set('dateEnvoi', drawerDateEnvoi.value ? new Date(drawerDateEnvoi.value) : r.get('dateEnvoi'))
    r.set('to', drawerTo.value)
    r.set('cc', drawerCc.value)
    r.set('objet', drawerObjet.value)
    if (editorDrawerRef.value) {
      try { r.set('corps', editorDrawerRef.value.getInstance().getHTML()) } catch {}
    }
    await r.save()
    showDrawer.value = false
    toast.add({ title: 'Relance enregistrée', color: 'green' })
    await charger()
  } catch (err) {
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
  } finally {
    savingDrawer.value = false
  }
}

async function validerRelanceDrawer() {
  validantDrawer.value = true
  try {
    const r = drawerRow.value._parse
    r.set('valide', true)
    drawerRow.value.valide = true
    await r.save()
    showDrawer.value = false
    toast.add({ title: 'Relance validée', color: 'green' })
    await charger()
  } catch (err) {
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
  } finally {
    validantDrawer.value = false
  }
}

// ── Workflow de validation ────────────────────────────────────
function selectionnerRelancePourValidation(relance) {
  relanceCourante.value = relance
}

async function validerRelanceWorkflow() {
  if (!relanceCourante.value) return
  
  validantWorkflow.value = true
  try {
    const r = relanceCourante.value._parse
    r.set('valide', true)
    relanceCourante.value.valide = true
    await r.save()
    
    toast.add({ title: 'Relance validée !', color: 'green' })
    
    // Passer à la relance suivante
    await charger()
    passerARelanceSuivante()
  } catch (err) {
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
  } finally {
    validantWorkflow.value = false
  }
}

function passerRelanceWorkflow() {
  passerARelanceSuivante()
}

function passerARelanceSuivante() {
  if (relancesAValider.value.length === 0) {
    relanceCourante.value = null
    return
  }
  
  // Trouver l'index courant
  const indexCourant = relancesAValider.value.findIndex(r => r.id === relanceCourante.value?.id)
  
  // Si on est au dernier élément ou si aucune relance n'est sélectionnée, prendre la première
  const indexSuivant = indexCourant === relancesAValider.value.length - 1 || indexCourant === -1 
    ? 0 
    : indexCourant + 1
  
  relanceCourante.value = relancesAValider.value[indexSuivant]
}

// Auto-sélectionner la première relance quand on arrive sur la vue validation
watch(vue, (newVue) => {
  if (newVue === 'validation' && relancesAValider.value.length > 0) {
    relanceCourante.value = relancesAValider.value[0]
  }
})

onMounted(() => {
  charger()
  chargerSequences()
})
</script>
