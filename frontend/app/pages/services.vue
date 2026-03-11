<template>
  <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
    <div class="w-full max-w-lg">
      <h1 class="text-2xl font-semibold text-gray-800 mb-2">État des services</h1>
      <p class="text-gray-500 text-sm mb-8">Vérification de la disponibilité de Parse Server et Parse Cloud.</p>

      <div class="flex flex-col gap-4 mb-8">
        <!-- Parse Server -->
        <UCard>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <UBadge :color="tagType(parseServer.status)" variant="subtle" size="md">
                {{ statusLabel(parseServer.status) }}
              </UBadge>
              <span class="font-medium text-gray-700">Parse Server</span>
            </div>
            <div class="text-right">
              <span v-if="parseServer.responseMs !== null" class="text-sm text-gray-400">
                {{ parseServer.responseMs }} ms
              </span>
              <p v-if="parseServer.error" class="text-xs text-red-500 mt-1">{{ parseServer.error }}</p>
            </div>
          </div>
        </UCard>

        <!-- Parse Cloud -->
        <UCard>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <UBadge :color="tagType(parseCloud.status)" variant="subtle" size="md">
                {{ statusLabel(parseCloud.status) }}
              </UBadge>
              <span class="font-medium text-gray-700">Parse Cloud</span>
            </div>
            <div class="text-right">
              <span v-if="parseCloud.responseMs !== null" class="text-sm text-gray-400">
                {{ parseCloud.responseMs }} ms
              </span>
              <p v-if="parseCloud.error" class="text-xs text-red-500 mt-1">{{ parseCloud.error }}</p>
            </div>
          </div>
        </UCard>
      </div>

      <UButton color="primary" :loading="checking" @click="runChecks">
        Tester les services
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ auth: false, layout: false })

const { $parse } = useNuxtApp()

interface ServiceState {
  status: 'idle' | 'checking' | 'ok' | 'error'
  responseMs: number | null
  error: string | null
}

const parseServer = reactive<ServiceState>({ status: 'idle', responseMs: null, error: null })
const parseCloud = reactive<ServiceState>({ status: 'idle', responseMs: null, error: null })
const checking = ref(false)

function tagType(status: ServiceState['status']) {
  if (status === 'ok') return 'green'
  if (status === 'error') return 'red'
  return 'neutral'
}

function statusLabel(status: ServiceState['status']) {
  if (status === 'ok') return 'OK'
  if (status === 'error') return 'Erreur'
  if (status === 'checking') return '...'
  return 'Non testé'
}

async function checkParseServer() {
  parseServer.status = 'checking'
  parseServer.responseMs = null
  parseServer.error = null
  const t0 = Date.now()
  try {
    const res = await fetch('/api/healthy')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    parseServer.responseMs = Date.now() - t0
    parseServer.status = 'ok'
  } catch (err: any) {
    parseServer.responseMs = Date.now() - t0
    parseServer.error = err.message || 'Inaccessible'
    parseServer.status = 'error'
  }
}

async function checkParseCloud() {
  parseCloud.status = 'checking'
  parseCloud.responseMs = null
  parseCloud.error = null
  const t0 = Date.now()
  try {
    await ($parse as any).Cloud.run('ping')
    parseCloud.responseMs = Date.now() - t0
    parseCloud.status = 'ok'
  } catch (err: any) {
    parseCloud.responseMs = Date.now() - t0
    parseCloud.error = err.message || 'Erreur inconnue'
    parseCloud.status = 'error'
  }
}

async function runChecks() {
  checking.value = true
  await Promise.allSettled([checkParseServer(), checkParseCloud()])
  checking.value = false
}

onMounted(runChecks)
</script>
