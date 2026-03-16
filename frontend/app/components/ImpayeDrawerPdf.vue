<template>
  <UDrawer v-model:open="open" direction="right" :handle="false" :overlay="true" :ui="{ content: 'w-[50vw] max-w-none' }">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <h3 class="text-base font-semibold text-gray-900">Aperçu PDF</h3>
        <div class="flex items-center gap-2">
          <a :href="pdfUrl" target="_blank">
            <UButton icon="i-heroicons-arrow-down-tray" color="neutral" variant="ghost" size="sm">
              Télécharger
            </UButton>
          </a>
          <UButton icon="i-heroicons-x-mark" color="neutral" variant="ghost" size="sm" @click="open = false" />
        </div>
      </div>
    </template>

    <template #body>
      <div class="relative h-full">
        <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <UIcon name="i-heroicons-arrow-path" class="size-8 text-gray-400 animate-spin" />
        </div>
        <div v-if="erreur" class="flex items-center justify-center h-full">
          <p class="text-gray-500 text-sm">PDF introuvable ou inaccessible.</p>
        </div>
        <iframe
          v-if="impayelId && !erreur"
          :src="pdfUrl"

          class="w-full h-full border-0"
          style="min-height: calc(100vh - 80px)"
          @load="loading = false"
          @error="erreur = true; loading = false"
        />
      </div>
    </template>
  </UDrawer>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  impayelId: { type: String, default: null },
})
const emit = defineEmits(['update:modelValue'])

const config = useRuntimeConfig()
const open = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const loading = ref(true)
const erreur = ref(false)

const pdfUrl = computed(() => {
  return `${config.public.apiBaseUrl}/api/pdf/${props.impayelId}`
})

watch(() => props.impayelId, () => {
  loading.value = true
  erreur.value = false
})
</script>
