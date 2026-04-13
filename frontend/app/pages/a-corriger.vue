<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <h1 class="text-2xl font-semibold text-gray-900">À corriger</h1>
    </div>

    <!-- Tabs -->
    <div class="border-b border-gray-200">
      <nav class="-mb-px flex space-x-8" aria-label="Tabs">
        <button
          @click="activeTab = 'contacts'"
          :class="[
            activeTab === 'contacts' 
              ? 'border-sky-500 text-sky-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
          ]"
        >
          Contacts sans email
        </button>
        <button
          @click="activeTab = 'impayes'"
          :class="[
            activeTab === 'impayes' 
              ? 'border-sky-500 text-sky-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
          ]"
        >
          Impayés sans payeur
        </button>
      </nav>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="text-center py-12 text-gray-400">Chargement…</div>

    <!-- Contacts sans email -->
    <div v-else-if="activeTab === 'contacts'" class="space-y-4">
      <UCard>
        <UTable :data="contactsSansEmail" :columns="contactColumns" />
      </UCard>
    </div>

    <!-- Impayés sans payeur -->
    <div v-else class="space-y-4">
      <UCard>
        <UTable :data="impayesSansPayeur" :columns="impayeColumns">
          <!-- Numéro de facture -->
          <template #nfacture-cell="{ row }">
            <NuxtLink :to="`/impayes/${row.original.id}`" class="text-sky-700 hover:underline font-mono">
              {{ row.original.nfacture || '—' }}
            </NuxtLink>
          </template>

          <!-- Montant -->
          <template #montant-cell="{ row }">
            <span class="text-sm font-medium">{{ row.original.montant ? `${row.original.montant} €` : '—' }}</span>
          </template>

          <!-- Payeur -->
          <template #payeur-cell="{ row }">
            <span class="text-sm text-gray-400 italic">(aucun payeur)</span>
          </template>

          <!-- Échéance -->
          <template #dateEcheance-cell="{ row }">
            <span class="text-sm">{{ formatDate(row.original.dateEcheance) }}</span>
          </template>

        </UTable>
      </UCard>
    </div>
  </div>
</template>

<script setup>
import { h } from 'vue'

const { $parse } = useNuxtApp()
const toast = useToast()

// State
const loading = ref(false)
const activeTab = ref('contacts')
const contactsSansEmail = ref([])
const impayesSansPayeur = ref([])

// Columns definitions
const contactColumns = [
  {
    accessorKey: 'nom',
    header: 'Nom',
    cell: ({ row }) => h(NuxtLink, {
      to: `/contacts/${row.original.id}`,
      class: 'text-sky-700 hover:underline text-sm'
    }, row.original.nom || '(sans nom)')
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => h('span', { class: 'text-sm text-gray-400 italic' }, '(aucun email)')
  },
  {
    accessorKey: 'telephone',
    header: 'Téléphone',
    cell: ({ row }) => h('span', { class: 'text-sm' }, row.original.telephone || '—')
  },
]

const impayeColumns = [
  { accessorKey: 'nfacture', header: 'Facture' },
  { accessorKey: 'numero_dossier', header: 'N° dossier' },
  { accessorKey: 'montant', header: 'Montant' },
  { accessorKey: 'payeur', header: 'Payeur' },
  { accessorKey: 'dateEcheance', header: 'Échéance' }
]

// Helper functions
function formatDate(val) {
  if (!val) return '—'
  const d = val instanceof Date ? val : new Date(val)
  return isNaN(d) ? '—' : d.toLocaleDateString('fr-FR', { dateStyle: 'short' })
}

function parseContact(c) {
  if (!c) return null
  
  // Try different ways to access the data
  const getValue = (key) => {
    if (c.get) return c.get(key)
    if (c[key] !== undefined) return c[key]
    return undefined
  }
  
  return {
    id: c.id,
    nom: getValue('nom') || getValue('name') || getValue('Nom') || '—',
    email: getValue('email') || getValue('Email') || '',
    telephone: getValue('telephone') || getValue('telephone') || '',
    type: getValue('type') || getValue('Type') || '—',
  }
}

function parseImpaye(i) {
  if (!i) return null
  
  const getValue = (key) => {
    if (i.get) return i.get(key)
    if (i[key] !== undefined) return i[key]
    return undefined
  }
  
  return {
    id: i.id,
    nfacture: getValue('nfacture') || '—',
    numero_dossier: getValue('numero_dossier') || '—',
    montant: getValue('total_ttc') || getValue('montant_total') || null,
    dateEcheance: getValue('date_echeance') || getValue('dateEcheance') || null,
    payeur: getValue('payeur_nom') || getValue('payeur') || getValue('nom_payeur') || '',
  }
}

// Load data
async function chargerContactsSansEmail() {
  loading.value = true
  try {
    // Create two separate queries and combine results
    const q1 = new $parse.Query('Contact')
    q1.doesNotExist('email')
    q1.limit(200)
    
    const q2 = new $parse.Query('Contact')
    q2.equalTo('email', '')
    q2.limit(200)
    
    // Execute both queries
    const results1 = await q1.find()
    const results2 = await q2.find()
    
    // Combine and deduplicate results
    const allResults = [...results1, ...results2]
    const uniqueResults = allResults.filter((item, index, self) => 
      index === self.findIndex((t) => t.id === item.id)
    )
    
    contactsSansEmail.value = uniqueResults.map(parseContact)
    
    // Debug: log the first contact to see the structure
    if (uniqueResults.length > 0) {
      console.log('First contact:', {
        id: uniqueResults[0].id,
        nom: uniqueResults[0].get ? uniqueResults[0].get('nom') : uniqueResults[0].nom,
        email: uniqueResults[0].get ? uniqueResults[0].get('email') : uniqueResults[0].email
      })
    }
  } catch (err) {
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

async function chargerImpayesSansPayeur() {
  loading.value = true
  try {
    const q = new $parse.Query('Impaye')
    q.doesNotExist('payeur')
    q.limit(200)

    const results = await q.find()
    console.log('Impayés trouvés:', results.length, 'résultats')
    
    if (results.length > 0) {
      console.log('Premier impayé brut:', {
        id: results[0].id,
        payeur_nom: results[0].get ? results[0].get('payeur_nom') : results[0].payeur_nom,
        nfacture: results[0].get ? results[0].get('nfacture') : results[0].nfacture
      })
    }
    
    impayesSansPayeur.value = results.map(parseImpaye)
    console.log('Impayés parsés:', impayesSansPayeur.value)
  } catch (err) {
    console.error('Erreur chargement impayés:', err)
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

// Load data when tab changes
watch(activeTab, (newTab) => {
  if (newTab === 'contacts') {
    chargerContactsSansEmail()
  } else {
    chargerImpayesSansPayeur()
  }
}, { immediate: true })

onMounted(() => {
  // Load initial data based on active tab
  if (activeTab.value === 'contacts') {
    chargerContactsSansEmail()
  } else {
    chargerImpayesSansPayeur()
  }
})
</script>

<style scoped>
/* Add any custom styles here */
</style>