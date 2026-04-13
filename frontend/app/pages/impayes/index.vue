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
      </div>
      <!-- Bouton Synchroniser -->
      <SyncButton @success="charger" />
    </div>

    <!-- Barre de filtres -->
    <div class="flex items-center gap-3 flex-wrap">
      <!-- Recherche globale -->
      <UInput
        v-model="globalFilter"
        icon="i-heroicons-magnifying-glass"
        placeholder="Rechercher (payeur, facture, référence, adresse...)"
        class="w-72"
      />

      <!-- Filtre séquence -->
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-700">Séquence :</span>
        <USelect
          v-model="filtreSequence"
          :items="sequenceOptions"
          class="w-44"
          :loading="sequencesLoading"
          placeholder="Toutes les séquences"
          @change="charger()"
        />
      </div>

      <!-- Visibilité des colonnes (vue unitaire uniquement) -->
      <UDropdownMenu
        v-if="activeView === 'unitaire'"
        :items="colonnesDropdownItems"
      >
        <UButton
          color="neutral"
          variant="outline"
          icon="i-heroicons-adjustments-horizontal"
          size="sm"
        >
          Colonnes
        </UButton>
      </UDropdownMenu>
    </div>

    <!-- ── Vue unitaire ── -->
    <div v-if="activeView === 'unitaire'" class="space-y-3">
      <UCard :ui="{ body: { padding: 'p-0' } }" class="max-h-[60vh] !overflow-x-auto !overflow-y-auto force-scrollbar">
        <UTable
          ref="tableUnitaire"
          :data="impayes"
          :columns="colonnesUnitaire"
          :loading="loading"
          v-model:sorting="sorting"
          v-model:column-visibility="columnVisibility"
          :global-filter="globalFilter"
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

      <div class="flex justify-end text-sm text-gray-500">
        {{ impayes.length }} impayés chargés
      </div>
    </div>

    <!-- ── Vue par payeur ── -->
    <div v-else-if="activeView === 'payeur'" class="space-y-3">
      <div v-if="loading" class="text-center py-8 text-gray-400">Chargement...</div>
      <div v-else-if="impayes.length === 0" class="text-center py-8 text-gray-400">Aucun impayé trouvé</div>
      <template v-else>
        <UCard :ui="{ body: { padding: 'p-0' } }" class="max-h-[65vh] !overflow-x-auto !overflow-y-auto force-scrollbar">
          <UTable
            :data="impayes"
            :columns="colonnesPayeur"
            :grouping="['payeur_nom']"
            :grouping-options="groupingOptions"
            :global-filter="globalFilter"
            :ui="{ td: 'empty:p-0' }"
          >
            <!-- Expand / nom du payeur -->
            <template #title-cell="{ row }">
              <div v-if="row.getIsGrouped()" class="flex items-center gap-2 max-w-md">
                <UButton
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  :icon="row.getIsExpanded() ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
                  @click="row.toggleExpanded()"
                />
                <span class="font-semibold text-gray-900 truncate">{{ row.getValue('payeur_nom') || '(inconnu)' }}</span>
                <UBadge color="neutral" variant="subtle">
                  {{ row.getLeafRows().length }} facture{{ row.getLeafRows().length > 1 ? 's' : '' }}
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

            <template #sequenceNom-cell="{ row }">
              <template v-if="!row.getIsGrouped()">
                <span v-if="row.original.sequenceNom" class="text-sm text-sky-700">{{ row.original.sequenceNom }}</span>
                <span v-else class="text-gray-400 text-sm">—</span>
              </template>
              <template v-else>
                <span class="text-sm text-sky-700">
                  {{ getUniqueSequencesForGroup(row) }}
                </span>
              </template>
            </template>

            <template #actions-cell="{ row }">
              <div v-if="!row.getIsGrouped()" class="flex items-center gap-1">
                <UButton icon="i-heroicons-document" color="neutral" variant="ghost" size="xs" @click="ouvrirPdf(row.original)" />
                <UDropdownMenu :items="menuItems(row.original)">
                  <UButton icon="i-heroicons-ellipsis-vertical" color="neutral" variant="ghost" size="xs" />
                </UDropdownMenu>
              </div>
              <div v-else class="flex items-center gap-1">
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
          </UTable>
        </UCard>
        <div class="flex justify-end text-sm text-gray-500">
          {{ groupesPayeur.length }} payeurs · {{ impayes.length }} impayés
        </div>
      </template>
    </div>

    <!-- ── Vue par contact ── -->
    <div v-else-if="activeView === 'contact'" class="space-y-3">
      <div v-if="loading" class="text-center py-8 text-gray-400">Chargement...</div>
      <div v-else-if="impayes.length === 0" class="text-center py-8 text-gray-400">Aucun impayé trouvé</div>
      <template v-else>
        <UCard :ui="{ body: { padding: 'p-0' } }" class="max-h-[65vh] !overflow-x-auto !overflow-y-auto force-scrollbar">
          <UTable
            :data="impayesContactFlat"
            :columns="colonnesContact"
            :grouping="['contact_nom', 'contact_role']"
            :grouping-options="groupingOptions"
            :global-filter="globalFilter"
            :ui="{ td: 'empty:p-0' }"
          >
            <!-- Expand / nom du contact / rôle -->
            <template #title-cell="{ row }">
              <div
                v-if="row.getIsGrouped()"
                class="flex items-center gap-2 max-w-md"
                :style="{ paddingLeft: `${row.depth * 1.25}rem` }"
              >
                <UButton
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  :icon="row.getIsExpanded() ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
                  @click="row.toggleExpanded()"
                />
                <span v-if="row.groupingColumnId === 'contact_nom'" class="font-semibold text-gray-900 truncate">
                  {{ row.getValue('contact_nom') }}
                </span>
                <span v-else class="text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">
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
              <div v-else class="flex items-center gap-1">
                <UButton
                  size="xs"
                  variant="soft"
                  color="sky"
                  icon="i-heroicons-queue-list"
                  @click.stop="ouvrirDrawerAssignationContact(row)"
                >
                  Attribuer séquence
                </UButton>
              </div>
            </template>
          </UTable>
        </UCard>
        <div class="flex justify-end text-sm text-gray-500">
          {{ groupesContact.length }} contacts
        </div>
      </template>
    </div>

    <!-- ── Vue sans séquence ── -->
    <div v-else class="space-y-3">
      <div v-if="loading" class="text-center py-8 text-gray-400">Chargement...</div>
      <div v-else-if="impayes.length === 0" class="text-center py-8 text-gray-400">Aucun impayé sans séquence trouvé</div>
      <template v-else>
        <UCard :ui="{ body: { padding: 'p-0' } }" class="max-h-[65vh] !overflow-x-auto !overflow-y-auto force-scrollbar">
          <UTable
            :data="impayes"
            :columns="colonnesParDefaut"
            :loading="loading"
            v-model:sorting="sorting"
            :global-filter="globalFilter"
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
              <span class="text-gray-400 text-sm">—</span>
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
        <div class="flex justify-end text-sm text-gray-500">
          {{ impayes.length }} impayés sans séquence
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
      @assigned="charger"
    />

    <!-- Modal assigner séquence (ligne) -->
    <UModal v-model:open="modalAssignerOuvert" title="Assigner une séquence">
      <template #body>
        <div class="space-y-4">
          <h3 class="text-sm font-medium text-gray-700">Sélectionnez une séquence</h3>

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
        
        <!-- Affichage des séquences sous forme de cards -->
        <div v-if="sequences.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <UCard
            v-for="sequence in sequences"
            :key="sequence.id"
            :class="{
              'border-2 border-primary-500': sequenceChoisie === sequence.id,
              'cursor-pointer hover:border-gray-300': true
            }"
            @click="sequenceChoisie = sequence.id"
          >
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-medium text-gray-900">{{ sequence.get('nom') }}</h3>
                <p class="text-sm text-gray-500 mt-1">
                  {{ sequence.get('description') || 'Aucune description' }}
                </p>
              </div>
              <UBadge
                :color="sequence.get('publiee') ? 'green' : 'gray'"
                variant="subtle"
              >
                {{ sequence.get('publiee') ? 'Publiée' : 'Non publiée' }}
              </UBadge>
            </div>
          </UCard>
        </div>
        
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
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="modalAssignerOuvert = false">Annuler</UButton>
          <UButton :loading="assignant" :disabled="!sequenceChoisie" @click="assignerSequenceWrapper">
            Assigner la séquence sélectionnée
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<style>
.force-scrollbar::-webkit-scrollbar {
  height: 8px;
}

.force-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}
</style>

<script setup>
import { h, resolveComponent } from 'vue'
import { getGroupedRowModel } from '@tanstack/vue-table'
import { useImpayesStoreComposable } from '~/composables/useImpayesStore'

const { $parse } = useNuxtApp()
const toast = useToast()
const router = useRouter()

// Helper : en-tête de colonne triable (pattern officiel Nuxt UI)
const UButton = resolveComponent('UButton')
function sortHeader(label) {
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

import ImpayeDrawerPdf from '~/components/ImpayeDrawerPdf.vue'
import DrawerAssignSequence from '~/components/DrawerAssignSequence.vue'

const {
  activeView,
  filtreSequence,
  impayes,
  loading,
  sequences,
  sequencesLoading,
  charger,
  chargerSequences,
  marquerPaye,
  marquerPayesGroupes,
  assignerSequence,
  sequenceOptions,
  vues,
} = useImpayesStoreComposable()

// État local supplémentaire
const selection = ref([])

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
const impayesCibles = ref([])

// ── TanStack Table : état partagé entre les vues ──
const globalFilter = ref('')
const sorting = ref([])

// Ref sur le tableau unitaire (pour l'API de visibilité des colonnes)
const tableUnitaire = useTemplateRef('tableUnitaire')

// Dropdown de visibilité des colonnes (vue unitaire)
const colonnesDropdownItems = computed(() => {
  const cols = tableUnitaire.value?.tableApi?.getAllColumns().filter(col => col.getCanHide())
  if (!cols?.length) return [[]]
  return [
    cols.map(col => ({
      label: typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id,
      type: 'checkbox',
      checked: col.getIsVisible(),
      onSelect(e) {
        e.preventDefault()
        col.toggleVisibility(!col.getIsVisible())
      },
    })),
  ]
})

// ── Options TanStack Table ──
const groupingOptions = ref({
  groupedColumnMode: 'remove',
  getGroupedRowModel: getGroupedRowModel(),
})

// ── Colonnes vue unitaire (toutes colonnes, optionnelles masquées par défaut) ──
const colonnesUnitaire = [
  { id: 'select',                      header: ' ',                          enableHiding: false },
  { accessorKey: 'nfacture',           header: sortHeader('N° Facture') },
  { accessorKey: 'date_piece',         header: sortHeader('Date pièce') },
  { accessorKey: 'numero_dossier',     header: 'N° Dossier' },
  { accessorKey: 'adresse_bien',       header: 'Adresse du bien' },
  { accessorKey: 'payeur_nom',         header: sortHeader('Payeur') },
  { accessorKey: 'retard',             header: sortHeader('Retard') },
  { accessorKey: 'reste_a_payer',      header: sortHeader('Reste à payer') },
  { accessorKey: 'date_debut_mission', header: 'Date intervention' },
  { accessorKey: 'sequence',           header: 'Séquence' },
  // Colonnes optionnelles (masquées par défaut)
  { accessorKey: 'reference',          header: 'Référence',                  meta: { initiallyHidden: true } },
  { accessorKey: 'reference_externe',  header: 'Réf externe',                meta: { initiallyHidden: true } },
  { accessorKey: 'statut_dossier',     header: 'Statut dossier',             meta: { initiallyHidden: true } },
  { accessorKey: 'total_ht',           header: sortHeader('Total HT'),       meta: { initiallyHidden: true } },
  { accessorKey: 'total_ttc',          header: sortHeader('Total TTC'),      meta: { initiallyHidden: true } },
  { accessorKey: 'apporteur_nom',      header: 'Apporteur',                  meta: { initiallyHidden: true } },
  { accessorKey: 'commentaire_piece',  header: 'Commentaire',                meta: { initiallyHidden: true } },
  { accessorKey: 'numero_lot',         header: 'Lot',                        meta: { initiallyHidden: true } },
  { accessorKey: 'etage',              header: 'Étage',                      meta: { initiallyHidden: true } },
  { accessorKey: 'porte',              header: 'Porte',                      meta: { initiallyHidden: true } },
  { id: 'actions',                     header: ' ',                          enableHiding: false },
]

// Visibilité initiale : masquer les colonnes optionnelles
const columnVisibility = ref(
  Object.fromEntries(
    colonnesUnitaire
      .filter(c => c.meta?.initiallyHidden)
      .map(c => [c.accessorKey, false])
  )
)

// ── Colonnes vue par défaut (sans séquence) ──
const colonnesParDefaut = [
  { id: 'select',                      header: ' ' },
  { accessorKey: 'nfacture',           header: sortHeader('N° Facture') },
  { accessorKey: 'date_piece',         header: sortHeader('Date pièce') },
  { accessorKey: 'numero_dossier',     header: 'N° Dossier' },
  { accessorKey: 'adresse_bien',       header: 'Adresse du bien' },
  { accessorKey: 'payeur_nom',         header: sortHeader('Payeur') },
  { accessorKey: 'retard',             header: sortHeader('Retard') },
  { accessorKey: 'reste_a_payer',      header: sortHeader('Reste à payer') },
  { accessorKey: 'date_debut_mission', header: 'Date intervention' },
  { accessorKey: 'sequence',           header: 'Séquence' },
  { id: 'actions',                     header: ' ' },
]

// ── Colonnes vue par payeur ──
const colonnesPayeur = [
  { id: 'title' },
  { accessorKey: 'payeur_nom' },
  { accessorKey: 'nfacture',      header: 'N° Facture',             cell: ({ row }) => row.getIsGrouped() ? null : undefined },
  { accessorKey: 'date_piece',    header: 'Date pièce',             cell: ({ row }) => row.getIsGrouped() ? null : undefined },
  { accessorKey: 'retard',        header: sortHeader('Retard'),      aggregationFn: 'max' },
  { accessorKey: 'reste_a_payer', header: sortHeader('Reste à payer'), aggregationFn: 'sum' },
  { accessorKey: 'sequenceNom',   header: 'Séquence' },
  { id: 'actions' },
]

// ── Colonnes vue par contact ──
const colonnesContact = [
  { id: 'title' },
  { accessorKey: 'contact_nom' },
  { accessorKey: 'contact_role' },
  { accessorKey: 'nfacture',      header: 'N° Facture',             cell: ({ row }) => row.getIsGrouped() ? null : undefined },
  { accessorKey: 'date_piece',    header: 'Date pièce',             cell: ({ row }) => row.getIsGrouped() ? null : undefined },
  { accessorKey: 'retard',        header: sortHeader('Retard'),      aggregationFn: 'max' },
  { accessorKey: 'reste_a_payer', header: sortHeader('Reste à payer'), aggregationFn: 'sum' },
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

// ── Sélection manuelle ──
function isSelected(item) {
  return selection.value.some(s => s.objectId === item.objectId)
}
function toggleSelection(item) {
  const idx = selection.value.findIndex(s => s.objectId === item.objectId)
  if (idx === -1) selection.value.push(item)
  else selection.value.splice(idx, 1)
}

// Options pour le modal
const sequenceOptionsModal = computed(() =>
  sequences.value.map(s => ({
    label: s.get('nom'),
    value: s.id
  }))
)

// ── Helpers ──
function formatDate(val) {
  if (!val) return '—'
  const d = val instanceof Date ? val : new Date(val)
  return d.toLocaleDateString('fr-FR', { dateStyle: 'short' })
}

function formatMontant(val) {
  if (val == null) return '—'
  return Number(val).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
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

function countContactGroup(row) {
  return row.groupingColumnId === 'contact_nom'
    ? row.subRows.reduce((s, sr) => s + sr.subRows.length, 0)
    : row.subRows.length
}

function getUniqueSequencesForGroup(row) {
  const seqs = new Set()
  row.getLeafRows().forEach(leafRow => {
    if (leafRow.original.sequenceNom) seqs.add(leafRow.original.sequenceNom)
  })
  if (seqs.size === 0) return '—'
  return [...seqs].join(', ')
}

// ── Actions ──
function ouvrirDrawerAssignation(row) {
  drawerAssignPayeur.value = row.getValue('payeur_nom') || '(inconnu)'
  drawerAssignImpayes.value = row.getLeafRows().map(r => r.original)
  drawerAssignOpen.value = true
}

function ouvrirDrawerAssignationContact(row) {
  const contactNom = row.groupingColumnId === 'contact_nom'
    ? row.getValue('contact_nom')
    : `${row.getValue('contact_nom')} (${row.getValue('contact_role')})`
  drawerAssignPayeur.value = contactNom || '(inconnu)'
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

  ]
}

async function assignerSequenceWrapper() {
  if (!sequenceChoisie.value) return
  assignant.value = true
  try {
    await assignerSequence(impayesCibles.value, sequenceChoisie.value)
    selection.value = []
    impayesCibles.value = []
    modalAssignerOuvert.value = false
    // Rafraîchissement supplémentaire pour s'assurer que le tableau est à jour
    await charger()
  } catch (err) {
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
  } finally {
    assignant.value = false
  }
}



onMounted(() => {
  charger()
  chargerSequences()
})
</script>
