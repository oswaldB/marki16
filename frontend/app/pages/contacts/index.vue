<template>
  <div class="p-6 space-y-4">

    <!-- ── Header ── -->
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div class="flex items-center gap-3 flex-wrap">
        <h1 class="text-2xl font-semibold text-gray-900">Contacts</h1>
        <UBadge v-if="total > 0" color="neutral" variant="subtle">{{ total }}</UBadge>
        <button
          class="flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium transition-colors"
          :class="filtreSansEmail
            ? 'bg-red-100 text-red-700 hover:bg-red-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
          @click="toggleFiltreSansEmail"
        >
          <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold">
            {{ sansEmailCount }}
          </span>
          sans email
        </button>
      </div>

      <div class="flex items-center gap-2">
        <UButton icon="i-heroicons-plus" @click="ouvrirCreation">
          Nouveau contact
        </UButton>
        <UButton
          :loading="syncing"
          :disabled="syncing"
          color="neutral"
          variant="outline"
          icon="i-heroicons-arrow-path"
          @click="lancerSync"
        >
          {{ syncing ? 'Sync...' : 'Synchroniser' }}
        </UButton>
      </div>
    </div>

    <!-- Résultat sync -->
    <UAlert
      v-if="syncResult"
      :color="syncResult.errors?.length ? 'orange' : 'green'"
      :title="syncResult.errors?.length ? 'Sync terminée avec erreurs' : 'Sync réussie'"
      :description="syncResultMessage"
    />

    <!-- ── Filtres ── -->
    <div class="flex items-center gap-3 flex-wrap">
      <UInput
        v-model="search"
        icon="i-heroicons-magnifying-glass"
        placeholder="Rechercher par nom..."
        class="w-56"
        @input="onSearchInput"
      />
      <USelect
        v-model="filtreSource"
        :items="sourceOptions"
        class="w-40"
        @change="resetEtCharger"
      />
      <USelect
        v-model="filtreType"
        :items="typeOptions"
        class="w-52"
        @change="resetEtCharger"
      />
    </div>

    <!-- ── Tableau ── -->
    <UCard :ui="{ body: { padding: 'p-0' } }">
      <UTable :data="rows" :columns="colonnes" :loading="loading">

        <template #nom-cell="{ row }">
          <button
            class="text-sky-700 hover:underline font-medium text-left"
            @click="ouvrirDrawer(row.original)"
          >
            {{ row.original.nom }}
          </button>
        </template>

        <template #email-cell="{ row }">
          <span v-if="row.original.email" class="text-sm text-gray-700">{{ row.original.email }}</span>
          <UBadge v-else color="red" variant="subtle" size="xs">Manquant</UBadge>
        </template>

        <template #type-cell="{ row }">
          <UBadge v-if="row.original.type" color="neutral" variant="subtle" size="xs">{{ row.original.type }}</UBadge>
          <span v-else class="text-gray-400 text-sm">—</span>
        </template>

        <template #source-cell="{ row }">
          <UBadge
            :color="row.original.source === 'db_externe' ? 'blue' : 'violet'"
            variant="subtle"
            size="xs"
          >
            {{ row.original.source === 'db_externe' ? 'BD externe' : 'Upload' }}
          </UBadge>
        </template>

        <template #nb_impayes-cell="{ row }">
          <span class="text-sm" :class="row.original.nb_impayes > 0 ? 'font-medium text-gray-900' : 'text-gray-400'">
            {{ row.original.nb_impayes }}
          </span>
        </template>

        <template #actions-cell="{ row }">
          <UButton
            icon="i-heroicons-pencil-square"
            color="neutral"
            variant="ghost"
            size="xs"
            @click="ouvrirDrawer(row.original)"
          />
        </template>

      </UTable>
    </UCard>

    <!-- Pagination -->
    <div v-if="total > pageSize" class="flex items-center justify-between text-sm text-gray-500">
      <span>{{ (page - 1) * pageSize + 1 }}–{{ Math.min(page * pageSize, total) }} sur {{ total }}</span>
      <div class="flex items-center gap-2">
        <UButton
          size="xs"
          color="neutral"
          variant="outline"
          icon="i-heroicons-chevron-left"
          :disabled="page <= 1"
          @click="page--; charger()"
        />
        <span class="px-2">{{ page }}</span>
        <UButton
          size="xs"
          color="neutral"
          variant="outline"
          icon="i-heroicons-chevron-right"
          :disabled="page * pageSize >= total"
          @click="page++; charger()"
        />
      </div>
    </div>

    <!-- ══════════════════════════════════════
         DRAWER — Détail / Édition
    ══════════════════════════════════════ -->
    <USlideover v-model:open="showDrawer" side="right" :title="contactSelectionne?.nom || 'Détails du contact'">
      <template v-if="contactSelectionne" #header>
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center gap-2">
            <p class="font-semibold">{{ contactSelectionne.nom }}</p>
            <UBadge
              :color="contactSelectionne.source === 'db_externe' ? 'blue' : 'violet'"
              variant="subtle"
              size="xs"
            >
              {{ contactSelectionne.source === 'db_externe' ? 'BD externe' : 'Upload' }}
            </UBadge>
          </div>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark"
            size="sm"
            @click="showDrawer = false"
          />
        </div>
      </template>
      <template v-if="contactSelectionne" #body>
        <div class="space-y-4">
          <!-- Alerte lecture seule -->
          <UAlert
            v-if="contactSelectionne.source === 'db_externe'"
            color="blue"
            icon="i-heroicons-information-circle"
            title="Contact issu de la synchronisation"
            description="Ce contact est géré par la base de données externe. Les modifications sont impossibles ici."
          />

          <!-- Champs -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-gray-500 mb-1 block">Nom</label>
              <UInput
                v-model="formEdition.nom"
                :disabled="contactSelectionne.source === 'db_externe'"
              />
            </div>
            <div>
              <label class="text-xs text-gray-500 mb-1 block">Type</label>
              <USelect
                v-model="formEdition.type"
                :items="typeOptionsForm"
                :disabled="contactSelectionne.source === 'db_externe'"
              />
            </div>
            <div>
              <label class="text-xs text-gray-500 mb-1 block">Email</label>
              <UInput
                v-model="formEdition.email"
                type="email"
                :disabled="contactSelectionne.source === 'db_externe'"
              />
            </div>
            <div>
              <label class="text-xs text-gray-500 mb-1 block">Téléphone</label>
              <UInput
                v-model="formEdition.telephone"
                :disabled="contactSelectionne.source === 'db_externe'"
              />
            </div>
          </div>

          <!-- Impayés liés -->
          <div>
            <p class="text-sm font-semibold text-gray-700 mb-2">
              Impayés liés
              <span class="text-gray-400 font-normal">({{ impayelsDuContact.length }})</span>
            </p>
            <div v-if="loadingImpayes" class="text-sm text-gray-400 py-2">Chargement…</div>
            <div v-else-if="impayelsDuContact.length === 0" class="text-sm text-gray-400">Aucun impayé associé</div>
            <div v-else class="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
              <div
                v-for="imp in impayelsDuContact"
                :key="imp.id"
                class="flex items-center justify-between px-3 py-2 hover:bg-gray-50"
              >
                <div class="flex items-center gap-3 text-sm">
                  <span class="font-mono text-gray-700 w-28">{{ imp.get('nfacture') || '—' }}</span>
                  <span class="font-medium">{{ formatMontant(imp.get('reste_a_payer')) }}</span>
                  <UBadge :color="statutColor(imp.get('statut'))" variant="subtle" size="xs">
                    {{ imp.get('statut') || '—' }}
                  </UBadge>
                </div>
                <NuxtLink
                  :to="`/impayes/${imp.id}`"
                  class="text-sky-600 hover:text-sky-800"
                  @click="showDrawer = false"
                >
                  <UIcon name="i-heroicons-arrow-top-right-on-square" class="size-4" />
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template v-if="contactSelectionne" #footer>
        <div class="flex items-center justify-between w-full">
          <UButton
            v-if="contactSelectionne.source === 'upload'"
            color="red"
            variant="ghost"
            size="sm"
            icon="i-heroicons-trash"
            :loading="deleting"
            @click="confirmerSuppression"
          >
            Supprimer
          </UButton>
          <div v-else />
          <div class="flex gap-2">
            <UButton color="neutral" variant="ghost" @click="showDrawer = false">Fermer</UButton>
            <UButton
              v-if="contactSelectionne.source === 'upload'"
              :loading="saving"
              @click="enregistrer"
            >
              Enregistrer
            </UButton>
          </div>
        </div>
      </template>
    </USlideover>

    <!-- ══════════════════════════════════════
         MODAL — Confirmer suppression
    ══════════════════════════════════════ -->
    <UModal v-model:open="showDeleteModal" title="Supprimer le contact">
      <template #body>
        <div class="space-y-3">
          <p>Supprimer <strong>{{ contactSelectionne?.nom }}</strong> ?</p>
          <UAlert
            v-if="impayelsDuContact.length > 0"
            color="orange"
            icon="i-heroicons-exclamation-triangle"
            :title="`Ce contact a ${impayelsDuContact.length} impayé(s) lié(s)`"
            description="Les impayés associés ne seront pas supprimés mais n'auront plus de contact."
          />
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="showDeleteModal = false">Annuler</UButton>
          <UButton color="red" :loading="deleting" @click="supprimerContact">Supprimer</UButton>
        </div>
      </template>
    </UModal>

    <!-- ══════════════════════════════════════
         MODAL — Créer un contact
    ══════════════════════════════════════ -->
    <UModal v-model:open="showCreateModal" title="Nouveau contact">
      <template #body>
        <div class="grid grid-cols-2 gap-3">
          <div class="col-span-2">
            <label class="text-xs text-gray-500 mb-1 block">Nom *</label>
            <UInput v-model="formCreation.nom" placeholder="Jean Dupont" />
          </div>
          <div>
            <label class="text-xs text-gray-500 mb-1 block">Email</label>
            <UInput v-model="formCreation.email" type="email" placeholder="jean@exemple.com" />
          </div>
          <div>
            <label class="text-xs text-gray-500 mb-1 block">Téléphone</label>
            <UInput v-model="formCreation.telephone" placeholder="06 00 00 00 00" />
          </div>
          <div class="col-span-2">
            <label class="text-xs text-gray-500 mb-1 block">Type</label>
            <USelect
              v-model="formCreation.type"
              :items="typeOptionsForm"
            />
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="showCreateModal = false">Annuler</UButton>
          <UButton :loading="creating" @click="creerContact">Créer</UButton>
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
const saving = ref(false)
const deleting = ref(false)
const creating = ref(false)
const syncing = ref(false)
const loadingImpayes = ref(false)

const contacts = ref([])
const total = ref(0)
const sansEmailCount = ref(0)
const page = ref(1)
const pageSize = 50

// Filtres
const search = ref('')
const filtreSource = ref('all')
const filtreType = ref('all')
const filtreSansEmail = ref(false)

// Sync
const syncResult = ref(null)

// Drawer
const showDrawer = ref(false)
const contactSelectionne = ref(null)
const formEdition = ref({ nom: '', email: '', telephone: '', type: '' })
const impayelsDuContact = ref([])

// Modals
const showDeleteModal = ref(false)
const showCreateModal = ref(false)
const formCreation = ref({ nom: '', email: '', telephone: '', type: '' })

// ── Options ────────────────────────────────────────────────────
const sourceOptions = [
  { label: 'Toutes les sources', value: 'all' },
  { label: 'BD externe',         value: 'db_externe' },
  { label: 'Upload',             value: 'upload' },
]

const typeOptions = [
  { label: 'Tous les types',      value: 'all' },
  { label: 'Propriétaire',        value: 'Propriétaire' },
  { label: 'Locataire sortant',   value: 'Locataire sortant' },
  { label: 'Locataire entrant',   value: 'Locataire entrant' },
  { label: 'Apporteur',           value: 'Apporteur' },
]

const typeOptionsForm = [
  { label: '—',                  value: '' },
  { label: 'Propriétaire',       value: 'Propriétaire' },
  { label: 'Locataire sortant',  value: 'Locataire sortant' },
  { label: 'Locataire entrant',  value: 'Locataire entrant' },
  { label: 'Apporteur',          value: 'Apporteur' },
]

// ── Tableau ────────────────────────────────────────────────────
const colonnes = [
  { accessorKey: 'nom',        header: 'Nom' },
  { accessorKey: 'email',      header: 'Email' },
  { accessorKey: 'telephone',  header: 'Téléphone' },
  { accessorKey: 'type',       header: 'Type' },
  { accessorKey: 'source',     header: 'Source' },
  { accessorKey: 'nb_impayes', header: 'Impayés' },
  { id: 'actions',             header: ' ' },
]

// Map contactId → count impayés
const impayesCountMap = ref({})

const rows = computed(() =>
  contacts.value.map(c => ({
    _parse:     c,
    id:         c.id,
    nom:        c.get('nom') || '—',
    email:      c.get('email') || '',
    telephone:  c.get('telephone') || '',
    type:       c.get('type') || '',
    source:     c.get('source') || 'upload',
    nb_impayes: impayesCountMap.value[c.id] ?? 0,
  }))
)

// ── Chargement ────────────────────────────────────────────────
async function charger() {
  loading.value = true
  try {
    const q = buildQuery()
    q.ascending('nom')
    q.limit(pageSize)
    q.skip((page.value - 1) * pageSize)

    const [results, count] = await Promise.all([q.find(), q.count()])
    contacts.value = results
    total.value = count

    // Nb impayés par contact (batch)
    if (results.length > 0) {
      const qImp = new $parse.Query('Impaye')
      qImp.containedIn('payeur', results)
      qImp.select('payeur')
      qImp.limit(1000)
      const impayes = await qImp.find()
      const map = {}
      for (const imp of impayes) {
        const pid = imp.get('payeur')?.id
        if (pid) map[pid] = (map[pid] || 0) + 1
      }
      impayesCountMap.value = map
    } else {
      impayesCountMap.value = {}
    }
  } catch (err) {
    toast.add({ title: 'Erreur chargement', description: err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

function buildQuery() {
  const q = new $parse.Query('Contact')
  if (filtreSource.value !== 'all') q.equalTo('source', filtreSource.value)
  if (filtreType.value !== 'all') q.equalTo('type', filtreType.value)
  if (filtreSansEmail.value) q.doesNotExist('email')
  if (search.value.trim()) q.matches('nom', new RegExp(search.value.trim(), 'i'))
  return q
}

async function chargerSansEmailCount() {
  try {
    const q = new $parse.Query('Contact')
    q.doesNotExist('email')
    sansEmailCount.value = await q.count()
  } catch { /* silencieux */ }
}

function resetEtCharger() {
  page.value = 1
  charger()
}

let searchTimer = null
function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 1; charger() }, 300)
}

function toggleFiltreSansEmail() {
  filtreSansEmail.value = !filtreSansEmail.value
  page.value = 1
  charger()
}

// ── Drawer ─────────────────────────────────────────────────────
async function ouvrirDrawer(row) {
  contactSelectionne.value = row
  formEdition.value = {
    nom:       row._parse.get('nom')       || '',
    email:     row._parse.get('email')     || '',
    telephone: row._parse.get('telephone') || '',
    type:      row._parse.get('type')      || '',
  }
  impayelsDuContact.value = []
  showDrawer.value = true
  loadingImpayes.value = true
  try {
    const qImp = new $parse.Query('Impaye')
    qImp.equalTo('payeur', row._parse)
    qImp.descending('date_piece')
    qImp.limit(20)
    impayelsDuContact.value = await qImp.find()
  } catch { /* silencieux */ } finally {
    loadingImpayes.value = false
  }
}

async function enregistrer() {
  saving.value = true
  try {
    const c = contactSelectionne.value._parse
    c.set('nom',       formEdition.value.nom)
    c.set('email',     formEdition.value.email || undefined)
    c.set('telephone', formEdition.value.telephone || undefined)
    c.set('type',      formEdition.value.type || undefined)
    await c.save()
    toast.add({ title: 'Contact mis à jour', color: 'green' })
    showDrawer.value = false
    await Promise.all([charger(), chargerSansEmailCount()])
  } catch (err) {
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
  } finally {
    saving.value = false
  }
}

function confirmerSuppression() {
  showDeleteModal.value = true
}

async function supprimerContact() {
  deleting.value = true
  try {
    await contactSelectionne.value._parse.destroy()
    showDeleteModal.value = false
    showDrawer.value = false
    toast.add({ title: 'Contact supprimé', color: 'green' })
    await Promise.all([charger(), chargerSansEmailCount()])
  } catch (err) {
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
  } finally {
    deleting.value = false
  }
}

// ── Création ───────────────────────────────────────────────────
function ouvrirCreation() {
  formCreation.value = { nom: '', email: '', telephone: '', type: '' }
  showCreateModal.value = true
}

async function creerContact() {
  if (!formCreation.value.nom.trim()) {
    toast.add({ title: 'Le nom est requis', color: 'orange' })
    return
  }
  creating.value = true
  try {
    const c = new $parse.Object('Contact')
    c.set('nom',    formCreation.value.nom.trim())
    c.set('source', 'upload')
    if (formCreation.value.email)     c.set('email',     formCreation.value.email)
    if (formCreation.value.telephone) c.set('telephone', formCreation.value.telephone)
    if (formCreation.value.type)      c.set('type',      formCreation.value.type)
    await c.save()
    toast.add({ title: 'Contact créé', color: 'green' })
    showCreateModal.value = false
    await Promise.all([charger(), chargerSansEmailCount()])
  } catch (err) {
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
  } finally {
    creating.value = false
  }
}

// ── Sync ───────────────────────────────────────────────────────
const syncResultMessage = computed(() => {
  if (!syncResult.value) return ''
  const { impayes_created, impayes_updated, contacts_created, errors } = syncResult.value
  const parts = []
  if (impayes_created) parts.push(`${impayes_created} impayé(s) créé(s)`)
  if (impayes_updated) parts.push(`${impayes_updated} impayé(s) mis à jour`)
  if (contacts_created) parts.push(`${contacts_created} contact(s) créé(s)`)
  if (errors?.length) parts.push(`${errors.length} erreur(s)`)
  return parts.join(' · ')
})

async function lancerSync() {
  syncing.value = true
  syncResult.value = null
  try {
    const stats = await $parse.Cloud.run('syncNow')
    syncResult.value = stats
    toast.add({
      title: 'Synchronisation terminée',
      description: syncResultMessage.value,
      color: stats.errors?.length ? 'orange' : 'green',
    })
    await Promise.all([charger(), chargerSansEmailCount()])
  } catch (err) {
    toast.add({ title: 'Erreur de synchronisation', description: err.message, color: 'red' })
  } finally {
    syncing.value = false
  }
}

// ── Helpers ────────────────────────────────────────────────────
function formatMontant(val) {
  if (val == null) return '—'
  return Number(val).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

function statutColor(statut) {
  if (statut === 'payé') return 'green'
  if (statut === 'en cours') return 'blue'
  return 'orange'
}

// ── Init ───────────────────────────────────────────────────────
onMounted(() => {
  charger()
  chargerSansEmailCount()
})
</script>
