<template>
  <UButton
    :loading="syncing"
    :disabled="syncing"
    color="neutral"
    variant="outline"
    icon="i-heroicons-arrow-path"
    @click="lancerSync"
  >
    {{ syncing ? 'Sync...' : label }}
  </UButton>
</template>

<script setup>
const props = defineProps({
  label: {
    type: String,
    default: 'Synchroniser'
  },
  onSuccess: {
    type: Function,
    default: () => {}
  }
})

const { $parse } = useNuxtApp()
const toast = useToast()
const syncing = ref(false)

async function lancerSync() {
  syncing.value = true
  try {
    // Utiliser triggerImportInvoices au lieu de syncNow
    const syncStats = await $parse.Cloud.run('triggerImportInvoices')
    const created = syncStats.stats?.etape5?.impayes_created || 0
    const updated = syncStats.stats?.etape5?.impayes_updated || 0
    toast.add({
      title: 'Synchronisation terminée',
      description: `${created} créés, ${updated} mis à jour`,
      color: 'green'
    })

    // Utiliser verifyPaidInvoicesNow qui appelle verifyPaidInvoicesMaster
    const verifyStats = await $parse.Cloud.run('verifyPaidInvoicesNow')
    toast.add({
      title: 'Vérification terminée',
      description: `${verifyStats.result?.updated || 0} factures marquées comme payées`,
      color: 'green'
    })

    props.onSuccess()
    window.location.reload()
  } catch (err) {
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
  } finally {
    syncing.value = false
  }
}
</script>
