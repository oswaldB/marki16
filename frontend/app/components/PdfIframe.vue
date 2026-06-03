<template>
  <div class="relative w-full h-full">
    <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
      <UIcon name="i-heroicons-arrow-path" class="size-6 text-gray-400 animate-spin" />
    </div>
    <p v-if="erreur" class="flex items-center justify-center h-full text-sm text-gray-400">
      PDF introuvable ou inaccessible.
    </p>
    <iframe
      v-else
      :src="src"
      class="w-full h-full border-0"
      @load="loading = false"
      @error="erreur = true; loading = false"
    />
  </div>
</template>

<script setup>
const props = defineProps({
  impayeId: { type: String, default: null },
  src: { type: String, default: null },
})

const loading = ref(true)
const erreur = ref(false)

// Utiliser src si fourni, sinon calculer à partir de impayeId
const src = computed(() => props.src || null)

watch(() => [props.impayeId, props.src], () => {
  loading.value = true
  erreur.value = false
})
</script>
