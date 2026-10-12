<template>
  <div class="p-6 space-y-6">
    <!-- ── En-tête ── -->
    <div class="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">Audit du recouvrement</h1>
        <p class="text-sm text-gray-500 mt-1">
          Progression des impayés actifs dans les séquences de type « relances » :
          en attente → relance 1, 2, 3… → récalcitrant.
          Les séquences de suivi sont hors périmètre et comptées à part.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <span v-if="data" class="text-xs text-gray-400">
          Généré le {{ formatDateHeure(data.genereLe) }}
        </span>
        <UButton
          icon="i-heroicons-arrow-path"
          color="neutral"
          variant="soft"
          :loading="loading"
          @click="charger"
        >
          Rafraîchir
        </UButton>
      </div>
    </div>

    <!-- ── Erreur ── -->
    <UAlert
      v-if="erreur"
      color="error"
      variant="soft"
      icon="i-heroicons-exclamation-triangle"
      title="Erreur de chargement"
      :description="erreur"
    />

    <div v-if="loading && !data" class="text-center py-16 text-gray-400">Chargement…</div>

    <template v-if="data">
      <!-- ══ KPI ══ -->
      <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <UCard>
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Impayés en attente</p>
          <p class="mt-1 text-3xl font-semibold text-gray-900 tabular-nums">
            {{ data.totaux.actifs }}
          </p>
          <p class="text-xs text-gray-400 mt-1">
            {{ formatMontant(data.totaux.montantActif) }} de reste à payer
          </p>
        </UCard>

        <UCard>
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Avec email</p>
          <p class="mt-1 text-3xl font-semibold text-sky-600 tabular-nums">
            {{ data.totaux.avecEmail }}
          </p>
          <p class="text-xs text-gray-400 mt-1">
            {{ formatMontant(data.totaux.montantAvecEmail) }} ·
            {{ formatPct(pctActifs(data.totaux.avecEmail)) }} des actifs
          </p>
        </UCard>

        <UCard>
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">En séquence de relances</p>
          <p class="mt-1 text-3xl font-semibold text-sky-700 tabular-nums">
            {{ data.totaux.dansSequenceRelance }}
          </p>
          <p class="text-xs text-gray-400 mt-1">
            {{ formatMontant(data.totaux.montantDansSequenceRelance) }} · périmètre de l'audit
          </p>
        </UCard>

        <UCard>
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">En attente de relance</p>
          <p class="mt-1 text-3xl font-semibold text-amber-600 tabular-nums">
            {{ phaseByKey('en_attente')?.count ?? 0 }}
          </p>
          <p class="text-xs text-gray-400 mt-1">
            {{ formatMontant(phaseByKey('en_attente')?.montant ?? 0) }} ·
            {{ formatPct(phaseByKey('en_attente')?.pct) }} du périmètre
          </p>
        </UCard>

        <UCard>
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Séquence épuisée</p>
          <p class="mt-1 text-3xl font-semibold text-red-600 tabular-nums">
            {{ phaseByKey('recalcitrant')?.count ?? 0 }}
          </p>
          <p class="text-xs text-gray-400 mt-1">
            {{ formatMontant(phaseByKey('recalcitrant')?.montant ?? 0) }} de reste à payer
          </p>
        </UCard>

        <UCard>
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Hors périmètre</p>
          <p class="mt-1 text-3xl font-semibold text-gray-400 tabular-nums">
            {{ data.horsPerimetre.suivi + data.horsPerimetre.sansSequence }}
          </p>
          <p class="text-xs text-gray-400 mt-1">
            {{ data.horsPerimetre.suivi }} en séquence de suivi ·
            {{ data.horsPerimetre.sansSequence }} sans séquence
          </p>
        </UCard>
      </div>

      <!-- ══ Entonnoir ══ -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 class="text-base font-semibold text-gray-900">Entonnoir des relances</h2>
              <p class="text-xs text-gray-500 mt-0.5">
                Largeur de barre et chiffre blanc = population de l'étape.
                Chaque étape ne conserve que les impayés ayant passé la précédente.
                Le chiffre coloré = impayés dont c'est la <strong>dernière étape atteinte</strong>.
              </p>
            </div>
            <div class="text-xs text-gray-500">
              Base : {{ data.totaux.actifs }} impayés actifs
            </div>
          </div>
        </template>

        <div class="space-y-2">
          <div
            v-for="(stage, i) in entonnoir"
            :key="stage.key"
            class="flex items-center gap-3"
          >
            <!-- Libellé -->
            <div class="w-40 sm:w-52 shrink-0 text-right">
              <p class="text-sm font-medium text-gray-800 leading-tight">{{ stage.label }}</p>
              <p class="text-[11px] text-gray-400">{{ formatPct(stage.pct) }} des actifs</p>
              <UBadge
                v-if="stage.key === 'dans_sequence' && data.totaux.sequenceSansEmail"
                color="warning"
                variant="subtle"
                size="xs"
                class="mt-1"
              >
                dont {{ data.totaux.sequenceSansEmail }} sans email valide
              </UBadge>            </div>

            <!-- Barre de l'entonnoir -->
            <div class="flex-1 h-11 flex items-center justify-center relative">
              <div
                class="h-9 rounded-md transition-all duration-500 flex items-center justify-center min-w-[2rem]"
                :style="{
                  width: stage.barWidth + '%',
                  backgroundColor: stage.couleur,
                  clipPath: stage.clipPath,
                }"
              >
                <span class="text-xs font-semibold text-white tabular-nums drop-shadow">
                  {{ stage.count }}
                </span>
              </div>
            </div>

            <!-- Détail phase -->
            <div class="w-40 sm:w-48 shrink-0 text-sm tabular-nums">
              <template v-if="stage.exclusif !== null">
                <span class="font-semibold" :style="{ color: stage.couleur }">{{ stage.exclusif }}</span>
                <span class="text-gray-400 text-xs"> à cette étape</span>
                <p class="text-[11px] text-gray-400">{{ formatMontant(stage.exclusifMontant) }}</p>
              </template>
              <template v-else>
                <p class="text-gray-700">{{ formatMontant(stage.montant) }}</p>
                <p class="text-[11px] text-gray-400 leading-tight">
                  {{ stage.sousTitre || 'reste à payer' }}
                </p>
              </template>
            </div>
          </div>
        </div>
      </UCard>

      <!-- ══ Graphe : nombre par phase ══ -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <UCard>
          <template #header>
            <h2 class="text-base font-semibold text-gray-900">Nombre d'impayés par phase</h2>
            <p class="text-xs text-gray-500 mt-0.5">
              Dernière phase atteinte par chaque impayé actif (répartition exclusive).
            </p>
          </template>
          <div class="h-80">
            <Bar :data="barData" :options="barOptions" />
          </div>
        </UCard>

        <!-- ══ Tableau récapitulatif ══ -->
        <UCard :ui="{ body: { padding: 'p-0' } }">
          <template #header>
            <h2 class="text-base font-semibold text-gray-900">Répartition par phase</h2>
            <p class="text-xs text-gray-500 mt-0.5">
              « Ont atteint » = cumul des phases suivantes incluses.
              % calculé sur les {{ data.totaux.dansSequenceRelance }} impayés en séquence de relances.
            </p>
          </template>
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th class="text-left font-medium px-4 py-2">Phase</th>
                <th class="text-right font-medium px-3 py-2">À cette étape</th>
                <th class="text-right font-medium px-3 py-2">Ont atteint</th>
                <th class="text-right font-medium px-3 py-2">Montant</th>
                <th class="text-right font-medium px-4 py-2">%</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="p in data.phases" :key="p.key" class="hover:bg-gray-50">
                <td class="px-4 py-2">
                  <span class="inline-flex items-center gap-2">
                    <span
                      class="size-2.5 rounded-full shrink-0"
                      :style="{ backgroundColor: couleurPhase(p.key) }"
                    />
                    <span class="text-gray-800">{{ p.label }}</span>
                  </span>
                </td>
                <td class="px-3 py-2 text-right font-semibold tabular-nums text-gray-900">
                  {{ p.count }}
                </td>
                <td class="px-3 py-2 text-right tabular-nums text-gray-500">
                  {{ p.cumulatif }}
                </td>
                <td class="px-3 py-2 text-right tabular-nums text-gray-600">
                  {{ formatMontant(p.montant) }}
                </td>
                <td class="px-4 py-2 text-right tabular-nums text-gray-500">
                  {{ formatPct(p.pct) }}
                </td>
              </tr>
              <tr class="bg-gray-50/60">
                <td class="px-4 py-2 text-gray-500">Hors périmètre (séquence de suivi)</td>
                <td class="px-3 py-2 text-right tabular-nums text-gray-500">
                  {{ data.horsPerimetre.suivi }}
                </td>
                <td class="px-3 py-2 text-right text-gray-300">—</td>
                <td class="px-3 py-2 text-right tabular-nums text-gray-500">
                  {{ formatMontant(data.horsPerimetre.montantSuivi) }}
                </td>
                <td class="px-4 py-2 text-right text-gray-300">—</td>
              </tr>
              <tr class="bg-gray-50/60">
                <td class="px-4 py-2 text-gray-500">Hors périmètre (sans séquence)</td>
                <td class="px-3 py-2 text-right tabular-nums text-gray-500">
                  {{ data.sansSequence.count }}
                </td>
                <td class="px-3 py-2 text-right text-gray-300">—</td>
                <td class="px-3 py-2 text-right tabular-nums text-gray-500">
                  {{ formatMontant(data.sansSequence.montant) }}
                </td>
                <td class="px-4 py-2 text-right text-gray-300">—</td>
              </tr>
            </tbody>
            <tfoot class="border-t border-gray-200 bg-white">
              <tr class="font-semibold text-gray-900">
                <td class="px-4 py-2">Total actifs</td>
                <td class="px-3 py-2 text-right tabular-nums">
                  {{ data.totaux.actifs }}
                </td>
                <td class="px-3 py-2 text-right tabular-nums text-gray-400">
                  {{ data.totaux.dansSequenceRelance }}
                </td>
                <td class="px-3 py-2 text-right tabular-nums">
                  {{ formatMontant(data.totaux.montantActif) }}
                </td>
                <td class="px-4 py-2 text-right">100 %</td>
              </tr>
            </tfoot>
          </table>
        </UCard>
      </div>

      <!-- ══ Détail par séquence ══ -->
      <UCard>
        <template #header>
          <h2 class="text-base font-semibold text-gray-900">Détail par séquence</h2>
          <p class="text-xs text-gray-500 mt-0.5">
            Répartition des impayés actifs pour chaque séquence de type « relances ».
          </p>
        </template>

        <div class="space-y-6">
          <div v-for="seq in data.sequences" :key="seq.id">
            <div class="flex items-center justify-between gap-3 flex-wrap mb-2">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-queue-list" class="size-4 text-sky-600" />
                <span class="font-medium text-gray-800">{{ seq.nom }}</span>
                <UBadge color="neutral" variant="subtle" size="xs">
                  {{ seq.maxIndex }} étape{{ seq.maxIndex > 1 ? 's' : '' }}
                </UBadge>
              </div>
              <div class="text-xs text-gray-500">
                {{ seq.actifs }} impayés actifs · {{ formatMontant(seq.montant) }}
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="p in seq.phases"
                :key="p.key"
                class="flex-1 min-w-[110px] rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2"
              >
                <p class="text-[11px] text-gray-500 truncate">{{ p.label }}</p>
                <p class="text-lg font-semibold tabular-nums" :style="{ color: couleurPhase(p.key) }">
                  {{ p.count }}
                </p>
                <p class="text-[11px] text-gray-400 tabular-nums">{{ formatMontant(p.montant) }}</p>
              </div>
            </div>
          </div>

          <p v-if="!data.sequences.length" class="text-sm text-gray-400">
            Aucune séquence associée aux impayés actifs.
          </p>
        </div>
      </UCard>

      <!-- ══ Contexte ══ -->
      <p class="text-xs text-gray-400">
        {{ data.totaux.impayesTotal }} impayés au total (dont {{ data.totaux.soldes }} soldés) ·
        {{ data.relances.total }} relances en base ({{ data.relances.envoyees }} envoyées) ·
        {{ data.maxIndex }} étapes maximum par séquence ·
        audit limité aux séquences de type « relances » ({{ data.totaux.dansSequenceSuivi }} impayés en séquence de suivi exclus).
      </p>
    </template>
  </div>
</template>

<script setup>
import { Bar } from 'vue-chartjs'

const { $parse } = useNuxtApp()

// ── État ──
const loading = ref(false)
const erreur = ref(null)
const data = ref(null)

// ── Couleurs par phase ──
const COULEURS = {
  actifs: '#64748b',
  avec_email: '#0ea5e9',
  dans_sequence: '#0284c7',
  en_attente: '#f59e0b',
  recalcitrant: '#dc2626',
}

function couleurPhase(key) {
  if (COULEURS[key]) return COULEURS[key]
  if (key === 'sans_sequence') return '#9ca3af'
  const k = Number(String(key).replace('relance_', '')) || 0
  // Dégradé de bleus de plus en plus soutenu selon l'avancement
  const palette = ['#38bdf8', '#0ea5e9', '#0284c7', '#0369a1', '#075985', '#0c4a6e']
  return palette[Math.min(Math.max(k - 1, 0), palette.length - 1)]
}

// ── Entonnoir ──
const entonnoir = computed(() => {
  const stages = data.value?.funnel || []
  if (!stages.length) return []
  const base = stages[0].count || 1

  return stages.map((stage, i) => {
    const width = (stage.count / base) * 100
    const next = stages[i + 1]
    const nextWidth = next ? (next.count / base) * 100 : width * 0.45

    // Trapèze : bord haut = population de cette étape, bord bas = population de
    // l'étape suivante (l'entonnoir se resserre vers le bas).
    const insetBas =
      width > 0 ? Math.max(0, (width - nextWidth) / 2 / width) * 100 : 0
    const clipPath = `polygon(0% 0, 100% 0, ${100 - insetBas}% 100%, ${insetBas}% 100%)`

    return {
      ...stage,
      couleur: couleurPhase(stage.key),
      barWidth: width,
      clipPath,
    }
  })
})

// ── Graphe Chart.js ──
const barData = computed(() => ({
  labels: (data.value?.phases || []).map((p) => p.label),
  datasets: [
    {
      label: "Impayés à cette étape",
      data: (data.value?.phases || []).map((p) => p.count),
      backgroundColor: (data.value?.phases || []).map((p) => couleurPhase(p.key)),
      borderRadius: 5,
      maxBarThickness: 26,
    },
  ],
}))

const barOptions = {
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label(ctx) {
          const p = data.value?.phases?.[ctx.dataIndex]
          if (!p) return ` ${ctx.parsed.x} impayé(s)`
          return [
            ` ${p.count} impayé(s) à cette étape`,
            ` ${p.cumulatif} ont atteint cette étape`,
            ` ${formatMontant(p.montant)}`,
          ]
        },
      },
    },
  },
  scales: {
    x: {
      beginAtZero: true,
      ticks: { stepSize: 1, precision: 0 },
      grid: { color: '#f3f4f6' },
    },
    y: {
      grid: { display: false },
      ticks: { font: { size: 11 } },
    },
  },
}

// ── Chargement ──
async function charger() {
  loading.value = true
  erreur.value = null
  try {
    data.value = await $parse.Cloud.run('getAuditPhases')
  } catch (err) {
    erreur.value = err?.message || 'Impossible de charger les données d\'audit'
  } finally {
    loading.value = false
  }
}

// ── Helpers ──
function phaseByKey(key) {
  return data.value?.phases?.find((p) => p.key === key) || null
}

function pctActifs(val) {
  const total = data.value?.totaux?.actifs || 0
  return total > 0 ? (val / total) * 100 : 0
}

function formatMontant(val) {
  if (val == null) return '—'
  return Number(val).toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  })
}

function formatPct(val) {
  if (val == null || isNaN(val)) return '—'
  return `${Number(val).toFixed(1)} %`
}

function formatDateHeure(val) {
  if (!val) return '—'
  const d = new Date(val)
  if (isNaN(d)) return '—'
  return d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
}

onMounted(charger)
</script>
