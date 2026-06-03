<template>
  <UDrawer v-model:open="open" direction="right" :handle="false" :overlay="true" :ui="{ content: 'w-[50vw] max-w-none' }">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <h3 class="text-base font-semibold text-gray-900">Aperçu PDF</h3>
        <div class="flex items-center gap-2">
          <a v-if="signedPdfUrl" :href="signedPdfUrl" target="_blank">
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
          <p class="text-gray-500 text-sm">{{ erreur }}</p>
        </div>
        <iframe
          v-if="signedPdfUrl && !erreur"
          :src="signedPdfUrl"
          class="w-full h-full border-0"
          style="min-height: calc(100vh - 80px)"
          @load="loading = false"
          @error="erreur = 'Ce lien a expiré. Veuillez réutiliser le lien envoyé par email.'; loading = false"
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
const signedPdfUrl = ref(null)

// Générer un lien PDF signé quand le drawer s'ouvre
watch(() => [props.modelValue, props.impayelId], async () => {
  if (!props.modelValue || !props.impayelId) {
    signedPdfUrl.value = null
    return
  }

  loading.value = true
  erreur.value = false

  try {
    const response = await $parse.Cloud.run('generatePdfLink', { impayelId: props.impayelId })
    signedPdfUrl.value = response.url
  } catch (err) {
    erreur.value = 'Impossible de générer le lien PDF.'
    signedPdfUrl.value = null
  }
}, { immediate: true })

// Réinitialiser quand on ferme le drawer
watch(() => props.modelValue, (isOpen) => {
  if (!isOpen) {
    loading.value = true
    erreur.value = false
  }
})
</script>
