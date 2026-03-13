<template>
  <div class="p-6 space-y-4">
    <h1 class="text-2xl font-semibold text-gray-900">Clients récalcitrants</h1>
    
    <!-- Barre de recherche et filtres -->
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div class="flex items-center gap-3 flex-wrap">
        <!-- Recherche -->
        <UInput
          v-model="search"
          icon="i-heroicons-magnifying-glass"
          placeholder="Rechercher (payeur, facture, référence, adresse...)"
          class="w-64"
          @input="onSearchInput"
        />
        
        <!-- Filtre séquence -->
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-gray-700">Séquence:</span>
          <USelect
            v-model="filtreSequence"
            :items="sequenceOptions"
            class="w-44"
            @change="charger"
            :loading="sequencesLoading"
            placeholder="Toutes les séquences"
          />
        </div>
      </div>
    </div>

    <!-- Tableau des clients récalcitrants -->
    <div class="space-y-3">
      <div v-if="loading" class="text-center py-8 text-gray-400">Chargement...</div>
      <div v-else-if="recalcitrants.length === 0" class="text-center py-8 text-gray-400">Aucun client récalcitrant trouvé</div>
      <template v-else>
        <UCard :ui="{ body: { padding: 'p-0' } }" class="max-h-[65vh] !overflow-x-auto !overflow-y-auto">
          <UTable
            :data="recalcitrants"
            :columns="colonnes"
            :loading="loading"
            class="[&_td]:!whitespace-normal [&_td]:!break-words"
          >
            <!-- Payeur -->
            <template #payeur_nom-cell="{ row }">
              <span class="font-medium">{{ row.payeur_nom || '—' }}</span>
            </template>

            <!-- N° Facture -->
            <template #nfacture-cell="{ row }">
              <span class="font-mono text-sm">{{ row.nfacture || '—' }}</span>
            </template>

            <!-- Date pièce -->
            <template #date_piece-cell="{ row }">{{ formatDate(row.date_piece) }}</template>

            <!-- Retard -->
            <template #retard-cell="{ row }">
              <span
                class="font-medium text-sm"
                :class="row.retard > 30 ? 'text-red-600' : row.retard > 7 ? 'text-orange-500' : 'text-gray-600'"
              >
                {{ row.retard }}j
              </span>
            </template>

            <!-- Reste à payer -->
            <template #reste_a_payer-cell="{ row }">
              <span class="font-medium">{{ formatMontant(row.reste_a_payer) }}</span>
            </template>

            <!-- Séquence -->
            <template #sequence-cell="{ row }">
              <span v-if="row.sequenceNom" class="text-sm text-sky-700">{{ row.sequenceNom }}</span>
              <span v-else class="text-gray-400 text-sm">—</span>
            </template>

            <!-- Dernière relance -->
            <template #derniere_relance-cell="{ row }">{{ formatDate(row.derniere_relance) }}</template>

            <!-- Actions -->
            <template #actions-cell="{ row }">
              <div class="flex items-center gap-1">
                <UButton
                  icon="i-heroicons-document"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  title="Voir PDF"
                  @click="ouvrirPdf(row)"
                />
                <UDropdownMenu :items="menuItems(row)">
                  <UButton icon="i-heroicons-ellipsis-vertical" color="neutral" variant="ghost" size="xs" />
                </UDropdownMenu>
              </div>
            </template>
          </UTable>
        </UCard>
        
        <div class="flex justify-end text-sm text-gray-500">
          {{ recalcitrants.length }} clients récalcitrants
        </div>
      </template>
    </div>

    <!-- Modal PDF -->
    <ImpayeDrawerPdf v-model="pdfOuvert" :impayelId="pdfImpayelId" />
  </div>
</template>

<script setup>
import { getGroupedRowModel } from '@tanstack/vue-table'
const { $parse } = useNuxtApp()
const toast = useToast()
const router = useRouter()

// Import manuel des composants
import ImpayeDrawerPdf from '~/components/ImpayeDrawerPdf.vue'

// ── État ──
const search = ref('')
const filtreSequence = ref('all')
const loading = ref(false)
const recalcitrants = ref([])
const sequences = ref([])
const sequencesLoading = ref(false)

// PDF
const pdfOuvert = ref(false)
const pdfImpayelId = ref(null)

// Colonnes du tableau
const colonnes = [
  { accessorKey: 'payeur_nom',        header: 'Payeur' },
  { accessorKey: 'nfacture',          header: 'N° Facture' },
  { accessorKey: 'date_piece',        header: 'Date pièce' },
  { accessorKey: 'retard',            header: 'Retard' },
  { accessorKey: 'reste_a_payer',     header: 'Reste à payer' },
  { accessorKey: 'sequenceNom',       header: 'Séquence' },
  { accessorKey: 'derniere_relance',  header: 'Dernière relance' },
  { id: 'actions',                    header: ' ' },
]

// Options de filtre séquence
const sequenceOptions = computed(() => [
  { label: 'Toutes les séquences', value: 'all' },
  ...sequences.value.map(s => ({ label: s.get('nom'), value: s.id })),
])

// Helpers
const today = new Date()

function calcRetard(datePiece) {
  if (!datePiece) return 0
  const d = datePiece instanceof Date ? datePiece : new Date(datePiece)
  return Math.floor((today - d) / 86_400_000)
}

function formatDate(val) {
  if (!val) return '—'
  const d = val instanceof Date ? val : new Date(val)
  return d.toLocaleDateString('fr-FR', { dateStyle: 'short' })
}

function formatMontant(val) {
  if (val == null) return '—'
  return Number(val).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

function rowToPlain(r) {
  const seq = r.get('sequence')
  return {
    _parse: r,
    objectId: r.id,
    nfacture:           r.get('nfacture') || '—',
    payeur_nom:         r.get('payeur_nom') || '—',
    retard:             calcRetard(r.get('date_piece')),
    reste_a_payer:      r.get('reste_a_payer'),
    date_piece:         r.get('date_piece'),
    sequenceNom:        seq ? seq.get('nom') : null,
    sequenceId:         seq ? seq.id : null,
    url_pdf:            r.get('url_pdf'),
    derniere_relance:   r.get('derniere_relance'),
  }
}

// Recherche
let searchTimer = null
function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => charger(), 400)
}

// Charger les clients récalcitrants
async function charger() {
  loading.value = true
  try {
    // 1. Trouver tous les impayés avec une séquence
    const q = new $parse.Query('Impaye')
    q.include('sequence')
    q.exists('sequence')
    
    // 2. Filtrer ceux qui n'ont pas de règlement (statut != 'payé')
    q.notEqualTo('statut', 'payé')
    
    // 3. Appliquer les filtres
    if (search.value) {
      const queries = []
      const fieldsToSearch = ['payeur_nom', 'nfacture', 'reference', 'reference_externe', 'adresse_bien', 'apporteur_nom', 'commentaire_piece', 'numero_dossier', 'numero_lot']
      const searchLower = search.value.toLowerCase()
      
      fieldsToSearch.forEach(field => {
        const q = new $parse.Query('Impaye')
        q.exists('sequence')
        q.notEqualTo('statut', 'payé')
        q.matches(field, searchLower, 'i')
        queries.push(q)
      })
      
      const combined = $parse.Query.or(...queries)
      combined.include('sequence')
      
      if (filtreSequence.value !== 'all') {
        const seqPtr = $parse.Object.extend('Sequence').createWithoutData(filtreSequence.value)
        combined.equalTo('sequence', seqPtr)
      }
      
      const results = await combined.find()
      
      // 4. Filtrer ceux qui n'ont plus de relances à faire
      const recalcitrantsData = []
      for (const impaye of results) {
        const hasMoreRelances = await aDesRelancesRestantes(impaye)
        if (!hasMoreRelances) {
          recalcitrantsData.push(rowToPlain(impaye))
        }
      }
      
      recalcitrants.value = recalcitrantsData
    } else {
      if (filtreSequence.value !== 'all') {
        const seqPtr = $parse.Object.extend('Sequence').createWithoutData(filtreSequence.value)
        q.equalTo('sequence', seqPtr)
      }
      
      const results = await q.find()
      
      // 4. Filtrer ceux qui n'ont plus de relances à faire
      const recalcitrantsData = []
      for (const impaye of results) {
        const hasMoreRelances = await aDesRelancesRestantes(impaye)
        if (!hasMoreRelances) {
          recalcitrantsData.push(rowToPlain(impaye))
        }
      }
      
      recalcitrants.value = recalcitrantsData
    }
  } catch (err) {
    toast.add({ title: 'Erreur chargement', description: err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

// Vérifier si un impayé a encore des relances à faire
async function aDesRelancesRestantes(impaye) {
  try {
    // 1. Vérifier s'il y a une séquence associée
    const sequence = impaye.get('sequence')
    if (!sequence) return false
    
    // 2. Charger la séquence complète
    const seqQuery = new $parse.Query('Sequence')
    const fullSequence = await seqQuery.get(sequence.id)
    
    // 3. Compter le nombre d'emails dans la séquence
    const emails = fullSequence.get('emails') || []
    const totalEmails = emails.length
    
    // 4. Compter le nombre de relances déjà envoyées pour cet impayé
    const relanceQuery = new $parse.Query('Relance')
    const impayePtr = $parse.Object.extend('Impaye').createWithoutData(impaye.id)
    relanceQuery.equalTo('impaye', impayePtr)
    relanceQuery.notEqualTo('statut', 'annulé')
    const relancesEnvoyees = await relanceQuery.count()
    
    // 5. Retourner true si toutes les relances ont été envoyées
    return relancesEnvoyees >= totalEmails
  } catch (err) {
    console.error('Erreur vérification relances restantes:', err)
    return false
  }
}

// Charger les séquences
async function chargerSequences() {
  try {
    sequencesLoading.value = true
    const q = new $parse.Query('Sequence')
    q.limit(200)
    sequences.value = await q.find()
  } catch {
    console.error('Failed to load sequences')
  } finally {
    sequencesLoading.value = false
  }
}

// Actions
function ouvrirPdf(row) {
  pdfImpayelId.value = row.objectId
  pdfOuvert.value = true
}

function menuItems(row) {
  return [
    {
      label: 'Voir le détail',
      icon: 'i-heroicons-eye',
      onSelect: () => router.push(`/impayes/${row.objectId}`),
    },
    {
      label: 'Marquer payé',
      icon: 'i-heroicons-check-circle',
      onSelect: () => marquerPaye(row),
    },
  ]
}

async function marquerPaye(row) {
  try {
    row._parse.set('statut', 'payé')
    await row._parse.save()
    row.statut = 'payé'
    toast.add({ title: 'Facture marquée comme payée', color: 'green' })
    await charger()
  } catch (err) {
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
  }
}

// Charger au montage
onMounted(() => {
  charger()
  chargerSequences()
})
</script>

<style scoped>
/* Ajoutez ici des styles spécifiques si nécessaire */
</style>