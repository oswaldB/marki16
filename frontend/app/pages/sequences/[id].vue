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
          v-if="attributionAutomatique"
          icon="i-heroicons-play"
          color="primary"
          :loading="runningAutoAssign"
          @click="lancerAttributionAutomatique"
          size="sm"
          class="md:size-auto"
        >
          Lancer attribution auto
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
      </div>
    </div>

    <!-- ── Type de séquence ── -->
    <div class="flex flex-col md:flex-row md:items-center gap-4">
      <span class="text-sm font-medium text-gray-700 w-full md:w-36 shrink-0">Type de séquence</span>
      <div class="flex flex-wrap gap-4">
        <label v-for="seqType in sequenceTypes" :key="seqType.value" class="flex items-center gap-2">
          <input
            type="radio"
            :value="seqType.value"
            v-model="type"
            @change="setType(seqType.value)"
            class="h-4 w-4 text-blue-600 focus:ring-blue-500"
          />
          <span class="text-sm text-gray-700">{{ seqType.label }}</span>
        </label>
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

    <!-- ── Section EMAILS (conditionnelle selon le type) ── -->
    <UCard>
      <template #header>
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <span class="font-semibold text-gray-800">
            {{ type === 'relances' ? 'EMAILS DE RELANCE' : 'EMAIL DE SUIVI' }}
          </span>
          <UButton variant="outline" size="sm" @click="showIaModal = true" class="w-full md:w-auto">
            <UIcon name="i-heroicons-sparkles" class="size-4" />
            Générer par IA
          </UButton>
        </div>
      </template>

      <div class="space-y-4">
        <div v-if="loading" class="text-center py-6 text-gray-400">Chargement...</div>

        <!-- Emails de relance (pour type "relances") -->
        <template v-if="type === 'relances'">
          <SequenceEmailCard
            v-for="(email, idx) in emailsSorted"
            :key="email._key"
            :email="email"
            :index="idx"
            :smtp-options="smtpOptions"
            :all-variables="allVariables"
            :editor-refs="editorRefs"
            @delete="supprimerEmail"
            @open-chatgpt="openChatGptModal"
            @open-smtp="showSmtpModal = true"
            @open-liens="showLienModal = true"
            @editor-mounted="(key, el) => editorRefs[key] = el"
            @corps-change="(email, html) => updateCorps(email, html)"
            @smtp-change="onSmtpChange"
          />

          <UButton variant="outline" icon="i-heroicons-plus" @click="ajouterEmail">
            Ajouter un email
          </UButton>
        </template>

        <!-- Email de suivi (pour type "suivi") -->
        <template v-if="type === 'suivi'">
          <!-- Afficher le composant avec email=null si la liste est vide -->
          <SequenceSuiviCard
            v-if="emails.length === 0"
            :email="null"
            :smtp-options="smtpOptions"
            :vars-search="varsSearch"
            :collapsed="false"
            @create="ajouterEmailSuivi"
          />

          <!-- Afficher le composant avec les données si un email existe -->
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
            @update:scenario="email.activeScenario = $event"
            @delete="supprimerEmail(email._key)"
            @toggle="toggleEmailVisibility(email._key)"
          >
            <template #editor>
              <ToastuiEditor
                ref="el => editorRefs[email._key] = el"
                :initialValue="getCurrentCorps(email)"
                :options="editorOptions"
                @change="(html) => updateCorps(email, html)"
              />
            </template>
          </SequenceSuiviCard>
        </template>
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
import SequenceEmailCard from '~/components/SequenceEmailCard.vue'
import SequenceSuiviCard from '~/components/SequenceSuiviCard.vue'
import SequenceRulesSection from '~/components/SequenceRulesSection.vue'
import DrawerLienPaiement from '~/components/DrawerLienPaiement.vue'
import ModalIaSequence from '~/components/ModalIaSequence.vue'
import ModalChatGptEmail from '~/components/ModalChatGptEmail.vue'
import SmtpDrawer from '~/components/SmtpDrawer.vue'
import SequenceTestSlideover from '~/components/SequenceTestSlideover.vue'
import { useSequenceEditor, updateCorps, VARIABLES, SEQUENCE_TYPES, getCurrentCorps, SCENARIO_FORMATS, editorOptions } from '~/composables/useSequenceEditor'
import { useSequenceRules } from '~/composables/useSequenceRules'
import { useIaSequence } from '~/composables/useIaSequence'
import { useLiensPaiement } from '~/composables/useLiensPaiement'
import { h } from 'vue'
import ToastuiEditor from '~/components/ToastuiEditor.vue'

const { $parse } = useNuxtApp()
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
  sequence, nom, publiee, type,
  emails, emailsSorted,
  smtpOptions,
  showSmtpModal,
  varsSearch,
  collapsedEmails,
  charger,
  sauvegarder,
  togglePublication,
  ajouterEmail,
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
} = useIaSequence(emails, allVariables, editorRefs)

// ── State local ────────────────────────────────────────────────
const runningAutoAssign = ref(false)
const sequenceTypes = SEQUENCE_TYPES
const showTestModal = ref(false)

// Fonction pour ajouter un email de suivi (sans délai)
function ajouterEmailSuivi() {

// Gestion du test de séquence
function onTestSent() {
  toast.add({ title: 'Test envoyé', description: 'Les emails de test ont été envoyés avec succès', color: 'green' })
}
  emails.value = [{
    _key: `email_suivi_${Date.now()}`,
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
  }]
}

// Watcher pour gérer le changement de type
watch(type, (newType, oldType) => {
  if (newType !== oldType) {
    if (newType === 'suivi' && emails.value.length === 0) {
      // Pour le suivi, ajouter un email seulement si la liste est vide
      ajouterEmailSuivi()
    } else if (newType === 'relances' && emails.value.length === 0) {
      // Pour les relances, si aucun email, en ajouter un par défaut
      ajouterEmail()
    }
    // Si des emails existent déjà, les conserver tels quels
  }
})

// ── Lifecycle ─────────────────────────────────────────────────
onMounted(() => {
  charger()
  console.log('Type de séquence initial:', type.value)
  console.log('Types disponibles:', sequenceTypes)
  console.log('Emails initiaux:', emails.value)
  
  // Initialiser les emails selon le type initial seulement si la liste est vide
  // (le watcher gérera les changements de type ultérieurs)
})

// ── Attribution automatique ──────────────────────────────────
async function lancerAttributionAutomatique() {
  try {
    runningAutoAssign.value = true
    
    // Sauvegarder d'abord la séquence pour s'assurer qu'elle est à jour
    await sauvegarder(editorRefs)
    
    // Vérifier si la fonction assignSpecificSequence existe
    let result
    try {
      // Essayer d'appeler la fonction assignSpecificSequence
      result = await $parse.Cloud.run('assignSpecificSequence', {
        sequenceId: sequence.value.id,
      })
    } catch (functionError) {
      // Si la fonction n'existe pas, essayer une approche alternative
      if (functionError.message && functionError.message.includes('Invalid function')) {
        console.log('La fonction assignSpecificSequence n\'existe pas, utilisation de l\'approche alternative')
        
        // Approche alternative: utiliser createRelancesWithTemplates directement
        // (Cette partie doit être adaptée à votre logique métier)
        result = {
          assigned: 0,
          assignedImpayeIds: []
        }
        
        // Ici vous pourriez appeler une autre fonction ou afficher un message
        toast.add({
          title: 'Information',
          description: 'La fonction d\'attribution automatique n\'est pas encore disponible',
          color: 'blue'
        })
        
        runningAutoAssign.value = false
        return
      } else {
        // Si c'est une autre erreur, la relancer
        throw functionError
      }
    }
    
    // Créer les relances pour les impayés nouvellement attribués
    if (result.assignedImpayeIds && result.assignedImpayeIds.length > 0) {
      console.log(`Création des relances pour ${result.assignedImpayeIds.length} impayés`);
      
      // Appeler la fonction pour créer les relances
      const relancesResult = await $parse.Cloud.run('createRelancesWithTemplates', {
        impayeIds: result.assignedImpayeIds,
        sequenceId: sequence.value.id,
      });
      
      toast.add({
        title: 'Succès',
        description: `${result.assigned} impayés ont reçu cette séquence et ${relancesResult.relancesCrees} relances ont été créées`,
        color: 'green'
      })
    } else {
      toast.add({
        title: 'Succès',
        description: `${result.assigned} impayés ont reçu cette séquence`,
        color: 'green'
      })
    }
    
    // Recalculer l'aperçu
    await calculerApercu()
  } catch (error) {
    console.error('Erreur attribution automatique:', error)
    
    const toast = useToast()
    const errorMessage = error.message || 'Échec de l\'attribution automatique'
    
    // Afficher le toast d'erreur
    toast.add({
      id: 'error-toast-with-copy',
      title: 'Erreur',
      description: errorMessage,
      color: 'red',
      timeout: 0  // Ne pas fermer automatiquement
    })
    
    // Copier automatiquement dans le presse-papier
    navigator.clipboard.writeText(errorMessage)
      .then(() => {
        // Ajouter un toast de confirmation
        setTimeout(() => {
          toast.add({
            title: 'Copié!',
            description: 'Le message d\'erreur a été copié dans le presse-papier',
            color: 'green'
          })
        }, 500)
      })
      .catch(err => {
        console.error('Échec de la copie:', err)
      })
  } finally {
    runningAutoAssign.value = false
  }
}
</script>

<style scoped>
/* Responsive improvements */
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

/* Scrollbar styling for better UX */
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
