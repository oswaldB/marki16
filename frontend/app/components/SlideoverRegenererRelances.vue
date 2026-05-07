<template>
  <USlideover v-model:open="isOpen">
    <template #title>
      Régénérer les relances
    </template>

    <template #body>
      <div class="p-4 space-y-6">
        <!-- Question 1: Dates -->
        <div class="space-y-3">
          <p class="text-sm font-medium text-gray-700">Dates des relances</p>
          <div class="flex flex-wrap gap-4">
            <URadio
              v-model="options.resetDates"
              :value="false"
              label="Garder les dates existantes"
              class="text-sm"
            />
            <URadio
              v-model="options.resetDates"
              :value="true"
              label="Repartir de 0"
              class="text-sm"
            />
          </div>
          <p class="text-xs text-gray-500">
            {{ options.resetDates ? 'Les relances seront recreees avec de nouvelles dates' : 'Les dates existantes seront conservees' }}
          </p>
        </div>

        <!-- Question 2: Perimetre -->
        <div class="space-y-3">
          <p class="text-sm font-medium text-gray-700">Perimetre de regeneration</p>
          <div class="flex flex-wrap gap-4">
            <URadio
              v-model="options.includeSent"
              :value="false"
              label="Seulement les non envoyees"
              class="text-sm"
            />
            <URadio
              v-model="options.includeSent"
              :value="true"
              label="Toute la sequence"
              class="text-sm"
            />
          </div>
          <p class="text-xs text-gray-500">
            {{ options.includeSent ? 'Toutes les relances seront recreees' : 'Seules les relances non envoyees seront traitees' }}
          </p>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3 p-4">
        <UButton variant="outline" @click="isOpen = false">Annuler</UButton>
        <UButton color="primary" :loading="loading" @click="confirmer">
          Régénérer
        </UButton>
      </div>
    </template>
  </USlideover>
</template>

<script setup>
import { computed, ref, reactive } from 'vue'

const props = defineProps({
  open: { type: Boolean, required: true },
  sequence: { type: Object, required: true }
})

const emit = defineEmits(['update:open', 'confirmed'])

const isOpen = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val)
})

const options = reactive({
  resetDates: false,
  includeSent: false
})

const loading = ref(false)

async function confirmer() {
  loading.value = true
  try {
    emit('confirmed', { ...options })
    isOpen.value = false
  } finally {
    loading.value = false
  }
}
</script>
