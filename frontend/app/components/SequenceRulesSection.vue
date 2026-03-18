<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <span class="font-semibold text-gray-800">RÈGLES D'ATTRIBUTION AUTOMATIQUE</span>
        <div class="flex items-center gap-3">
          <span class="text-sm text-gray-600">Activé</span>
          <ToggleSwitch v-model="attributionAutomatique" />
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Groupes de règles -->
      <div v-for="(groupe, groupeIdx) in groupesRegles" :key="groupeIdx" class="border border-gray-200 rounded-lg p-3">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <USelect v-model="groupe.logique" :items="groupeLogiqueOptions" class="w-20" />
            <span class="text-sm font-medium">Groupe {{ groupeIdx + 1 }}</span>
          </div>
          <UButton icon="i-heroicons-trash" color="red" variant="ghost" size="xs" @click="supprimerGroupe(groupeIdx)" />
        </div>

        <div class="space-y-2">
          <div v-for="(regle, regleIdx) in groupe.regles" :key="regleIdx" class="flex items-center gap-2 flex-wrap">
            <USelect
              v-model="regle.champ"
              :items="champOptions"
              class="w-44"
              @change="chargerOptionsPourChamp(regle)"
            />
            <USelect v-model="regle.operateur" :items="operateurOptions" class="w-36" />

            <USelect
              v-if="regle.options && regle.options.length > 0"
              v-model="regle.valeur"
              :items="regle.options"
              :multiple="regle.operateur === 'egal' || regle.operateur === 'different'"
              class="flex-1 min-w-32"
            >
              <template #label>
                <span v-if="regle.valeur && regle.valeur.length">{{ regle.valeur.join(', ') }}</span>
                <span v-else class="text-gray-400">
                  Sélectionner {{ regle.operateur === 'egal' || regle.operateur === 'different' ? 'des valeurs' : 'une valeur' }}
                </span>
              </template>
            </USelect>
            <UInput v-else v-model="regle.valeur" placeholder="Valeur" class="flex-1 min-w-24" />

            <UButton icon="i-heroicons-trash" color="red" variant="ghost" size="xs" @click="supprimerRegle(groupeIdx, regleIdx)" />
          </div>

          <UButton variant="outline" icon="i-heroicons-plus" size="sm" @click="ajouterRegleAuGroupe(groupeIdx)">
            Ajouter une règle
          </UButton>
        </div>
      </div>

      <div class="flex gap-2">
        <UButton variant="outline" icon="i-heroicons-plus" size="sm" @click="ajouterGroupeRegles()">
          Ajouter un groupe
        </UButton>
      </div>

      <!-- Aperçu live -->
      <div class="pt-2 flex items-center gap-4 text-sm flex-wrap">
        <span class="text-green-600 font-medium">
          <UIcon name="i-heroicons-check-circle" class="size-4" /> {{ apercuConcernes }} impayés concernés
        </span>
        <span class="text-red-500 font-medium">
          <UIcon name="i-heroicons-x-circle" class="size-4" /> {{ apercuExclus }} exclus
        </span>
        <span class="text-yellow-600 font-medium">
          <UIcon name="i-heroicons-envelope-open" class="size-4" /> {{ apercuSansEmail || 0 }} sans email
        </span>
        <UButton
          v-if="apercuConcernes > 0"
          variant="outline"
          size="xs"
          @click="showImpayesTable = !showImpayesTable"
        >
          {{ showImpayesTable ? 'Masquer' : 'Voir' }} les {{ apercuConcernes }} impayés concernés
        </UButton>
      </div>

      <!-- Tableau des impayés concernés -->
      <div v-if="showImpayesTable && apercuConcernes > 0" class="mt-4 border border-gray-200 rounded-lg overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-2 text-left font-medium text-gray-700">Facture</th>
              <th class="px-4 py-2 text-left font-medium text-gray-700">Payeur</th>
              <th class="px-4 py-2 text-left font-medium text-gray-700">Montant</th>
              <th class="px-4 py-2 text-left font-medium text-gray-700">Échéance</th>
              <th class="px-4 py-2 text-left font-medium text-gray-700">Statut</th>
              <th class="px-4 py-2 text-left font-medium text-gray-700">Déjà dans séquence</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-100">
            <tr v-for="impaye in impayesConcernes" :key="impaye.id">
              <td class="px-4 py-2 text-gray-800">{{ impaye.nfacture }}</td>
              <td class="px-4 py-2 text-gray-600">{{ impaye.payeur_nom }}</td>
              <td class="px-4 py-2 text-gray-600">{{ impaye.reste_a_payer }} €</td>
              <td class="px-4 py-2 text-gray-600">{{ impaye.date_echeance }}</td>
              <td class="px-4 py-2">
                <span class="px-2 py-1 rounded-full text-xs font-medium" :class="{
                  'bg-green-100 text-green-800': impaye.statut === 'validé',
                  'bg-yellow-100 text-yellow-800': impaye.statut === 'en attente',
                  'bg-red-100 text-red-800': impaye.statut === 'impayé',
                  'bg-gray-100 text-gray-800': !impaye.statut
                }">
                  {{ impaye.statut || 'inconnu' }}
                </span>
              </td>
              <td class="px-4 py-2 text-center">
                <UIcon v-if="impaye.dejaDansSequence" name="i-heroicons-check-circle" class="size-5 text-green-500" />
                <UIcon v-else name="i-heroicons-x-circle" class="size-5 text-gray-300" />
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="impayesConcernes.length === 0" class="p-4 text-center text-gray-400">
          Aucun impayé trouvé correspondant aux critères
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup>
import ToggleSwitch from '~/components/ToggleSwitch.vue'
import { useSequenceRules } from '~/composables/useSequenceRules'
import { champOptions, operateurOptions, groupeLogiqueOptions } from '~/composables/useSequenceEditor'

const props = defineProps({
  groupes: { type: Array, required: true },
  attributionAutomatiqueValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:groupes', 'update:attributionAutomatiqueValue'])

const { $parse } = useNuxtApp()

const {
  groupesRegles,
  attributionAutomatique,
  apercuConcernes,
  apercuExclus,
  apercuSansEmail,
  impayesConcernes,
  showImpayesTable,
  calculerApercu,
  ajouterGroupeRegles,
  supprimerGroupe,
  ajouterRegleAuGroupe,
  supprimerRegle,
  chargerOptionsPourChamp,
} = useSequenceRules($parse)

// Sync props → composable
watch(() => props.groupes, (v) => { groupesRegles.value = v }, { immediate: true })
watch(groupesRegles, (v) => emit('update:groupes', v), { deep: true })

watch(() => props.attributionAutomatiqueValue, (v) => { attributionAutomatique.value = v }, { immediate: true })
watch(attributionAutomatique, (v) => emit('update:attributionAutomatiqueValue', v))
</script>
