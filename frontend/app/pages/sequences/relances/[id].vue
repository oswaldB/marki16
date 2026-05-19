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
        <UBadge color="blue" variant="subtle" class="shrink-0 self-center">
          Relances
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
        <UButton
          icon="i-heroicons-arrow-path"
          color="primary"
          :loading="regenerating"
          @click="showRegenererSlideover = true"
          size="sm"
          class="md:size-auto"
        >
          Régénérer les relances
        </UButton>
        <UButton
          icon="i-heroicons-folder"
          color="neutral"
          @click="navigateToSuivi"
          size="sm"
          class="md:size-auto"
        >
          Voir Suivi
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

    <!-- ── Section EMAILS DE RELANCE ── -->
    <UCard>
      <template #header>
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <span class="font-semibold text-gray-800">EMAILS DE RELANCE</span>
          <UButton variant="outline" size="sm" @click="showIaModal = true" class="w-full md:w-auto">
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

    <SlideoverRegenererRelances
      v-model:open="showRegenererSlideover"
      :sequence="sequence"
      @confirmed="regenererRelances"
    />

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
import SequenceTestSlideover from '~/components/SequenceTestSlideover.vue'
import SlideoverRegenererRelances from '~/components/SlideoverRegenererRelances.vue'
import { useSequenceEditor, updateCorps, VARIABLES, getCurrentCorps, editorOptions } from '~/composables/useSequenceEditor'
import { useSequenceRules } from '~/composables/useSequenceRules'
import { useIaSequence } from '~/composables/useIaSequence'
import { useLiensPaiement } from '~/composables/useLiensPaiement'
import { h } from 'vue'

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
} = useIaSequence(emails, allVariables, editorRefs, 'relances')

// ── State local ────────────────────────────────────────────────
const runningAutoAssign = ref(false)
const showTestModal = ref(false)
const showRegenererSlideover = ref(false)
const regenerating = ref(false)

// ── Navigation vers suivi ─────────────────────────────────────
function navigateToSuivi() {
  router.push(`/sequences/suivi/${router.currentRoute.value.params.id}`)
}

// Gestion du test de séquence
function onTestSent() {
  toast.add({ title: 'Test envoyé', description: 'Les emails de test ont été envoyés avec succès', color: 'green' })
}

// -- Force type to relances --
watch(() => sequence.value, (seq) => {
  if (seq) {
    setType('relances')
  }
}, { immediate: true })

// ── Lifecycle ─────────────────────────────────────────────────
async function loadSequence() {
  await charger()
  // Force le type à relances
  if (sequence.value) {
    sequence.value.set('type', 'relances')
    setType('relances')
  }
}

onMounted(loadSequence)

// ── Attribution automatique ──────────────────────────────────
async function lancerAttributionAutomatique() {
  try {
    runningAutoAssign.value = true
    await sauvegarder(editorRefs)

    const toast = useToast()
    toast.add({
      title: 'Attribution en cours',
      description: 'Lancement de la génération des relances...',
      color: 'blue'
    })

    const result = await $parse.Cloud.run('generateRelances')

    const created = result.stats?.etape1?.relancesCreated || 0
    const updated = result.stats?.etape1?.relancesUpdated || 0

    toast.add({
      title: 'Succès',
      description: `${created} relances créées, ${updated} mises à jour`,
      color: 'green'
    })

    await calculerApercu()
  } catch (error) {
    console.error('Erreur attribution automatique:', error)
    const toast = useToast()
    const errorMessage = error.message || 'Échec de l\'attribution automatique'

    toast.add({
      id: 'error-toast-with-copy',
      title: 'Erreur',
      description: errorMessage,
      color: 'red',
      timeout: 0
    })

    navigator.clipboard.writeText(errorMessage)
      .then(() => {
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

// ── Régénération des relances ─────────────────────────────────────
async function regenererRelances(options) {
  regenerating.value = true
  const toast = useToast()

  console.log('[REGEN_SEQ] DEBUT - Options:', { resetDates: options.resetDates, includeSent: options.includeSent })

  try {
    console.log('[REGEN_SEQ] Etape 1/5: Sauvegarde de la sequence...')
    await sauvegarder(editorRefs)
    console.log('[REGEN_SEQ] Sequence sauvegardee avec succes')

    console.log('[REGEN_SEQ] Etape 2/5: Recuperation des relances pour sequence ID:', sequence.value?.id)
    const Relance = $parse.Object.extend('Relance')
    const query = new $parse.Query(Relance)
    query.equalTo('sequence', sequence.value)
    query.limit(10000)
    const allRelances = await query.find()
    console.log('[REGEN_SEQ] Relances trouvees:', allRelances.length)

    console.log('[REGEN_SEQ] Etape 3/5: Filtrage - includeSent:', options.includeSent)
    const relancesToProcess = allRelances.filter(relance => {
      const statut = relance.get('statut')
      const shouldExclude = !options.includeSent && statut === 'envoyé'
      if (shouldExclude) return false
      return true
    })

    console.log('[REGEN_SEQ] Relances a traiter:', relancesToProcess.length)

    if (relancesToProcess.length === 0) {
      console.log('[REGEN_SEQ] AUCUNE RELANCE A TRAITER')
      toast.add({ title: 'Rien à régénérer', color: 'blue' })
      return
    }

    console.log('[REGEN_SEQ] Etape 4/5: Traitement des', relancesToProcess.length, 'relances')
    const updates = relancesToProcess.map(async (relance) => {
      if (options.resetDates) {
        await relance.destroy()
      } else {
        relance.set('statut', 'En attente de generation')
        if (options.includeSent) {
          relance.set('dateEnvoi', null)
          relance.set('date_envoi_prevue', null)
        }
        await relance.save()
      }
    })

    await Promise.all(updates)
    console.log('[REGEN_SEQ] Toutes les relances traitees')

    console.log('[REGEN_SEQ] Etape 5/5: Appel triggerImportInvoices...')
    const result = await $parse.Cloud.run('triggerImportInvoices')
    console.log('[REGEN_SEQ] Resultat triggerImportInvoices:', result)

    const created = result.result?.createRelances?.created || 0
    const updated = result.result?.createRelances?.updated || 0
    console.log('[REGEN_SEQ] Relances - Crees:', created, 'Mises a jour:', updated)

    toast.add({
      title: 'Regeneration terminee',
      description: `${created} creees, ${updated} mises a jour pour ${sequence.value.get('nom')}`,
      color: 'green'
    })
    console.log('[REGEN_SEQ] Toast de succes affiche')

    await calculerApercu()
    console.log('[REGEN_SEQ] Apercu recalcule')

  } catch (error) {
    console.error('[REGEN_SEQ] ERREUR:', error.message, error.stack)
    toast.add({
      title: 'Erreur',
      description: error.message || 'Echec de la regeneration',
      color: 'red'
    })
  } finally {
    regenerating.value = false
    console.log('[REGEN_SEQ] FIN')
  }
}
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
