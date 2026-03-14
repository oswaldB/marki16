<template>
  <div class="p-6 space-y-6">

    <!-- ── Header ── -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p class="text-sm text-gray-500 mt-1">Vue d'ensemble de l'activité</p>
      </div>
      <!-- Bouton Synchroniser -->
      <UButton
        :loading="syncing"
        :disabled="syncing"
        color="neutral"
        variant="outline"
        icon="i-heroicons-arrow-path"
        @click="lancerSyncImpayes"
      >
        Synchroniser
      </UButton>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-400">Chargement…</div>

    <template v-else>
      <!-- ── KPI Cards ── -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <UCard>
          <div class="flex items-start gap-3">
            <div class="p-2 rounded-lg bg-orange-50">
              <UIcon name="i-heroicons-document-text" class="size-5 text-orange-500" />
            </div>
            <div>
              <div class="flex items-center gap-1">
                <p class="text-xs text-gray-500 font-medium">Impayés actifs</p>
                <UTooltip text="Nombre d'impayés dont le statut n'est pas 'payé' (impayé + en cours)">
                  <UIcon name="i-heroicons-information-circle" class="size-3.5 text-gray-400" />
                </UTooltip>
              </div>
              <p class="text-2xl font-bold text-gray-900 mt-0.5">{{ kpi.impayes_actifs }}</p>
              <p class="text-xs text-gray-400">en cours + impayé</p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-start gap-3">
            <div class="p-2 rounded-lg bg-red-50">
              <UIcon name="i-heroicons-banknotes" class="size-5 text-red-500" />
            </div>
            <div>
              <div class="flex items-center gap-1">
                <p class="text-xs text-gray-500 font-medium">Montant total impayé</p>
                <UTooltip text="Somme du champ 'reste à payer' pour tous les impayés non payés">
                  <UIcon name="i-heroicons-information-circle" class="size-3.5 text-gray-400" />
                </UTooltip>
              </div>
              <p class="text-2xl font-bold text-gray-900 mt-0.5">{{ formatMontantCourt(kpi.montant_total) }}</p>
              <p class="text-xs text-gray-400">{{ formatMontant(kpi.montant_total) }}</p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-start gap-3">
            <div class="p-2 rounded-lg bg-blue-50">
              <UIcon name="i-heroicons-envelope" class="size-5 text-blue-500" />
            </div>
            <div>
              <div class="flex items-center gap-1">
                <p class="text-xs text-gray-500 font-medium">Relances du jour</p>
                <UTooltip text="Nombre de relances avec statut 'pending' dont la date d'envoi est aujourd'hui">
                  <UIcon name="i-heroicons-information-circle" class="size-3.5 text-gray-400" />
                </UTooltip>
              </div>
              <p class="text-2xl font-bold text-gray-900 mt-0.5">{{ kpi.relances_jour }}</p>
              <p class="text-xs text-gray-400">à envoyer aujourd'hui</p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-start gap-3">
            <div class="p-2 rounded-lg bg-green-50">
              <UIcon name="i-heroicons-check-badge" class="size-5 text-green-500" />
            </div>
            <div>
              <div class="flex items-center gap-1">
                <p class="text-xs text-gray-500 font-medium">Taux de recouvrement</p>
                <UTooltip text="Pourcentage d'impayés avec statut 'payé' par rapport au total">
                  <UIcon name="i-heroicons-information-circle" class="size-3.5 text-gray-400" />
                </UTooltip>
              </div>
              <p class="text-2xl font-bold text-gray-900 mt-0.5">{{ kpi.taux_recouvrement }}%</p>
              <p class="text-xs text-gray-400">des dossiers payés</p>
            </div>
          </div>
        </UCard>



      </div>

      <!-- ── Graphiques ── -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <!-- Donut statuts -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-1.5">
              <p class="text-sm font-semibold text-gray-700">Répartition par statut</p>
              <UTooltip text="Nombre d'impayés par statut (impayé, en cours, payé)">
                <UIcon name="i-heroicons-information-circle" class="size-4 text-gray-400" />
              </UTooltip>
            </div>
          </template>
          <div class="flex items-center justify-center h-52">
            <Doughnut :data="donutData" :options="donutOptions" />
          </div>
          <div class="flex justify-center gap-5 mt-3 text-xs text-gray-600">
            <span class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded-full bg-orange-400 inline-block" />
              Impayé ({{ statutCounts.impaye }})
            </span>
            <span class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded-full bg-blue-500 inline-block" />
              En cours ({{ statutCounts.en_cours }})
            </span>
            <span class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded-full bg-green-500 inline-block" />
              Payé ({{ statutCounts.paye }})
            </span>
          </div>
        </UCard>

        <!-- Bar mois -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-1.5">
              <p class="text-sm font-semibold text-gray-700">Montant facturé vs reste à payer par mois (12 mois + avant)</p>
              <UTooltip text="Montant total TTC (bleu + orange) et reste à payer (orange) pour les factures dont la date de pièce est dans le mois">
                <UIcon name="i-heroicons-information-circle" class="size-4 text-gray-400" />
              </UTooltip>
            </div>
          </template>
          <div class="h-64">
            <Bar :data="barData" :options="barOptions" />
          </div>
        </UCard>

      </div>

      <!-- ── Tableaux ── -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <!-- Relances du jour -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold text-gray-700">Relances du jour</p>
              <NuxtLink to="/relances" class="text-xs text-sky-600 hover:underline">Voir tout →</NuxtLink>
            </div>
          </template>
          <div v-if="relancesJour.length === 0" class="text-sm text-gray-400 py-4 text-center">
            Aucune relance prévue aujourd'hui
          </div>
          <div v-else class="divide-y divide-gray-100">
            <div
              v-for="rel in relancesJour"
              :key="rel.id"
              class="flex items-center justify-between py-2.5"
            >
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ rel.payeur_nom }}</p>
                <p class="text-xs text-gray-500">{{ rel.nfacture }} · {{ rel.sequence_nom }}</p>
                <p class="text-xs text-gray-400">{{ rel.date }} · {{ rel.heure }} · Relance {{ rel.numero }}</p>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Relances à valider -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold text-gray-700">Relances à valider</p>
              <NuxtLink to="/relances?validation=true" class="text-xs text-sky-600 hover:underline">Voir tout →</NuxtLink>
            </div>
          </template>
          <div v-if="relancesAValider.length === 0" class="text-sm text-gray-400 py-4 text-center">
            Aucune relance à valider
          </div>
          <div v-else class="divide-y divide-gray-100">
            <div
              v-for="rel in relancesAValider"
              :key="rel.id"
              class="flex items-center justify-between py-2.5"
            >
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ rel.payeur_nom }}</p>
                <p class="text-xs text-gray-500">{{ rel.nfacture }} · {{ rel.sequence_nom }}</p>
                <p class="text-xs text-gray-400">{{ rel.date }} · Relance {{ rel.numero }}</p>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Contacts sans email -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold text-gray-700">Contacts sans email</p>
              <NuxtLink to="/contacts/sans-email" class="text-xs text-sky-600 hover:underline">Voir tout →</NuxtLink>
            </div>
          </template>
          <div v-if="contactsSansEmail.length === 0" class="text-sm text-gray-400 py-4 text-center">
            Tous les contacts ont un email
          </div>
          <div v-else class="divide-y divide-gray-100">
            <div
              v-for="contact in contactsSansEmail"
              :key="contact.id"
              class="flex items-center justify-between py-2.5"
            >
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ contact.nom }}</p>
                <p class="text-xs text-gray-500">{{ contact.telephone || '—' }}</p>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Impayés récents -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold text-gray-700">Impayés récents</p>
              <NuxtLink to="/impayes" class="text-xs text-sky-600 hover:underline">Voir tout →</NuxtLink>
            </div>
          </template>
          <div v-if="impayes_recents.length === 0" class="text-sm text-gray-400 py-4 text-center">
            Aucun impayé
          </div>
          <div v-else class="divide-y divide-gray-100">
            <div
              v-for="imp in impayes_recents"
              :key="imp.id"
              class="flex items-center justify-between py-2.5"
            >
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ imp.payeur_nom }}</p>
                <p class="text-xs text-gray-500 font-mono">{{ imp.nfacture }}</p>
              </div>
              <div class="flex items-center gap-2 shrink-0 ml-2">
                <span class="text-sm font-medium text-gray-800">{{ formatMontant(imp.reste_a_payer) }}</span>
                <UBadge :color="statutColor(imp.statut)" variant="subtle" size="xs">{{ imp.statut }}</UBadge>
                <NuxtLink :to="`/impayes/${imp.id}`">
                  <UIcon name="i-heroicons-arrow-top-right-on-square" class="size-4 text-gray-400 hover:text-sky-600" />
                </NuxtLink>
              </div>
            </div>
          </div>
        </UCard>

      </div>
    </template>

  </div>
</template>

<script setup>
import { Doughnut, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

const { $parse } = useNuxtApp()

// ── State ──────────────────────────────────────────────────────
const loading = ref(true)
const syncing = ref(false)

const kpi = ref({
  impayes_actifs:    0,
  montant_total:     0,
  relances_jour:     0,
  taux_recouvrement: 0,
})

const statutCounts = ref({ impaye: 0, en_cours: 0, paye: 0 })
const montantsMois = ref({
  ttc: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  reste: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
})
const relancesJour = ref([])
const impayes_recents = ref([])
const relancesAValider = ref([])
const contactsSansEmail = ref([])

// ── Chargement ────────────────────────────────────────────────
onMounted(async () => {
  try {
    await Promise.all([
      chargerKpi(),
      chargerStatuts(),
      chargerMontantsMois(),
      chargerRelancesJour(),
      chargerImpayes(),
      chargerRelancesAValider(),
      chargerContactsSansEmail(),
    ])
  } finally {
    loading.value = false
  }
})

async function chargerKpi() {
  const today = endOfDay()

  const [actifs, total_count, paye_count, relances, contacts_sans_email] = await Promise.all([
    new $parse.Query('Impaye').notEqualTo('statut', 'payé').doesNotExist('solde').count(),
    new $parse.Query('Impaye').count(),
    new $parse.Query('Impaye').equalTo('statut', 'payé').count(),
    new $parse.Query('Relance')
      .equalTo('statut', 'pending')
      .lessThanOrEqualTo('dateEnvoi', today)
      .count(),
    new $parse.Query('Contact')
      .doesNotExist('email')
      .count(),
  ])

  // Montant total impayé (somme des actifs non soldés, chargés en batch)
  const qMontant = new $parse.Query('Impaye')
  qMontant.notEqualTo('statut', 'payé')
  qMontant.doesNotExist('solde')
  qMontant.select('reste_a_payer')
  qMontant.limit(1000)
  const impayes_actifs = await qMontant.find()
  const montant = impayes_actifs.reduce((s, i) => s + (i.get('reste_a_payer') || 0), 0)

  kpi.value = {
    impayes_actifs:    actifs,
    montant_total:     montant,
    relances_jour:     relances,
    taux_recouvrement: total_count > 0 ? Math.round((paye_count / total_count) * 100) : 0,
    contacts_sans_email: contacts_sans_email,
  }
}

async function chargerStatuts() {
  const [impaye, en_cours, paye, solde] = await Promise.all([
    new $parse.Query('Impaye').equalTo('statut', 'impaye').doesNotExist('solde').count(),
    new $parse.Query('Impaye').equalTo('statut', 'en cours').doesNotExist('solde').count(),
    new $parse.Query('Impaye').equalTo('statut', 'payé').count(),
    new $parse.Query('Impaye').equalTo('solde', true).count(),
  ])
  statutCounts.value = { impaye, en_cours, paye: paye + solde }
}

async function chargerMontantsMois() {
  const montantsTTC = []
  const montantsReste = []
  
  // Calcul pour 12 mois + colonne "avant"
  for (let i = 12; i >= 0; i--) {
    const debut = new Date()
    debut.setDate(1)
    debut.setMonth(debut.getMonth() - i)
    debut.setHours(0, 0, 0, 0)
    const fin = new Date(debut)
    fin.setMonth(fin.getMonth() + 1)

    const q = new $parse.Query('Impaye')
    q.greaterThanOrEqualTo('date_piece', debut)
    q.lessThan('date_piece', fin)
    q.doesNotExist('solde')
    q.select('total_ttc', 'reste_a_payer')
    q.limit(500)
    const items = await q.find()
    
    const ttc = items.reduce((s, i) => s + (i.get('total_ttc') || 0), 0)
    const reste = items.reduce((s, i) => s + (i.get('reste_a_payer') || 0), 0)
    
    montantsTTC.push(ttc)
    montantsReste.push(reste)
  }
  
  montantsMois.value = {
    ttc: montantsTTC,
    reste: montantsReste
  }
}

async function chargerRelancesJour() {
  if (!$parse.User.current()) return
  const q = new $parse.Query('Relance')
  q.equalTo('statut', 'pending')
  q.lessThanOrEqualTo('dateEnvoi', endOfDay())
  q.include('impaye')
  q.include('sequence')
  q.ascending('dateEnvoi')
  q.limit(5)
  const results = await q.find()
  relancesJour.value = results.map(r => {
    const imp = r.get('impaye')
    const seq = r.get('sequence')
    const d = r.get('dateEnvoi')
    return {
      id:           r.id,
      payeur_nom:   imp ? imp.get('payeur_nom') || '—' : '—',
      nfacture:     imp ? imp.get('nfacture') || '—' : '—',
      sequence_nom: seq ? seq.get('nom') || '—' : '—',
      heure:        d ? d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—',
      date:         d ? d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : '—',
    }
  })
}

async function chargerImpayes() {
  const q = new $parse.Query('Impaye')
  q.descending('createdAt')
  q.doesNotExist('solde')
  q.limit(5)
  const results = await q.find()
  impayes_recents.value = results.map(r => ({
    id:           r.id,
    nfacture:     r.get('nfacture') || '—',
    payeur_nom:   r.get('payeur_nom') || '—',
    reste_a_payer: r.get('reste_a_payer'),
    statut:       r.get('statut') || '—',
  }))
}

async function chargerRelancesAValider() {
  if (!$parse.User.current()) return
  const q = new $parse.Query('Relance')
  q.equalTo('valide', false)
  q.equalTo('statut', 'pending')
  q.include('impaye')
  q.include('sequence')
  q.ascending('dateEnvoi')
  q.limit(5)
  const results = await q.find()
  relancesAValider.value = results.map(r => {
    const imp = r.get('impaye')
    const seq = r.get('sequence')
    const d = r.get('dateEnvoi')
    return {
      id:           r.id,
      payeur_nom:   imp ? imp.get('payeur_nom') || '—' : '—',
      nfacture:     imp ? imp.get('nfacture') || '—' : '—',
      sequence_nom: seq ? seq.get('nom') || '—' : '—',
      heure:        d ? d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—',
      date:         d ? d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : '—',
      numero:       r.get('numero') || '—',
    }
  })
}

async function chargerContactsSansEmail() {
  if (!$parse.User.current()) return
  const q = new $parse.Query('Contact')
  q.doesNotExist('email')
  q.ascending('nom')
  q.limit(5)
  const results = await q.find()
  contactsSansEmail.value = results.map(c => ({
    id:         c.id,
    nom:        c.get('nom') || '—',
    telephone:  c.get('telephone') || null,
  }))
}

// ── Helpers ────────────────────────────────────────────────────
function endOfDay() {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d
}

function formatMontant(val) {
  if (val == null) return '—'
  return Number(val).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

function formatMontantCourt(val) {
  if (val == null) return '—'
  const n = Number(val)
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.', ',') + ' M€'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace('.', ',') + ' k€'
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

function statutColor(statut) {
  if (statut === 'payé') return 'green'
  if (statut === 'en cours') return 'blue'
  return 'orange'
}

function labelsMois() {
  const mois = []
  // Commencer par "Avant" puis 12 mois
  mois.push('Avant')
  for (let i = 12; i >= 1; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    mois.push(d.toLocaleDateString('fr-FR', { month: 'short' }))
  }
  return mois
}

// ── Chart data ─────────────────────────────────────────────────
const donutData = computed(() => ({
  labels: ['Impayé', 'En cours', 'Payé'],
  datasets: [{
    data: [statutCounts.value.impaye, statutCounts.value.en_cours, statutCounts.value.paye],
    backgroundColor: ['#fb923c', '#3b82f6', '#22c55e'],
    borderWidth: 0,
  }],
}))

const donutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
}

const barData = computed(() => ({
  labels: labelsMois(),
  datasets: [
    {
      label: 'Reste à payer',
      data: montantsMois.value.reste,
      backgroundColor: '#fb923c',
      borderRadius: 4,
    },
    {
      label: 'Montant payé',
      data: montantsMois.value.ttc.map((ttc, i) => ttc - montantsMois.value.reste[i]),
      backgroundColor: '#22c55e',
      borderRadius: 4,
    }
  ],
}))

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: {
        usePointStyle: true,
        padding: 15,
      }
    }
  },
  scales: {
    y: {
      stacked: true,
      ticks: {
        callback: (val) => {
          if (val >= 1000) return (val / 1000).toFixed(0) + ' k€'
          return val + ' €'
        },
      },
      grid: { color: '#f3f4f6' },
    },
    x: {
      stacked: true,
      grid: { display: false }
    },
  },
}
</script>
