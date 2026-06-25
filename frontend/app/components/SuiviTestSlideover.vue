<template>
  <USlideover v-model:open="isOpen">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <span class="font-semibold">Tester l'email de suivi</span>
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

        <!-- Informations sur le filtre appliqué -->
        <div v-if="hasReglesAttribution" class="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div class="flex items-start gap-2">
            <UIcon name="i-heroicons-funnel" class="size-4 text-blue-600 mt-0.5" />
            <div class="flex-1">
              <p class="text-sm font-medium text-blue-800">Filtre actif : Règles d'attribution</p>
              <p class="text-xs text-blue-600 mt-1">
                Seuls les payeurs correspondant aux règles d'attribution automatique sont affichés.
              </p>
            </div>
          </div>
        </div>
        <div v-else class="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div class="flex items-start gap-2">
            <UIcon name="i-heroicons-information-circle" class="size-4 text-amber-600 mt-0.5" />
            <div class="flex-1">
              <p class="text-sm font-medium text-amber-800">Aucune règle d'attribution</p>
              <p class="text-xs text-amber-600 mt-1">
                Tous les payeurs avec au moins un impayé actif sont affichés.
              </p>
            </div>
          </div>
        </div>

        <!-- Liste des payeurs -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-medium text-gray-700">
              {{ hasReglesAttribution ? 'Payeurs conformes aux règles' : 'Payeurs avec impayés actifs' }}
            </h3>
            <UButton
              icon="i-heroicons-arrow-path"
              variant="outline"
              size="2xs"
              :loading="loadingPayeurs"
              @click="chargerPayeurs"
            >
              Actualiser
            </UButton>
          </div>

          <div v-if="loadingPayeurs" class="text-center py-6">
            <UIcon name="i-heroicons-arrow-path" class="size-6 animate-spin mx-auto text-gray-400" />
            <p class="text-xs text-gray-500 mt-2">Chargement des payeurs...</p>
          </div>

          <div v-else>
            <div v-if="payeurs.length === 0" class="text-center py-6 text-gray-400">
              <UIcon name="i-heroicons-information-circle" class="size-6 mx-auto mb-2" />
              <p class="text-sm">
                {{ hasReglesAttribution 
                  ? 'Aucun payeur ne correspond aux règles d\'attribution' 
                  : 'Aucun payeur avec impayés actifs trouvé' 
                }}
              </p>
            </div>

            <div v-else class="space-y-2 max-h-72 overflow-y-auto">
              <div
                v-for="payeur in payeurs"
                :key="payeur.value"
                class="p-3 border rounded-lg hover:border-blue-300 cursor-pointer transition-colors"
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
                    <div class="text-xs font-bold text-red-600">{{ formatMontant(payeur.impayesAmount) }}</div>
                  </div>
                </div>
                <!-- Tags de conformité aux règles -->
                <div v-if="hasReglesAttribution && payeur.reglesMatch" class="mt-2 flex flex-wrap gap-1">
                  <UBadge
                    v-for="(match, idx) in payeur.reglesMatch.slice(0, 3)"
                    :key="idx"
                    color="blue"
                    variant="subtle"
                    size="2xs"
                  >
                    {{ match }}
                  </UBadge>
                  <UBadge
                    v-if="payeur.reglesMatch.length > 3"
                    color="gray"
                    variant="subtle"
                    size="2xs"
                  >
                    +{{ payeur.reglesMatch.length - 3 }}
                  </UBadge>
                </div>
              </div>
            </div>
          </div>

          <p class="text-xs text-gray-500 mt-2">
            Sélectionnez un payeur pour tester l'email de suivi avec ses données
          </p>
        </div>

        <!-- Informations sur l'email de suivi à tester -->
        <div v-if="emailSuiviInfo">
          <h3 class="text-sm font-medium text-gray-700 mb-2">Email de suivi à tester</h3>
          <div class="bg-gray-50 rounded-lg p-3 text-sm">
            <div class="flex items-start gap-2">
              <UIcon name="i-heroicons-envelope" class="size-4 text-gray-500 mt-0.5" />
              <div class="flex-1">
                <p class="font-medium">Objet: {{ emailSuiviInfo.objet || 'Sans objet' }}</p>
                <p class="text-xs text-gray-500 mt-1">
                  Fréquence: {{ formatFrequence(emailSuiviInfo.frequence) }}
                </p>
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
  groupesRegles: { type: Array, default: () => [] },
  attributionAutomatique: { type: Boolean, default: false }
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
const payeurs = ref([])
const loadingPayeurs = ref(false)
const sendingTest = ref(false)

// Vérifier si la séquence a des règles d'attribution
const hasReglesAttribution = computed(() => {
  if (!props.attributionAutomatique) return false
  if (!props.groupesRegles || props.groupesRegles.length === 0) return false
  
  // Vérifier qu'au moins un groupe a des règles valides
  return props.groupesRegles.some(groupe => 
    groupe.regles && groupe.regles.some(regle => 
      regle.champ && regle.valeur !== '' && regle.valeur !== null && 
      (!Array.isArray(regle.valeur) || regle.valeur.length > 0)
    )
  )
})

// Informations sur l'email de suivi (prend le premier email actif)
const emailSuiviInfo = computed(() => {
  if (!props.emails || props.emails.length === 0) return null
  
  const email = props.emails[0]
  if (!email) return null
  
  const scenarioActif = email.activeScenario || 'single'
  const scenario = email.scenarios?.find(s => s?.format === scenarioActif)
  
  return {
    objet: scenario?.objet || email.objet || 'Sans objet',
    frequence: email.frequence || { type: 'hebdomadaire' }
  }
})

// Formater le montant
function formatMontant(amount) {
  if (amount === undefined || amount === null) return '-'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Formater la fréquence
function formatFrequence(frequence) {
  if (!frequence) return 'Non définie'
  
  const types = {
    'quotidien': 'Quotidien',
    'hebdomadaire': 'Hebdomadaire',
    'mensuel': 'Mensuel'
  }
  
  const type = types[frequence.type] || frequence.type
  
  if (frequence.type === 'quotidien' && frequence.hour) {
    return `${type} à ${frequence.hour}h00`
  }
  if (frequence.type === 'hebdomadaire' && frequence.dayOfWeek) {
    const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
    return `${type} - ${jours[parseInt(frequence.dayOfWeek)]}`
  }
  if (frequence.type === 'mensuel' && frequence.dayOfMonth) {
    const jour = frequence.dayOfMonth === 'last' ? 'dernier jour' : `${frequence.dayOfMonth} du mois`
    return `${type} - ${jour}`
  }
  
  return type
}

// Construire la requête Parse à partir des règles d'attribution
function buildImpayeQueryFromRegles() {
  const queries = []
  
  for (const groupe of props.groupesRegles) {
    const groupeQueries = []
    
    for (const regle of groupe.regles) {
      if (!regle.champ || regle.valeur === '' || regle.valeur === null) continue
      if (Array.isArray(regle.valeur) && regle.valeur.length === 0) continue
      
      const q = new $parse.Query('Impaye')
      
      switch (regle.operateur) {
        case 'egal':
          Array.isArray(regle.valeur)
            ? q.containedIn(regle.champ, regle.valeur)
            : q.equalTo(regle.champ, regle.valeur)
          break
        case 'different':
          Array.isArray(regle.valeur)
            ? q.notContainedIn(regle.champ, regle.valeur)
            : q.notEqualTo(regle.champ, regle.valeur)
          break
        case 'superieur':
          q.greaterThan(regle.champ, Number(regle.valeur))
          break
        case 'inferieur':
          q.lessThan(regle.champ, Number(regle.valeur))
          break
        case 'contient':
          q.contains(regle.champ, regle.valeur)
          break
      }
      
      groupeQueries.push(q)
    }
    
    if (groupeQueries.length > 0) {
      // Combiner avec AND pour ce groupe
      let groupeFinalQuery = groupeQueries[0]
      for (let i = 1; i < groupeQueries.length; i++) {
        groupeFinalQuery = $parse.Query.and(groupeFinalQuery, groupeQueries[i])
      }
      queries.push(groupeFinalQuery)
    }
  }
  
  if (queries.length === 0) return null
  
  // Combiner les groupes avec OR
  let finalQuery = queries[0]
  for (let i = 1; i < queries.length; i++) {
    finalQuery = $parse.Query.or(finalQuery, queries[i])
  }
  
  return finalQuery
}

// Charger les payeurs (filtrés ou non selon les règles)
async function chargerPayeurs() {
  try {
    loadingPayeurs.value = true
    
    let impayesQuery
    
    if (hasReglesAttribution.value) {
      // Appliquer les règles d'attribution
      impayesQuery = buildImpayeQueryFromRegles()
      if (!impayesQuery) {
        // Si les règles ne produisent pas de requête valide, charger tous les impayés
        impayesQuery = new $parse.Query('Impaye')
      }
    } else {
      // Pas de règles : charger tous les impayés actifs
      impayesQuery = new $parse.Query('Impaye')
    }
    
    // Filtres communs : impayés actifs non soldés
    impayesQuery.equalTo('facture_soldee', false)
    impayesQuery.greaterThan('reste_a_payer', 0)
    impayesQuery.include('payeur')
    impayesQuery.limit(1000)
    
    const impayes = await impayesQuery.find()
    
    // Grouper par payeur
    const payeursMap = new Map()
    
    impayes.forEach(impaye => {
      const payeur = impaye.get('payeur')
      if (payeur) {
        const payeurId = payeur.id
        const montant = impaye.get('reste_a_payer') || 0
        
        // Collecter les règles correspondantes
        const reglesMatch = []
        if (hasReglesAttribution.value) {
          // Déterminer quelles règles correspondent
          props.groupesRegles.forEach((groupe, gIdx) => {
            groupe.regles.forEach((regle, rIdx) => {
              if (regle.champ && impaye.get(regle.champ) !== undefined) {
                const valeurImpaye = impaye.get(regle.champ)
                const valeurRegle = regle.valeur
                let match = false
                
                switch (regle.operateur) {
                  case 'egal':
                    match = Array.isArray(valeurRegle) 
                      ? valeurRegle.includes(valeurImpaye)
                      : valeurImpaye === valeurRegle
                    break
                  case 'different':
                    match = Array.isArray(valeurRegle)
                      ? !valeurRegle.includes(valeurImpaye)
                      : valeurImpaye !== valeurRegle
                    break
                  case 'superieur':
                    match = Number(valeurImpaye) > Number(valeurRegle)
                    break
                  case 'inferieur':
                    match = Number(valeurImpaye) < Number(valeurRegle)
                    break
                  case 'contient':
                    match = String(valeurImpaye).includes(valeurRegle)
                    break
                }
                
                if (match) {
                  reglesMatch.push(`${regle.champ}: ${valeurRegle}`)
                }
              }
            })
          })
        }
        
        if (payeursMap.has(payeurId)) {
          const existing = payeursMap.get(payeurId)
          existing.impayesCount++
          existing.impayesAmount += montant
          existing.impayes.push(impaye)
        } else {
          payeursMap.set(payeurId, {
            id: payeurId,
            nom: payeur.get('nom') || 'Sans nom',
            email: payeur.get('email') || 'Sans email',
            impayesCount: 1,
            impayesAmount: montant,
            impayes: [impaye],
            reglesMatch: reglesMatch
          })
        }
      }
    })
    
    // Convertir en tableau et trier par montant décroissant
    payeurs.value = Array.from(payeursMap.values())
      .map(p => ({
        value: p.id,
        nom: p.nom,
        email: p.email,
        impayesCount: p.impayesCount,
        impayesAmount: p.impayesAmount,
        impayes: p.impayes,
        reglesMatch: p.reglesMatch
      }))
      .sort((a, b) => b.impayesAmount - a.impayesAmount)
    
    const message = hasReglesAttribution.value
      ? `${payeurs.value.length} payeurs conformes aux règles trouvés`
      : `${payeurs.value.length} payeurs avec impayés actifs trouvés`
    
    toast.add({
      title: 'Payeurs chargés',
      description: message,
      color: 'green'
    })
    
  } catch (error) {
    console.error('Erreur chargement payeurs:', error)
    toast.add({ 
      title: 'Erreur', 
      description: 'Impossible de charger les payeurs', 
      color: 'red' 
    })
  } finally {
    loadingPayeurs.value = false
  }
}

// Sélectionner un payeur
async function selectPayeur(payeur) {
  selectedPayeur.value = payeur.value
  
  try {
    // Récupérer les impayés complets pour ce payeur
    const Contact = $parse.Object.extend('Contact')
    const contactQuery = new $parse.Query(Contact)
    const contact = await contactQuery.get(payeur.value)
    
    const Impaye = $parse.Object.extend('Impaye')
    const impayeQuery = new $parse.Query(Impaye)
    impayeQuery.equalTo('facture_soldee', false)
    impayeQuery.greaterThan('reste_a_payer', 0)
    impayeQuery.equalTo('payeur', contact)
    impayeQuery.descending('date_piece')
    impayeQuery.limit(100)
    
    const impayesResults = await impayeQuery.find()
    
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
    selectedPayeurData.value = payeur
  }
}

// Envoyer le test
function envoyerTest() {
  if (!testEmail.value || !selectedPayeur.value) {
    toast.add({ 
      title: 'Erreur', 
      description: 'Veuillez remplir tous les champs', 
      color: 'red' 
    })
    return
  }
  
  // Afficher immédiatement le message de confirmation et fermer
  emit('test-sent')
  isOpen.value = false
  
  // Lancer l'envoi en arrière-plan sans attendre la réponse
  $parse.User.current().then((currentUser) => {
    const requestData = {
      sequenceId: props.sequence.id,
      testEmail: testEmail.value,
      payeurId: selectedPayeur.value,
      payeurData: selectedPayeurData.value,
      emailIndex: 0,
      userId: currentUser ? currentUser.id : null,
      userEmail: currentUser ? currentUser.get('email') : null,
      userName: currentUser ? currentUser.get('username') : null
    }
    
    // Fire and forget - on n'attend pas la réponse
    $parse.Cloud.run('sendTestSingleSuivi', requestData).catch((error) => {
      console.error('Erreur envoi test (arrière-plan):', error)
    })
  })
}

// Charger les payeurs automatiquement à l'ouverture
watch(() => props.modelValue, (newVal) => {
  if (newVal && payeurs.value.length === 0) {
    chargerPayeurs()
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
/* Styles spécifiques si nécessaire */
</style>
