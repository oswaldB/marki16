<template>
  <UModal v-model:open="open" title="Générer les emails par IA">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-heroicons-sparkles" class="size-5" />
        <span>Générer les emails par IA</span>
      </div>
    </template>
    <template #body>
      <div class="space-y-3">
        <p class="text-sm text-gray-600">
          Copiez le prompt, collez-le dans ChatGPT, puis collez la réponse YAML ici.
        </p>
        <UButton variant="outline" size="sm" @click="$emit('copyPrompt')">
          <UIcon name="i-heroicons-clipboard" class="size-4" />
          Copier le prompt
        </UButton>
        <div class="w-full">
          <label class="text-xs text-gray-500 mb-1 block">Réponse YAML de ChatGPT</label>
          <UTextarea
            v-model="iaResponse"
            :rows="8"
            placeholder="---
- delai: 7
  scenarios:
    - format: single
      objet: &quot;Rappel facture [[nfacture]]&quot;
      corps: |
        Bonjour [[payeur_nom]], ..."
            class="w-full"
          />
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton color="neutral" variant="ghost" class="w-full" @click="open = false">Annuler</UButton>
        <UButton class="w-full" @click="$emit('validate', iaResponse)">
          <UIcon name="i-heroicons-check" class="size-4" />
          Valider et remplacer les emails
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup>
const props = defineProps({
  open: { type: Boolean, default: false },
  modelValue: { type: String, default: '' },
})

const emit = defineEmits(['update:open', 'update:modelValue', 'copyPrompt', 'validate'])

const open = computed({
  get: () => props.open,
  set: (v) => emit('update:open', v),
})

const iaResponse = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})
</script>
