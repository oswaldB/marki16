<template>
  <UCard>
    <template #header>
      <h2 class="text-base font-semibold text-gray-900">Connexion</h2>
    </template>

    <form class="space-y-4" @submit.prevent="handleLogin">
      <UFormField label="Identifiant" name="username">
        <UInput
          v-model="form.username"
          type="text"
          placeholder="Votre identifiant"
          autocomplete="username"
          required
          class="w-full"
        />
      </UFormField>

      <UFormField label="Mot de passe" name="password">
        <UInput
          v-model="form.password"
          type="password"
          placeholder="••••••••"
          autocomplete="current-password"
          required
          class="w-full"
        />
      </UFormField>

      <UAlert
        v-if="error"
        color="error"
        variant="subtle"
        :description="error"
        icon="i-heroicons-exclamation-circle"
      />

      <UButton
        type="submit"
        color="primary"
        class="w-full justify-center"
        :loading="loading"
      >
        Se connecter
      </UButton>
    </form>
  </UCard>
</template>

<script setup>
definePageMeta({ layout: 'auth' })

const authStore = useAuthStore()

const form = reactive({ username: '', password: '' })
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  try {
    await authStore.login(form.username, form.password)
    await navigateTo('/')
  } catch (err) {
    error.value = err.message || 'Identifiants incorrects'
  } finally {
    loading.value = false
  }
}
</script>
