<template>
  <div class="space-y-6">
    <UCard>
      <template #header>
        <div>
          <h2 class="text-lg font-medium text-gray-900">Hello World - Marki</h2>
          <p class="mt-1 text-sm text-gray-500">Application de relances automatiques de factures impayées</p>
        </div>
      </template>

      <dl class="divide-y divide-gray-200">
        <div class="py-4 grid grid-cols-3 gap-4">
          <dt class="text-sm font-medium text-gray-500">Backend Status</dt>
          <dd class="text-sm text-gray-900 col-span-2">
            <UBadge v-if="backendStatus" color="success" variant="subtle">
              {{ backendStatus.status }}
            </UBadge>
            <UBadge v-else color="warning" variant="subtle">Loading...</UBadge>
          </dd>
        </div>

        <div class="py-4 grid grid-cols-3 gap-4">
          <dt class="text-sm font-medium text-gray-500">Parse Server</dt>
          <dd class="text-sm text-gray-900 col-span-2">
            <UBadge v-if="parseServerStatus" color="success" variant="subtle">
              {{ parseServerStatus }}
            </UBadge>
            <UBadge v-else color="warning" variant="subtle">Checking...</UBadge>
          </dd>
        </div>

        <div class="py-4 grid grid-cols-3 gap-4">
          <dt class="text-sm font-medium text-gray-500">Cloud Code</dt>
          <dd class="text-sm text-gray-900 col-span-2 flex items-center gap-3">
            <UButton size="sm" @click="testCloudCode">Test Cloud Function</UButton>
            <span v-if="cloudCodeResult" class="text-sm text-gray-600">{{ cloudCodeResult }}</span>
          </dd>
        </div>

        <div class="py-4 grid grid-cols-3 gap-4">
          <dt class="text-sm font-medium text-gray-500">Parse Dashboard</dt>
          <dd class="text-sm text-gray-900 col-span-2">
            <UButton size="sm" color="gray" variant="outline" @click="openDashboard">
              Open Parse Dashboard
            </UButton>
            <p class="mt-1 text-xs text-gray-500">Username: admin | Password: admin</p>
          </dd>
        </div>
      </dl>
    </UCard>

    <UCard>
      <template #header>
        <h3 class="text-lg font-medium text-gray-900">Prochaines étapes</h3>
      </template>

      <ul class="space-y-3">
        <li v-for="step in steps" :key="step.label" class="flex items-start gap-3">
          <UIcon
            :name="step.done ? 'i-heroicons-check-circle-20-solid' : 'i-heroicons-check-circle'"
            :class="step.done ? 'text-green-500' : 'text-gray-400'"
            class="mt-0.5 size-5 shrink-0"
          />
          <p :class="step.done ? 'text-sm text-gray-700' : 'text-sm text-gray-500'">{{ step.label }}</p>
        </li>
      </ul>
    </UCard>
  </div>
</template>

<script setup>
const backendStatus = ref(null)
const parseServerStatus = ref(null)
const cloudCodeResult = ref(null)

const steps = [
  { label: 'Backend et Parse Server configurés', done: true },
  { label: 'Frontend Nuxt 4 avec TailwindCSS', done: true },
  { label: 'Parse Dashboard installé et configuré', done: true },
  { label: "Implémenter l'authentification", done: false },
  { label: 'Créer les modèles de données Parse', done: false },
]

const checkBackendHealth = async () => {
  try {
    const response = await fetch('http://localhost:1555/healthy')
    if (response.ok) {
      const data = await response.json()
      backendStatus.value = data
      parseServerStatus.value = 'running'
    }
  } catch {
    setTimeout(checkBackendHealth, 2000)
  }
}

const testCloudCode = async () => {
  try {
    const response = await fetch('http://localhost:1555/api/test-cloud-hello')
    if (response.ok) {
      const data = await response.json()
      cloudCodeResult.value = data.result
    } else {
      cloudCodeResult.value = 'Error: status ' + response.status
    }
  } catch (error) {
    cloudCodeResult.value = 'Error: ' + error.message
  }
}

const openDashboard = () => {
  window.open('http://localhost:1555/parse-dashboard', '_blank')
}

onMounted(() => {
  checkBackendHealth()
})
</script>
