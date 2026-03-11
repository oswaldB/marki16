<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script setup>
const authStore = useAuthStore()

onMounted(() => {
  authStore.fetchCurrentUser()
})
</script>
