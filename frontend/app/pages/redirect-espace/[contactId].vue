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
const contactId = computed(() => route.params.contactId)

onMounted(async () => {
  try {
    // Appeler Cloud Function pour obtenir l'URL signée
    const response = await $parse.Cloud.run('generateContactToken', {
      contactId: contactId.value
    })

    if (response?.url) {
      // Redirection automatique vers l'URL signée
      window.location.href = response.url
    } else {
      throw new Error('Aucune URL générée')
    }
  } catch (err) {
    console.error('❌ [REDIRECT-ESPACE] Erreur:', err)
    // Afficher message d'erreur
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
