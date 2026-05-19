<template>
  <div class="p-4 md:p-6 space-y-6">

    <!-- ── Header ── -->
    <div class="flex flex-col gap-4 md:flex-row md:items-center">
      <div class="flex items-center gap-4">
        <NuxtLink to="/sequences" class="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
          <UIcon name="i-heroicons-arrow-left" class="size-4" />
          Retour
        </NuxtLink>
        <UInput v-model="nom" class="flex-1 text-xl font-semibold" placeholder="Nom de la séquence" />
      </div>

      <div class="flex flex-wrap gap-2 justify-end">
        <UBadge color="green" variant="subtle" class="shrink-0 self-center">
          Suivi
        </UBadge>
        <UBadge :color="publiee ? 'success' : 'neutral'" variant="subtle" class="shrink-0 self-center">
          {{ publiee ? 'Publiée' : 'Brouillon' }}
        </UBadge>
        <UButton
          :icon="publiee ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
          :color="publiee ? 'neutral' : 'success'"
          :variant="publiee ? 'outline' : 'solid'"
          :loading="publishing"
          @click="togglePublication"
          size="sm"
          class="md:size-auto"
        >
          {{ publiee ? 'Dépublier' : 'Publier' }}
        </UButton>
        <UButton icon="i-heroicons-floppy-disk" :loading="saving" @click="sauvegarder(editorRefs)" size="sm" class="md:size-auto">
          Enregistrer
        </UButton>
        <UButton
          icon="i-heroicons-beaker"
          color="orange"
          @click="showTestModal = true"
          size="sm"
          class="md:size-auto"
        >
          Tester la séquence
        </UButton>
        <UButton
          icon="i-heroicons-folder"
          color="neutral"
          @click="navigateToRelances"
          size="sm"
          class="md:size-auto"
        >
          Voir Relances
        </UButton>
      </div>
    </div>

    <!-- ── Toggle validation obligatoire ── -->
    <div class="flex flex-col md:flex-row md:items-center gap-4">
      <span class="text-sm font-medium text-gray-700 w-full md:w-36 shrink-0">Validation obligatoire</span>
      <div class="flex items-center gap-4">
        <ToggleSwitch v-model="validationObligatoire" />
        <span class="text-sm text-gray-500">
          {{ validationObligatoire ? 'Validation obligatoire activée' : 'Validation obligatoire désactivée' }}
        </span>
      </div>
    </div>

    <!-- ── Section EMAIL DE SUIVI ── -->
    <UCard>
      <template #header>
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <span class="font-semibold text-gray-800">EMAIL DE SUIVI</span>
          <div class="flex gap-2">
            <UButton variant="outline" size="sm" @click="showIaModal = true" class="w-full md:w-auto">
              <UIcon name="i-heroicons-sparkles" class="size-4" />
              Générer par IA
            </UButton>
            <UButton variant="outline" icon="i-heroicons-plus" size="sm" @click="ajouterEmailSuivi" class="w-full md:w-auto">
              Ajouter un email
            </UButton>
          </div>
        </div>
      </template>

      <div class="space-y-4">
        <div v-if="loading" class="text-center py-6 text-gray-400">Chargement...</div>

        <!-- Emails de suivi -->
        <template v-if="emails.length === 0">
          <SequenceSuiviCard
            :email="null"
            :smtp-options="smtpOptions"
            :vars-search="varsSearch"
            :collapsed="false"
            @create="ajouterEmailSuivi"
          />
        </template>

        <SequenceSuiviCard
          v-for="(email, idx) in emails"
          :key="email._key"
          :email="email"
          :smtp-options="smtpOptions"
          :vars-search="varsSearch"
          :collapsed="collapsedEmails[email._key]"
          @update:to="email.to = $event"
          @update:cc="email.cc = $event"
          @update:smtp="(scenario, val) => {
            const s = email.scenarios.find(s => s.format === scenario)
            if (s) s.smtp = val
          }"
          @update:scenario="(newScenario) => switchScenario(email, newScenario, editorRefs)"
          @delete="supprimerEmail(email._key)"
          @toggle="toggleEmailVisibility(email._key)"
        >
          <template #editor>
            <ToastuiEditor
              :ref="el => editorRefs[email._key] = el"
              :initialValue="getCurrentCorps(email)"
              :options="editorOptions"
              @change="(html) => updateCorps(email, html)"
            />
          </template>
        </SequenceSuiviCard>
      </div>
    </UCard>

    <!-- ── Section RÈGLES ── -->
    <SequenceRulesSection
      v-model:groupes="groupesRegles"
      v-model:attribution-automatique-value="attributionAutomatique"
    />

    <!-- ── Drawers / Modals ── -->
    <DrawerLienPaiement
      v-model:open="showLienModal"
      :all-variables="allVariables"
      @updated="chargerLiensPaiement"
    />

    <SequenceTestSlideover
      v-model="showTestModal"
      :sequence="sequence"
      :emails="emails"
      @test-sent="onTestSent"
    />

    <ModalIaSequence
      v-model:open="showIaModal"
      v-model="iaResponse"
      @copy-prompt="copyPromptIA"
      @validate="validerIA"
    />

    <ModalChatGptEmail
      v-model:open="showChatGptModal"
      v-model="chatGptResponse"
      :email-idx="chatGptEmailIdx"
      :target-format="chatGptTargetFormat"
      @copy-prompt="copyChatGptPrompt"
      @insert="insererReponseChatGpt"
    />

    <SmtpDrawer v-model="showSmtpModal" :mode-edition="false" @saved="onSmtpSaved" />

  </div>
</template>

<script setup>
import ToggleSwitch from '~/components/ToggleSwitch.vue'
import SequenceSuiviCard from '~/components/SequenceSuiviCard.vue'
import SequenceRulesSection from '~/components/SequenceRulesSection.vue'
import DrawerLienPaiement from '~/components/DrawerLienPaiement.vue'
import ModalIaSequence from '~/components/ModalIaSequence.vue'
import ModalChatGptEmail from '~/components/ModalChatGptEmail.vue'
import SmtpDrawer from '~/components/SmtpDrawer.vue'
import SequenceTestSlideover from '~/components/SequenceTestSlideover.vue'
import ToastuiEditor from '~/components/ToastuiEditor.vue'
import { useSequenceEditor, updateCorps, switchScenario, VARIABLES, SCENARIO_FORMATS, getCurrentCorps, editorOptions } from '~/composables/useSequenceEditor'
import { useSequenceRules } from '~/composables/useSequenceRules'
import { useIaSequence } from '~/composables/useIaSequence'
import { useLiensPaiement } from '~/composables/useLiensPaiement'

const { $parse } = useNuxtApp()
const router = useRouter()
const toast = useToast()

// ── Composables règles ────────────────────────────────────────
const {
  groupesRegles,
  attributionAutomatique,
  validationObligatoire,
  calculerApercu,
  loadAllOptions,
} = useSequenceRules($parse)

// ── Composable liens de paiement ─────────────────────────────
const {
  liensPaiement,
  showLienModal,
  chargerLiensPaiement,
} = useLiensPaiement($parse)

// ── Variables globales ────────────────────────────────────────
const liensPaiementVars = computed(() =>
  liensPaiement.value.map(lien => ({
    name: `lien_paiement_${lien.id}`,
    display: lien.nom,
    url: lien.url,
    isPaymentLink: true,
  }))
)

const allVariables = computed(() => [
  ...VARIABLES,
  { groupe: 'LIENS DE PAIEMENT', vars: liensPaiementVars.value },
])

// ── Composable éditeur principal ─────────────────────────────
const {
  loading, saving, publishing,
  sequence, nom, publiee,
  emails,
  smtpOptions,
  showSmtpModal,
  varsSearch,
  collapsedEmails,
  charger,
  sauvegarder,
  togglePublication,
  supprimerEmail,
  toggleEmailVisibility,
  onSmtpChange,
  onSmtpSaved,
  setType,
} = useSequenceEditor($parse, groupesRegles, calculerApercu, chargerLiensPaiement, loadAllOptions, attributionAutomatique, validationObligatoire)

// ── editorRefs (local, partagé avec composables IA + sauvegarder) ──
const editorRefs = reactive({})

// ── Composable IA ─────────────────────────────────────────────
const {
  showIaModal, iaResponse,
  showChatGptModal, chatGptEmailIdx, chatGptResponse, chatGptTargetFormat,
  copyPromptIA, validerIA,
  openChatGptModal, copyChatGptPrompt, insererReponseChatGpt,
} = useIaSequence(emails, allVariables, editorRefs, 'suivi')

// ── State local ────────────────────────────────────────────────
const showTestModal = ref(false)

// ── Navigation vers relances ─────────────────────────────────────
function navigateToRelances() {
  router.push(`/sequences/relances/${router.currentRoute.value.params.id}`)
}

// Fonction pour ajouter un email de suivi (sans délai)
function ajouterEmailSuivi() {
  emails.value.push({
    _key: `email_suivi_${Date.now()}`,
    email_index: emails.value.length + 1,
    delai: 0, // Pas de délai pour les emails de suivi
    smtp: '',
    to: '[[payeur_email]]',
    cc: '',
    activeScenario: 'single',
    frequence: 'hebdomadaire', // Fréquence par défaut
    scenarios: SCENARIO_FORMATS.map(format => ({
      format,
      active: true,
      smtp: '',
      cc: '',
      objet: '',
      corps: ''
    }))
  })
}

// Gestion du test de séquence
function onTestSent() {
  toast.add({ title: 'Test envoyé', description: 'Les emails de test ont été envoyés avec succès', color: 'green' })
}

// -- Force type to suivi --
watch(() => sequence.value, (seq) => {
  if (seq) {
    setType('suivi')
  }
}, { immediate: true })

// ── Lifecycle ─────────────────────────────────────────────────
async function loadSequence() {
  await charger()
  // Force le type à suivi
  if (sequence.value) {
    sequence.value.set('type', 'suivi')
    setType('suivi')
  }
  // Si aucun email, en créer un pour le suivi
  if (emails.value.length === 0) {
    ajouterEmailSuivi()
  }
}

onMounted(loadSequence)
</script>

<style scoped>
@media (max-width: 767px) {
  .responsive-input {
    width: 100%;
    margin-bottom: 0.5rem;
  }
  .responsive-badge {
    align-self: center;
  }
  .button-group {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
}

::-webkit-scrollbar {
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
</style>
