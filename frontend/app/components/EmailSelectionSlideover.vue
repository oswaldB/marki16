<template>
  <USlideover v-model:open="isOpen" side="right" :ui="{ content: 'w-1/3 max-w-none' }">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <span class="font-semibold text-lg">Définir un email de relance</span>
      </div>
      <div class="mt-2 text-sm text-gray-500">
        {{ props.contactId ? 'Sélectionnez un email existant ou créez-en un nouveau pour ce contact.' : 'Sélectionnez un email existant ou créez-en un nouveau pour cet impayé.' }}
      </div>
    </template>
    
    <template #body>
      <div class="space-y-6 py-4">
        <!-- Recherche d'emails existants -->
        <div>
          <h3 class="text-sm font-medium text-gray-900 mb-3">Rechercher un email de relance existant</h3>
          <UInput
            v-model="searchQuery"
            icon="i-heroicons-magnifying-glass"
            placeholder="Rechercher un email de relance..."
            class="w-full"
            @input="searchEmails"
            :ui="{ icon: { trailing: { pointer: '' } } }"
          />
          
          <div v-if="loading" class="mt-4 text-center text-gray-400">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin size-5 mx-auto" />
            <span class="text-sm">Recherche...</span>
          </div>
          
          <div v-else-if="filteredEmails.length > 0" class="mt-4 space-y-1">
            <UButton
              v-for="email in filteredEmails"
              :key="email.id"
              color="neutral"
              variant="ghost"
              class="w-full justify-start py-2.5"
              @click="selectEmail(email)"
            >
              <span class="truncate max-w-[280px] block text-left">
                <span class="font-medium">{{ email.email }}</span>
                <span v-if="email.name" class="text-xs text-gray-500 ml-1">- {{ email.name }}</span>
              </span>
            </UButton>
          </div>
          
          <div v-else-if="searchQuery && !loading" class="mt-4 text-center text-gray-400 text-sm">
            Aucun email de relance trouvé
          </div>
          <div v-else-if="!searchQuery && allEmails.length === 0 && !loading" class="mt-4 text-center text-gray-400 text-sm">
            Aucun email de relance disponible. Créez-en un nouveau ci-dessous.
          </div>
        </div>
        
        <!-- Séparateur -->
        <div class="border-t border-gray-200"></div>
        
        <!-- Création d'un nouvel email -->
        <div class="mt-6">
          <h3 class="text-sm font-medium text-gray-900 mb-4">Ou créer un nouvel email de relance</h3>
          <UForm :state="newEmail" class="space-y-5">
            <UFormGroup label="Adresse email" name="email" required>
              <UInput
                v-model="newEmail.email"
                type="email"
                placeholder="exemple@domaine.com"
                class="w-full"
                :ui="{ base: 'w-full' }"
              />
            </UFormGroup>
            
            <UFormGroup label="Nom (optionnel)" name="name" class="mt-4">
              <UInput
                v-model="newEmail.name"
                placeholder="Nom ou description de l'email de relance"
                class="w-full"
                :ui="{ base: 'w-full' }"
              />
            </UFormGroup>
            
            <div class="mt-6">
              <UButton
                color="primary"
                :loading="creating"
                @click="createNewEmail"
                class="w-full py-2.5"
                size="md"
              >
                <span class="font-medium">Créer et utiliser cet email de relance</span>
              </UButton>
            </div>
          </UForm>
        </div>
      </div>
    </template>
    
    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton color="neutral" variant="ghost" @click="cancel" size="md">
          Annuler
        </UButton>
      </div>
    </template>
  </USlideover>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  contactId: {
    type: String,
    default: null
  },
  impayelId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'emailSelected'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const { $parse } = useNuxtApp()
const toast = useToast()

// État pour la recherche d'emails
const searchQuery = ref('')
const allEmails = ref([])
const filteredEmails = ref([])
const loading = ref(false)

// État pour la création d'un nouvel email
const newEmail = ref({
  email: '',
  name: ''
})
const creating = ref(false)

// Rechercher tous les emails au montage
onMounted(async () => {
  await loadAllEmails()
})

async function loadAllEmails() {
  try {
    loading.value = true
    // Charger tous les contacts qui ont un email pour la recherche
    const query = new $parse.Query('Contact')
    query.exists('email')
    query.notEqualTo('email', '')
    query.limit(1000)
    
    const contacts = await query.find()
    allEmails.value = contacts.map(c => ({
      id: c.id,
      email: c.get('email'),
      name: c.get('nom') || c.get('email')
    }))
    filteredEmails.value = allEmails.value
  } catch (error) {
    console.error('Erreur lors du chargement des emails de relance:', error)
    toast.add({ title: 'Erreur', description: 'Impossible de charger les emails de relance', color: 'red' })
  } finally {
    loading.value = false
  }
}

function searchEmails() {
  if (!searchQuery.value) {
    filteredEmails.value = allEmails.value
    return
  }
  
  const query = searchQuery.value.toLowerCase()
  filteredEmails.value = allEmails.value.filter(email =>
    email.email.toLowerCase().includes(query)
  )
}

async function selectEmail(email) {
  try {
    console.log('Contact sélectionné:', email)
    
    // Vérifier que nous avons un ID valide
    if (!email.id) {
      console.error('Le contact sélectionné n\'a pas d\'ID valide')
      toast.add({ title: 'Erreur', description: 'Contact invalide sélectionné', color: 'red' })
      return
    }
    
    // Émettre l'événement avec l'email et l'ID du contact
    // La logique de mise à jour sera gérée par le composant parent
    emit('emailSelected', email.email, email.id)
    isOpen.value = false
  } catch (error) {
    console.error('Erreur lors de la sélection du contact:', error)
    toast.add({ title: 'Erreur', description: 'Impossible de sélectionner le contact', color: 'red' })
  }
}

async function createNewEmail() {
  if (!newEmail.value.email) {
    toast.add({ title: 'Erreur', description: 'Veuillez entrer un email', color: 'red' })
    return
  }
  
  try {
    creating.value = true
    
    // 1. Créer un contact standard qui servira d'email de relance
    const Contact = $parse.Object.extend('Contact')
    const contactRelance = new Contact()
    
    contactRelance.set('email', newEmail.value.email)
    contactRelance.set('nom', newEmail.value.name || newEmail.value.email)
    contactRelance.set('estActif', true)
    contactRelance.set('nombreUtilisations', 0)
    
    // Si un contactId est fourni, ce contact devient un email de relance pour celui-ci
    if (props.contactId) {
      const contactPrincipal = Contact.createWithoutData(props.contactId)
      contactRelance.set('email_relance', contactPrincipal)
    } else if (props.impayelId) {
      // Pour un impayé, nous allons créer une relation directe
      const Impaye = $parse.Object.extend('Impaye')
      const impaye = await Impaye.createWithoutData(props.impayelId).fetch()
      // Le contact de relance sera utilisé comme email_relance pour l'impayé
    }
    
    await contactRelance.save()
    
    // 2. Créer une activité pour tracer la création
    const Activite = $parse.Object.extend('Activite')
    const activite = new Activite()
    activite.set('type', 'email_relance_cree')
    activite.set('details', `Email de relance créé: ${newEmail.value.email}`)
    activite.set('contactRelance', contactRelance)
    
    if (props.contactId) {
      const contactPtr = Contact.createWithoutData(props.contactId)
      activite.set('contact', contactPtr)
    } else if (props.impayelId) {
      const impayePtr = $parse.Object.extend('Impaye').createWithoutData(props.impayelId)
      activite.set('impaye', impayePtr)
    }
    
    await activite.save()
    
    toast.add({ title: 'Succès', description: 'Nouvel email de relance enregistré', color: 'green' })
    emit('emailSelected', newEmail.value.email, contactRelance.id)
    isOpen.value = false
    
    // Recharger la liste des emails
    await loadAllEmails()
  } catch (error) {
    console.error('Erreur lors de la création de l\'email de relance:', error)
    toast.add({ title: 'Erreur', description: 'Impossible de créer l\'email de relance', color: 'red' })
  } finally {
    creating.value = false
  }
}

function cancel() {
  isOpen.value = false
}
</script>
