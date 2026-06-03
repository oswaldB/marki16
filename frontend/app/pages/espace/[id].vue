<template>
  <div class="w-full h-screen bg-white flex flex-col">
    <!-- Header simple - seulement si le lien est valide ET pas d'erreur -->
    <div v-if="pdfUrl && !erreur" class="flex items-center justify-between p-4 border-b border-gray-200">
      <div class="flex items-center gap-2">
        <a :href="pdfUrl" target="_blank">
          <UButton icon="i-heroicons-arrow-down-tray" color="neutral" variant="ghost" size="sm">
            Télécharger
          </UButton>
        </a>
      </div>
    </div>

    <!-- Contenu -->
    <div class="relative flex-1">
      <div v-if="loading && pdfUrl" class="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
        <UIcon name="i-heroicons-arrow-path" class="size-8 text-gray-400 animate-spin" />
      </div>
      <div v-if="erreur" class="flex items-center justify-center h-full flex-col gap-4">
        <UIcon name="i-heroicons-exclamation-circle" class="size-8 text-red-500" />
        <p class="text-gray-600 text-center px-4">{{ erreur }}</p>
      </div>
      <iframe
        v-if="pdfUrl && !erreur"
        :src="pdfUrl"
        class="w-full h-full border-0"
        @load="loading = false"
        @error="erreur = 'Ce lien a expiré. Veuillez réutiliser le lien envoyé par email.'; loading = false"
      />
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const id = computed(() => route.params.id)
const config = useRuntimeConfig()

const sig = computed(() => route.query.sig)
const expires = computed(() => route.query.expires)

const pdfUrl = computed(() => {
  if (!id.value || !sig.value || !expires.value) return null
  return `${config.public.apiBaseUrl}/api/pdf/${id.value}?sig=${sig.value}&expires=${expires.value}`
})

const loading = ref(true)
const erreur = ref(null)

// Vérifier si le lien est invalide dès le départ
watch(() => [id.value, sig.value, expires.value], () => {
  if (!sig.value || !expires.value) {
    erreur.value = 'Lien invalide. Veuillez réutiliser le lien envoyé par email.'
    loading.value = false
    return
  }

  const now = Math.floor(Date.now() / 1000)
  if (parseInt(expires.value) < now) {
    erreur.value = 'Ce lien a expiré. Veuillez réutiliser le lien envoyé par email.'
    loading.value = false
  } else {
    erreur.value = null
    loading.value = true
  }
}, { immediate: true })

definePageMeta({
  layout: 'public'
})
</script>
