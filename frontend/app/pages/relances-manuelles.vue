<template>
  <div class="p-4 md:p-6">
    <!-- ── Header ── -->
    <div class="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">Relances manuelles</h1>
        <p class="text-sm text-gray-500">
          Sélectionnez les contacts (payeurs / apporteurs d'affaires) à gauche, puis éditez,
          planifiez et envoyez les emails de suivi à droite.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          color="neutral"
          variant="outline"
          icon="i-heroicons-arrow-path"
          :loading="loading"
          @click="chargerImpayes"
        >
          Recharger
        </UButton>
      </div>
    </div>

    <!-- ── Coupure verticale : contacts (gauche) / emails (droite) ── -->
    <div class="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

      <!-- ═══ PANNEAU GAUCHE : sélection des contacts ═══ -->
      <section class="flex flex-col gap-3 min-w-0">
        <!-- Barre de filtres : toujours en haut de la colonne de gauche -->
        <div class="flex items-center gap-2">
          <UInput
            v-model="search"
            icon="i-heroicons-magnifying-glass"
            placeholder="Contact, email, n° facture, adresse…"
            class="flex-1 min-w-0"
          />
          <USelect
            v-model="smtpProfilId"
            :items="smtpOptions"
            placeholder="Profil SMTP"
            class="w-44 shrink-0"
          />
          <UButton
            color="neutral"
            :variant="showFiltres ? 'soft' : 'outline'"
            icon="i-heroicons-funnel"
            class="shrink-0"
            :title="showFiltres ? 'Masquer les filtres avancés' : 'Afficher les filtres avancés'"
            @click="showFiltres = !showFiltres"
          >
            Filtres
            <UBadge v-if="nbFiltresActifs" color="primary" variant="solid" size="xs" class="ml-1">
              {{ nbFiltresActifs }}
            </UBadge>
          </UButton>
        </div>

        <!-- Filtres avancés (repliables) -->
        <UCard v-if="showFiltres" :ui="{ body: { padding: 'p-3' } }">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-gray-500 mb-1 block">Destinataire</label>
              <USelect v-model="filtreRole" :items="roleOptions" class="w-full" />
            </div>

            <div>
              <label class="text-xs text-gray-500 mb-1 block">Séquence</label>
              <USelect v-model="filtreSequence" :items="sequenceOptions" class="w-full" />
            </div>

            <div>
              <label class="text-xs text-gray-500 mb-1 block">Statut dossier</label>
              <USelect v-model="filtreStatutDossier" :items="statutDossierOptions" class="w-full" />
            </div>

            <div>
              <label class="text-xs text-gray-500 mb-1 block">Retard minimum (jours)</label>
              <UInput v-model="retardMin" type="number" placeholder="0" class="w-full" />
            </div>

            <div>
              <label class="text-xs text-gray-500 mb-1 block">Reste à payer min (€)</label>
              <UInput v-model="rapMin" type="number" placeholder="0" class="w-full" />
            </div>

            <div>
              <label class="text-xs text-gray-500 mb-1 block">Reste à payer max (€)</label>
              <UInput v-model="rapMax" type="number" placeholder="∞" class="w-full" />
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 pt-3 border-t border-gray-100">
            <UCheckbox v-model="includeBlacklist" label="Blacklistés" />
            <UCheckbox v-model="includeSuspendus" label="Suspendus" />
            <UCheckbox v-model="includeSansEmail" label="Sans email" />
            <UButton color="neutral" variant="ghost" size="sm" icon="i-heroicons-x-mark" class="ml-auto" @click="reinitialiser">
              Réinitialiser
            </UButton>
          </div>
        </UCard>

        <UAlert
          v-if="!smtpProfilId"
          color="warning"
          variant="subtle"
          icon="i-heroicons-exclamation-triangle"
          title="Aucun profil SMTP sélectionné"
          description="Choisissez un profil SMTP en haut du panneau pour pouvoir générer les emails."
        />

        <!-- Barre de sélection + génération -->
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div class="flex items-center gap-2 flex-wrap">
            <UButton color="neutral" variant="outline" size="sm" @click="toutSelectionner">
              Tout sélectionner
            </UButton>
            <UButton v-if="selectedKeys.length" color="neutral" variant="ghost" size="sm" @click="deselectionner">
              Aucun
            </UButton>
            <span class="text-sm text-gray-500">
              {{ groupes.length }} groupe(s) · <strong>{{ selectedKeys.length }}</strong> sélectionné(s)
              <template v-if="selectedKeys.length"> — {{ formatMontant(totalSelection) }}</template>
            </span>
          </div>
          <UButton
            icon="i-heroicons-sparkles"
            color="primary"
            :loading="generant"
            :disabled="selectedKeys.length === 0 || !smtpProfilId"
            @click="generer"
          >
            Générer les emails
          </UButton>
        </div>

        <!-- Tableau des groupes (contacts) -->
        <div v-if="loading" class="text-center py-12 text-gray-400">Chargement…</div>
        <div v-else class="max-h-[60vh] overflow-auto rounded-lg border border-gray-200 bg-white">
          <UTable
            :data="groupes"
            :columns="colonnes"
            :ui="{ thead: 'sticky top-0 z-10 bg-white', td: 'py-2' }"
            :empty-state="{ icon: 'i-heroicons-inbox', label: 'Aucun impayé ne correspond aux filtres' }"
          >
            <template #select-cell="{ row }">
              <input
                type="checkbox"
                class="rounded"
                :checked="isSelected(row.original)"
                @change="toggleSelection(row.original)"
              />
            </template>

            <template #contactNom-cell="{ row }">
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <p class="font-medium text-gray-900 truncate">{{ row.original.contactNom }}</p>
                  <UBadge :color="row.original.role === 'apporteur' ? 'purple' : 'sky'" variant="subtle" size="xs">
                    {{ row.original.role === 'apporteur' ? 'Apporteur' : 'Payeur' }}
                  </UBadge>
                </div>
                <p class="text-xs text-gray-500 truncate">{{ row.original.contact.email || '—' }}</p>
              </div>
            </template>

            <template #nbFactures-cell="{ row }">
              <div class="text-sm leading-tight">
                <p>{{ row.original.nbFactures }} facture(s)</p>
                <p
                  class="text-xs"
                  :class="row.original.retardMax > 30 ? 'text-red-600' : row.original.retardMax > 7 ? 'text-orange-500' : 'text-gray-400'"
                >
                  {{ row.original.retardMax }}j de retard
                </p>
              </div>
            </template>

            <template #totalRap-cell="{ row }">
              <span class="text-sm font-medium whitespace-nowrap">{{ formatMontant(row.original.totalRap) }}</span>
            </template>

            <template #actions-cell="{ row }">
              <UButton
                icon="i-heroicons-document-text"
                color="neutral"
                variant="ghost"
                size="xs"
                title="Voir les factures"
                @click="ouvrirFactures(row.original)"
              />
            </template>
          </UTable>
        </div>
      </section>

      <!-- ═══ PANNEAU DROITE : emails de suivi générés ═══ -->
      <section class="flex flex-col gap-3 min-w-0">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <h2 class="text-base font-semibold text-gray-900">
            Emails de suivi générés
            <span class="text-sm font-normal text-gray-500">({{ file.length }})</span>
          </h2>
          <USelect v-model="filtreFileStatut" :items="fileStatutOptions" class="w-36" @change="chargerFile" />
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <UInput v-model="datePlanification" type="date" size="sm" class="w-40" />
          <UButton
            color="neutral"
            variant="outline"
            size="sm"
            icon="i-heroicons-calendar-days"
            :loading="planifGroupe"
            :disabled="!datePlanification"
            @click="planifierTous"
          >
            Tout planifier
          </UButton>
          <UButton
            size="sm"
            icon="i-heroicons-paper-airplane"
            :loading="envoiGroupe"
            @click="envoyerTous"
          >
            Tout envoyer
          </UButton>
        </div>

        <!-- File des emails générés -->
        <div v-if="fileLoading" class="text-center py-8 text-gray-400">Chargement…</div>
        <div v-else class="max-h-[60vh] overflow-auto rounded-lg border border-gray-200 bg-white">
          <UTable
            :data="file"
            :columns="fileColonnes"
            :ui="{ thead: 'sticky top-0 z-10 bg-white', td: 'py-2' }"
            :empty-state="{ icon: 'i-heroicons-envelope', label: 'Aucun email de suivi manuel' }"
          >
            <template #statut-cell="{ row }">
              <UBadge :color="statutColor(row.original.statut)" variant="subtle" size="xs">
                {{ statutLabel(row.original.statut) }}
              </UBadge>
            </template>

            <template #destinataire-cell="{ row }">
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ row.original.contactNom || '—' }}</p>
                <p class="text-xs text-gray-500 truncate">
                  {{ row.original.email || '—' }} · {{ row.original.impayes.length }} facture(s)
                </p>
                <p class="text-xs text-gray-400 truncate">{{ row.original.objet || '(sans objet)' }}</p>
              </div>
            </template>

            <template #dateEnvoi-cell="{ row }">
              <span class="text-sm tabular-nums whitespace-nowrap">{{ formatDate(row.original.dateEnvoi) }}</span>
            </template>

            <template #fileActions-cell="{ row }">
              <div class="flex items-center gap-1">
                <UButton
                  :icon="estEnvoyee(row.original) ? 'i-heroicons-eye' : 'i-heroicons-pencil-square'"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  :title="estEnvoyee(row.original) ? 'Voir' : 'Éditer / prévoir / envoyer'"
                  @click="ouvrirSuivi(row.original)"
                />
                <UButton
                  v-if="!estEnvoyee(row.original)"
                  icon="i-heroicons-trash"
                  color="red"
                  variant="ghost"
                  size="xs"
                  title="Supprimer cette relance non envoyée"
                  @click="demanderSuppression(row.original)"
                />
              </div>
            </template>
          </UTable>
        </div>
      </section>
    </div>

    <!-- ── Slideover factures d'un groupe ── -->
    <USlideover v-model:open="showFactures" side="right" :ui="{ content: 'w-full md:w-1/3 max-w-none' }">
      <template #header>
        <span class="font-semibold">Factures — {{ groupeFactures?.contactNom }}</span>
      </template>
      <template #body>
        <div v-if="groupeFactures" class="space-y-2">
          <div
            v-for="imp in groupeFactures.impayes"
            :key="imp.id"
            class="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2"
          >
            <div class="min-w-0">
              <NuxtLink :to="`/impayes/${imp.id}`" class="font-mono text-sm text-sky-700 hover:underline">
                {{ imp.nfacture }}
              </NuxtLink>
              <p class="text-xs text-gray-500 truncate">{{ imp.adresse_bien || '—' }}</p>
            </div>
            <div class="text-right shrink-0 ml-3">
              <p class="text-sm font-medium">{{ formatMontant(imp.reste_a_payer) }}</p>
              <p class="text-xs text-gray-400">{{ imp.retard }}j</p>
            </div>
          </div>
        </div>
      </template>
    </USlideover>

    <!-- ── Slideover édition suivi ── -->
    <RelancesManuellesSuiviDrawer
      v-model:open="showSuiviDrawer"
      :suivi="suiviSelectionne"
      @saved="chargerFile"
      @sent="chargerFile"
    />

    <!-- ── Confirmation suppression d'une relance non envoyée ── -->
    <UModal v-model:open="showSupprModal" title="Supprimer la relance">
      <template #body>
        <div class="space-y-3">
          <p>
            Supprimer définitivement la relance prévue pour
            <strong>{{ suiviASupprimer?.contactNom || suiviASupprimer?.email || 'ce contact' }}</strong> ?
          </p>
          <p class="text-sm text-gray-500">
            {{ suiviASupprimer?.objet || '(sans objet)' }} ·
            {{ suiviASupprimer?.impayes?.length || 0 }} facture(s)
          </p>
          <UAlert
            color="orange"
            icon="i-heroicons-exclamation-triangle"
            title="Cette action est irréversible"
            description="Aucun email n'a été envoyé pour cette relance : elle sera retirée de la file."
          />
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="showSupprModal = false">Annuler</UButton>
          <UButton color="red" icon="i-heroicons-trash" :loading="supprimant" @click="supprimerSuivi">
            Supprimer
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup>
const { $parse } = useNuxtApp()
const toast = useToast()

// ── State ──────────────────────────────────────────────────────
const loading = ref(false)
const impayes = ref([])
const sequences = ref([])
const smtpProfiles = ref([])

const search = ref('')
const filtreRole = ref('payeur')
const filtreSequence = ref('all')
const filtreStatutDossier = ref('all')
const rapMin = ref('')
const rapMax = ref('')
const retardMin = ref('')
const includeBlacklist = ref(false)
const includeSuspendus = ref(false)
const includeSansEmail = ref(false)
const smtpProfilId = ref(null)

const selectedKeys = ref([])
const generant = ref(false)

const showFactures = ref(false)
const showFiltres = ref(true)
const groupeFactures = ref(null)

const file = ref([])
const fileLoading = ref(false)
const filtreFileStatut = ref('a_traiter')
const envoiGroupe = ref(false)
const planifGroupe = ref(false)
const datePlanification = ref(new Date().toISOString().slice(0, 10))

const showSuiviDrawer = ref(false)
const suiviSelectionne = ref(null)
// Suppression d'une relance non envoyée
const showSupprModal = ref(false)
const suiviASupprimer = ref(null)
const supprimant = ref(false)

// ── Options ────────────────────────────────────────────────────
const roleOptions = [
  { label: 'Payeur', value: 'payeur' },
  { label: "Apporteur d'affaire", value: 'apporteur' },
  { label: 'Les deux', value: 'both' },
]

const sequenceOptions = computed(() => [
  { label: 'Toutes les séquences', value: 'all' },
  { label: 'Sans séquence', value: 'none' },
  ...sequences.value.map((s) => ({ label: s.get('nom'), value: s.id })),
])

const statutDossierOptions = computed(() => {
  const values = new Set()
  for (const i of impayes.value) {
    if (i.statut_dossier) values.add(i.statut_dossier)
  }
  return [
    { label: 'Tous les statuts', value: 'all' },
    ...[...values].sort().map((v) => ({ label: v, value: v })),
  ]
})

const smtpOptions = computed(() =>
  smtpProfiles.value.map((p) => ({
    label: p.get('nom') || p.get('email_from') || p.get('username') || p.id,
    value: p.id,
  })),
)

const fileStatutOptions = [
  { label: 'À traiter', value: 'a_traiter' },
  { label: 'Envoyés', value: 'envoyes' },
  { label: 'Tous', value: 'tous' },
]

// ── Colonnes ───────────────────────────────────────────────────
const colonnes = [
  { id: 'select', header: '' },
  { accessorKey: 'contactNom', header: 'Contact' },
  { accessorKey: 'nbFactures', header: 'Factures' },
  { accessorKey: 'totalRap', header: 'Reste dû' },
  { id: 'actions', header: ' ' },
]

const fileColonnes = [
  { accessorKey: 'statut', header: 'Statut' },
  { accessorKey: 'destinataire', header: 'Destinataire' },
  { accessorKey: 'dateEnvoi', header: 'Prévu le' },
  { id: 'fileActions', header: ' ' },
]

// Nombre de filtres avancés actifs (badge du bouton « Filtres »)
const nbFiltresActifs = computed(() => {
  let n = 0
  if (filtreRole.value !== 'payeur') n++
  if (filtreSequence.value !== 'all') n++
  if (filtreStatutDossier.value !== 'all') n++
  if (rapMin.value !== '') n++
  if (rapMax.value !== '') n++
  if (retardMin.value !== '') n++
  if (includeBlacklist.value) n++
  if (includeSuspendus.value) n++
  if (includeSansEmail.value) n++
  return n
})

// ── Helpers ────────────────────────────────────────────────────
function calcRetard(dateEcheance) {
  if (!dateEcheance) return 0
  const d = dateEcheance instanceof Date ? dateEcheance : new Date(dateEcheance)
  if (isNaN(d.getTime())) return 0
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86_400_000))
}

function formatDate(val) {
  if (!val) return '—'
  const d = val instanceof Date ? val : new Date(val)
  return isNaN(d) ? '—' : d.toLocaleDateString('fr-FR', { dateStyle: 'short' })
}

function formatMontant(val) {
  if (val == null) return '—'
  return Number(val).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

function statutColor(statut) {
  if (statut === 'Envoyée') return 'green'
  if (statut === "Erreur d'envoi") return 'red'
  if (statut === 'pret pour envoi') return 'blue'
  if (statut === 'brouillon') return 'orange'
  return 'neutral'
}

function statutLabel(statut) {
  if (statut === 'brouillon') return 'À envoyer'
  if (statut === 'pret pour envoi') return 'Planifié'
  return statut
}

function contactFrom(ptr) {
  if (!ptr || typeof ptr.get !== 'function') return null
  return {
    _parse: ptr,
    id: ptr.id,
    nom: ptr.get('nom') || '',
    prenom: ptr.get('prenom') || '',
    email: (ptr.get('email') || '').trim(),
    type: ptr.get('type') || '',
    isBlacklisted: ptr.get('isBlacklisted') === true,
  }
}

function mapImpaye(i) {
  const seq = i.get('sequence')
  const seqObj = seq && typeof seq.get === 'function' ? seq : null
  return {
    _parse: i,
    id: i.id,
    nfacture: i.get('nfacture') || '—',
    reste_a_payer: i.get('reste_a_payer'),
    date_echeance: i.get('date_echeance'),
    retard: calcRetard(i.get('date_echeance')),
    adresse_bien: i.get('adresse_bien') || '',
    statut_dossier: i.get('statut_dossier') || '',
    isBlacklisted: i.get('isBlacklisted') === true,
    payeur: contactFrom(i.get('payeur')),
    apporteur: contactFrom(i.get('apporteur')),
    contactRelance: contactFrom(i.get('contact_relance')),
    sequenceId: seqObj ? seqObj.id : null,
    sequenceNom: seqObj ? seqObj.get('nom') : null,
  }
}

// ── Filtrage des impayés ───────────────────────────────────────
function impayePasse(i) {
  if (!includeBlacklist.value && i.isBlacklisted) return false
  const statut = i.statut_dossier.toLowerCase()
  if (!includeSuspendus.value && statut.includes('suspend')) return false

  if (filtreSequence.value === 'none') {
    if (i.sequenceId) return false
  } else if (filtreSequence.value !== 'all') {
    if (i.sequenceId !== filtreSequence.value) return false
  }

  if (filtreStatutDossier.value !== 'all' && i.statut_dossier !== filtreStatutDossier.value) return false

  const rap = Number(i.reste_a_payer) || 0
  if (rapMin.value !== '' && rap < Number(rapMin.value)) return false
  if (rapMax.value !== '' && rap > Number(rapMax.value)) return false
  if (retardMin.value !== '' && i.retard < Number(retardMin.value)) return false
  return true
}

// ── Groupes contact + rôle ─────────────────────────────────────
const groupes = computed(() => {
  const map = new Map()
  const role = filtreRole.value

  for (const imp of impayes.value) {
    if (!impayePasse(imp)) continue

    const candidats = []
    const payeurContact = imp.contactRelance || imp.payeur
    if (role !== 'apporteur' && payeurContact) candidats.push({ contact: payeurContact, role: 'payeur' })
    if (role !== 'payeur' && imp.apporteur) candidats.push({ contact: imp.apporteur, role: 'apporteur' })

    for (const { contact, role: r } of candidats) {
      if (!includeSansEmail.value && !contact.email) continue
      if (contact.isBlacklisted && !includeBlacklist.value) continue
      const key = `${contact.id}::${r}`
      if (!map.has(key)) map.set(key, { key, contact, role: r, impayes: [] })
      map.get(key).impayes.push(imp)
    }
  }

  let list = [...map.values()].map((g) => {
    const totalRap = g.impayes.reduce((s, i) => s + (Number(i.reste_a_payer) || 0), 0)
    const retardMax = g.impayes.reduce((m, i) => Math.max(m, i.retard || 0), 0)
    const seqs = [...new Set(g.impayes.map((i) => i.sequenceNom).filter(Boolean))]
    const statuts = [...new Set(g.impayes.map((i) => i.statut_dossier).filter(Boolean))]
    return {
      ...g,
      contactNom: `${g.contact.prenom} ${g.contact.nom}`.trim() || g.contact.email || '(inconnu)',
      roleLabel: g.role === 'apporteur' ? "Apporteur d'affaire" : 'Payeur',
      nbFactures: g.impayes.length,
      totalRap,
      retardMax,
      sequencesLabel: seqs.join(', ') || '—',
      statutsLabel: statuts.join(', ') || '—',
    }
  })

  if (search.value) {
    const s = search.value.toLowerCase()
    list = list.filter(
      (g) =>
        g.contactNom.toLowerCase().includes(s) ||
        g.contact.email.toLowerCase().includes(s) ||
        g.impayes.some(
          (i) =>
            String(i.nfacture ?? '').toLowerCase().includes(s) ||
            String(i.adresse_bien ?? '').toLowerCase().includes(s),
        ),
    )
  }

  return list.sort((a, b) => b.totalRap - a.totalRap)
})

// ── Sélection ──────────────────────────────────────────────────
function isSelected(g) {
  return selectedKeys.value.includes(g.key)
}

// Total restant dû des groupes sélectionnés
const totalSelection = computed(() =>
  groupes.value
    .filter((g) => isSelected(g))
    .reduce((s, g) => s + (Number(g.totalRap) || 0), 0),
)

function toggleSelection(g) {
  const idx = selectedKeys.value.indexOf(g.key)
  if (idx === -1) selectedKeys.value.push(g.key)
  else selectedKeys.value.splice(idx, 1)
}

function toutSelectionner() {
  selectedKeys.value = groupes.value.map((g) => g.key)
}

function deselectionner() {
  selectedKeys.value = []
}

function reinitialiser() {
  search.value = ''
  filtreRole.value = 'payeur'
  filtreSequence.value = 'all'
  filtreStatutDossier.value = 'all'
  rapMin.value = ''
  rapMax.value = ''
  retardMin.value = ''
  includeBlacklist.value = false
  includeSuspendus.value = false
  includeSansEmail.value = false
  selectedKeys.value = []
}

// ── Chargements ────────────────────────────────────────────────
async function chargerImpayes() {
  loading.value = true
  try {
    const q = new $parse.Query('Impaye')
    q.equalTo('facture_soldee', false)
    q.greaterThan('reste_a_payer', 0)
    q.include('sequence')
    q.include('payeur')
    q.include('apporteur')
    q.include('contact_relance')
    q.descending('date_echeance')
    q.limit(1000)
    const res = await q.find()
    impayes.value = res.map(mapImpaye)
    selectedKeys.value = []
  } catch (err) {
    toast.add({ title: 'Erreur chargement impayés', description: err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

async function chargerSequences() {
  try {
    const q = new $parse.Query('Sequence')
    q.ascending('nom')
    q.limit(200)
    sequences.value = await q.find()
  } catch (err) {
    console.error('Erreur chargement séquences', err)
  }
}

async function chargerSmtp() {
  try {
    const q = new $parse.Query('SmtpProfile')
    q.ascending('nom')
    q.limit(100)
    smtpProfiles.value = await q.find()
    if (!smtpProfilId.value && smtpProfiles.value.length > 0) {
      smtpProfilId.value = smtpProfiles.value[0].id
    }
  } catch (err) {
    console.error('Erreur chargement profils SMTP', err)
  }
}

function mapSuivi(s) {
  const contact = s.get('contact')
  const impayesSuivi = s.get('impayes') || []
  return {
    _parse: s,
    id: s.id,
    statut: s.get('statut') || '',
    objet: s.get('objet') || '',
    corps: s.get('corps') || '',
    cc: s.get('cc') || '',
    dateEnvoi: s.get('dateEnvoi'),
    lastError: s.get('lastError') || '',
    email: contact ? contact.get('email') || '' : '',
    contactNom: contact
      ? `${contact.get('prenom') || ''} ${contact.get('nom') || ''}`.trim()
      : '',
    impayes: impayesSuivi.map((i) => ({
      id: i.id,
      nfacture: i.get('nfacture') || '—',
      reste_a_payer: i.get('reste_a_payer') ?? null,
    })),
  }
}

async function chargerFile() {
  fileLoading.value = true
  try {
    const q = new $parse.Query('Suivi')
    q.equalTo('manuelle', true)
    if (filtreFileStatut.value === 'a_traiter') {
      q.containedIn('statut', ['brouillon', 'pret pour envoi', "Erreur d'envoi"])
    } else if (filtreFileStatut.value === 'envoyes') {
      q.equalTo('statut', 'Envoyée')
    }
    q.include('contact')
    q.include('impayes')
    q.include('smtpProfil')
    q.descending('createdAt')
    q.limit(200)
    const res = await q.find()
    file.value = res.map(mapSuivi)
  } catch (err) {
    toast.add({ title: 'Erreur chargement file', description: err.message, color: 'red' })
  } finally {
    fileLoading.value = false
  }
}

// ── Génération ─────────────────────────────────────────────────
const payloadGeneration = computed(() =>
  groupes.value
    .filter((g) => isSelected(g))
    .map((g) => ({
      contactId: g.contact.id,
      role: g.role,
      impayeIds: g.impayes.map((i) => i.id),
    })),
)

async function generer() {
  if (payloadGeneration.value.length === 0) {
    toast.add({ title: 'Aucun groupe sélectionné', color: 'orange' })
    return
  }
  if (!smtpProfilId.value) {
    toast.add({ title: 'Sélectionnez un profil SMTP', color: 'orange' })
    return
  }

  generant.value = true
  try {
    const res = await $parse.Cloud.run('generateRelancesManuelles', {
      selection: payloadGeneration.value,
      smtpProfilId: smtpProfilId.value,
    })
    const crees = res?.suivisCrees ?? 0
    const erreurs = res?.erreurs || []
    toast.add({
      title: `${crees} email(s) de suivi généré(s)`,
      description: erreurs.length
        ? `${erreurs.length} erreur(s) : ${erreurs[0]?.erreur || ''}`
        : 'Éditez le contenu puis envoyez ou planifiez.',
      color: crees > 0 ? 'green' : 'orange',
    })
    selectedKeys.value = []
    await chargerFile()
  } catch (err) {
    toast.add({ title: 'Erreur génération', description: err.message, color: 'red' })
  } finally {
    generant.value = false
  }
}

// ── Actions file ───────────────────────────────────────────────
function ouvrirFactures(groupe) {
  groupeFactures.value = groupe
  showFactures.value = true
}

function ouvrirSuivi(row) {
  suiviSelectionne.value = row
  showSuiviDrawer.value = true
}

// Une relance est « envoyée » si le statut l'indique ou si l'envoi a été confirmé.
// Seules les relances NON envoyées peuvent être supprimées.
function estEnvoyee(s) {
  return s?.statut === 'Envoyée' || s?.emailSent === true
}

function demanderSuppression(row) {
  if (estEnvoyee(row)) {
    toast.add({
      title: 'Relance déjà envoyée',
      description: 'Elle ne peut plus être supprimée.',
      color: 'orange',
    })
    return
  }
  suiviASupprimer.value = row
  showSupprModal.value = true
}

async function supprimerSuivi() {
  const row = suiviASupprimer.value
  if (!row) return

  supprimant.value = true
  try {
    await $parse.Cloud.run('supprimerRelanceManuelle', { suiviId: row.id })
    toast.add({ title: 'Relance supprimée', color: 'green' })
    showSupprModal.value = false
    suiviASupprimer.value = null
    await chargerFile()
  } catch (err) {
    toast.add({
      title: 'Erreur suppression',
      description: err.message,
      color: 'red',
    })
  } finally {
    supprimant.value = false
  }
}

function suivisATraiter() {
  return file.value.filter(
    (f) =>
      f.statut === 'brouillon' ||
      f.statut === 'pret pour envoi' ||
      f.statut === "Erreur d'envoi",
  )
}

async function envoyerTous() {
  const rows = suivisATraiter()
  if (rows.length === 0) {
    toast.add({ title: 'Aucun email à envoyer', color: 'orange' })
    return
  }
  if (!window.confirm(`Envoyer ${rows.length} email(s) maintenant ?`)) return

  envoiGroupe.value = true
  try {
    const res = await $parse.Cloud.run('sendSuivis', {
      suiviIds: rows.map((r) => r.id),
    })
    const stats = res?.stats || res?.result || {}
    const ok = stats?.suivisEnvoyes ?? 0
    const ko = stats?.suivisErreurs ?? 0
    toast.add({
      title: `${ok} email(s) envoyé(s)`,
      description: ko ? `${ko} erreur(s) — voir la file.` : undefined,
      color: ko ? 'orange' : 'green',
    })
    await chargerFile()
  } catch (err) {
    toast.add({ title: "Erreur d'envoi groupé", description: err.message, color: 'red' })
  } finally {
    envoiGroupe.value = false
  }
}

async function planifierTous() {
  const rows = suivisATraiter()
  if (rows.length === 0) {
    toast.add({ title: 'Aucun email à planifier', color: 'orange' })
    return
  }
  if (!datePlanification.value) {
    toast.add({ title: 'Choisissez une date', color: 'orange' })
    return
  }

  planifGroupe.value = true
  try {
    const d = new Date(datePlanification.value)
    await Promise.all(
      rows.map((r) => {
        r._parse.set('dateEnvoi', d)
        // Bascule en "pret pour envoi" : le cron se chargera de l'envoi à échéance.
        r._parse.set('statut', 'pret pour envoi')
        return r._parse.save()
      }),
    )
    toast.add({ title: `${rows.length} email(s) planifié(s)`, color: 'green' })
    await chargerFile()
  } catch (err) {
    toast.add({ title: 'Erreur planification', description: err.message, color: 'red' })
  } finally {
    planifGroupe.value = false
  }
}

onMounted(async () => {
  await Promise.all([chargerImpayes(), chargerSequences(), chargerSmtp(), chargerFile()])
})
</script>
