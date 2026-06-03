<template>
  <div class="w-full h-screen bg-white flex items-center justify-center">
    <div class="text-center">
      <UIcon name="i-heroicons-arrow-path" class="size-8 text-gray-500 animate-spin mb-4" />
      <p class="text-gray-600">Génération du lien sécurisé en cours...</p>
    </div>
  </div>
</template>

<script setup>
const { $parse } = useNuxtApp()
const route = useRoute()
const id = computed(() => route.params.id)

onMounted(async () => {
  try {
    const response = await $parse.Cloud.run('generatePdfLink', { impayelId: id.value })
    if (response?.url) {
      // La Cloud Function retourne l'URL absolue complète : https://dev.markidiags.com/espace/ID?sig=XXX&expires=YYY
      window.location.href = response.url
    } else {
      throw new Error('Aucune URL générée')
    }
  } catch (err) {
    console.error('❌ [REDIRECT-PDF] Erreur:', err)
    // Remplacer la page par un message d'erreur
    document.body.innerHTML = `
      <div class="w-full h-screen bg-white flex flex-col items-center justify-center p-4">
        <div class="text-center text-red-500">
          <div class="text-6xl mb-4">❌</div>
          <h2 class="text-lg font-medium text-gray-900 mb-2">Erreur</h2>
          <p class="text-gray-600 mb-4">${err.message || 'Impossible de générer le lien sécurisé'}</p>
          <p class="text-sm text-gray-500">Veuillez réutiliser le lien reçu par email.</p>
        </div>
      </div>
    `
  }
})

definePageMeta({
  layout: 'public'
})
</script>
