<template>
  <USlideover v-model:open="isOpen">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <span class="font-semibold">Tester un email individuel</span>
        <UButton
          color="gray"
          variant="ghost"
          icon="i-heroicons-x-mark"
          size="sm"
          @click="isOpen = false"
        />
      </div>
    </template>

    <template #body>
      <div class="space-y-6 p-4">
        <!-- Email de test -->
        <div>
          <label class="text-sm font-medium text-gray-700 block mb-2">
            Email de destination pour le test
          </label>
          <UInput
            v-model="testEmail"
            placeholder="email@exemple.com"
            type="email"
            required
          />
        </div>

        <!-- Informations sur l'email à tester -->
        <div>
          <h3 class="text-sm font-medium text-gray-700 mb-2">Email à tester</h3>
          <div class="bg-gray-50 rounded-lg p-3 text-sm">
            <div class="flex items-start gap-2">
              <UIcon name="i-heroicons-envelope" class="size-4 text-gray-500 mt-0.5" />
              <div class="flex-1">
                <p class="font-medium">Email {{ emailIndex + 1 }}: {{ emailInfo.objet || 'Sans objet' }}</p>
                <p class="text-xs text-gray-500">Délai: J+{{ emailInfo.delai }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Liste des payeurs avec impayés actifs -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-medium text-gray-700">Payeurs avec impayés actifs</h3>
            <UButton
              icon="i-heroicons-arrow-path"
              variant="outline"
              size="2xs"
              :loading="loadingPayeurs"
              @click="chargerPayeursAvecImpayes"
            >
              Actualiser
            </UButton>
          </div>

          <div v-if="loadingPayeurs" class="text-center py-6">
            <UIcon name="i-heroicons-arrow-path" class="size-6 animate-spin mx-auto text-gray-400" />
            <p class="text-xs text-gray-500 mt-2">Chargement des payeurs...</p>
          </div>

          <div v-else>
            <div v-if="payeursAvecImpayes.length === 0" class="text-center py-6 text-gray-400">
              <UIcon name="i-heroicons-information-circle" class="size-6 mx-auto mb-2" />
              <p class="text-sm">Aucun payeur avec impayés actifs trouvé</p>
            </div>

            <div v-else class="space-y-2 max-h-60 overflow-y-auto">
              <div
                v-for="payeur in payeursAvecImpayes"
                :key="payeur.value"
                class="p-3 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer"
                :class="{
                  'border-blue-300 bg-blue-50': selectedPayeur === payeur.value,
                  'border-gray-200': selectedPayeur !== payeur.value
                }"
                @click="selectPayeur(payeur)"
              >
                <div class="flex items-center justify-between">
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-gray-900 truncate">{{ payeur.nom }}</div>
                    <div class="text-xs text-gray-500 truncate">{{ payeur.email }}</div>
                  </div>
                  <div class="text-right ml-3">
                    <div class="text-xs font-medium text-red-600">{{ payeur.impayesCount }} impayé(s)</div>
                    <div class="text-xs font-bold text-red-600">{{ payeur.impayesAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p class="text-xs text-gray-500 mt-2">
            Sélectionnez un payeur pour tester l'email avec ses données
          </p>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 p-4">
        <UButton
          variant="outline"
          color="gray"
          @click="isOpen = false"
        >
          Annuler
        </UButton>
        <UButton
          :loading="sendingTest"
          :disabled="!testEmail || !selectedPayeur"
          @click="envoyerTest"
        >
          Envoyer le test
        </UButton>
      </div>
    </template>
  </USlideover>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  sequence: { type: Object, required: true },
  emails: { type: Array, required: true },
  emailIndex: { type: Number, default: null }
})

const emit = defineEmits(['update:modelValue', 'test-sent'])

const { $parse } = useNuxtApp()
const toast = useToast()

// State
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const testEmail = ref('')
const selectedPayeur = ref(null)
const selectedPayeurData = ref(null)
const payeursAvecImpayes = ref([])
const loadingPayeurs = ref(false)
const sendingTest = ref(false)

// Informations sur l'email à tester (calculé depuis props.emailIndex)
const emailInfo = computed(() => {
  if (props.emailIndex === null || props.emailIndex === undefined || !props.emails[props.emailIndex]) {
    return { delai: 0, objet: 'Sans objet' }
  }
  const email = props.emails[props.emailIndex]
  const scenarioActif = email.activeScenario || 'single'
  const scenario = email.scenarios?.find(s => s?.format === scenarioActif)
  return {
    delai: email.delai || 0,
    objet: scenario?.objet || email.objet || 'Sans objet'
  }
})

// Charger uniquement les payeurs avec impayés actifs non soldés
async function chargerPayeursAvecImpayes() {
  try {
    loadingPayeurs.value = true

    // 1. D'abord, récupérer tous les impayés actifs non soldés
    const Impaye = $parse.Object.extend('Impaye')
    const impayeQuery = new $parse.Query(Impaye)
    impayeQuery.equalTo('facture_soldee', false)
    impayeQuery.include('payeur')
    impayeQuery.limit(1000)

    const impayes = await impayeQuery.find()

    // 2. Grouper les impayés par payeur et calculer les totaux
    const payeursMap = new Map()

    impayes.forEach(impaye => {
      const payeur = impaye.get('payeur')
      if (payeur) {
        const payeurId = payeur.id
        const montant = impaye.get('reste_a_payer') || 0

        if (payeursMap.has(payeurId)) {
          const existing = payeursMap.get(payeurId)
          existing.impayesCount++
          existing.impayesAmount += montant
        } else {
          payeursMap.set(payeurId, {
            id: payeurId,
            nom: payeur.get('nom') || 'Sans nom',
            email: payeur.get('email') || 'Sans email',
            impayesCount: 1,
            impayesAmount: montant
          })
        }
      }
    })

    // 3. Convertir en tableau et trier par montant décroissant
    payeursAvecImpayes.value = Array.from(payeursMap.values())
      .map(p => ({
        value: p.id,
        nom: p.nom,
        email: p.email,
        impayesCount: p.impayesCount,
        impayesAmount: p.impayesAmount
      }))
      .sort((a, b) => b.impayesAmount - a.impayesAmount)

    toast.add({
      title: 'Payeurs chargés',
      description: `${payeursAvecImpayes.value.length} payeurs avec impayés actifs trouvés`,
      color: 'green'
    })

  } catch (error) {
    console.error('Erreur chargement payeurs avec impayés:', error)
    toast.add({ title: 'Erreur', description: 'Impossible de charger les payeurs avec impayés', color: 'red' })
  } finally {
    loadingPayeurs.value = false
  }
}

// Sélectionner un payeur
async function selectPayeur(payeur) {
  selectedPayeur.value = payeur.value
  
  // Récupérer les impayés complets pour ce payeur
  try {
    const Impaye = $parse.Object.extend('Impaye')
    const impayeQuery = new $parse.Query(Impaye)
    impayeQuery.equalTo('facture_soldee', false)
    impayeQuery.greaterThan('reste_a_payer', 0)
    impayeQuery.equalTo('payeur', { __type: 'Pointer', className: 'Contact', objectId: payeur.value })
    impayeQuery.descending('date_piece')
    impayeQuery.limit(100)
    
    const impayesResults = await impayeQuery.find()
    
    // Construire l'objet payeurData avec les impayés complets
    selectedPayeurData.value = {
      objectId: payeur.value,
      nom: payeur.nom,
      email: payeur.email,
      impayesCount: payeur.impayesCount,
      impayesAmount: payeur.impayesAmount,
      impayes: impayesResults.map(imp => ({
        objectId: imp.id,
        nfacture: imp.get('nfacture'),
        reference: imp.get('reference'),
        date_piece: imp.get('date_piece'),
        date_echeance: imp.get('date_echeance'),
        total_ht: imp.get('total_ht'),
        total_ttc: imp.get('total_ttc'),
        montant_total: imp.get('montant_total'),
        reste_a_payer: imp.get('reste_a_payer'),
        url_pdf: imp.get('url_pdf')
      }))
    }
  } catch (error) {
    console.error('Erreur récupération impayés:', error)
    // Fallback: utiliser les données de base sans impayés détaillés
    selectedPayeurData.value = payeur
  }
}

// Envoyer le test
function envoyerTest() {
  if (!testEmail.value || !selectedPayeur.value) {
    toast.add({ title: 'Erreur', description: 'Veuillez remplir tous les champs', color: 'red' })
    return
  }

  // Afficher immédiatement le message de confirmation et fermer
  emit('test-sent')
  isOpen.value = false

  // Lancer l'envoi en arrière-plan sans attendre la réponse
  const currentUser = $parse.User.current()
  // Préparer les données pour l'envoi
  // Utiliser l'email_index de l'email choisi (stocké dans l'objet email)
  const selectedEmail = props.emailIndex !== null ? props.emails[props.emailIndex] : null
  const requestData = {
    sequenceId: props.sequence.id,
    testEmail: testEmail.value,
    payeurId: selectedPayeur.value,
    payeurData: selectedPayeurData.value,
    emailIndex: selectedEmail?.email_index || null,
    userId: currentUser ? currentUser.id : null,
    userEmail: currentUser ? currentUser.get('email') : null,
    userName: currentUser ? currentUser.get('username') : null
  }

  // Fire and forget - on n'attend pas la réponse
  $parse.Cloud.run('sendTestSingleEmail', requestData).catch((error) => {
    console.error('Erreur envoi test (arrière-plan):', error)
  })
}

// Charger les payeurs avec impayés automatiquement à l'ouverture
watch(() => props.modelValue, (newVal) => {
  if (newVal && payeursAvecImpayes.value.length === 0) {
    chargerPayeursAvecImpayes()
  }
})

// Réinitialiser la sélection lorsque le drawer est fermé
watch(() => props.modelValue, (newVal) => {
  if (!newVal) {
    selectedPayeur.value = null
    selectedPayeurData.value = null
  }
})
</script>

<style scoped>
/* Ajoutez des styles spécifiques si nécessaire */
</style>
