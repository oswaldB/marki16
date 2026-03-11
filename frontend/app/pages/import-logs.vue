<template>
  <div class="p-6 space-y-4">
    <!-- Alerte si dernière sync en erreur ou partielle -->
    <UAlert
      v-if="lastLogAlert"
      :color="lastLogAlert.color"
      :title="lastLogAlert.title"
      :description="lastLogAlert.description"
    />

    <!-- Barre d'outils -->
    <div class="flex items-center justify-between gap-4">
      <USelect
        v-model="filterStatus"
        :items="statusOptions"
        class="w-48"
        @change="chargerLogs"
      />
      <UButton
        :loading="syncing"
        :disabled="syncing"
        icon="i-heroicons-arrow-path"
        @click="lancerSync"
      >
        {{ syncing ? 'Synchronisation...' : 'Synchroniser maintenant' }}
      </UButton>
    </div>

    <!-- Tableau des logs -->
    <UCard>
      <UTable
        :data="logs"
        :columns="columns"
        :loading="loading"
      >
        <template #startedAt-cell="{ row }">
          {{ formatDate(row.original.startedAt) }}
        </template>

        <template #durationMs-cell="{ row }">
          {{ (row.original.durationMs / 1000).toFixed(1) }}s
        </template>

        <template #trigger-cell="{ row }">
          <UBadge :color="row.original.trigger === 'manual' ? 'blue' : 'gray'" variant="subtle">
            {{ row.original.trigger === 'manual' ? 'Manuel' : 'Cron' }}
          </UBadge>
        </template>

        <template #status-cell="{ row }">
          <UBadge :color="statusColor(row.original.status)" variant="subtle">
            {{ statusLabel(row.original.status) }}
          </UBadge>
        </template>

        <template #impayes-cell="{ row }">
          <span class="text-sm">
            +{{ row.original.impayes_created }} / ↺{{ row.original.impayes_updated }}
          </span>
        </template>

        <template #contacts-cell="{ row }">
          <span class="text-sm">
            +{{ row.original.contacts_created }} / ↺{{ row.original.contacts_updated }}
          </span>
        </template>

        <template #errors-cell="{ row }">
          <button
            v-if="row.original.errors?.length"
            class="text-red-600 underline text-sm hover:text-red-800"
            @click="ouvrirDetailErreurs(row.original)"
          >
            {{ row.original.errors.length }} erreur(s)
          </button>
          <span v-else class="text-gray-400 text-sm">—</span>
        </template>
      </UTable>
    </UCard>

    <!-- Modal détail erreurs -->
    <UModal v-model:open="modalOuvert" :title="`Erreurs — ${formatDate(logSelectionne?.startedAt)}`">
      <template #body>
        <ul class="space-y-2 max-h-96 overflow-y-auto">
          <li
            v-for="(err, i) in logSelectionne?.errors"
            :key="i"
            class="text-sm text-red-700 bg-red-50 rounded px-3 py-2 font-mono"
          >
            {{ err }}
          </li>
        </ul>
      </template>
      <template #footer>
        <div class="flex justify-end">
          <UButton color="neutral" @click="modalOuvert = false">Fermer</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup>
const { $parse } = useNuxtApp()
const toast = useToast()

const logs = ref([])
const loading = ref(false)
const syncing = ref(false)
const filterStatus = ref('all')
const modalOuvert = ref(false)
const logSelectionne = ref(null)

const statusOptions = [
  { label: 'Tous les statuts', value: 'all' },
  { label: 'Succès', value: 'success' },
  { label: 'Partiel', value: 'partial' },
  { label: 'Erreur', value: 'error' },
]

const columns = [
  { accessorKey: 'startedAt',  header: 'Date / heure' },
  { accessorKey: 'durationMs', header: 'Durée' },
  { accessorKey: 'trigger',    header: 'Déclencheur' },
  { accessorKey: 'status',     header: 'Statut' },
  { id: 'impayes',             header: 'Impayés (+créés / ↺MàJ)' },
  { id: 'contacts',            header: 'Contacts (+créés / ↺MàJ)' },
  { id: 'errors',              header: 'Erreurs' },
]

function statusColor(status) {
  if (status === 'success') return 'green'
  if (status === 'partial') return 'orange'
  return 'red'
}

function statusLabel(status) {
  if (status === 'success') return 'Succès'
  if (status === 'partial') return 'Partiel'
  return 'Erreur'
}

function formatDate(val) {
  if (!val) return '—'
  const d = val instanceof Date ? val : new Date(val)
  return d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
}

const lastLogAlert = computed(() => {
  const first = logs.value[0]
  if (!first || first.status === 'success') return null
  return {
    color: first.status === 'partial' ? 'orange' : 'red',
    title: first.status === 'partial' ? 'Dernière sync terminée avec erreurs' : 'Dernière sync en échec',
    description: `${first.errors?.length ?? 0} erreur(s) — ${formatDate(first.startedAt)}`,
  }
})

async function chargerLogs() {
  loading.value = true
  try {
    const q = new $parse.Query('SyncLog')
    if (filterStatus.value !== 'all') q.equalTo('status', filterStatus.value)
    q.descending('startedAt')
    q.limit(50)
    const results = await q.find({ useMasterKey: false })
    logs.value = results.map(r => ({
      objectId: r.id,
      startedAt: r.get('startedAt'),
      finishedAt: r.get('finishedAt'),
      durationMs: r.get('durationMs') ?? 0,
      trigger: r.get('trigger') ?? 'cron',
      status: r.get('status') ?? 'success',
      impayes_created: r.get('impayes_created') ?? 0,
      impayes_updated: r.get('impayes_updated') ?? 0,
      contacts_created: r.get('contacts_created') ?? 0,
      contacts_updated: r.get('contacts_updated') ?? 0,
      errors: r.get('errors') ?? [],
    }))
  } catch (err) {
    toast.add({ title: 'Erreur chargement des logs', description: err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

function ouvrirDetailErreurs(log) {
  logSelectionne.value = log
  modalOuvert.value = true
}

async function lancerSync() {
  syncing.value = true
  try {
    await $parse.Cloud.run('syncNow')
    toast.add({ title: 'Synchronisation terminée', color: 'green' })
    await chargerLogs()
  } catch (err) {
    toast.add({ title: 'Erreur de synchronisation', description: err.message, color: 'red' })
  } finally {
    syncing.value = false
  }
}

onMounted(chargerLogs)
</script>
