<script setup>
const { $parse } = useNuxtApp()
const router = useRouter()
const route = useRoute()

onMounted(async () => {
  try {
    const q = new $parse.Query('Sequence')
    const seq = await q.get(route.params.id)
    const type = seq.get('type') || 'relances'

    // Rediriger vers la bonne page selon le type
    await router.replace(`/sequences/${type}/${route.params.id}`)
  } catch (err) {
    console.error('Erreur de redirection:', err)
    // Si la séquence n'existe pas, rediriger vers la liste
    await router.replace('/sequences')
  }
})
</script>

<template>
  <div class="p-6 text-center text-gray-500">
    Redirection en cours...
  </div>
</template>
