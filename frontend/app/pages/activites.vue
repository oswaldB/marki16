<template>
  <div class="p-6 space-y-4">
    <h1 class="text-2xl font-bold text-gray-900">Activités récentes</h1>

    <!-- Filtres -->
    <div class="flex items-center gap-4">
      <USelect
        v-model="filterType"
        :items="typeOptions"
        class="w-48"
        placeholder="Type d'activité"
      />
      <USelect
        v-model="filterOperation"
        :items="operationOptions"
        class="w-48"
        placeholder="Opération"
      />
      <UInput
        v-model="searchNfacture"
        placeholder="Rechercher par n° facture..."
        class="w-64"
      />
    </div>

    <!-- Onglets pour les vues -->
    <UTabs :items="viewTabs" v-model="selectedView" class="w-full">
      <template #content="{ item }">
        <div class="p-4">
          <!-- Vue détaillée -->
          <UCard v-if="item.key === 'detailed'">
            <UTable
              :data="filteredActivites"
              :columns="columns"
              :loading="loading"
              :empty-state="{
                icon: 'i-heroicons-inbox',
                label: 'Aucune activité trouvée'
              }"
            >
              <template #timestamp-cell="{ row }">
                {{ formatDateTime(row.original.timestamp) }}
              </template>

              <template #type-cell="{ row }">
                <UBadge :color="typeColor(row.original.type)" variant="subtle">
                  {{ typeLabel(row.original.type) }}
                </UBadge>
              </template>

              <template #operation-cell="{ row }">
                <UBadge :color="operationColor(row.original.operation)" variant="subtle">
                  {{ operationLabel(row.original.operation) }}
                </UBadge>
              </template>

              <template #nfacture-cell="{ row }">
                <NuxtLink
                  v-if="row.original.impaye_id"
                  :to="`/impayes/${row.original.impaye_id}`"
                  class="text-blue-600 hover:text-blue-800 font-mono"
                >
                  {{ row.original.nfacture }}
                </NuxtLink>
                <span v-else class="font-mono">
                  {{ row.original.nfacture }}
                </span>
              </template>

              <template #montant-cell="{ row }">
                <span v-if="row.original.montant !== null && row.original.montant !== undefined">
                  {{ formatCurrency(row.original.montant) }}
                </span>
                <span v-else class="text-gray-400">—</span>
              </template>

              <template #payeur_nom-cell="{ row }">
                <span v-if="row.original.payeur_nom">
                  {{ row.original.payeur_nom }}
                </span>
                <span v-else class="text-gray-400">—</span>
              </template>

              <template #trigger-cell="{ row }">
                <UBadge :color="row.original.trigger === 'manual' ? 'blue' : 'gray'" variant="subtle">
                  {{ row.original.trigger === 'manual' ? 'Manuel' : 'Automatique' }}
                </UBadge>
              </template>

              <template #error_message-cell="{ row }">
                <span v-if="row.original.error_message" class="text-red-600 text-sm">
                  {{ row.original.error_message }}
                </span>
                <span v-else class="text-gray-400">—</span>
              </template>
            </UTable>
          </UCard>

          <!-- Vue groupée par date/heure -->
          <UCard v-if="item.key === 'grouped_datetime'">
            <UTable
              :data="groupedByDateTime"
              :columns="groupedDateTimeColumns"
              :loading="loading"
              :empty-state="{
                icon: 'i-heroicons-inbox',
                label: 'Aucune activité trouvée'
              }"
            >
              <template #date-cell="{ row }">
                <span class="font-semibold">{{ row.original.date }}</span>
              </template>

              <template #activities-cell="{ row }">
                <div class="space-y-2">
                  <div v-for="(activity, index) in row.original.activities" :key="index" class="flex items-center gap-2 p-2 border rounded-lg">
                    <span class="text-sm text-gray-500">{{ formatTime(activity.timestamp) }}</span>
                    <UBadge :color="typeColor(activity.type)" variant="subtle" size="xs">
                      {{ typeLabel(activity.type) }}
                    </UBadge>
                    <UBadge :color="operationColor(activity.operation)" variant="subtle" size="xs">
                      {{ operationLabel(activity.operation) }}
                    </UBadge>
                    <span class="font-mono text-sm">{{ activity.nfacture }}</span>
                    <span v-if="activity.payeur_nom" class="text-sm truncate max-w-[150px]">{{ activity.payeur_nom }}</span>
                  </div>
                </div>
              </template>
            </UTable>
          </UCard>

          <!-- Vue groupée par type -->
          <UCard v-if="item.key === 'grouped_type'">
            <UTable
              :data="groupedByType"
              :columns="groupedTypeColumns"
              :loading="loading"
              :empty-state="{
                icon: 'i-heroicons-inbox',
                label: 'Aucune activité trouvée'
              }"
            >
              <template #type-cell="{ row }">
                <div class="flex items-center gap-2">
                  <UBadge :color="typeColor(row.original.type)" variant="subtle">
                    {{ typeLabel(row.original.type) }}
                  </UBadge>
                  <span class="text-gray-500">({{ row.original.count }} activités)</span>
                </div>
              </template>

              <template #activities-cell="{ row }">
                <div class="space-y-2">
                  <div v-for="(activity, index) in row.original.activities" :key="index" class="flex items-center gap-2 p-2 border rounded-lg">
                    <span class="text-sm text-gray-500">{{ formatDateTime(activity.timestamp) }}</span>
                    <UBadge :color="operationColor(activity.operation)" variant="subtle" size="xs">
                      {{ operationLabel(activity.operation) }}
                    </UBadge>
                    <span class="font-mono text-sm">{{ activity.nfacture }}</span>
                    <span v-if="activity.payeur_nom" class="text-sm truncate max-w-[150px]">{{ activity.payeur_nom }}</span>
                  </div>
                </div>
              </template>
            </UTable>
          </UCard>

          <!-- Vue groupée par opération -->
          <UCard v-if="item.key === 'grouped_operation'">
            <UTable
              :data="groupedByOperation"
              :columns="groupedOperationColumns"
              :loading="loading"
              :empty-state="{
                icon: 'i-heroicons-inbox',
                label: 'Aucune activité trouvée'
              }"
            >
              <template #operation-cell="{ row }">
                <div class="flex items-center gap-2">
                  <UBadge :color="operationColor(row.original.operation)" variant="subtle">
                    {{ operationLabel(row.original.operation) }}
                  </UBadge>
                  <span class="text-gray-500">({{ row.original.count }} activités)</span>
                </div>
              </template>

              <template #activities-cell="{ row }">
                <div class="space-y-2">
                  <div v-for="(activity, index) in row.original.activities" :key="index" class="flex items-center gap-2 p-2 border rounded-lg">
                    <span class="text-sm text-gray-500">{{ formatDateTime(activity.timestamp) }}</span>
                    <UBadge :color="typeColor(activity.type)" variant="subtle" size="xs">
                      {{ typeLabel(activity.type) }}
                    </UBadge>
                    <span class="font-mono text-sm">{{ activity.nfacture }}</span>
                    <span v-if="activity.payeur_nom" class="text-sm truncate max-w-[150px]">{{ activity.payeur_nom }}</span>
                  </div>
                </div>
              </template>
            </UTable>
          </UCard>
        </div>
      </template>
    </UTabs>
  </div>
</template>

<script setup>
const { $parse } = useNuxtApp()

const activites = ref([])
const loading = ref(false)
const filterType = ref('all')
const filterOperation = ref('all')
const searchNfacture = ref('')
const selectedView = ref('detailed')

const viewTabs = [
  { label: 'Vue détaillée', key: 'detailed', slot: 'content' },
  { label: 'Groupé par date/heure', key: 'grouped_datetime', slot: 'content' },
  { label: 'Groupé par type', key: 'grouped_type', slot: 'content' },
  { label: 'Groupé par opération', key: 'grouped_operation', slot: 'content' },
]

const typeOptions = [
  { label: 'Tous les types', value: 'all' },
  { label: 'Sync impayés', value: 'sync_impaye' },
  { label: 'Vérification paiements', value: 'verification_paiement' },
]

const operationOptions = [
  { label: 'Toutes les opérations', value: 'all' },
  { label: 'Créé', value: 'created' },
  { label: 'Mis à jour', value: 'updated' },
  { label: 'Payé', value: 'paid' },
  { label: 'Erreur', value: 'error' },
]

const columns = [
  { accessorKey: 'timestamp', header: 'Date / Heure' },
  { accessorKey: 'type', header: 'Type' },
  { accessorKey: 'operation', header: 'Opération' },
  { accessorKey: 'nfacture', header: 'N° Facture' },
  { accessorKey: 'montant', header: 'Montant' },
  { accessorKey: 'payeur_nom', header: 'Payeur' },
  { accessorKey: 'trigger', header: 'Déclencheur' },
  { accessorKey: 'error_message', header: 'Erreur' },
]

const groupedDateTimeColumns = [
  { accessorKey: 'date', header: 'Date' },
  { accessorKey: 'activities', header: 'Activités' },
]

const groupedTypeColumns = [
  { accessorKey: 'type', header: 'Type' },
  { accessorKey: 'activities', header: 'Activités' },
]

const groupedOperationColumns = [
  { accessorKey: 'operation', header: 'Opération' },
  { accessorKey: 'activities', header: 'Activités' },
]

function typeColor(type) {
  if (type === 'sync_impaye') return 'blue'
  if (type === 'verification_paiement') return 'green'
  return 'gray'
}

function typeLabel(type) {
  if (type === 'sync_impaye') return 'Sync impayés'
  if (type === 'verification_paiement') return 'Vérif. paiements'
  return type
}

function operationColor(operation) {
  if (operation === 'created') return 'green'
  if (operation === 'updated') return 'blue'
  if (operation === 'paid') return 'purple'
  if (operation === 'error') return 'red'
  return 'gray'
}

function operationLabel(operation) {
  if (operation === 'created') return 'Créé'
  if (operation === 'updated') return 'Mis à jour'
  if (operation === 'paid') return 'Payé'
  if (operation === 'error') return 'Erreur'
  return operation
}

function formatDateTime(val) {
  if (!val) return '—'
  const d = val instanceof Date ? val : new Date(val)
  return d.toLocaleString('fr-FR', { 
    dateStyle: 'short', 
    timeStyle: 'medium' 
  })
}

function formatTime(val) {
  if (!val) return '—'
  const d = val instanceof Date ? val : new Date(val)
  return d.toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

function formatCurrency(value) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

const filteredActivites = computed(() => {
  return activites.value
    .filter(a => filterType.value === 'all' || a.type === filterType.value)
    .filter(a => filterOperation.value === 'all' || a.operation === filterOperation.value)
    .filter(a => !searchNfacture.value || 
      (a.nfacture && String(a.nfacture).toLowerCase().includes(searchNfacture.value.toLowerCase()))
    )
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
})

// Group by date/time
const groupedByDateTime = computed(() => {
  const grouped = {}
  filteredActivites.value.forEach(activity => {
    const date = new Date(activity.timestamp).toLocaleDateString('fr-FR')
    if (!grouped[date]) {
      grouped[date] = []
    }
    grouped[date].push(activity)
  })
  
  return Object.keys(grouped).map(date => ({
    date,
    activities: grouped[date]
  })).sort((a, b) => new Date(b.date) - new Date(a.date))
})

// Group by type
const groupedByType = computed(() => {
  const grouped = {}
  filteredActivites.value.forEach(activity => {
    if (!grouped[activity.type]) {
      grouped[activity.type] = []
    }
    grouped[activity.type].push(activity)
  })
  
  return Object.keys(grouped).map(type => ({
    type,
    count: grouped[type].length,
    activities: grouped[type].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }))
})

// Group by operation
const groupedByOperation = computed(() => {
  const grouped = {}
  filteredActivites.value.forEach(activity => {
    if (!grouped[activity.operation]) {
      grouped[activity.operation] = []
    }
    grouped[activity.operation].push(activity)
  })
  
  return Object.keys(grouped).map(operation => ({
    operation,
    count: grouped[operation].length,
    activities: grouped[operation].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }))
})

async function chargerActivites() {
  loading.value = true
  try {
    const q = new $parse.Query('Activite')
    q.descending('timestamp')
    q.limit(200)
    const results = await q.find({ useMasterKey: false })
    activites.value = results.map(r => ({
      objectId: r.id,
      timestamp: r.get('timestamp'),
      type: r.get('type') ?? 'unknown',
      operation: r.get('operation') ?? 'unknown',
      nfacture: r.get('nfacture'),
      impaye_id: r.get('impaye_id'),
      montant: r.get('montant'),
      payeur_nom: r.get('payeur_nom'),
      trigger: r.get('trigger') ?? 'cron',
      error_message: r.get('error_message'),
    }))
  } catch (err) {
    console.error('Erreur chargement activités:', err)
  } finally {
    loading.value = false
  }
}

onMounted(chargerActivites)
</script>

<style>
/* Ajouter un style pour les lignes avec erreur */
.UTable-tr[data-operation='error'] {
  background-color: #fee2e2; /* red-50 */
}
</style>