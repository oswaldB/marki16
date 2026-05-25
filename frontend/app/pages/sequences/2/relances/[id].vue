<template>
  <div class="p-4 md:p-6 space-y-6 h-full">
    <!-- Header -->
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div class="flex items-center gap-4">
        <NuxtLink to="/sequences" class="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
          <UIcon name="i-heroicons-arrow-left" class="size-4" />
          Retour
        </NuxtLink>
        <UInput v-model="nom" class="flex-1 text-xl font-semibold" placeholder="Nom de la séquence" readonly />
      </div>

      <div class="flex items-center gap-4">
        <UBadge color="blue" variant="subtle">
          Relances - Chat Ollama
        </UBadge>
        <UBadge :color="publiee ? 'success' : 'neutral'" variant="subtle">
          {{ publiee ? 'Publiée' : 'Brouillon' }}
        </UBadge>
      </div>
    </div>

    <!-- Titre de la page -->
    <div class="border-b pb-4">
      <h1 class="text-2xl font-bold text-gray-900">
        Rédaction assistée par IA
      </h1>
      <p class="text-sm text-gray-500 mt-1">
        Chattez directement avec Ollama pour rédiger vos emails de relance
      </p>
    </div>

    <!-- Contenu principal: split view -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)] min-h-0">
      <!-- Gauche: Liste des emails -->
      <div class="lg:col-span-1 space-y-4 overflow-y-auto">
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <span class="font-semibold">Emails de la séquence</span>
              <UBadge color="neutral" variant="subtle">
                {{ emails.length }} email(s)
              </UBadge>
            </div>
          </template>

          <div class="space-y-3">
            <div
              v-for="(email, idx) in emailsSorted"
              :key="email._key"
              class="border rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors"
              :class="selectedEmailIndex === idx ? 'border-primary-500 bg-primary-50/50' : 'border-gray-200'"
              @click="selectEmail(idx)"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-sm font-medium text-gray-700">
                      Email {{ idx + 1 }}
                    </span>
                    <UBadge color="neutral" variant="subtle" size="xs">
                      +{{ email.delai || 0 }} jours
                    </UBadge>
                  </div>
                  <div class="text-xs text-gray-500 truncate">
                    {{ getScenario(email).objet || 'Sans objet' }}
                  </div>
                  <div v-if="email.smtp" class="text-xs text-gray-400 mt-1">
                    SMTP: {{ getSmtpName(email.smtp) }}
                  </div>
                </div>
                <UIcon
                  name="i-heroicons-check-circle"
                  class="size-5 text-primary-600 shrink-0"
                  v-if="selectedEmailIndex === idx"
                />
              </div>
            </div>

            <div v-if="emails.length === 0" class="text-center text-gray-400 py-4">
              Aucun email dans cette séquence
            </div>
          </div>
        </UCard>

        <!-- Variables disponibles -->
        <UCard>
          <template #header>
            <span class="font-semibold">Variables disponibles</span>
          </template>
          <div class="text-xs space-y-2">
            <div v-for="(group, gIdx) in allVariables" :key="gIdx">
              <div class="font-medium text-gray-700 mb-1">{{ group.groupe }}</div>
              <div class="flex flex-wrap gap-1 mb-2">
                <UBadge v-for="(varName, vIdx) in group.vars" :key="vIdx" color="neutral" variant="subtle" size="xs">
                  [[{{ varName }}]]
                </UBadge>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Droite: Chat Ollama (2 colonnes) -->
      <div class="lg:col-span-2">
        <OllamaChatPanel
          :loading="loading"
          :messages="messages"
          :current-input="currentInput"
          :current-response="currentResponse"
          :selected-email-index="selectedEmailIndex"
          :context-type="contextType"
          :formatted-variables="formattedVariables"
          :emails="emails"
          :signature="signature"
          @send-message="sendMessage"
          @select-context="selectEmail"
          @copy-response="copyResponse"
          @insert-response="insertResponse"
        />
      </div>
    </div>

    <!-- Visualisation HTML de l'email sélectionné -->
    <UModal v-model:open="showHtmlPreview" title="Prévisualisation HTML" size="xl" class="w-full max-w-4xl">
      <template #body>
        <div class="space-y-4">
          <div v-if="selectedEmailData">
            <div class="border-b pb-2 mb-4">
              <div class="flex items-center gap-2">
                <span class="font-medium">Objet:</span>
                <span>{{ selectedEmailData.objet || 'Sans objet' }}</span>
              </div>
              <div class="flex items-center gap-2 mt-1">
                <span class="font-medium">À:</span>
                <span>{{ selectedEmailData.to || 'Non défini' }}</span>
              </div>
              <div class="flex items-center gap-2 mt-1" v-if="selectedEmailData.cc">
                <span class="font-medium">CC:</span>
                <span>{{ selectedEmailData.cc }}</span>
              </div>
            </div>
            <div class="border rounded-lg p-4 bg-white">
              <div class="prose max-w-none" v-html="selectedEmailData.corps || '<p>Aucun contenu</p>'" />
              <div v-if="signature" class="mt-6 pt-4 border-t">
                <div v-html="signature" />
              </div>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <UButton color="neutral" variant="ghost" @click="showHtmlPreview = false">
          Fermer
        </UButton>
      </template>
    </UModal>

    <!-- Drawers/Modals pour insertion -->
    <UModal v-model:open="showInsertModal" title="Insérer dans l'éditeur">
      <template #body>
        <div class="space-y-4">
          <p>Voulez-vous insérer ce contenu dans l'email {{ selectedEmailIndex !== null ? selectedEmailIndex + 1 : 'la séquence' }} ?</p>
          <UTextarea v-model="currentResponse" :rows="8" readonly />
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="showInsertModal = false">Annuler</UButton>
          <UButton color="primary" @click="confirmInsert">Confirmer l'insertion</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup>
import OllamaChatPanel from '~/components/OllamaChatPanel.vue'
import { useSequenceEditor, getScenario, VARIABLES } from '~/composables/useSequenceEditor'
import { useOllamaChat } from '~/composables/useOllamaChat'
import { useLiensPaiement } from '~/composables/useLiensPaiement'

const { $parse } = useNuxtApp()
const router = useRouter()
const toast = useToast()

// ── State local ─────────────────────────────────────────────────
const showHtmlPreview = ref(false)
const showInsertModal = ref(false)

// ── Composable éditeur ─────────────────────────────────────────
const {
  loading: sequenceLoading,
  sequence,
  nom,
  publiee,
  emails,
  emailsSorted,
  charger,
  getSmtpName,
} = useSequenceEditor($parse)

// ── Composable liens de paiement ─────────────────────────────
const { chargerLiensPaiement } = useLiensPaiement($parse)

// ── Variables globales ────────────────────────────────────────
const allVariables = computed(() => VARIABLES)

// ── Composable Ollama Chat ─────────────────────────────────────
const {
  loading,
  messages,
  currentInput,
  currentResponse,
  selectedEmailIndex,
  contextType,
  signature,
  formattedVariables,
  emailDetails,
  sendMessage,
  selectEmailContext,
  copyResponse,
  initChat,
} = useOllamaChat(router.currentRoute.value.params.id, allVariables)

// État de l'email sélectionné pour la prévisualisation
const selectedEmailData = ref(null)

// ── Méthodes ───────────────────────────────────────────────────

/**
 * Sélectionne un email
 */
async function selectEmail(idx) {
  await selectEmailContext(idx)
  
  // Charger les détails de l'email pour prévisualisation
  if (idx !== null) {
    const email = emailsSorted.value[idx]
    const scenario = getScenario(email)
    selectedEmailData.value = {
      ...email,
      objet: scenario?.objet || '',
      corps: scenario?.corps || '',
      to: email.to || '',
      cc: email.cc || '',
    }
  } else {
    selectedEmailData.value = null
  }
}

/**
 * Affiche la prévisualisation HTML
 */
function showHtml() {
  if (selectedEmailIndex.value === null) {
    toast.add({ title: 'Info', description: 'Sélectionnez un email pour voir sa prévisualisation', color: 'blue' })
    return
  }
  showHtmlPreview.value = true
}

/**
 * Insère la réponse dans l'éditeur
 */
function insertResponse() {
  if (!currentResponse.value) {
    toast.add({ title: 'Rien à insérer', color: 'neutral' })
    return
  }
  
  if (selectedEmailIndex.value === null) {
    toast.add({ title: 'Info', description: 'Sélectionnez un email pour insérer le contenu', color: 'blue' })
    return
  }
  
  showInsertModal.value = true
}

/**
 * Confirme l'insertion dans l'éditeur
 */
async function confirmInsert() {
  try {
    const email = emailsSorted.value[selectedEmailIndex.value]
    if (!email) {
      throw new Error('Email non trouvé')
    }

    // Trouver le scénario actif
    const scenario = getScenario(email)
    if (!scenario) {
      throw new Error('Scénario non trouvé')
    }

    // Mettre à jour le corps du scénario
    scenario.corps = currentResponse.value
    email.activeScenario = email.activeScenario || 'single'

    // Sauvegarder la séquence
    // (On ne sauvegarde pas automatiquement, on laisse l'utilisateur le faire manuellement)
    
    toast.add({ title: 'Contenu inséré', description: 'Le contenu a été ajouté à l\'email', color: 'green' })
    showInsertModal.value = false
    currentResponse.value = ''
  } catch (err) {
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
  }
}

// ── Lifecycle ─────────────────────────────────────────────────

async function loadSequence() {
  await charger()
  await chargerLiensPaiement()
  initChat()
}

// Force le type à relances
watch(() => sequence.value, (seq) => {
  if (seq) {
    seq.set('type', 'relances')
  }
}, { immediate: true })

onMounted(loadSequence)
</script>

<style scoped>
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Assurer que la zone de chat prend toute la hauteur */
:deep(.grid-cols-3 > div:last-child) {
  display: flex;
  flex-direction: column;
}
</style>
