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
              <div v-if="row.original.impayes && row.original.impayes.length > 1" class="flex flex-wrap gap-1 text-sm font-mono">
                <span v-for="(imp, index) in row.original.impayes" :key="imp.id">
                  <NuxtLink
                    :to="`/impayes/${imp.id}`"
                    class="text-sky-700 hover:underline"
                  >
                    {{ imp.nfacture }}
                  </NuxtLink>
                  <span v-if="index < row.original.impayes.length - 1">, </span>
                </span>
              </div>
              <NuxtLink
                v-else-if="row.original.impayelId"
                :to="`/impayes/${row.original.impayelId}`"
                class="text-sky-700 hover:underline text-sm font-mono"
              >
                {{ row.original.nfacture }}
              </NuxtLink>
              <span v-else class="text-sm text-gray-400">{{ row.original.nfacture }}</span>
            </template>

            <!-- Statut -->
            <template #statut-cell="{ row }">
              <div class="flex items-center gap-2">
                <UBadge :color="STATUT_CONFIG[row.original.statut]?.color ?? 'neutral'" variant="subtle" size="xs">
                  {{ STATUT_CONFIG[row.original.statut]?.label ?? row.original.statut }}
                </UBadge>
                <UButton
                  v-if="row.original.statut === 'pending' || row.original.statut === 'échec' || row.original.statut === 'optimisee'"
                  icon="i-heroicons-pencil-square"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  @click="ouvrirDrawer(row, false)"
                />
              </div>
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
                    v-if="row.statut === 'pending' || row.statut === 'échec' || row.statut === 'optimisee'"
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
          
          <!-- Case à cocher pour appliquer à tous les emails suivants -->
          <div v-if="!drawerReadonly" class="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <UCheckbox v-model="applyToAllFollowing.value" />
            <span class="text-sm text-gray-600">Appliquer ce destinataire à tous les emails suivants</span>
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
          <div v-if="!relanceDrawer?.impayes || relanceDrawer?.impayes.length === 0" class="text-center py-4 text-gray-400 text-sm">
            Aucun PDF disponible pour cette relance
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
import { UButton, UCheckbox } from '#components'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import ToastuiEditor from '~/components/ToastuiEditor.vue'
import PdfIframe from '~/components/PdfIframe.vue'

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
const applyToAllFollowing = ref(false) // État de la case à cocher
const originalToValue = ref('') // Valeur originale du champ To pour détecter les changements

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
  pending:   { label: 'En attente', color: 'neutral' },
  'envoyé':  { label: 'Envoyé',     color: 'green'   },
  'échec':   { label: 'Échec',      color: 'red'     },
  'annulé':  { label: 'Annulé',     color: 'orange'  },
  'optimisee': { label: 'Optimisée', color: 'purple' },
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
  { accessorKey: 'dateEnvoi',   header: sortableHeader('Date envoi prévue') },
  { accessorKey: 'objet',       header: sortableHeader('Objet') },
  { accessorKey: 'to',          header: sortableHeader('Destinataire') },
  {
    accessorKey: 'nfacture',
    header: sortableHeader('Facture'),
    cell: ({ row }) => {
      const r = row.original
      
      // Si plusieurs factures, afficher toutes les numéros de facture
      if (r.impayes && r.impayes.length > 1) {
        const invoiceNumbers = r.impayes.map(imp => imp.nfacture).join(', ')
        return h('div', { class: 'text-sm font-mono' }, invoiceNumbers)
      }
      
      if (r.impayelId) {
        return h(NuxtLink, {
          to: `/impayes/${r.impayelId}`,
          class: 'text-sky-700 hover:underline text-sm font-mono'
        }, r.nfacture)
      }
      return h('span', { class: 'text-sm text-gray-400' }, r.nfacture)
    }
  },
  { accessorKey: 'statut',      header: sortableHeader('Statut') },
  {
    accessorKey: 'valide',
    header: sortableHeader('Validé'),
    cell: ({ row }) => {
      const isValide = row.original.valide
      return h('span', {
        class: isValide ? 'text-green-600 font-medium' : 'text-yellow-600 font-medium'
      }, isValide ? 'Oui' : 'Non')
    }
  },
  {
    id: 'actions',
    header: ' ',
    enableSorting: false,
    cell: ({ row }) => {
      const r = row.original
      const btns = []
      if (r.statut === 'pending') {
        btns.push(h(UButton, { icon: 'i-heroicons-trash', color: 'red', variant: 'ghost', size: 'xs', onClick: () => annulerRelance(r) }))
      } else if (r.statut === 'envoyé') {
        btns.push(h(UButton, { icon: 'i-heroicons-eye', color: 'neutral', variant: 'ghost', size: 'xs', onClick: () => ouvrirDrawer(r, true) }))
      } else if (r.statut === 'échec') {
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
  displayEventTime: false, // Masquer l'affichage de l'heure
  events: relancesFiltrees.value.map(r => {
    // Utiliser la date réelle de la relance sans heure spécifique
    const dateRelance = new Date(r.dateEnvoi)
    dateRelance.setHours(0, 0, 0, 0) // Réinitialiser l'heure à minuit
    
    return {
      id: r.id,
      title: (r.to?.split('@')[0] || '?') + ' — ' + (r.objet?.slice(0, 20) || ''),
      start: dateRelance.toISOString(),
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
  
  // Handle both Parse Objects and plain JavaScript objects
  const getValue = (key) => {
    return i.get ? i.get(key) : i[key]
  }
  
  return {
    id:           i.id,
    nfacture:     getValue('nfacture') || '—',
    statut:       getValue('statut') || '',
    resteAPayer:  getValue('reste_a_payer') ?? null,
    montantTotal: getValue('total_ttc') ?? null,
    adresseBien:  getValue('adresse_bien') || '',
    payeurNom:    getValue('payeur_nom') || '',
  }
}

function parseRelance(r) {
  // Supporte impayes (array) et impaye (single pointer)
  const impayes = r.get('impayes')   // array de Pointer si peuplé
  const impaye  = r.get('impaye')    // single Pointer fallback

  // Handle the case where impayes contains object IDs (strings) instead of Parse Objects
  const impayeliste = Array.isArray(impayes) && impayes.length > 0
    ? impayes.map(i => {
        // If it's a string (object ID), we can't parse it, so return basic info from metadata
        if (typeof i === 'string' || !i.get) {
          return null
        }
        return parseImpaye(i)
      }).filter(Boolean)
    : impaye ? [parseImpaye(impaye)] : []

  // Toujours retourner une seule ligne, avec toutes les factures
  // Handle both old and new field names for backward compatibility
  const getValue = (key) => {
    return r.get ? r.get(key) : r[key]
  }
  
  const metadata = getValue('metadata') || {}
  const templateData = metadata.templateData || {}
  
  // Get facture number from metadata if impayeliste is empty
  const nfactureFromMetadata = templateData.nfacture || templateData.nfactures_liste
  const factureNumber = impayeliste.length > 0 
    ? impayeliste.map(imp => imp.nfacture).join(', ')
    : (nfactureFromMetadata ? String(nfactureFromMetadata) : '—')
  
  // Also try to get email from contact if available
  const contact = r.get('contact')
  const contactEmail = contact ? (contact.get ? contact.get('email') : contact.email) : null
  
  return {
    _parse:      r,
    id:          r.id,
    dateEnvoi:   getValue('date_envoi_prevue') || getValue('date_envoi') || getValue('dateEnvoi'),
    objet:       getValue('sujet') || getValue('objet') || '',
    to:          templateData.payeur_email || templateData.proprio_email || contactEmail || getValue('to') || getValue('destinataire') || '',
    cc:          getValue('cc') || '',
    corps:       getValue('contenu') || getValue('corps') || '',
    statut:      getValue('statut') || 'pending',
    manuelle:    getValue('manuelle') || false,
    valide:      getValue('valide') !== false, // par défaut true si non défini
    nfacture:    factureNumber,
    impayelId:   impayeliste.length > 0 ? impayeliste.map(imp => imp.id) : null,
    email_index: getValue('email_index') ?? null,
    impayes:     impayeliste,
    isGrouped:   impayeliste.length > 1,
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
    q.include('contact')
    q.include('sequence')
    q.descending('date_envoi_prevue')
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
    // Grouper les relances par ID pour éviter les doublons
    const relancesParId = {}
    selection.value.forEach(row => {
      if (!relancesParId[row.id]) {
        relancesParId[row.id] = row
      }
    })
    
    const relancesAAnnuler = Object.values(relancesParId)
    
    await $parse.Object.saveAll(relancesAAnnuler.map(r => {
      r._parse.set('statut', 'annulé')
      return r._parse
    }))
    
    // Mettre à jour le statut localement
    relancesAAnnuler.forEach(r => {
      r.statut = 'annulé'
    })
    
    toast.add({ title: `${relancesAAnnuler.length} relance(s) annulée(s)`, color: 'green' })
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
    // Grouper les relances par ID pour éviter les doublons
    const relancesParId = {}
    selection.value.forEach(row => {
      if (!relancesParId[row.id] && !row.valide) {
        relancesParId[row.id] = row
      }
    })
    
    const relancesAValider = Object.values(relancesParId)
    
    if (relancesAValider.length === 0) {
      toast.add({ title: 'Aucune relance à valider', color: 'yellow' })
      return
    }

    await $parse.Object.saveAll(relancesAValider.map(r => {
      r._parse.set('valide', true)
      return r._parse
    }))
    
    // Mettre à jour le statut localement
    relancesAValider.forEach(r => {
      r.valide = true
    })
    
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
  // Gérer les deux cas: row.original (vue tableau) ou row direct (vue calendrier)
  const relance = row.original || row
  
  drawerRow.value = relance
  drawerReadonly.value = readonly
  drawerDateEnvoi.value = toDateInput(relance.dateEnvoi)
  drawerTo.value = relance.to
  drawerCc.value = relance.cc
  drawerObjet.value = relance.objet
  drawerCorps.value = relance.corps
  originalToValue.value = relance.to // Stocker la valeur originale
  applyToAllFollowing.value = false // Réinitialiser l'état de la case à cocher
  editorVisible.value = false
  showDrawer.value = true
  console.log('[ouvrirDrawer] drawerCorps:', drawerCorps.value?.slice(0, 80))
  console.log('[ouvrirDrawer] impayes:', relance.impayes)
  // Attendre la fin de l'animation du slideover avant de monter l'éditeur
  setTimeout(() => { editorVisible.value = true }, 300)
}

async function enregistrerDrawer() {
  savingDrawer.value = true
  try {
    const row = drawerRow.value
    const r = row._parse
    
    r.set('dateEnvoi', drawerDateEnvoi.value ? new Date(drawerDateEnvoi.value) : r.get('dateEnvoi'))
    r.set('to', drawerTo.value)
    r.set('cc', drawerCc.value)
    r.set('objet', drawerObjet.value)
    if (editorDrawerRef.value) {
      try { r.set('corps', editorDrawerRef.value.getInstance().getHTML()) } catch {}
    }
    await r.save()
    
    // Si la case est cochée, appliquer le changement à tous les emails suivants
    if (applyToAllFollowing.value) {
      await appliquerToAuxRelancesSuivantes(row, drawerTo.value)
    }
    
    showDrawer.value = false
    toast.add({ title: 'Relance enregistrée', color: 'green' })
    await charger()
  } catch (err) {
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
  } finally {
    savingDrawer.value = false
  }
}

// Fonction pour appliquer le changement de destinataire à toutes les relances suivantes
async function appliquerToAuxRelancesSuivantes(relanceCourante, nouveauTo) {
  try {
    // Trouver toutes les relances avec la même facture (impaye) qui ont une date postérieure
    const relancesAAppliquer = relances.value.filter(r => {
      // Vérifier si c'est une relance suivante (même facture, date postérieure)
      const memeFacture = r.impayelId && relanceCourante.impayelId && 
                         r.impayelId.some(id => relanceCourante.impayelId.includes(id))
      const datePosterieure = new Date(r.dateEnvoi) > new Date(relanceCourante.dateEnvoi)
      const differentId = r.id !== relanceCourante.id
      
      return memeFacture && datePosterieure && differentId
    })
    
    if (relancesAAppliquer.length > 0) {
      // Mettre à jour toutes les relances suivantes
      const objetsAEnregistrer = relancesAAppliquer.map(r => {
        r._parse.set('to', nouveauTo)
        r.to = nouveauTo // Mettre à jour localement
        return r._parse
      })
      
      await $parse.Object.saveAll(objetsAEnregistrer)
      
      toast.add({ 
        title: `Destinataire appliqué à ${relancesAAppliquer.length} relance(s) suivante(s)`, 
        color: 'blue'
      })
    }
  } catch (err) {
    toast.add({ title: 'Erreur', description: 'Échec de la mise à jour des relances suivantes: ' + err.message, color: 'red' })
  }
}

async function validerRelanceDrawer() {
  validantDrawer.value = true
  try {
    const row = drawerRow.value
    const r = row._parse
    
    r.set('valide', true)
    row.valide = true
    
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
    const row = relanceCourante.value
    const r = row._parse
    
    r.set('valide', true)
    row.valide = true
    
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

// Watcher pour détecter les changements dans le champ To
watch(drawerTo, (newVal, oldVal) => {
  if (newVal !== originalToValue.value && newVal !== oldVal) {
    // Le champ To a été modifié
    // La case à cocher est maintenant toujours visible en mode édition
  }
})

onMounted(() => {
  charger()
  chargerSequences()
})
</script>
