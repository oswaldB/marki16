<template>
  <div class="p-6 space-y-6">

    <!-- Header -->
    <div class="flex items-start justify-between gap-4 flex-wrap">
      <div class="flex items-center gap-3">
        <UButton icon="i-heroicons-arrow-left" color="neutral" variant="ghost" to="/impayes">
          Retour
        </UButton>
        <div>
          <h1 class="text-xl font-semibold text-gray-900">
            {{ impaye?.nfacture || '…' }}
            <span v-if="impaye?.numero_dossier" class="text-gray-400 font-normal"> — {{ impaye.numero_dossier }}</span>
          </h1>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <USelect
          v-if="impaye"
          v-model="statut"
          :items="statutOptions"
          class="w-36"
          @change="changerStatut"
        />
        <UButton icon="i-heroicons-document" color="neutral" variant="outline" @click="pdfOuvert = true">
          Voir PDF
        </UButton>
      </div>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-400">Chargement…</div>

    <template v-else-if="impaye">

      <!-- Grille FACTURE + BIEN/DOSSIER -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <!-- FACTURE -->
        <UCard>
          <template #header>
            <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">Facture</h2>
          </template>
          <dl class="space-y-2">
            <div class="flex justify-between text-sm">
              <dt class="text-gray-500">N° facture</dt>
              <dd class="font-medium text-gray-900">{{ impaye.nfacture }}</dd>
            </div>
            <div class="flex justify-between text-sm">
              <dt class="text-gray-500">Réf pièce</dt>
              <dd class="text-gray-700">{{ impaye.ref_piece || '—' }}</dd>
            </div>
            <div class="flex justify-between text-sm">
              <dt class="text-gray-500">Date pièce</dt>
              <dd class="text-gray-700">{{ formatDate(impaye.date_piece) }}</dd>
            </div>
            <div class="flex justify-between text-sm">
              <dt class="text-gray-500">Retard</dt>
              <dd class="font-semibold" :class="retard > 30 ? 'text-red-600' : retard > 7 ? 'text-orange-500' : 'text-gray-700'">
                {{ retard }} jour{{ retard > 1 ? 's' : '' }}
              </dd>
            </div>
            <hr class="border-gray-100" />
            <div class="flex justify-between text-sm">
              <dt class="text-gray-500">Total HT</dt>
              <dd class="text-gray-700">{{ formatMontant(impaye.total_ht) }}</dd>
            </div>
            <div class="flex justify-between text-sm">
              <dt class="text-gray-500">Total TTC</dt>
              <dd class="text-gray-700">{{ formatMontant(impaye.total_ttc) }}</dd>
            </div>
            <div class="flex justify-between text-sm">
              <dt class="text-gray-500">Reste à payer</dt>
              <dd class="font-bold text-gray-900 text-base">{{ formatMontant(impaye.reste_a_payer) }}</dd>
            </div>
            <div v-if="impaye.commentaire_piece" class="flex justify-between text-sm">
              <dt class="text-gray-500">Commentaire</dt>
              <dd class="text-gray-700 text-right max-w-xs">{{ impaye.commentaire_piece }}</dd>
            </div>
          </dl>
        </UCard>

        <!-- BIEN + DOSSIER -->
        <div class="space-y-4">
          <UCard>
            <template #header>
              <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">Bien</h2>
            </template>
            <dl class="space-y-2">
              <div class="flex justify-between text-sm">
                <dt class="text-gray-500">Adresse</dt>
                <dd class="text-gray-900 font-medium text-right">{{ impaye.adresse_bien || '—' }}</dd>
              </div>
              <div v-if="impaye.entree || impaye.escalier || impaye.etage || impaye.porte || impaye.numero_lot" class="flex justify-between text-sm">
                <dt class="text-gray-500">Détail</dt>
                <dd class="text-gray-700 text-right">
                  <span v-if="impaye.entree">Ent. {{ impaye.entree }} </span>
                  <span v-if="impaye.escalier">Esc. {{ impaye.escalier }} </span>
                  <span v-if="impaye.etage">Ét. {{ impaye.etage }} </span>
                  <span v-if="impaye.porte">Porte {{ impaye.porte }} </span>
                  <span v-if="impaye.numero_lot">Lot {{ impaye.numero_lot }}</span>
                </dd>
              </div>
              <div class="flex justify-between text-sm">
                <dt class="text-gray-500">CP / Ville</dt>
                <dd class="text-gray-700">{{ [impaye.code_postal, impaye.ville].filter(Boolean).join(' ') || '—' }}</dd>
              </div>
            </dl>
          </UCard>

          <UCard>
            <template #header>
              <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">Dossier</h2>
            </template>
            <dl class="space-y-2">
              <div class="flex justify-between text-sm">
                <dt class="text-gray-500">N° dossier</dt>
                <dd class="font-medium text-gray-900">{{ impaye.numero_dossier || '—' }}</dd>
              </div>
              <div class="flex justify-between text-sm">
                <dt class="text-gray-500">Référence</dt>
                <dd class="text-gray-700">{{ impaye.reference || '—' }}</dd>
              </div>
              <div class="flex justify-between text-sm">
                <dt class="text-gray-500">Réf externe</dt>
                <dd class="text-gray-700">{{ impaye.reference_externe || '—' }}</dd>
              </div>
              <div class="flex justify-between text-sm">
                <dt class="text-gray-500">Statut dossier</dt>
                <dd class="text-gray-700">{{ impaye.statut_dossier || '—' }}</dd>
              </div>
              <div class="flex justify-between text-sm">
                <dt class="text-gray-500">Intervention</dt>
                <dd class="text-gray-700">{{ formatDate(impaye.date_debut_mission) }}</dd>
              </div>
              <div class="flex justify-between text-sm">
                <dt class="text-gray-500">Employé</dt>
                <dd class="text-gray-700">{{ impaye.employe_intervention || '—' }}</dd>
              </div>
            </dl>
          </UCard>
        </div>
      </div>

      <!-- INTERLOCUTEURS -->
      <UCard>
        <template #header>
          <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">Interlocuteurs</h2>
        </template>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <!-- Payeur -->
          <div v-if="impaye.payeur_nom" class="border border-gray-200 rounded-lg p-3 space-y-1">
            <div class="flex items-center gap-2">
              <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Payeur</p>
              <UBadge v-if="impaye.payeur_type" color="sky" variant="subtle" size="xs">{{ impaye.payeur_type }}</UBadge>
            </div>
            <p class="font-medium text-gray-900 text-sm">{{ impaye.payeur_nom }}</p>
            <p v-if="impaye.payeur_type_personne === 'M' && impaye.payeur_contact_nom" class="text-xs text-gray-500">
              Contact : {{ impaye.payeur_contact_nom }}
              <span v-if="impaye.payeur_contact_email"> · {{ impaye.payeur_contact_email }}</span>
            </p>
            <p v-if="impaye.payeur_email" class="text-xs text-gray-600">{{ impaye.payeur_email }}</p>
            <p v-if="impaye.payeur_telephone" class="text-xs text-gray-600">{{ impaye.payeur_telephone }}</p>
          </div>

          <!-- Apporteur -->
          <div v-if="impaye.apporteur_nom" class="border border-gray-200 rounded-lg p-3 space-y-1">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Apporteur d'affaire</p>
            <p class="font-medium text-gray-900 text-sm">{{ impaye.apporteur_nom }}</p>
            <p v-if="impaye.apporteur_contact_nom" class="text-xs text-gray-500">
              Contact : {{ impaye.apporteur_contact_nom }}
              <span v-if="impaye.apporteur_contact_email"> · {{ impaye.apporteur_contact_email }}</span>
            </p>
            <p v-if="impaye.apporteur_email" class="text-xs text-gray-600">{{ impaye.apporteur_email }}</p>
            <p v-if="impaye.apporteur_telephone" class="text-xs text-gray-600">{{ impaye.apporteur_telephone }}</p>
          </div>

          <!-- Propriétaire -->
          <div v-if="impaye.proprietaire_nom" class="border border-gray-200 rounded-lg p-3 space-y-1">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Propriétaire</p>
            <p class="font-medium text-gray-900 text-sm">{{ impaye.proprietaire_nom }}</p>
            <p v-if="impaye.proprietaire_contact_nom" class="text-xs text-gray-500">Contact : {{ impaye.proprietaire_contact_nom }}</p>
            <p v-if="impaye.proprietaire_email" class="text-xs text-gray-600">{{ impaye.proprietaire_email }}</p>
            <p v-if="impaye.proprietaire_telephone" class="text-xs text-gray-600">{{ impaye.proprietaire_telephone }}</p>
          </div>

          <!-- Locataire entrant -->
          <div v-if="impaye.locataire_entrant_nom" class="border border-gray-200 rounded-lg p-3 space-y-1">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Locataire entrant</p>
            <p class="font-medium text-gray-900 text-sm">{{ impaye.locataire_entrant_nom }}</p>
            <p v-if="impaye.locataire_entrant_email" class="text-xs text-gray-600">{{ impaye.locataire_entrant_email }}</p>
            <p v-if="impaye.locataire_entrant_telephone" class="text-xs text-gray-600">{{ impaye.locataire_entrant_telephone }}</p>
          </div>

          <!-- Locataire sortant -->
          <div v-if="impaye.locataire_sortant_nom" class="border border-gray-200 rounded-lg p-3 space-y-1">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Locataire sortant</p>
            <p class="font-medium text-gray-900 text-sm">{{ impaye.locataire_sortant_nom }}</p>
            <p v-if="impaye.locataire_sortant_email" class="text-xs text-gray-600">{{ impaye.locataire_sortant_email }}</p>
            <p v-if="impaye.locataire_sortant_telephone" class="text-xs text-gray-600">{{ impaye.locataire_sortant_telephone }}</p>
          </div>

          <!-- Acquéreur -->
          <div v-if="impaye.acquereur_nom" class="border border-gray-200 rounded-lg p-3 space-y-1">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Acquéreur</p>
            <p class="font-medium text-gray-900 text-sm">{{ impaye.acquereur_nom }}</p>
            <p v-if="impaye.acquereur_email" class="text-xs text-gray-600">{{ impaye.acquereur_email }}</p>
            <p v-if="impaye.acquereur_telephone" class="text-xs text-gray-600">{{ impaye.acquereur_telephone }}</p>
          </div>

          <!-- Donneur d'ordre -->
          <div v-if="impaye.donneur_ordre_nom" class="border border-gray-200 rounded-lg p-3 space-y-1">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Donneur d'ordre</p>
            <p class="font-medium text-gray-900 text-sm">{{ impaye.donneur_ordre_nom }}</p>
            <p v-if="impaye.donneur_ordre_email" class="text-xs text-gray-600">{{ impaye.donneur_ordre_email }}</p>
            <p v-if="impaye.donneur_ordre_telephone" class="text-xs text-gray-600">{{ impaye.donneur_ordre_telephone }}</p>
          </div>

          <!-- Notaire -->
          <div v-if="impaye.notaire_nom" class="border border-gray-200 rounded-lg p-3 space-y-1">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Notaire</p>
            <p class="font-medium text-gray-900 text-sm">{{ impaye.notaire_nom }}</p>
            <p v-if="impaye.notaire_email" class="text-xs text-gray-600">{{ impaye.notaire_email }}</p>
            <p v-if="impaye.notaire_telephone" class="text-xs text-gray-600">{{ impaye.notaire_telephone }}</p>
          </div>

          <!-- Syndic -->
          <div v-if="impaye.syndic_nom" class="border border-gray-200 rounded-lg p-3 space-y-1">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Syndic</p>
            <p class="font-medium text-gray-900 text-sm">{{ impaye.syndic_nom }}</p>
            <p v-if="impaye.syndic_email" class="text-xs text-gray-600">{{ impaye.syndic_email }}</p>
            <p v-if="impaye.syndic_telephone" class="text-xs text-gray-600">{{ impaye.syndic_telephone }}</p>
          </div>
        </div>
      </UCard>

      <!-- SÉQUENCE -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between flex-wrap gap-2">
            <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">Séquence</h2>
            <div class="flex items-center gap-2 flex-wrap">
              <!-- Indicateur relanceContact -->
              <div v-if="impaye.relanceContact" class="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-1">
                <span class="text-gray-400">Email relances :</span>
                <span class="font-medium text-gray-700">{{ impaye.relanceContact.nom }}</span>
                <span v-if="impaye.relanceContact.email" class="text-gray-500">· {{ impaye.relanceContact.email }}</span>
              </div>
              <UButton
                size="sm"
                color="neutral"
                variant="outline"
                @click="ouvrirModalRelanceContact"
              >
                {{ impaye.relanceContact ? 'Changer l\'email de relances' : 'Attribuer un email de relances par défaut' }}
              </UButton>
              <UButton
                v-if="sequenceActive"
                size="sm"
                color="neutral"
                variant="outline"
                @click="ouvrirModalSequence"
              >Changer</UButton>
              <UButton
                v-if="sequenceActive"
                size="sm"
                color="error"
                variant="ghost"
                :loading="retirantSequence"
                @click="retirerSequence"
              >Retirer</UButton>
              <UButton
                v-if="!sequenceActive"
                size="sm"
                color="primary"
                @click="ouvrirModalSequence"
              >Assigner une séquence</UButton>
            </div>
          </div>
        </template>
        <p v-if="sequenceActive" class="text-gray-900 font-medium">{{ sequenceActive.get('nom') }}</p>
        <p v-else class="text-gray-400 text-sm italic">Aucune séquence assignée à cet impayé.</p>
      </UCard>

      <!-- RELANCES -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">Relances</h2>
            <UButton icon="i-heroicons-plus" size="sm" @click="ouvrirRelanceCreate">
              Créer une relance
            </UButton>
          </div>
        </template>
        <div v-if="relances.length === 0" class="text-center py-4 text-gray-400 text-sm italic">
          Aucune relance planifiée.
        </div>
        <UTable v-else :data="relances" :columns="colonnesRelances">
          <template #dateEnvoi-cell="{ row }">
            {{ formatDate(row.original.dateEnvoi) }}
          </template>
          <template #statut-cell="{ row }">
            <UBadge :color="statutRelanceColor(row.original.statut)" variant="subtle">
              {{ statutRelanceLabel(row.original.statut) }}
            </UBadge>
          </template>
          <template #manuelle-cell="{ row }">
            <span v-if="row.original.manuelle" title="Relance manuelle">✋</span>
          </template>
          <template #actions-cell="{ row }">
            <div class="flex items-center gap-1">
              <UButton
                icon="i-heroicons-pencil-square"
                color="neutral"
                variant="ghost"
                size="xs"
                @click="ouvrirRelanceEdit(row.original)"
              />
              <UButton
                v-if="row.original.statut === 'pending'"
                icon="i-heroicons-trash"
                color="error"
                variant="ghost"
                size="xs"
                @click="supprimerRelance(row.original)"
              />
            </div>
          </template>
        </UTable>
      </UCard>

      <!-- HISTORIQUE -->
      <UCard>
        <template #header>
          <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">Historique</h2>
        </template>
        <ul class="space-y-3">
          <li
            v-for="(evt, i) in historique"
            :key="i"
            class="flex items-start gap-3"
          >
            <div class="mt-1 size-2 rounded-full bg-sky-400 shrink-0" />
            <div>
              <p class="text-sm text-gray-900">{{ evt.label }}</p>
              <p class="text-xs text-gray-400">{{ formatDatetime(evt.date) }}</p>
            </div>
          </li>
        </ul>
      </UCard>

    </template>

    <!-- PDF Drawer -->
    <ImpayeDrawerPdf v-model="pdfOuvert" :impayelId="impayelId" />

    <!-- Modal sélection séquence -->
    <UModal v-model:open="modalSequenceOuvert" title="Choisir une séquence">
      <template #body>
        <USelect
          v-model="sequenceChoisie"
          :items="sequenceOptions"
          placeholder="Sélectionner une séquence..."
        />
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="modalSequenceOuvert = false">Annuler</UButton>
          <UButton :loading="assignantSequence" :disabled="!sequenceChoisie" @click="assignerSequence">
            Assigner
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Modal attribution email de relances -->
    <UModal v-model:open="modalRelanceContactOuvert" title="Attribuer un email de relances par défaut">
      <template #body>
        <div class="space-y-6">
          <!-- Section recherche contact existant -->
          <div class="space-y-2">
            <p class="text-sm font-medium text-gray-700">Rechercher un contact existant</p>
            <UInput
              v-model="rechercheContact"
              placeholder="Nom ou email (2 caractères min.)…"
              @input="onRechercheContact"
            />
            <div v-if="resultatsRecherche.length > 0" class="border border-gray-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
              <button
                v-for="c in resultatsRecherche"
                :key="c.id"
                class="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
                :class="contactSelectionne?.id === c.id ? 'bg-primary-50 font-medium text-primary-700' : 'text-gray-900'"
                @click="selectionnerContact(c)"
              >
                <span class="font-medium">{{ c.nom }}</span>
                <span v-if="c.email" class="text-gray-500 ml-2">{{ c.email }}</span>
              </button>
            </div>
            <p v-if="rechercheContact.length >= 2 && resultatsRecherche.length === 0 && !rechercheEnCours" class="text-xs text-gray-400 italic">
              Aucun contact trouvé.
            </p>
          </div>

          <div class="border-t border-gray-200" />

          <!-- Section création nouveau contact -->
          <div class="space-y-2">
            <p class="text-sm font-medium text-gray-700">Ou créer un nouveau contact</p>
            <UInput v-model="nouveauContactNom" placeholder="Nom" />
            <UInput v-model="nouveauContactEmail" placeholder="Email" type="email" />
            <p v-if="nouveauContactEmailErreur" class="text-xs text-red-500">{{ nouveauContactEmailErreur }}</p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="modalRelanceContactOuvert = false">Annuler</UButton>
          <UButton
            v-if="contactSelectionne"
            :loading="attribuantContact"
            @click="confirmerAttributionContact"
          >
            Confirmer
          </UButton>
          <UButton
            v-else-if="nouveauContactNom || nouveauContactEmail"
            :loading="attribuantContact"
            :disabled="!nouveauContactNom || !nouveauContactEmail"
            @click="creerEtAttribuerContact"
          >
            Créer et attribuer
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Drawer relance -->
    <RelanceDrawer
      v-model="relanceDrawerOuvert"
      :mode="relanceDrawerMode"
      :relance="relanceSelectionnee"
      :impayelId="impayelId"
      @success="onRelanceSuccess"
    />
  </div>
</template>

<script setup>
const route = useRoute()
const { $parse } = useNuxtApp()
const toast = useToast()

const impayelId = computed(() => route.params.id)

// ── État ──
const loading = ref(true)
const impayeObj = ref(null)  // Parse object
const impaye = ref(null)     // données à plat pour le template
const sequenceActive = ref(null)
const relances = ref([])
const sequences = ref([])

// Statut
const statut = ref('impaye')
const { getOptions } = useDynamicOptions()
const statutOptions = ref([
  { label: 'Impayé',   value: 'impaye' },
  { label: 'En cours', value: 'en cours' },
  { label: 'Payé',     value: 'payé' },
])

// Charger les options dynamiques
onMounted(async () => {
  try {
    const options = await getOptions('statut_impaye')
    if (options.length > 0) {
      statutOptions.value = options
    }
  } catch (error) {
    console.error('Failed to load dynamic statut options:', error)
  }
})

// PDF
const pdfOuvert = ref(false)

// Séquence
const modalSequenceOuvert = ref(false)
const sequenceChoisie = ref(null)
const assignantSequence = ref(false)
const retirantSequence = ref(false)

// Attribution email relances
const modalRelanceContactOuvert = ref(false)
const rechercheContact = ref('')
const resultatsRecherche = ref([])
const contactSelectionne = ref(null)
const rechercheEnCours = ref(false)
const nouveauContactNom = ref('')
const nouveauContactEmail = ref('')
const nouveauContactEmailErreur = ref('')
const attribuantContact = ref(false)

// Relances
const relanceDrawerOuvert = ref(false)
const relanceDrawerMode = ref('create')
const relanceSelectionnee = ref(null)

// Colonnes relances
const colonnesRelances = [
  { accessorKey: 'dateEnvoi', header: "Date d'envoi" },
  { accessorKey: 'objet',     header: 'Objet' },
  { accessorKey: 'statut',    header: 'Statut' },
  { id: 'manuelle',           header: ' ' },
  { id: 'actions',            header: ' ' },
]

// ── Helpers ──
const today = new Date()

function formatDate(val) {
  if (!val) return '—'
  const d = val instanceof Date ? val : new Date(val)
  return d.toLocaleDateString('fr-FR', { dateStyle: 'short' })
}

function formatDatetime(val) {
  if (!val) return '—'
  const d = val instanceof Date ? val : new Date(val)
  return d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
}

function formatMontant(val) {
  if (val == null) return '—'
  return Number(val).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

const retard = computed(() => {
  const d = impaye.value?.date_piece
  if (!d) return 0
  const date = d instanceof Date ? d : new Date(d)
  return Math.floor((today - date) / 86_400_000)
})

function statutRelanceColor(s) {
  if (s === 'envoyé') return 'green'
  if (s === 'échec')  return 'red'
  if (s === 'annulé') return 'orange'
  return 'neutral'
}

function statutRelanceLabel(s) {
  if (s === 'envoyé')  return 'Envoyé'
  if (s === 'échec')   return 'Échec'
  if (s === 'pending') return 'En attente'
  if (s === 'annulé')  return 'Annulé'
  return s
}

// ── Historique ──
const historique = computed(() => {
  const evts = []
  if (impaye.value?.createdAt) {
    evts.push({ date: impaye.value.createdAt, label: 'Impayé créé (sync automatique)' })
  }
  for (const r of relances.value) {
    if (r.statut === 'envoyé') {
      evts.push({ date: r.dateEnvoi, label: `Email envoyé — ${r.objet || '(sans objet)'}` })
    } else if (r.statut === 'échec') {
      evts.push({ date: r.dateEnvoi, label: `Échec d'envoi — ${r.objet || '(sans objet)'}` })
    }
  }
  return evts.sort((a, b) => new Date(b.date) - new Date(a.date))
})

// ── Options séquences ──
const sequenceOptions = computed(() =>
  sequences.value.map(s => ({ label: s.get('nom'), value: s.id }))
)

// ── Charger ──
function parseImpaye(obj) {
  const rc = obj.get('relanceContact')
  return {
    objectId:               obj.id,
    createdAt:              obj.createdAt,
    nfacture:               obj.get('nfacture'),
    ref_piece:              obj.get('ref_piece'),
    date_piece:             obj.get('date_piece'),
    total_ht:               obj.get('total_ht'),
    total_ttc:              obj.get('total_ttc'),
    reste_a_payer:          obj.get('reste_a_payer'),
    commentaire_piece:      obj.get('commentaire_piece'),
    statut:                 obj.get('statut'),
    adresse_bien:           obj.get('adresse_bien'),
    code_postal:            obj.get('code_postal'),
    ville:                  obj.get('ville'),
    entree:                 obj.get('entree'),
    escalier:               obj.get('escalier'),
    etage:                  obj.get('etage'),
    porte:                  obj.get('porte'),
    numero_lot:             obj.get('numero_lot'),
    numero_dossier:         obj.get('numero_dossier'),
    reference:              obj.get('reference'),
    reference_externe:      obj.get('reference_externe'),
    statut_dossier:         obj.get('statut_dossier'),
    date_debut_mission:     obj.get('date_debut_mission'),
    employe_intervention:   obj.get('employe_intervention'),
    // Interlocuteurs à plat
    payeur_nom:                   obj.get('payeur_nom'),
    payeur_email:                 obj.get('payeur_email'),
    payeur_telephone:             obj.get('payeur_telephone'),
    payeur_type:                  obj.get('payeur_type'),
    payeur_type_personne:         obj.get('payeur_type_personne'),
    payeur_contact_nom:           obj.get('payeur_contact_nom'),
    payeur_contact_email:         obj.get('payeur_contact_email'),
    apporteur_nom:                obj.get('apporteur_nom'),
    apporteur_email:              obj.get('apporteur_email'),
    apporteur_telephone:          obj.get('apporteur_telephone'),
    apporteur_contact_nom:        obj.get('apporteur_contact_nom'),
    apporteur_contact_email:      obj.get('apporteur_contact_email'),
    proprietaire_nom:             obj.get('proprietaire_nom'),
    proprietaire_email:           obj.get('proprietaire_email'),
    proprietaire_telephone:       obj.get('proprietaire_telephone'),
    proprietaire_type_personne:   obj.get('proprietaire_type_personne'),
    proprietaire_contact_nom:     obj.get('proprietaire_contact_nom'),
    proprietaire_contact_email:   obj.get('proprietaire_contact_email'),
    locataire_entrant_nom:        obj.get('locataire_entrant_nom'),
    locataire_entrant_email:      obj.get('locataire_entrant_email'),
    locataire_entrant_telephone:  obj.get('locataire_entrant_telephone'),
    locataire_sortant_nom:        obj.get('locataire_sortant_nom'),
    locataire_sortant_email:      obj.get('locataire_sortant_email'),
    locataire_sortant_telephone:  obj.get('locataire_sortant_telephone'),
    acquereur_nom:                obj.get('acquereur_nom'),
    acquereur_email:              obj.get('acquereur_email'),
    acquereur_telephone:          obj.get('acquereur_telephone'),
    donneur_ordre_nom:            obj.get('donneur_ordre_nom'),
    donneur_ordre_email:          obj.get('donneur_ordre_email'),
    donneur_ordre_telephone:      obj.get('donneur_ordre_telephone'),
    notaire_nom:                  obj.get('notaire_nom'),
    notaire_email:                obj.get('notaire_email'),
    notaire_telephone:            obj.get('notaire_telephone'),
    syndic_nom:                   obj.get('syndic_nom'),
    syndic_email:                 obj.get('syndic_email'),
    syndic_telephone:             obj.get('syndic_telephone'),
    relanceContact: rc ? {
      id:    rc.id,
      nom:   rc.get('nom'),
      email: rc.get('email'),
    } : null,
  }
}

async function charger() {
  loading.value = true
  try {
    const q = new $parse.Query('Impaye')
    q.include('sequence')
    q.include('relanceContact')
    const obj = await q.get(impayelId.value)
    impayeObj.value = obj
    impaye.value = parseImpaye(obj)
    sequenceActive.value = obj.get('sequence') || null
    statut.value = obj.get('statut') || 'impaye'
    await chargerRelances()
  } catch (err) {
    toast.add({ title: 'Erreur chargement', description: err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

async function chargerRelances() {
  const q = new $parse.Query('Relance')
  q.equalTo('impaye', impayeObj.value)
  q.ascending('dateEnvoi')
  q.limit(200)
  const results = await q.find()
  relances.value = results.map(r => ({
    _parse:    r,
    objectId:  r.id,
    dateEnvoi: r.get('dateEnvoi'),
    objet:     r.get('objet') || '(sans objet)',
    corps:     r.get('corps') || '',
    statut:    r.get('statut') || 'pending',
    manuelle:  r.get('manuelle') || false,
  }))
}

async function chargerSequences() {
  try {
    const q = new $parse.Query('Sequence')
    q.limit(200)
    sequences.value = await q.find()
  } catch { /* silencieux */ }
}

// ── Actions ──
async function changerStatut() {
  try {
    impayeObj.value.set('statut', statut.value)
    await impayeObj.value.save()
    toast.add({ title: 'Statut mis à jour', color: 'green' })
  } catch (err) {
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
  }
}

function ouvrirModalSequence() {
  sequenceChoisie.value = sequenceActive.value?.id || null
  modalSequenceOuvert.value = true
}

async function assignerSequence() {
  if (!sequenceChoisie.value) return
  assignantSequence.value = true
  try {
    const result = await $parse.Cloud.run('assignerSequence', {
      impayelId: impayelId.value,
      sequenceId: sequenceChoisie.value,
    })
    const seqObj = sequences.value.find(s => s.id === sequenceChoisie.value)
    sequenceActive.value = seqObj || null
    toast.add({ title: `Séquence assignée — ${result.created} relance(s) créée(s)`, color: 'green' })
    modalSequenceOuvert.value = false
    await chargerRelances()
  } catch (err) {
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
  } finally {
    assignantSequence.value = false
  }
}

async function retirerSequence() {
  retirantSequence.value = true
  try {
    await $parse.Cloud.run('assignerSequence', {
      impayelId: impayelId.value,
      sequenceId: null,
    })
    sequenceActive.value = null
    toast.add({ title: 'Séquence retirée', color: 'green' })
    await chargerRelances()
  } catch (err) {
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
  } finally {
    retirantSequence.value = false
  }
}

function ouvrirRelanceCreate() {
  relanceSelectionnee.value = null
  relanceDrawerMode.value = 'create'
  relanceDrawerOuvert.value = true
}

function ouvrirRelanceEdit(row) {
  relanceSelectionnee.value = row._parse
  relanceDrawerMode.value = 'edit'
  relanceDrawerOuvert.value = true
}

async function supprimerRelance(row) {
  try {
    await row._parse.destroy()
    relances.value = relances.value.filter(r => r.objectId !== row.objectId)
    toast.add({ title: 'Relance supprimée', color: 'green' })
  } catch (err) {
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
  }
}

function onRelanceSuccess() {
  chargerRelances()
}

// ── Attribution email de relances ──
function ouvrirModalRelanceContact() {
  rechercheContact.value = ''
  resultatsRecherche.value = []
  contactSelectionne.value = null
  nouveauContactNom.value = ''
  nouveauContactEmail.value = ''
  nouveauContactEmailErreur.value = ''
  modalRelanceContactOuvert.value = true
}

let rechercheTimeout = null
function onRechercheContact() {
  contactSelectionne.value = null
  clearTimeout(rechercheTimeout)
  if (rechercheContact.value.length < 2) {
    resultatsRecherche.value = []
    return
  }
  rechercheTimeout = setTimeout(() => rechercherContacts(), 300)
}

async function rechercherContacts() {
  rechercheEnCours.value = true
  try {
    const terme = rechercheContact.value
    const qNom = new $parse.Query('Contact')
    qNom.contains('nom', terme)
    const qEmail = new $parse.Query('Contact')
    qEmail.contains('email', terme)
    const query = $parse.Query.or(qNom, qEmail)
    query.limit(20)
    const results = await query.find()
    resultatsRecherche.value = results.map(c => ({
      id: c.id, nom: c.get('nom') || '', email: c.get('email') || '', _parse: c,
    }))
  } catch (err) {
    console.error('Erreur recherche contacts:', err)
  } finally {
    rechercheEnCours.value = false
  }
}

function selectionnerContact(c) {
  contactSelectionne.value = c
  nouveauContactNom.value = ''
  nouveauContactEmail.value = ''
}

function validerEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function confirmerAttributionContact() {
  if (!contactSelectionne.value) return
  attribuantContact.value = true
  try {
    await $parse.Cloud.run('attribuerRelanceContact', {
      impayelId: impayelId.value,
      contactId: contactSelectionne.value.id,
    })
    modalRelanceContactOuvert.value = false
    toast.add({ title: 'Email de relances attribué', color: 'green' })
    await charger()
  } catch (err) {
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
  } finally {
    attribuantContact.value = false
  }
}

async function creerEtAttribuerContact() {
  nouveauContactEmailErreur.value = ''
  if (!validerEmail(nouveauContactEmail.value)) {
    nouveauContactEmailErreur.value = 'Adresse email invalide'
    return
  }
  attribuantContact.value = true
  try {
    await $parse.Cloud.run('attribuerRelanceContact', {
      impayelId: impayelId.value,
      nom: nouveauContactNom.value,
      email: nouveauContactEmail.value,
    })
    modalRelanceContactOuvert.value = false
    toast.add({ title: 'Contact créé et email de relances attribué', color: 'green' })
    await charger()
  } catch (err) {
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
  } finally {
    attribuantContact.value = false
  }
}

onMounted(() => {
  charger()
  chargerSequences()
})
</script>
