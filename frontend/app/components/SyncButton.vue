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
    const syncStats = await $parse.Cloud.run('syncNow')
    toast.add({ 
      title: 'Synchronisation terminée', 
      description: `${syncStats.imported || 0} impayés synchronisés`,
      color: 'green' 
    })
    
    const verifyStats = await $parse.Cloud.run('verifyPaidInvoicesNow')
    toast.add({ 
      title: 'Vérification terminée', 
      description: `${verifyStats.updated || 0} factures marquées comme payées`,
      color: 'green' 
    })
    
    props.onSuccess()
  } catch (err) {
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
  } finally {
    syncing.value = false
  }
}
</script>