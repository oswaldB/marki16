<template>
  <div class="min-h-screen bg-gray-50 p-4 md:p-6">
    <!-- Header -->
    <div v-if="!erreur" class="max-w-4xl mx-auto mb-6">
      <div class="flex items-center gap-2 mb-2">
        <UIcon name="i-heroicons-document-text" class="size-6 text-gray-600" />
        <h1 class="text-xl font-semibold text-gray-900">Factures à régler</h1>
      </div>
      <p class="text-sm text-gray-500">
        Voici vos factures en attente de paiement.
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="max-w-4xl mx-auto flex items-center justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="size-8 text-gray-500 animate-spin" />
    </div>

    <!-- Error -->
    <div v-else-if="erreur" class="w-full h-screen bg-white flex flex-col items-center justify-center p-4">
      <div class="text-center text-red-500">
        <UIcon name="i-heroicons-exclamation-circle" class="size-8 mb-4" />
        <h2 class="text-lg font-medium text-gray-900 mb-2">Erreur</h2>
        <p class="text-gray-600 mb-4">{{ erreur }}</p>
        <p class="text-sm text-gray-500">Veuillez réutiliser le lien reçu par email.</p>
      </div>
    </div>

    <!-- Success - Deux tableaux -->
    <div v-else class="max-w-4xl mx-auto space-y-6">

      <!-- Tableau : Factures à régler -->
      <div v-if="impayesNonRegles.length > 0" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div class="p-4 border-b border-gray-200 bg-red-50">
          <h2 class="font-medium text-red-700 flex items-center gap-2">
            <UIcon name="i-heroicons-exclamation-circle" class="size-5" />
            Factures à régler ({{ impayesNonRegles.length }})
          </h2>
        </div>
        <div class="divide-y divide-gray-200">
          <ImpayeCard
            v-for="impaye in impayesNonRegles"
            :key="impaye.id"
            :impaye="impaye"
            :show-pdf-link="true"
            :show-payment-link="true"
            class="p-4"
          />
        </div>
      </div>

      <!-- Message si aucune facture à régler -->
      <div v-else class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <UIcon name="i-heroicons-check-circle" class="size-12 text-green-500 mb-4 mx-auto" />
        <h2 class="text-lg font-medium text-gray-900 mb-2">Aucune facture à régler</h2>
        <p class="text-gray-500">Vous n'avez actuellement aucune facture en attente de paiement.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
console.log('=== PAGE ESPACE/IMpaye CHARGEE ===')
const { $parse } = useNuxtApp()
const route = useRoute()
console.log('Route params:', route.params)
console.log('Route query:', route.query)
const contactId = computed(() => route.params.contactId)

const sig = computed(() => route.query.sig)
const expires = computed(() => route.query.expires)

const loading = ref(true)
const erreur = ref(null)
const impayes = ref([])

// Impayés filtrés - uniquement les factures non payées
const impayesNonRegles = computed(() =>
  impayes.value.filter(i => !i.facture_soldee && (i.reste_a_payer || 0) > 0)
)

// Vérifier le token dès le chargement
watch(() => [sig.value, expires.value], () => {
  if (!sig.value || !expires.value) {
    erreur.value = 'Lien invalide. Veuillez réutiliser le lien reçu par email.'
    loading.value = false
    return
  }

  const now = Math.floor(Date.now() / 1000)
  if (parseInt(expires.value) < now) {
    erreur.value = 'Ce lien a expiré. Veuillez réutiliser le lien reçu par email.'
    loading.value = false
    return
  }

  erreur.value = null
  loadImpayes()
}, { immediate: true })

// Charger les impayés du contact
async function loadImpayes() {
  try {
    console.log('=== APPEL API ===')
    console.log('Params envoyés:', {
      contactId: contactId.value,
      sig: sig.value,
      expires: expires.value
    })
    
    const result = await $parse.Cloud.run('getContactImpayes', {
      contactId: contactId.value,
      sig: sig.value,
      expires: expires.value
    })
    
    console.log('=== RÉSULTAT API ===')
    console.log('result:', result)

    if (result && result.impayes) {
      impayes.value = result.impayes
    }
  } catch (err) {
    console.error('❌ [ESPACE/CONTACT/IMPAYE] Erreur:', err)
    console.log('=== DEBUG ERREUR COMPLÈTE ===')
    console.log('err:', err)
    console.log('err.message:', err?.message)
    console.log('err.code:', err?.code)
    console.log('err.details:', err?.details)
    console.log('err.data:', err?.data)
    console.log('err.response:', err?.response)
    console.log('JSON.stringify(err):', JSON.stringify(err, Object.getOwnPropertyNames(err), 2))
    console.log('===================')
    erreur.value = err.message || 'Impossible de charger les factures'
  } finally {
    loading.value = false
  }
}

definePageMeta({
  layout: 'public'
})
</script>
