<template>
  <div class="p-6 space-y-4">
    <h1 class="text-2xl font-semibold text-gray-900">Clients récalcitrants</h1>

    <!-- Description -->
    <p class="text-sm text-gray-500">
      Un récalcitrant est un contact dont tous les impayés sont non réglés et qui a reçu
      l'intégralité de sa séquence de relances. Les impayés suspendus et les contacts
      suspendus sont exclus.
    </p>

    <!-- Barre de recherche -->
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div class="flex items-center gap-3 flex-wrap">
        <UInput
          v-model="search"
          icon="i-heroicons-magnifying-glass"
          placeholder="Rechercher (nom, email, n° facture, adresse...)"
          class="w-80"
        />
      </div>
      <div class="text-sm text-gray-500">
        {{ recalcitrants.length }} récalcitrant{{ recalcitrants.length > 1 ? 's' : '' }}
      </div>
    </div>

    <!-- Tableau -->
    <div v-if="loading" class="text-center py-8 text-gray-400">Chargement…</div>
    <div v-else-if="recalcitrants.length === 0" class="text-center py-8 text-gray-400">
      Aucun client récalcitrant trouvé
    </div>
    <template v-else>
      <UCard :ui="{ body: { padding: 'p-0' } }" class="max-h-[70vh] !overflow-x-auto !overflow-y-auto force-scrollbar">
        <UTable
          :data="flatData"
          :columns="colonnes"
          :grouping="['contact_nom']"
          :grouping-options="groupingOptions"
          :global-filter="search"
          :ui="{ td: 'empty:p-0' }"
        >
          <!-- Ligne groupée (contact) -->
          <template #title-cell="{ row }">
            <div v-if="row.getIsGrouped()" class="flex items-center gap-2 max-w-lg">
              <UButton
                variant="ghost"
                color="neutral"
                size="xs"
                :icon="row.getIsExpanded() ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
                @click="row.toggleExpanded()"
              />
              <span class="font-semibold text-gray-900 truncate">
                {{ row.getValue('contact_nom') || '(inconnu)' }}
              </span>
              <span v-if="getContactEmail(row)" class="text-xs text-gray-400 truncate max-w-[200px]">
                {{ getContactEmail(row) }}
              </span>
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

          <template #date_echeance-cell="{ row }">
            <span v-if="!row.getIsGrouped()">{{ formatDate(row.original.date_echeance) }}</span>
          </template>

          <template #reste_a_payer-cell="{ row }">
            <span :class="row.getIsGrouped() ? 'font-bold text-gray-900' : 'font-medium'">
              {{ formatMontant(row.getValue('reste_a_payer')) }}
            </span>
          </template>

          <template #adresse_bien-cell="{ row }">
            <span v-if="!row.getIsGrouped()" class="text-sm">{{ row.original.adresse_bien || '—' }}</span>
          </template>

          <template #sequenceNom-cell="{ row }">
            <template v-if="!row.getIsGrouped()">
              <span v-if="row.original.sequenceNom" class="text-sm text-sky-700">{{ row.original.sequenceNom }}</span>
              <span v-else class="text-gray-400 text-sm">—</span>
            </template>
            <template v-else>
              <span class="text-sm text-sky-700">{{ getUniqueSequencesForGroup(row) }}</span>
            </template>
          </template>

          <template #derniere_relance-cell="{ row }">
            <span v-if="row.getIsGrouped()" class="text-sm text-gray-500">
              {{ formatDate(getDerniereRelance(row)) }}
            </span>
            <span v-else class="text-sm text-gray-500">
              {{ formatDate(row.original.contact_derniere_relance) }}
            </span>
          </template>

          <template #actions-cell="{ row }">
            <div v-if="!row.getIsGrouped()" class="flex items-center gap-1">
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
            <div v-else class="flex items-center gap-1">
              <UButton
                size="xs"
                variant="soft"
                color="green"
                icon="i-heroicons-check-circle"
                @click.stop="marquerPayeGroupe(row)"
              >
                Tout marquer payé
              </UButton>
            </div>
          </template>
        </UTable>
      </UCard>
    </template>

    <!-- Modal PDF -->
    <ImpayeDrawerPdf v-model="pdfOuvert" :impayelId="pdfImpayelId" />
  </div>
</template>

<script setup>
import { getGroupedRowModel } from '@tanstack/vue-table'

const { $parse } = useNuxtApp()
const toast = useToast()
const router = useRouter()

import ImpayeDrawerPdf from '~/components/ImpayeDrawerPdf.vue'

// ── État ──
const search = ref('')
const loading = ref(false)
const recalcitrants = ref([])

// PDF
const pdfOuvert = ref(false)
const pdfImpayelId = ref(null)

// ── Options TanStack Table ──
const groupingOptions = ref({
  groupedColumnMode: 'remove',
  getGroupedRowModel: getGroupedRowModel(),
})

// ── Colonnes ──
const colonnes = [
  { id: 'title' },
  { accessorKey: 'contact_nom' },
  { accessorKey: 'nfacture', header: 'N° Facture', cell: ({ row }) => row.getIsGrouped() ? null : undefined },
  { accessorKey: 'date_piece', header: 'Date pièce', cell: ({ row }) => row.getIsGrouped() ? null : undefined },
  { accessorKey: 'date_echeance', header: 'Échéance', cell: ({ row }) => row.getIsGrouped() ? null : undefined },
  { accessorKey: 'reste_a_payer', header: 'Reste à payer', aggregationFn: 'sum' },
  { accessorKey: 'adresse_bien', header: 'Adresse du bien', cell: ({ row }) => row.getIsGrouped() ? null : undefined },
  { accessorKey: 'sequenceNom', header: 'Séquence' },
  { accessorKey: 'derniere_relance', header: 'Dernière relance' },
  { id: 'actions', header: ' ' },
]

// ── Données aplaties pour le groupement ──
const flatData = computed(() => {
  return recalcitrants.value.flatMap((r) => {
    const contactLabel = `${r.contact.nom} ${r.contact.prenom}`.trim() || '(inconnu)'
    return r.impayes.map((imp) => ({
      ...imp,
      contact_nom: contactLabel,
      contact_email: r.contact.email,
      contact_id: r.contact.id,
      contact_total_reste: r.totalResteAPayer,
      contact_nombre_impayes: r.nombreImpayes,
      contact_derniere_relance: r.derniereRelanceDate,
      // Champ numérique pour l'agrégation TanStack
      reste_a_payer: imp.reste_a_payer,
    }))
  })
})

// ── Charger les récalcitrants ──
async function charger() {
  loading.value = true
  try {
    const result = await $parse.Cloud.run('getRecalcitrants')
    recalcitrants.value = result.recalcitrants || []
  } catch (err) {
    toast.add({ title: 'Erreur chargement', description: err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

// ── Helpers ──
function formatDate(val) {
  if (!val) return '—'
  const d = val instanceof Date ? val : new Date(val)
  return isNaN(d) ? '—' : d.toLocaleDateString('fr-FR', { dateStyle: 'short' })
}

function formatMontant(val) {
  if (val == null) return '—'
  return Number(val).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

function getUniqueSequencesForGroup(row) {
  const seqs = new Set()
  row.getLeafRows().forEach((leafRow) => {
    if (leafRow.original.sequenceNom) seqs.add(leafRow.original.sequenceNom)
  })
  if (seqs.size === 0) return '—'
  return [...seqs].join(', ')
}

function getContactEmail(row) {
  const first = row.getLeafRows()[0]?.original
  return first?.contact_email || null
}

function getDerniereRelance(row) {
  const first = row.getLeafRows()[0]?.original
  return first?.contact_derniere_relance || null
}

// ── Actions ──
function ouvrirPdf(row) {
  pdfImpayelId.value = row.id
  pdfOuvert.value = true
}

async function marquerPayeGroupe(row) {
  const impayeIds = row.getLeafRows().map((r) => r.original.id)
  if (!impayeIds.length) return

  try {
    const Impaye = $parse.Object.extend('Impaye')
    const objs = impayeIds.map((id) => {
      const o = Impaye.createWithoutData(id)
      o.set('statut', 'payé')
      o.set('facture_soldee', true)
      o.set('reste_a_payer', 0)
      return o
    })

    await $parse.Object.saveAll(objs)
    toast.add({ title: `${impayeIds.length} facture(s) marquée(s) comme payée(s)`, color: 'green' })
    await charger()
  } catch (err) {
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
  }
}

async function marquerPaye(row) {
  try {
    const Impaye = $parse.Object.extend('Impaye')
    const o = Impaye.createWithoutData(row.id)
    o.set('statut', 'payé')
    o.set('facture_soldee', true)
    o.set('reste_a_payer', 0)
    await o.save()
    toast.add({ title: 'Facture marquée comme payée', color: 'green' })
    await charger()
  } catch (err) {
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
  }
}

function menuItems(row) {
  return [
    {
      label: 'Voir le détail',
      icon: 'i-heroicons-eye',
      onSelect: () => router.push(`/impayes/${row.id}`),
    },
    {
      label: 'Marquer payé',
      icon: 'i-heroicons-check-circle',
      onSelect: () => marquerPaye(row),
    },
  ]
}

onMounted(() => {
  charger()
})
</script>

<style>
.force-scrollbar::-webkit-scrollbar {
  height: 8px;
}

.force-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}
</style>
