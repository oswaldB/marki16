<template>
  <USlideover v-model:open="isOpen">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <span class="font-semibold">Tester la séquence</span>
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
            Sélectionnez un payeur pour tester la séquence avec ses données
          </p>
        </div>

        <!-- Résumé des emails à envoyer -->
        <div>
          <h3 class="text-sm font-medium text-gray-700 mb-2">Emails qui seront envoyés</h3>
          <div class="space-y-2">
            <div
              v-for="(email, index) in emailsToSend"
              :key="index"
              class="bg-gray-50 rounded-lg p-3 text-sm"
            >
              <div class="flex items-start gap-2">
                <UIcon name="i-heroicons-envelope" class="size-4 text-gray-500 mt-0.5" />
                <div class="flex-1">
                  <p class="font-medium">Email {{ index + 1 }}: {{ email.objet || 'Sans objet' }}</p>
                  <p class="text-xs text-gray-500">Délai: {{ email.delai }} jours</p>
                </div>
              </div>
            </div>
          </div>
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
          :disabled="!testEmail || !selectedPayeur || emailsToSend.length === 0"
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
  emails: { type: Array, required: true }
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

// Charger uniquement les payeurs avec impayés actifs non soldés
async function chargerPayeursAvecImpayes() {
  try {
    loadingPayeurs.value = true

    // 1. D'abord, récupérer tous les impayés actifs non soldés
    const Impaye = $parse.Object.extend('Impaye')
    const impayeQuery = new $parse.Query(Impaye)
    impayeQuery.equalTo('facture_soldee', false)
    impayeQuery.include('payeur')
    impayeQuery.limit(1000) // Limiter à 1000 impayés pour éviter la surcharge

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
function selectPayeur(payeur) {
  selectedPayeur.value = payeur.value
  selectedPayeurData.value = payeur
}

// Emails à envoyer (basé sur les emails de la séquence) - pour affichage uniquement
const emailsToSend = computed(() => {
  return props.emails
    .filter(email => {
      // Filtrer les emails actifs
      if (!email || !email.activeScenario) return false;
      
      // Vérifier que scenarios existe et n'est pas vide
      if (!email.scenarios || !Array.isArray(email.scenarios)) return false;
      
      const scenario = email.scenarios.find(s => s && s.format === email.activeScenario);
      return scenario && scenario.active !== false;
    })
    .map(email => {
      const scenario = email.scenarios.find(s => s && s.format === email.activeScenario);
      return {
        delai: email.delai || 0,
        objet: scenario?.objet || email.objet || 'Sans objet',
        corps: scenario?.corps || email.corps || '',
        smtp: scenario?.smtp || email.smtp || ''
      };
    })
    .filter(email => email.objet || email.corps); // Filtrer les emails vides
})

// Envoyer le test
async function envoyerTest() {
  if (!testEmail.value || !selectedPayeur.value) {
    toast.add({ title: 'Erreur', description: 'Veuillez remplir tous les champs', color: 'red' })
    return
  }

  // Vérifier que nous avons des emails à envoyer
  if (emailsToSend.value.length === 0) {
    toast.add({ title: 'Erreur', description: 'Aucun email valide à envoyer', color: 'red' })
    return
  }

  try {
    sendingTest.value = true
    console.log('Envoi test avec données:', {
      sequenceId: props.sequence.id,
      testEmail: testEmail.value,
      payeurId: selectedPayeur.value,
      payeurData: selectedPayeurData.value,
      emails: emailsToSend.value
    });

    // Appeler le cloud code pour envoyer les emails de test
    // Envoyer les emails originaux avec des informations supplémentaires
    const currentUser = await $parse.User.current()
    
    // Préparer les données à envoyer
    const requestData = {
      sequenceId: props.sequence.id,
      testEmail: testEmail.value,
      payeurId: selectedPayeur.value,
      payeurData: selectedPayeurData.value,
      emails: props.emails, // Envoyer les emails originaux avec leur structure complète
      userId: currentUser ? currentUser.id : null,
      userEmail: currentUser ? currentUser.get('email') : null,
      userName: currentUser ? currentUser.get('username') : null
    };
    

    
    const result = await $parse.Cloud.run('sendSequenceTest', requestData)

    console.log('Résultat cloud function:', result);

    toast.add({
      title: 'Test envoyé',
      description: `${result.sentEmails || 'des'} emails de test ont été envoyés à ${testEmail.value}`,
      color: 'green'
    })

    emit('test-sent')
    isOpen.value = false
  } catch (error) {
    console.error('Erreur envoi test complète:', error)

    // Extraire plus d'informations de l'erreur
    let errorMessage = 'Impossible d\'envoyer le test';
    if (error && error.message) {
      errorMessage = error.message;
    }
    if (error && error.code) {
      errorMessage += ` (Code: ${error.code})`;
    }

    toast.add({
      title: 'Erreur',
      description: errorMessage,
      color: 'red',
      timeout: 0
    })
  } finally {
    sendingTest.value = false
  }
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