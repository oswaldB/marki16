<template>
  <UModal
    :open="open"
    title="Supprimer le contact"
    @update:open="$emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-3">
        <p>Supprimer <strong>{{ contact?.nom }}</strong> ?</p>
        <UAlert
          v-if="impayesCount > 0"
          color="orange"
          icon="i-heroicons-exclamation-triangle"
          :title="`Ce contact a ${impayesCount} impayé(s) lié(s)`"
          description="Les impayés associés ne seront pas supprimés mais n'auront plus de contact."
        />
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton color="neutral" variant="ghost" @click="$emit('cancel')">Annuler</UButton>
        <UButton color="red" :loading="deleting" @click="$emit('confirm')">Supprimer</UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup>
defineProps({
  open:         { type: Boolean, default: false },
  contact:      { type: Object,  default: null  },
  impayesCount: { type: Number,  default: 0     },
  deleting:     { type: Boolean, default: false },
})

defineEmits(['update:open', 'confirm', 'cancel'])
</script>
