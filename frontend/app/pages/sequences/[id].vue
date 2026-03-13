<template>
  <div class="p-6 space-y-6">

    <!-- ── Header ── -->
    <div class="flex items-center gap-4">
      <NuxtLink to="/sequences" class="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        <UIcon name="i-heroicons-arrow-left" class="size-4" />
        Retour
      </NuxtLink>
      <UInput v-model="nom" class="flex-1 text-xl font-semibold" placeholder="Nom de la séquence" />
      <UBadge :color="publiee ? 'success' : 'neutral'" variant="subtle" class="shrink-0">
        {{ publiee ? 'Publiée' : 'Brouillon' }}
      </UBadge>
      <UButton
        :icon="publiee ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
        :color="publiee ? 'neutral' : 'success'"
        :variant="publiee ? 'outline' : 'solid'"
        :loading="publishing"
        @click="togglePublication"
      >
        {{ publiee ? 'Dépublier' : 'Publier' }}
      </UButton>
      <UButton icon="i-heroicons-floppy-disk" :loading="saving" @click="sauvegarder(editorRefs)">
        Enregistrer
      </UButton>
    </div>

    <!-- ── Toggle validation obligatoire ── -->
    <div class="flex items-center gap-4">
      <span class="text-sm font-medium text-gray-700 w-36 shrink-0">Validation obligatoire</span>
      <ToggleSwitch v-model="validationObligatoire" />
      <span class="text-sm text-gray-500">
        {{ validationObligatoire ? 'Validation obligatoire activée' : 'Validation obligatoire désactivée' }}
      </span>
    </div>

    <!-- ── Section EMAILS ── -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-semibold text-gray-800">EMAILS DE RELANCE</span>
          <UButton variant="outline" size="sm" @click="showIaModal = true">
            <UIcon name="i-heroicons-sparkles" class="size-4" />
            Générer par IA
          </UButton>
        </div>
      </template>

      <div class="space-y-4">
        <div v-if="loading" class="text-center py-6 text-gray-400">Chargement...</div>

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
import SequenceRulesSection from '~/components/SequenceRulesSection.vue'
import DrawerLienPaiement from '~/components/DrawerLienPaiement.vue'
import ModalIaSequence from '~/components/ModalIaSequence.vue'
import ModalChatGptEmail from '~/components/ModalChatGptEmail.vue'
import SmtpDrawer from '~/components/SmtpDrawer.vue'
import { useSequenceEditor, updateCorps, VARIABLES } from '~/composables/useSequenceEditor'
import { useSequenceRules } from '~/composables/useSequenceRules'
import { useIaSequence } from '~/composables/useIaSequence'
import { useLiensPaiement } from '~/composables/useLiensPaiement'

const { $parse } = useNuxtApp()

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
  emails, emailsSorted,
  smtpOptions,
  showSmtpModal,
  charger,
  sauvegarder,
  togglePublication,
  ajouterEmail,
  supprimerEmail,
  onSmtpChange,
  onSmtpSaved,
} = useSequenceEditor($parse, groupesRegles, calculerApercu, chargerLiensPaiement, loadAllOptions)

// ── editorRefs (local, partagé avec composables IA + sauvegarder) ──
const editorRefs = reactive({})

// ── Composable IA ─────────────────────────────────────────────
const {
  showIaModal, iaResponse,
  showChatGptModal, chatGptEmailIdx, chatGptResponse, chatGptTargetFormat,
  copyPromptIA, validerIA,
  openChatGptModal, copyChatGptPrompt, insererReponseChatGpt,
} = useIaSequence(emails, allVariables, editorRefs)

// ── Lifecycle ─────────────────────────────────────────────────
onMounted(() => charger())
</script>
