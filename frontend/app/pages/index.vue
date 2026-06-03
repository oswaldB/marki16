<template>
  <div class="p-6 space-y-6">

    <!-- ── Header ── -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p class="text-sm text-gray-500 mt-1">Vue d'ensemble de l'activité</p>
      </div>
      <!-- Bouton Synchroniser -->
      <SyncButton @success="onMounted" />
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-400">Chargement…</div>

    <template v-else>
      <!-- ── KPI Cards ── -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">

        <UCard>
          <div class="flex items-start gap-3">
            <div class="p-2 rounded-lg bg-purple-50">
              <UIcon name="i-heroicons-document-duplicate" class="size-5 text-purple-500" />
            </div>
            <div>
              <div class="flex items-center gap-1">
                <p class="text-xs text-gray-500 font-medium">Factures en attente</p>
                <UTooltip text="Nombre de factures uniques (nfacture) avec un reste à payer > 0">
                  <UIcon name="i-heroicons-information-circle" class="size-3.5 text-gray-400" />
                </UTooltip>
              </div>
              <p class="text-2xl font-bold text-gray-900 mt-0.5">{{ kpi.factures_en_attente }}</p>
              <p class="text-xs text-gray-400">reste à payer > 0</p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-start gap-3">
            <div class="p-2 rounded-lg bg-orange-50">
              <UIcon name="i-heroicons-document-text" class="size-5 text-orange-500" />
            </div>
            <div>
              <div class="flex items-center gap-1">
                <p class="text-xs text-gray-500 font-medium">Impayés actifs</p>
                <UTooltip text="Nombre de factures uniques (nfacture) avec un reste à payer > 0 et échéance dépassée">
                  <UIcon name="i-heroicons-information-circle" class="size-3.5 text-gray-400" />
                </UTooltip>
              </div>
              <p class="text-2xl font-bold text-gray-900 mt-0.5">{{ kpi.impayes_actifs }}</p>
              <p class="text-xs text-gray-400">échéance dépassée, non payé</p>
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
                <UTooltip text="Somme du 'reste à payer' par facture unique (nfacture) avec reste > 0 et échéance dépassée">
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
                <UTooltip text="Pourcentage de factures uniques avec échéance dépassée et reste = 0 par rapport au total de factures uniques avec échéance dépassée">
                  <UIcon name="i-heroicons-information-circle" class="size-3.5 text-gray-400" />
                </UTooltip>
              </div>
              <p class="text-2xl font-bold text-gray-900 mt-0.5">{{ kpi.taux_recouvrement }}%</p>
              <p class="text-xs text-gray-400">des échus payés (12 mois)</p>
            </div>
          </div>
        </UCard>

      </div>

      <!-- ── Ancienneté des impayés ── -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">

        <UCard>
          <div class="flex items-start gap-3">
            <div class="p-2 rounded-lg bg-sky-50">
              <UIcon name="i-heroicons-clock" class="size-5 text-sky-500" />
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-1">
                <p class="text-xs text-gray-500 font-medium">Moins de 7 jours</p>
                <UTooltip text="Factures uniques (nfacture) avec reste > 0 et échéance dépassée de moins de 7 jours">
                  <UIcon name="i-heroicons-information-circle" class="size-3.5 text-gray-400" />
                </UTooltip>
              </div>
              <p class="text-2xl font-bold text-gray-900 mt-0.5">{{ aging.j7.count }}</p>
              <p class="text-xs text-gray-400">{{ formatMontantCourt(aging.j7.montant) }}</p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-start gap-3">
            <div class="p-2 rounded-lg bg-yellow-50">
              <UIcon name="i-heroicons-clock" class="size-5 text-yellow-500" />
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-1">
                <p class="text-xs text-gray-500 font-medium">8 à 30 jours</p>
                <UTooltip text="Factures uniques (nfacture) avec reste > 0 et échéance dépassée de 8 à 30 jours">
                  <UIcon name="i-heroicons-information-circle" class="size-3.5 text-gray-400" />
                </UTooltip>
              </div>
              <p class="text-2xl font-bold text-gray-900 mt-0.5">{{ aging.j30.count }}</p>
              <p class="text-xs text-gray-400">{{ formatMontantCourt(aging.j30.montant) }}</p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-start gap-3">
            <div class="p-2 rounded-lg bg-orange-50">
              <UIcon name="i-heroicons-clock" class="size-5 text-orange-500" />
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-1">
                <p class="text-xs text-gray-500 font-medium">31 à 60 jours</p>
                <UTooltip text="Factures uniques (nfacture) avec reste > 0 et échéance dépassée de 31 à 60 jours">
                  <UIcon name="i-heroicons-information-circle" class="size-3.5 text-gray-400" />
                </UTooltip>
              </div>
              <p class="text-2xl font-bold text-gray-900 mt-0.5">{{ aging.j60.count }}</p>
              <p class="text-xs text-gray-400">{{ formatMontantCourt(aging.j60.montant) }}</p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-start gap-3">
            <div class="p-2 rounded-lg bg-violet-50">
              <UIcon name="i-heroicons-clock" class="size-5 text-violet-500" />
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-1">
                <p class="text-xs text-gray-500 font-medium">60 à 120 jours</p>
                <UTooltip text="Factures uniques (nfacture) avec reste > 0 et échéance dépassée de 60 à 120 jours">
                  <UIcon name="i-heroicons-information-circle" class="size-3.5 text-gray-400" />
                </UTooltip>
              </div>
              <p class="text-2xl font-bold text-gray-900 mt-0.5">{{ aging.j60_120.count }}</p>
              <p class="text-xs text-gray-400">{{ formatMontantCourt(aging.j60_120.montant) }}</p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-start gap-3">
            <div class="p-2 rounded-lg bg-red-50">
              <UIcon name="i-heroicons-exclamation-triangle" class="size-5 text-red-500" />
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-1">
                <p class="text-xs text-gray-500 font-medium">Plus de 120 jours</p>
                <UTooltip text="Factures uniques (nfacture) avec reste > 0 et échéance dépassée de plus de 120 jours">
                  <UIcon name="i-heroicons-information-circle" class="size-3.5 text-gray-400" />
                </UTooltip>
              </div>
              <p class="text-2xl font-bold text-gray-900 mt-0.5">{{ aging.j120.count }}</p>
              <p class="text-xs text-gray-400">{{ formatMontantCourt(aging.j120.montant) }}</p>
            </div>
          </div>
        </UCard>

      </div>

      <!-- ── Graphiques ── -->
      <div class="grid grid-cols-1 gap-4">

        <!-- Bar mois (pleine largeur) -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-1.5">
              <p class="text-sm font-semibold text-gray-700">Montant facturé vs reste à payer par mois (12 mois + avant)</p>
              <UTooltip text="Montant payé (vert) = somme TTC des factures uniques avec reste=0. Reste à payer (orange) = somme des restes > 0. Ligne = nb factures impayées (reste > 0)">
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
                <p class="text-sm font-medium text-gray-900 truncate">{{ contact.nom }} {{ contact.prenom }}</p>
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
              <NuxtLink to="/impayes/2" class="text-xs text-sky-600 hover:underline">Voir tout →</NuxtLink>
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
import { Bar } from 'vue-chartjs'

const { $parse } = useNuxtApp()

// ── State ──────────────────────────────────────────────────────
const loading = ref(true)

const kpi = ref({
  factures_en_attente: 0,
  impayes_actifs:    0,
  montant_total:     0,
  relances_jour:     0,
  taux_recouvrement: 0,
})

const montantsMois = ref({
  ttc:    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  reste:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  count:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
})
const aging = ref({
  j7:   { count: 0, montant: 0 },
  j30:  { count: 0, montant: 0 },
  j60:  { count: 0, montant: 0 },
  j120: { count: 0, montant: 0 },
  j60_120: { count: 0, montant: 0 },
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
      chargerAging(),
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
  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

  // Filtre : date_echeance < today (échéance dépassée)
  const qEchus = new $parse.Query('Impaye')
    .lessThan('date_echeance', today)
    .select('nfacture')
    .limit(10000)

  const qEchusPayes = new $parse.Query('Impaye')
    .lessThan('date_echeance', today)
    .equalTo('reste_a_payer', 0)
    .select('nfacture')
    .limit(10000)

  // Compter nfacture uniques avec reste_a_payer > 0 (toutes factures en attente)
  const qEnAttente = new $parse.Query('Impaye')
    .greaterThan('reste_a_payer', 0)
    .select('nfacture')
    .limit(10000)
  const enAttenteResult = await qEnAttente.find()
  const en_attente = [...new Set(enAttenteResult.map(i => i.get('nfacture')))].length

  // Compter nfacture uniques avec reste_a_payer > 0 et échéance dépassée
  const qEchusActifs = new $parse.Query('Impaye')
    .lessThan('date_echeance', today)
    .greaterThan('reste_a_payer', 0)
    .select('nfacture')
    .limit(10000)
  const actifsResult = await qEchusActifs.find()
  const actifs = [...new Set(actifsResult.map(i => i.get('nfacture')))].length

  const [echusResults, payeResults, relances] = await Promise.all([
    qEchus.find(),
    qEchusPayes.find(),
    new $parse.Query('Relance')
      .equalTo('statut', 'pending')
      .lessThanOrEqualTo('dateEnvoi', today)
      .count(),
  ])

  // Compter nfacture uniques
  const total_echus = [...new Set(echusResults.map(i => i.get('nfacture')))].length
  const paye_count = [...new Set(payeResults.map(i => i.get('nfacture')))].length

  // Montant total impayé (somme des restes à payer > 0 avec échéance dépassée, par nfacture unique)
  const qMontant = new $parse.Query('Impaye')
  qMontant.lessThan('date_echeance', today)
  qMontant.greaterThan('reste_a_payer', 0)
  qMontant.select('nfacture', 'reste_a_payer')
  qMontant.limit(10000)
  const impayes_actifs = await qMontant.find()
  // Grouper par nfacture et prendre le premier reste_a_payer
  const nfactureMap = new Map()
  for (const item of impayes_actifs) {
    const nfact = item.get('nfacture')
    if (nfact && !nfactureMap.has(nfact)) {
      nfactureMap.set(nfact, item.get('reste_a_payer') || 0)
    }
  }
  const montant = [...nfactureMap.values()].reduce((s, v) => s + v, 0)

  kpi.value = {
    factures_en_attente: en_attente,
    impayes_actifs:    actifs,
    montant_total:     montant,
    relances_jour:     relances,
    taux_recouvrement: total_echus > 0 ? Math.round((paye_count / total_echus) * 100) : 0,
  }
}

async function chargerAging() {
  const now = new Date()
  const today = endOfDay()
  const daysAgo = (n) => { const d = new Date(now); d.setDate(d.getDate() - n); d.setHours(23, 59, 59, 999); return d }

  const cutoff7   = daysAgo(7)
  const cutoff30  = daysAgo(30)
  const cutoff60  = daysAgo(60)
  const cutoff120 = daysAgo(120)

  const q = new $parse.Query('Impaye')
  q.lessThan('date_echeance', today)
  q.greaterThan('reste_a_payer', 0)
  q.select('nfacture', 'date_echeance', 'reste_a_payer')
  q.limit(2000)
  const items = await q.find()

  // Maps pour chaque bucket : nfacture -> reste_a_payer (premier trouvé)
  const j7Map = new Map()
  const j30Map = new Map()
  const j60Map = new Map()
  const j60_120Map = new Map()
  const j120Map = new Map()

  for (const item of items) {
    const nfact = item.get('nfacture')
    const de = item.get('date_echeance')
    const rap = item.get('reste_a_payer') || 0
    if (!de || !nfact) continue

    if (de >= cutoff7) {
      if (!j7Map.has(nfact)) j7Map.set(nfact, rap)
    } else if (de >= cutoff30) {
      if (!j30Map.has(nfact)) j30Map.set(nfact, rap)
    } else if (de >= cutoff60) {
      if (!j60Map.has(nfact)) j60Map.set(nfact, rap)
    } else if (de >= cutoff120) {
      if (!j60_120Map.has(nfact)) j60_120Map.set(nfact, rap)
    } else {
      if (!j120Map.has(nfact)) j120Map.set(nfact, rap)
    }
  }

  aging.value = {
    j7:   { count: j7Map.size,   montant: [...j7Map.values()].reduce((s, v) => s + v, 0) },
    j30:  { count: j30Map.size,  montant: [...j30Map.values()].reduce((s, v) => s + v, 0) },
    j60:  { count: j60Map.size,  montant: [...j60Map.values()].reduce((s, v) => s + v, 0) },
    j60_120: { count: j60_120Map.size, montant: [...j60_120Map.values()].reduce((s, v) => s + v, 0) },
    j120: { count: j120Map.size, montant: [...j120Map.values()].reduce((s, v) => s + v, 0) },
  }
}

async function chargerMontantsMois() {
  const montantsTTC   = []
  const montantsPaye  = []
  const montantsReste = []
  const montantsCount = []

  // Calcul pour 12 mois + colonne "avant" + mois courant
  // i=13 → "Avant" (toutes les factures avant les 12 derniers mois)
  // i=12 → mois-12, ..., i=0 → mois courant

  // Helper pour traiter une période
  async function getMontantsForPeriode(debut, fin, pourAvant = false) {
    const q = new $parse.Query('Impaye')
    if (debut) {
      q.greaterThanOrEqualTo('date_echeance', debut)
    }
    if (fin) {
      q.lessThanOrEqualTo('date_echeance', fin)
    }
    if (pourAvant) {
      q.greaterThan('reste_a_payer', 0)
    }
    q.select('nfacture', 'total_ttc', 'reste_a_payer')
    q.limit(2000)
    const items = await q.find()

    const nfactureMap = new Map()
    for (const item of items) {
      const nfact = item.get('nfacture')
      if (nfact && !nfactureMap.has(nfact)) {
        nfactureMap.set(nfact, {
          ttc: item.get('total_ttc') || 0,
          reste: item.get('reste_a_payer') || 0
        })
      }
    }

    const values = [...nfactureMap.values()]
    return {
      ttc: values.reduce((s, v) => s + v.ttc, 0),
      paye: pourAvant ? 0 : values.filter(v => v.reste === 0).reduce((s, v) => s + v.ttc, 0),
      reste: values.filter(v => v.reste > 0).reduce((s, v) => s + v.reste, 0),
      count: values.filter(v => v.reste > 0).length
    }
  }

  // Calcul pour la colonne "Avant" (factures uniques avec reste > 0 avant les 12 derniers mois)
  const debut12Mois = new Date()
  debut12Mois.setDate(1)
  debut12Mois.setMonth(debut12Mois.getMonth() - 12)
  debut12Mois.setHours(0, 0, 0, 0)

  const avant = await getMontantsForPeriode(null, debut12Mois, true)
  montantsTTC.push(avant.ttc)
  montantsPaye.push(avant.paye)
  montantsReste.push(avant.reste)
  montantsCount.push(avant.count)

  // Calcul pour les 12 mois + mois courant
  for (let i = 12; i >= 0; i--) {
    const debut = new Date()
    debut.setDate(1)
    debut.setMonth(debut.getMonth() - i)
    debut.setHours(0, 0, 0, 0)

    const fin = new Date(debut)
    fin.setMonth(fin.getMonth() + 1)
    fin.setDate(0)
    fin.setHours(23, 59, 59, 999)

    const mois = await getMontantsForPeriode(debut, fin)
    montantsTTC.push(mois.ttc)
    montantsPaye.push(mois.paye)
    montantsReste.push(mois.reste)
    montantsCount.push(mois.count)
  }

  montantsMois.value = {
    ttc:   montantsTTC,
    paye:  montantsPaye,
    reste: montantsReste,
    count: montantsCount,
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
  q.equalTo('facture_soldee', false)
  q.greaterThan('reste_a_payer', 0)
  q.limit(5)
  const results = await q.find()
  impayes_recents.value = results.map(r => ({
    id:           r.id,
    nfacture:     r.get('nfacture') || '—',
    payeur_nom:   r.get('payeur_nom') || '—',
    reste_a_payer: r.get('reste_a_payer'),
  }))
}

async function chargerRelancesAValider() {
  if (!$parse.User.current()) return
  const q = new $parse.Query('Relance')
  q.equalTo('valide', false)
  q.notEqualTo('manuel', true)
  q.include('contact')
  q.include('sequence')
  q.ascending('dateEnvoi')
  q.limit(5)
  const results = await q.find()

  relancesAValider.value = await Promise.all(
    results.map(async (r) => {
      const impayesIds = r.get('impayes') || []
      const impayes = []

      if (impayesIds.length > 0) {
        const impayeQuery = new $parse.Query('Impaye')
        impayeQuery.containedIn('objectId', impayesIds)
        const impayeResults = await impayeQuery.find()
        impayes.push(...impayeResults)
      }

      const seq = r.get('sequence')
      const contact = r.get('contact')
      const d = r.get('dateEnvoi') || r.get('date_envoi_prevue')
      return {
        id:           r.id,
        payeur_nom:   impayes[0] ? impayes[0].get('payeur_nom') || '—' : '—',
        nfacture:     impayes[0] ? impayes[0].get('nfacture') || '—' : '—',
        sequence_nom: seq ? seq.get('nom') || '—' : '—',
        heure:        d ? d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—',
        date:         d ? d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : '—',
        numero:       r.get('numero') || '—',
      }
    })
  )
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

function labelsMois() {
  const mois = []
  // 14 éléments : "Avant" + 13 mois (incluant le mois courant)
  for (let i = 13; i >= 0; i--) {
    if (i === 13) {
      mois.push('Avant')
    } else {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      mois.push(d.toLocaleDateString('fr-FR', { month: 'short' }))
    }
  }
  return mois
}

// ── Chart data ─────────────────────────────────────────────────
const barData = computed(() => {
  const data = {
    labels: labelsMois(),
    datasets: [
      {
        label: 'Reste à payer',
        data: montantsMois.value.reste,
        backgroundColor: '#fb923c',
        borderRadius: 4,
        yAxisID: 'y',
        order: 2,
      },
      {
        label: 'Montant payé',
        data: montantsMois.value.paye,
        backgroundColor: '#22c55e',
        borderRadius: 4,
        yAxisID: 'y',
        order: 2,
      },
      {
        type: 'line',
        label: 'Nb factures impayées',
        data: montantsMois.value.count,
        borderColor: '#6366f1',
        backgroundColor: '#6366f1',
        pointBackgroundColor: '#6366f1',
        pointRadius: 4,
        borderWidth: 2,
        tension: 0.3,
        yAxisID: 'y1',
        order: 1,
      },
    ],
  }

  console.log('Données du graphique:', data)
  return data
})

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
    },
    tooltip: {
      callbacks: {
        label(ctx) {
          if (ctx.dataset.yAxisID === 'y1') {
            return ` ${ctx.parsed.y} facture${ctx.parsed.y > 1 ? 's' : ''} impayée${ctx.parsed.y > 1 ? 's' : ''}`
          }
          const val = ctx.parsed.y
          if (val >= 1000) return ` ${ctx.dataset.label} : ${(val / 1000).toFixed(1)} k€`
          return ` ${ctx.dataset.label} : ${val.toLocaleString('fr-FR')} €`
        }
      }
    }
  },
  scales: {
    y: {
      stacked: true,
      position: 'left',
      ticks: {
        callback: (val) => {
          if (val >= 1000) return (val / 1000).toFixed(0) + ' k€'
          return val + ' €'
        },
      },
      grid: { color: '#f3f4f6' },
    },
    y1: {
      position: 'right',
      beginAtZero: true,
      ticks: {
        stepSize: 1,
        callback: (val) => val + ' fa.',
      },
      grid: { drawOnChartArea: false },
    },
    x: {
      stacked: true,
      grid: { display: false }
    },
  },
}
</script>
