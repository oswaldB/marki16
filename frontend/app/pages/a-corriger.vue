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
        <button
          @click="activeTab = 'apporteurs'"
          :class="[
            activeTab === 'apporteurs'
              ? 'border-sky-500 text-sky-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
          ]"
        >
          Apporteurs sans contact par défaut
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
    <div v-else-if="activeTab === 'impayes'" class="space-y-4">
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

    <!-- Apporteurs sans contact par défaut -->
    <div v-else class="space-y-4">
      <UCard>
        <div v-if="apporteursSansContactDefaut.length === 0" class="text-center py-8 text-gray-400">
          Aucun apporteur sans contact par défaut avec facture en cours
        </div>
        <UTable v-else :data="apporteursSansContactDefaut" :columns="apporteurColumns" />
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
const apporteursSansContactDefaut = ref([])

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
    accessorKey: 'code_interlocuteur',
    header: 'Code interlocuteur',
    cell: ({ row }) => h('span', { class: 'text-sm font-mono text-gray-600' }, row.original.code_interlocuteur || '—')
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
  {
    accessorKey: 'nb_impayes',
    header: 'Impayés actifs',
    cell: ({ row }) => h('span', { class: 'text-sm font-semibold text-red-600' }, row.original.nb_impayes || 0)
  },
  {
    accessorKey: 'numero_dossier',
    header: 'N° dossier',
    cell: ({ row }) => h('span', { class: 'text-sm' }, row.original.numero_dossier || '—')
  },
  {
    accessorKey: 'nfacture',
    header: 'Factures',
    cell: ({ row }) => h('span', { class: 'text-sm font-mono' }, row.original.nfacture || '—')
  },
]

const impayeColumns = [
  { accessorKey: 'nfacture', header: 'Facture' },
  { accessorKey: 'numero_dossier', header: 'N° dossier' },
  { accessorKey: 'montant', header: 'Montant' },
  { accessorKey: 'payeur', header: 'Payeur' },
  { accessorKey: 'dateEcheance', header: 'Échéance' }
]

const apporteurColumns = [
  {
    accessorKey: 'nom',
    header: 'Apporteur',
    cell: ({ row }) => h(NuxtLink, {
      to: `/contacts/${row.original.id}`,
      class: 'text-sky-700 hover:underline text-sm'
    }, `${row.original.nom || '(sans nom)'}${row.original.prenom ? ` ${row.original.prenom}` : ''}`)
  },
  {
    accessorKey: 'code_interlocuteur',
    header: 'Code interlocuteur',
    cell: ({ row }) => h('span', { class: 'text-sm font-mono text-gray-600' }, row.original.code_interlocuteur || '—')
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => h('span', { class: 'text-sm' }, row.original.email || '—')
  },
  {
    accessorKey: 'telephone',
    header: 'Téléphone',
    cell: ({ row }) => h('span', { class: 'text-sm' }, row.original.telephone || '—')
  },
  {
    accessorKey: 'motif',
    header: 'Motif',
    cell: ({ row }) => h(
      'span',
      {
        class: row.original.motif === 'aucun'
          ? 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700'
          : 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700'
      },
      row.original.motif === 'aucun' ? 'Aucun contact par défaut' : 'Défaut sans email'
    )
  },
  {
    accessorKey: 'nb_impayes',
    header: 'Impayés en cours',
    cell: ({ row }) => h('span', { class: 'text-sm font-semibold text-red-600' }, row.original.nb_impayes || 0)
  },
  {
    accessorKey: 'total_reste',
    header: 'Reste à payer',
    cell: ({ row }) => h('span', { class: 'text-sm font-medium' }, formatMontant(row.original.total_reste))
  },
  {
    accessorKey: 'numero_dossier',
    header: 'N° dossier',
    cell: ({ row }) => h('span', { class: 'text-sm' }, row.original.numero_dossier || '—')
  },
  {
    accessorKey: 'nfacture',
    header: 'Factures',
    cell: ({ row }) => h('span', { class: 'text-sm font-mono' }, row.original.nfacture || '—')
  },
]

// Helper functions
function formatDate(val) {
  if (!val) return '—'
  const d = val instanceof Date ? val : new Date(val)
  return isNaN(d) ? '—' : d.toLocaleDateString('fr-FR', { dateStyle: 'short' })
}

function formatMontant(val) {
  const n = Number(val)
  if (val === null || val === undefined || Number.isNaN(n)) return '—'
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
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
    externe_id: getValue('externe_id') || getValue('externeId') || getValue('code_interlocuteur') || '',
    nb_impayes: 0,
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
    // Create three separate queries to capture all contacts without email
    const q1 = new $parse.Query('Contact')
    q1.doesNotExist('email')
    q1.limit(10000)

    const q2 = new $parse.Query('Contact')
    q2.equalTo('email', '')
    q2.limit(10000)

    // Execute all three queries
    const results1 = await q1.find()
    const results2 = await q2.find()

    // 3. email is null
    const q3 = new $parse.Query('Contact')
    q3.equalTo('email', null)
    q3.limit(10000)
    const results3 = await q3.find()

    // Combine and deduplicate results using a Set for better performance
    const seenIds = new Set()
    const uniqueResults = [...results1, ...results2, ...results3].filter((item) => {
      if (seenIds.has(item.id)) {
        return false
      }
      seenIds.add(item.id)
      return true
    })

    // Récupérer les impayés actifs liés à ces contacts
    const Contact = $parse.Object.extend('Contact')
    const contactPointers = uniqueResults.map(c => Contact.createWithoutData(c.id))
    const impayesMap = new Map() // contactId -> { count, numero_dossiers: Set, nfactures: Set }

    const batchSize = 100
    for (let i = 0; i < contactPointers.length; i += batchSize) {
      const batch = contactPointers.slice(i, i + batchSize)
      const impayeQ = new $parse.Query('Impaye')
      impayeQ.containedIn('payeur', batch)
      impayeQ.greaterThan('reste_a_payer', 0)
      impayeQ.limit(10000)
      const impayes = await impayeQ.find()
      for (const impaye of impayes) {
        const payeur = impaye.get('payeur')
        if (payeur && payeur.id) {
          const data = impayesMap.get(payeur.id) || { count: 0, numero_dossiers: new Set(), nfactures: new Set() }
          data.count++
          const nd = impaye.get('numero_dossier')
          if (nd) data.numero_dossiers.add(nd)
          const nf = impaye.get('nfacture')
          if (nf) data.nfactures.add(nf)
          impayesMap.set(payeur.id, data)
        }
      }
    }

    contactsSansEmail.value = uniqueResults
      .map(parseContact)
      .map(c => {
        const data = impayesMap.get(c.id) || { count: 0, numero_dossiers: new Set(), nfactures: new Set() }
        return {
          ...c,
          code_interlocuteur: c.externe_id || '',
          nb_impayes: data.count,
          numero_dossier: Array.from(data.numero_dossiers).join(', '),
          nfacture: Array.from(data.nfactures).join(', '),
        }
      })
      .filter(c => c.nb_impayes > 0)
      .sort((a, b) => {
        const nomA = a.nom || ''
        const nomB = b.nom || ''
        return nomA.localeCompare(nomB, 'fr', { sensitivity: 'base' })
      })

    // Debug: log count and first contact to see the structure
    console.log(`Contacts sans email avec impayés actifs: ${contactsSansEmail.value.length}`)
    if (contactsSansEmail.value.length > 0) {
      console.log('First contact:', contactsSansEmail.value[0])
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
    q.equalTo('facture_soldee', false)
    q.limit(10000)

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

async function chargerApporteursSansContactDefaut() {
  loading.value = true
  try {
    const q = new $parse.Query('Impaye')
    q.greaterThan('reste_a_payer', 0)
    q.exists('apporteur')
    q.include('apporteur')
    q.limit(10000)

    const results = await q.find()

    const map = new Map()
    for (const impaye of results) {
      const apporteur = impaye.get('apporteur')
      if (!apporteur) continue

      const entry = map.get(apporteur.id) || {
        id: apporteur.id,
        nom: apporteur.get('nom') || '(sans nom)',
        prenom: apporteur.get('prenom') || '',
        code_interlocuteur: apporteur.get('externe_id') || '',
        email: apporteur.get('email') || '',
        telephone: apporteur.get('telephone') || '',
        a_contact_defaut: apporteur.get('a_contact_defaut') === true,
        contact_defaut_email: apporteur.get('contact_defaut_email') || '',
        nb_impayes: 0,
        total_reste: 0,
        numero_dossiers: new Set(),
        nfactures: new Set(),
      }

      entry.nb_impayes++
      const reste = impaye.get('reste_a_payer')
      if (typeof reste === 'number') entry.total_reste += reste
      const nd = impaye.get('numero_dossier')
      if (nd) entry.numero_dossiers.add(nd)
      const nf = impaye.get('nfacture')
      if (nf) entry.nfactures.add(nf)

      map.set(apporteur.id, entry)
    }

    // Périmètre : aucun contact par défaut OU défaut sans email exploitable
    apporteursSansContactDefaut.value = Array.from(map.values())
      .filter((a) => !a.a_contact_defaut || !String(a.contact_defaut_email).trim())
      .map((a) => ({
        ...a,
        motif: a.a_contact_defaut ? 'sans_email' : 'aucun',
        numero_dossier: Array.from(a.numero_dossiers).join(', '),
        nfacture: Array.from(a.nfactures).join(', '),
      }))
      .sort((a, b) => (a.nom || '').localeCompare(b.nom || '', 'fr', { sensitivity: 'base' }))

    console.log(`Apporteurs sans contact par défaut: ${apporteursSansContactDefaut.value.length}`)
  } catch (err) {
    console.error('Erreur chargement apporteurs:', err)
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

// Load data when tab changes
watch(activeTab, (newTab) => {
  if (newTab === 'contacts') {
    chargerContactsSansEmail()
  } else if (newTab === 'impayes') {
    chargerImpayesSansPayeur()
  } else {
    chargerApporteursSansContactDefaut()
  }
}, { immediate: true })
</script>

<style scoped>
/* Add any custom styles here */
</style>
