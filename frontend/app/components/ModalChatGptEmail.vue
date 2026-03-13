<template>
  <UModal v-model:open="open" :title="`Demander à ChatGPT — Email ${emailIdx + 1}`">
    <template #body>
      <div class="space-y-4">
        <p class="text-sm text-gray-600">
          Copiez le prompt pour le format souhaité, collez-le dans ChatGPT, puis collez la réponse ci-dessous.
        </p>
        <div class="grid grid-cols-2 gap-2">
          <UButton
            v-for="tab in scenarioTabs"
            :key="tab.value"
            variant="outline"
            size="sm"
            :color="targetFormat === tab.value ? 'primary' : 'neutral'"
            @click="$emit('copyPrompt', tab.value)"
          >
            <UIcon name="i-heroicons-clipboard" class="size-4" />
            {{ tab.label }}
          </UButton>
        </div>
        <p v-if="targetFormat" class="text-xs text-gray-500">
          La réponse sera insérée dans le format <strong>{{ scenarioTabs.find(t => t.value === targetFormat)?.label }}</strong>.
        </p>
        <div class="w-full">
          <label class="text-xs text-gray-500 mb-1 block">Corps de l'email (Markdown)</label>
          <UTextarea
            v-model="response"
            :rows="8"
            placeholder="Bonjour [[payeur_nom]],

Votre facture [[nfacture]] est en retard..."
            class="w-full"
          />
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton color="neutral" variant="ghost" class="w-full" @click="open = false">Annuler</UButton>
        <UButton :disabled="!response" class="w-full" @click="$emit('insert')">
          <UIcon name="i-heroicons-check" class="size-4" />
          Insérer dans l'éditeur
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup>
import { scenarioTabs } from '~/composables/useSequenceEditor'

const props = defineProps({
  open: { type: Boolean, default: false },
  emailIdx: { type: Number, default: 0 },
  targetFormat: { type: String, default: 'single' },
  modelValue: { type: String, default: '' },
})

const emit = defineEmits(['update:open', 'update:modelValue', 'copyPrompt', 'insert'])

const open = computed({
  get: () => props.open,
  set: (v) => emit('update:open', v),
})

const response = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})
</script>
