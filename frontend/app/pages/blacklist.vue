<template>
  <div class="p-6 space-y-4">

    <!-- Header -->
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <h1 class="text-2xl font-semibold text-gray-900">Blacklist</h1>
      
      <UButton
        color="primary"
        icon="i-heroicons-plus"
        @click="showAddSlideover = true"
        :loading="blacklistStore.loading"
      >
        Ajouter à la blacklist
      </UButton>
    </div>

    <!-- Filtres pour les contacts blacklistés -->
    <div class="flex items-center gap-3 flex-wrap mb-4">
      <UInput
        v-model="searchQuery"
        icon="i-heroicons-magnifying-glass"
        placeholder="Rechercher dans les contacts blacklistés..."
        class="w-64"
      />
      <USelect 
        v-model="sourceFilter" 
        :items="sourceOptions" 
        class="w-40" 
        placeholder="Toutes les sources"
        clearable
      />
    </div>

    <!-- Actions groupées -->
    <div v-if="selected.length > 0" class="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
      <span class="text-sm text-gray-600">
        {{ selected.length }} contact(s) sélectionné(s)
      </span>
      <UButton
        color="green"
        variant="solid"
        icon="i-heroicons-check-circle"
        size="sm"
        @click="removeSelectedFromBlacklist"
        :loading="blacklistStore.loading"
      >
        Retirer de la blacklist
      </UButton>
    </div>

    <!-- Tableau des contacts blacklistés -->
    <UCard :ui="{ body: { padding: 'p-0' } }">
      <UTable
        :data="filteredRows"
        :columns="columns"
        :loading="blacklistStore.loading"
        v-model:selected="selected"
        :empty="{ label: 'Aucun contact blacklisté trouvé' }"
        sticky="header"
        selectable
      >
        <!-- Cellule Date -->
        <template #blacklistedAt-cell="{ row }">
          <span v-if="row.original.blacklistedAt" class="text-gray-700 text-sm">
            {{ formatDate(row.original.blacklistedAt) }}
          </span>
          <span v-else class="text-gray-400 italic text-sm">—</span>
        </template>

        <!-- Cellule Email -->
        <template #email-cell="{ row }">
          <span v-if="row.original.email" class="text-gray-700">{{ row.original.email }}</span>
          <UBadge v-else color="red" variant="subtle">Manquant</UBadge>
        </template>

        <!-- Cellule Source -->
        <template #source-cell="{ row }">
          <UBadge :color="row.original.source === 'db_externe' ? 'blue' : 'violet'" variant="subtle">
            {{ row.original.source === 'db_externe' ? 'BD externe' : 'Upload' }}
          </UBadge>
        </template>

        <!-- Cellule Nb Impayés -->
        <template #nb_impayes-cell="{ row }">
          <span :class="row.original.nb_impayes > 0 ? 'font-semibold text-gray-900' : 'text-gray-400'">
            {{ row.original.nb_impayes }}
          </span>
        </template>

        <!-- Cellule Actions -->
        <template #actions-cell="{ row }">
          <UButton
            color="red"
            icon="i-heroicons-x-circle"
            size="xs"
            variant="ghost"
            @click="() => blacklistStore.toggleBlacklist(row.original.id, false)"
            :loading="blacklistStore.loading"
            title="Retirer de la blacklist"
          />
        </template>
      </UTable>
    </UCard>

    <!-- Slideover pour ajouter des contacts -->
    <USlideover 
      v-model:open="showAddSlideover" 
      side="right" 
      :ui="{ content: 'w-1/3 max-w-none' }"
      :prevent-close="blacklistStore.loading"
    >
      <template #header>
        <div class="flex items-center justify-between w-full">
          <span class="font-semibold text-lg">Ajouter à la blacklist</span>
          <UButton 
            color="neutral" 
            variant="ghost" 
            icon="i-heroicons-x-mark" 
            size="sm" 
            @click="showAddSlideover = false"
            :disabled="blacklistStore.loading"
          />
        </div>
      </template>
      
      <template #body>
        <div class="space-y-4 p-4">
          <!-- Recherche -->
          <UInput
            v-model="addSearchQuery"
            icon="i-heroicons-magnifying-glass"
            placeholder="Rechercher un contact à blacklister..."
            class="w-full"
            @update:model-value="debounceAddSearch"
          />

          <!-- Option pour supprimer les relances -->
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              v-model="deleteRelances"
              class="rounded"
              :disabled="blacklistStore.loading"
            />
            <span class="text-sm text-gray-600">Supprimer toutes les relances associées à ces contacts</span>
          </label>

          <!-- Message de progression -->
          <UAlert 
            v-if="blacklistStore.loading || progressMessage" 
            color="blue" 
            variant="soft" 
            class="mb-4"
            :close="false"
          >
            <template #title>
              <UIcon name="i-heroicons-arrow-path" class="animate-spin size-5" />
              {{ progressMessage || 'Traitement en cours...' }}
            </template>
            <template #description>
              <span class="text-sm">Merci de ne pas fermer cette page pendant l'opération.</span>
            </template>
          </UAlert>

          <!-- Résultats -->
          <div v-if="searchResults.length > 0" class="space-y-2">
            <p class="text-sm text-gray-600">
              {{ searchResults.length }} résultat(s) trouvé(s)
            </p>
            
            <div class="max-h-[60vh] overflow-y-auto border border-gray-200 rounded-lg">
              <div 
                v-for="contact in searchResults" 
                :key="contact.id"
                class="p-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer"
                :class="selectedForAdd.includes(contact.id) ? 'bg-sky-50' : ''"
              >
                <div class="flex items-center gap-3">
                  <input
                    type="checkbox"
                    :checked="selectedForAdd.includes(contact.id)"
                    class="rounded"
                    @change="() => toggleSelection(contact.id)"
                  />
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-gray-900">{{ contact.nom }}</p>
                    <p class="text-sm text-gray-500">{{ contact.email || contact.telephone || '—' }}</p>
                  </div>
                  <UBadge v-if="contact.isBlacklisted" color="red" variant="subtle" size="xs">
                    Déjà blacklisté
                  </UBadge>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-2 pt-4 border-t border-gray-200 mt-4">
              <UButton
                color="neutral"
                variant="outline"
                @click="showAddSlideover = false"
              >
                Annuler
              </UButton>
              <UButton
                color="red"
                variant="solid"
                icon="i-heroicons-plus"
                :disabled="selectedForAdd.length === 0"
                @click="addSelectedToBlacklist"
                :loading="blacklistStore.loading"
              >
                Ajouter {{ selectedForAdd.length }} contact(s) à la blacklist
              </UButton>
            </div>
          </div>

          <!-- Pas de résultats -->
          <div v-else-if="addSearchQuery && !searching" class="text-center py-8 text-gray-500">
            Aucun contact trouvé
          </div>

          <!-- Chargement -->
          <div v-if="addSearchQuery && searching" class="text-center py-4">
            <USkeleton class="h-8 w-full" />
          </div>

          <!-- Instructions -->
          <div v-if="!addSearchQuery" class="text-center py-8 text-gray-500">
            <p>Commencez à taper pour rechercher des contacts</p>
            <p class="text-sm mt-2">La recherche s'effectue sur tous les contacts (nom, email, téléphone)</p>
          </div>
        </div>
      </template>
    </USlideover>

  </div>
</template>

<script setup>
import { useBlacklistStore } from '~/stores/blacklistStore'

const { $parse } = useNuxtApp()

// Store
const blacklistStore = useBlacklistStore()

// États
const searchQuery = ref('')
const sourceFilter = ref(null)
const selected = ref([])

// Slideover d'ajout
const showAddSlideover = ref(false)
const addSearchQuery = ref('')
const searchResults = ref([])
const selectedForAdd = reactive([])
const searching = ref(false)
const deleteRelances = ref(false)
const progressMessage = ref('') // Message de progression

// Toggle sélection pour l'ajout
function toggleSelection(contactId) {
  const index = selectedForAdd.indexOf(contactId)
  if (index > -1) {
    selectedForAdd.splice(index, 1)
  } else {
    selectedForAdd.push(contactId)
  }
}

// Callback de progression
function handleProgress(progress) {
  if (progress.step === 'deleting_relances') {
    progressMessage.value = `Suppression des relances (${progress.current}/${progress.total}) - ${progress.deleted} supprimées`
  }
}

// Options de source
const sourceOptions = [
  { label: 'BD externe', value: 'db_externe' },
  { label: 'Upload', value: 'upload' }
]

// Lignes du tableau (réactives via le store)
const blacklistedContacts = computed(() => blacklistStore.blacklistedContacts)

const filteredRows = computed(() => {
  let data = blacklistStore.getFilteredContacts(searchQuery.value, sourceFilter.value)
  
  return data.map(c => ({
    id: c.id,
    nom: c.get('nom') || '—',
    email: c.get('email') || '',
    telephone: c.get('telephone') || '—',
    source: c.get('source') || 'inconnu',
    nb_impayes: c.get('nb_impayes') || 0,
    blacklistedAt: c.get('blacklistedAt') || null
  }))
})

// Colonnes du tableau
const columns = [
  { accessorKey: 'nom', header: 'Nom', enableSorting: true },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'telephone', header: 'Téléphone' },
  { accessorKey: 'source', header: 'Source' },
  { accessorKey: 'nb_impayes', header: 'Impayés', enableSorting: true },
  { accessorKey: 'blacklistedAt', header: 'Date Blacklist', enableSorting: true },
  { 
    id: 'actions', 
    header: 'Actions',
    cell: ({ row }) => 'actions-cell',
    enableSorting: false,
  },
]

// Formater une date
function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('fr-FR', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }) + ' ' + d.toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// Recherche pour l'ajout avec debounce
let addSearchTimeout = null
async function debounceAddSearch() {
  clearTimeout(addSearchTimeout)
  addSearchTimeout = setTimeout(() => {
    searchInAllContacts()
  }, 500)
}

// Chercher dans TOUS les contacts
async function searchInAllContacts() {
  if (!addSearchQuery.value) {
    searchResults.value = []
    return
  }

  searching.value = true
  try {
    const Contact = $parse.Object.extend('Contact')
    const searchRegex = new RegExp(addSearchQuery.value, 'i')
    
    const queries = []
    
    const nomQuery = new $parse.Query(Contact)
    nomQuery.matches('nom', searchRegex)
    nomQuery.limit(50)
    queries.push(nomQuery)
    
    const emailQuery = new $parse.Query(Contact)
    emailQuery.matches('email', searchRegex)
    emailQuery.limit(50)
    queries.push(emailQuery)
    
    const telQuery = new $parse.Query(Contact)
    telQuery.matches('telephone', searchRegex)
    telQuery.limit(50)
    queries.push(telQuery)
    
    const orQuery = $parse.Query.or(...queries)
    orQuery.include('entreprise')
    orQuery.limit(100)
    orQuery.ascending('nom')
    
    const contacts = await orQuery.find()
    
    searchResults.value = contacts.map(c => ({
      id: c.id,
      nom: c.get('nom') || '—',
      email: c.get('email') || '',
      telephone: c.get('telephone') || '—',
      isBlacklisted: c.get('isBlacklisted') || false
    }))
  } catch (error) {
    console.error('Erreur recherche:', error)
  } finally {
    searching.value = false
  }
}

// Ajouter les sélectionnés à la blacklist
async function addSelectedToBlacklist() {
  if (selectedForAdd.length === 0) return

  const toast = useToast()
  progressMessage.value = deleteRelances.value 
    ? 'Ajout à la blacklist et suppression des relances en cours... Merci de ne pas fermer cette page.'
    : 'Ajout à la blacklist en cours...'
  
  try {
    const result = await blacklistStore.addToBlacklistWithOptions(
      selectedForAdd, 
      deleteRelances.value, 
      handleProgress
    )
    
    showAddSlideover.value = false
    progressMessage.value = ''
    selectedForAdd.splice(0, selectedForAdd.length)
    deleteRelances.value = false
    addSearchQuery.value = ''
    searchResults.value = []
    
    let description = `${result.contactsAdded} contact(s) ajouté(s) à la blacklist`
    if (result.relancesDeleted > 0) {
      description += ` et ${result.relancesDeleted} relance(s) supprimée(s)`
    }
    
    toast.add({
      title: 'Succès',
      description,
      color: 'green'
    })
  } catch (error) {
    console.error('Erreur:', error)
    progressMessage.value = ''
    toast.add({
      title: 'Erreur',
      description: 'Impossible d\'ajouter les contacts à la blacklist',
      color: 'red'
    })
  }
}

// Charger les données au montage
onMounted(() => {
  blacklistStore.fetchBlacklistedContacts()
})

// Nettoyer
onUnmounted(() => {
  clearTimeout(addSearchTimeout)
})
</script>
