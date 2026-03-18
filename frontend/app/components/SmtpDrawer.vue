<template>
  <USlideover v-model:open="showDrawer" side="right" :title="modeEdition ? 'Modifier le profil' : 'Nouveau profil SMTP'">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <span>{{ modeEdition ? 'Modifier le profil' : 'Nouveau profil SMTP' }}</span>
        <UButton
          color="gray"
          variant="ghost"
          icon="i-heroicons-x-mark"
          size="sm"
          @click="showDrawer = false"
        />
      </div>
    </template>
    <template #body>
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-gray-500 mb-1 block">Nom *</label>
            <UInput v-model="form.nom" placeholder="Contact" />
          </div>
          <div>
            <label class="text-xs text-gray-500 mb-1 block">Nom affiché</label>
            <UInput v-model="form.nom_affiche" placeholder="Service Facturation" />
          </div>
          <div>
            <label class="text-xs text-gray-500 mb-1 block">Host *</label>
            <UInput v-model="form.host" placeholder="smtp.gmail.com" />
          </div>
          <div>
            <label class="text-xs text-gray-500 mb-1 block">Port</label>
            <UInput v-model.number="form.port" type="number" placeholder="587" />
          </div>
          <div>
            <label class="text-xs text-gray-500 mb-1 block">Utilisateur *</label>
            <UInput v-model="form.username" placeholder="contact@exemple.com" />
          </div>
          <div>
            <label class="text-xs text-gray-500 mb-1 block">Mot de passe *</label>
            <UInput v-model="form.password" type="password" />
          </div>
          <div class="col-span-2">
            <label class="text-xs text-gray-500 mb-1 block">Email from *</label>
            <UInput v-model="form.email_from" placeholder="contact@exemple.com" />
          </div>
        </div>

        <!-- Signature HTML -->
        <div>
          <label class="text-xs text-gray-500 mb-1 block">Signature HTML (optionnel)</label>
          <UTextarea
            v-model="form.signature_html"
            placeholder="&lt;p&gt;Cordialement,&lt;br&gt;L'équipe&lt;/p&gt;"
            :rows="4"
            class="w-full"
          />
        </div>

        <!-- Test connexion -->
        <div v-if="showTestSection" class="pt-2 border-t border-gray-100 space-y-2">
          <UButton
            variant="outline"
            size="sm"
            :loading="testStatus === 'loading'"
            icon="i-heroicons-signal"
            @click="testerConnexion"
          >
            Tester la connexion
          </UButton>
          <p v-if="testStatus === 'ok'" class="text-sm text-green-600 font-medium">
            ✅ Connexion réussie
          </p>
          <p v-else-if="testStatus === 'error'" class="text-sm text-red-600">
            ❌ {{ testMessage }}
          </p>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton color="neutral" variant="ghost" @click="showDrawer = false">Annuler</UButton>
        <UButton :loading="saving" @click="enregistrer">Enregistrer</UButton>
      </div>
    </template>
  </USlideover>
</template>

<script setup>
const { $parse } = useNuxtApp()
const toast = useToast()

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  modeEdition: {
    type: Boolean,
    default: false
  },
  profile: {
    type: Object,
    default: null
  },
  showTestSection: {
    type: Boolean,
    default: true
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'saved'])

// State
const saving = ref(false)
const testStatus = ref('idle') // 'idle' | 'loading' | 'ok' | 'error'
const testMessage = ref('')

const formVide = () => ({
  nom: '',
  nom_affiche: '',
  host: '',
  port: 587,
  username: '',
  password: '',
  email_from: '',
  signature_html: ''
})

const form = ref(formVide())

// Computed
const showDrawer = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Watchers
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    // Réinitialiser quand on ouvre
    if (props.modeEdition && props.profile) {
      form.value = {
        nom:          props.profile.get('nom')          || '',
        nom_affiche:  props.profile.get('nom_affiche')  || '',
        host:         props.profile.get('host')         || '',
        port:         props.profile.get('port')         || 587,
        username:     props.profile.get('username')     || '',
        password:     props.profile.get('password')     || '',
        email_from:   props.profile.get('email_from')   || '',
        signature_html: props.profile.get('signature_html') || '',
      }
    } else {
      form.value = formVide()
    }
    testStatus.value = 'idle'
  }
})

// Methods
async function enregistrer() {
  if (!form.value.nom || !form.value.host || !form.value.username || !form.value.email_from) {
    toast.add({ title: 'Champs requis manquants', color: 'orange' })
    return
  }
  
  saving.value = true
  try {
    const p = props.modeEdition ? props.profile : new $parse.Object('SmtpProfile')
    p.set('nom',           form.value.nom)
    p.set('nom_affiche',   form.value.nom_affiche)
    p.set('host',          form.value.host)
    p.set('port',          form.value.port || 587)
    p.set('username',      form.value.username)
    p.set('password',      form.value.password)
    p.set('email_from',    form.value.email_from)
    p.set('signature_html', form.value.signature_html)
    await p.save()

    showDrawer.value = false
    toast.add({ title: props.modeEdition ? 'Profil mis à jour' : 'Profil créé', color: 'green' })
    emit('saved', p)
  } catch (err) {
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
  } finally {
    saving.value = false
  }
}

async function testerConnexion() {
  testStatus.value = 'loading'
  testMessage.value = ''
  try {
    const config = useRuntimeConfig()
    const result = await $fetch(`${config.public.apiBaseUrl}/api/smtp/test`, {
      method: 'POST',
      body: {
        host:     form.value.host,
        port:     form.value.port,
        username: form.value.username,
        password: form.value.password,
      },
    })
    testStatus.value = result.ok ? 'ok' : 'error'
    testMessage.value = result.error || ''
  } catch {
    testStatus.value = 'error'
    testMessage.value = 'Erreur réseau'
  }
}
</script>