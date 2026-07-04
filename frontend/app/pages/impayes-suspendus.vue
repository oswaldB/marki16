<template>
  <div class="p-6 space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <h1 class="text-2xl font-semibold text-gray-900">Impayés suspendus</h1>
      
      <div class="flex items-center gap-2">
        <UButton
          icon="i-heroicons-arrow-path"
          color="neutral"
          variant="ghost"
          :loading="store.loading"
          @click="refresh"
        >
          Rafraîchir
        </UButton>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <UCard class="bg-red-50 border-red-200">
        <div class="text-center">
          <div class="text-3xl font-bold text-red-600">{{ stats.total }}</div>
          <div class="text-sm text-red-700">Impayés suspendus</div>
        </div>
      </UCard>
      
      <UCard class="bg-amber-50 border-amber-200">
        <div class="text-center">
          <div class="text-3xl font-bold text-amber-600">{{ stats.litige }}</div>
          <div class="text-sm text-amber-700">Litiges</div>
        </div>
      </UCard>
      
      <UCard class="bg-blue-50 border-blue-200">
        <div class="text-center">
          <div class="text-3xl font-bold text-blue-600">{{ formatMontant(stats.totalMontant) }}</div>
          <div class="text-sm text-blue-700">Montant total suspendu</div>
        </div>
      </UCard>
    </div>

    <!-- Filtres -->
    <div class="flex items-center gap-3 flex-wrap">
      <UInput
        v-model="searchQuery"
        icon="i-heroicons-magnifying-glass"
        placeholder="Rechercher (facture, client, référence...)"
        class="w-80"
      />
      
      <USelect
        v-model="motifFilter"
        :items="motifOptions"
        placeholder="Tous les motifs"
        class="w-48"
        clearable
      />
    </div>

    <!-- Tableau -->
    <UCard :ui="{ body: { padding: 'p-0' } }">
      <UTable
        :data="filteredRows"
        :columns="columns"
        :loading="store.loading"
        :empty="{ label: 'Aucun impayé suspendu' }"
        sticky="header"
      >
        <template #nfacture-cell="{ row }">
          <NuxtLink 
            :to="`/impayes/${row.original.id}`"
            class="font-medium text-sky-600 hover:text-sky-800 hover:underline"
          >
            {{ row.original.nfacture }}
          </NuxtLink>
        </template>

        <template #client-cell="{ row }">
          <div class="text-sm">
            <div class="font-medium text-gray-900">{{ row.original.payeurNom }}</div>
            <div v-if="row.original.contactEmail" class="text-gray-500">{{ row.original.contactEmail }}</div>
          </div>
        </template>

        <template #montant-cell="{ row }">
          <span class="font-medium">{{ formatMontant(row.original.montant) }}</span>
        </template>

        <template #motif-cell="{ row }">
          <div class="space-y-1">
            <UBadge
              :color="getMotifColor(row.original.motifType)"
              variant="subtle"
              size="xs"
            >
              {{ row.original.motifLabel }}
            </UBadge>
            <div v-if="row.original.motifDetail" class="text-xs text-gray-500 truncate max-w-xs">
              {{ row.original.motifDetail }}
            </div>
          </div>
        </template>

        <template #depuis-cell="{ row }">
          <div class="text-sm">
            <div>{{ formatDate(row.original.blacklistedAt) }}</div>
            <div class="text-xs text-gray-500">{{ formatRelativeDate(row.original.blacklistedAt) }}</div>
          </div>
        </template>

        <template #actions-cell="{ row }">
          <UButton
            color="green"
            variant="ghost"
            size="xs"
            icon="i-heroicons-play-circle"
            @click="reactiver(row.original)"
            :loading="store.saving"
          >
            Réactiver
          </UButton>
        </template>
      </UTable>
    </UCard>

    <!-- Slideover de réactivation -->
    <ImpayeSlideoverBlacklistImpaye
      v-if="slideoverOuvert"
      v-model="slideoverOuvert"
      :impaye="selectedImpaye"
      mode="unblacklist"
      @success="onReactivationSuccess"
      @close="slideoverOuvert = false"
    />
  </div>
</template>

<script setup>
/**
 * Page de liste des impayés suspendus (blacklistés)
 * F-008: Blacklist des Impayés - Vue liste (US-008-2)
 */

import { useBlacklistImpayeStore, BLACKLIST_MOTIF_TYPES } from '~/stores/blacklistImpayeStore'

const store = useBlacklistImpayeStore()
const toast = useToast()

// État local
const searchQuery = ref('')
const motifFilter = ref(null)
const slideoverOuvert = ref(false)
const selectedImpaye = ref(null)

// Options de motifs
const motifOptions = BLACKLIST_MOTIF_TYPES.map(m => ({
  label: m.label,
  value: m.value
}))

// Colonnes du tableau
const columns = [
  { accessorKey: 'nfacture', header: 'Facture' },
  { accessorKey: 'client', header: 'Client' },
  { accessorKey: 'montant', header: 'Montant', enableSorting: true },
  { accessorKey: 'motif', header: 'Motif' },
  { accessorKey: 'depuis', header: 'Depuis', enableSorting: true },
  { id: 'actions', header: 'Actions' }
]

// Données filtrées
const filteredRows = computed(() => {
  const impayes = store.getFilteredImpayes(searchQuery.value, motifFilter.value)
  
  return impayes.map(i => {
    const contact = i.get('contact_relance') || i.get('payeur')
    const motifType = i.get('blacklistMotifType')
    const motifLabel = BLACKLIST_MOTIF_TYPES.find(m => m.value === motifType)?.label || motifType
    
    return {
      id: i.id,
      nfacture: i.get('nfacture') || '—',
      payeurNom: i.get('payeur_nom') || '—',
      contactEmail: contact?.get('email') || '',
      montant: i.get('reste_a_payer') || 0,
      motifType,
      motifLabel,
      motifDetail: i.get('blacklistMotif') || '',
      blacklistedAt: i.get('blacklistedAt'),
      _parse: i
    }
  })
})

// Stats
const stats = computed(() => {
  const impayes = store.blacklistedImpayes
  return {
    total: impayes.length,
    litige: impayes.filter(i => i.get('blacklistMotifType') === 'litige').length,
    totalMontant: impayes.reduce((sum, i) => sum + (i.get('reste_a_payer') || 0), 0)
  }
})

// Couleur selon le motif
function getMotifColor(type) {
  const colors = {
    'litige': 'red',
    'reglement_en_cours': 'green',
    'erreur_facturation': 'amber',
    'procedure_judiciaire': 'red',
    'accord_special': 'blue',
    'accord_paiement_notaire': 'emerald',
    'cheque_encaissement_differe': 'cyan',
    'reglement_plusieurs_fois': 'indigo',
    'autre': 'gray'
  }
  return colors[type] || 'gray'
}

// Formatage
function formatMontant(val) {
  if (val == null) return '—'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(val)
}

function formatDate(val) {
  if (!val) return '—'
  const d = val instanceof Date ? val : new Date(val)
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

function formatRelativeDate(val) {
  if (!val) return ''
  const d = val instanceof Date ? val : new Date(val)
  const now = new Date()
  const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24))
  
  if (diff === 0) return 'aujourd\'hui'
  if (diff === 1) return 'hier'
  if (diff < 7) return `il y a ${diff} jours`
  if (diff < 30) return `il y a ${Math.floor(diff / 7)} semaine(s)`
  return `il y a ${Math.floor(diff / 30)} mois`
}

// Actions
function reactiver(row) {
  selectedImpaye.value = row._parse
  slideoverOuvert.value = true
}

function onReactivationSuccess() {
  toast.add({
    title: 'Succès',
    description: 'L\'impayé a été réactivé et les relances régénérées',
    color: 'green'
  })
  store.fetchBlacklistedImpayes(true)
}

function refresh() {
  store.fetchBlacklistedImpayes(true)
  toast.add({
    title: 'Actualisé',
    color: 'green'
  })
}

// Chargement initial
onMounted(() => {
  store.fetchBlacklistedImpayes()
})
</script>
