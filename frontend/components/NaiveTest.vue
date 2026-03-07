<template>
  <div class="p-4 space-y-4">
    <h1 class="text-2xl font-bold">Test Nuxt UI</h1>

    <UButton color="primary" @click="showMessage">Show Message</UButton>
    <UButton color="green" @click="showDialog">Show Dialog</UButton>

    <UAlert title="Info" color="blue" icon="i-heroicons-information-circle">
      Nuxt UI is working!
    </UAlert>

    <UCard>
      <template #header>Card Example</template>
      This is a Nuxt UI card component with Tailwind CSS styling.
    </UCard>
  </div>
</template>

<script setup>
const toast = useToast()

const showMessage = () => {
  toast.add({ title: 'Nuxt UI is working!', color: 'green' })
}

const showDialog = () => {
  // dialogs handled via UModal in Nuxt UI
}
</script>