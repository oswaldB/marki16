<template>
  <UDrawer v-model:open="open" direction="right">
    <template #header>
      <p class="font-semibold">Gestion des liens de paiement</p>
    </template>

    <template #body>
      <div class="flex flex-col gap-4 p-4">
        <!-- Liste des liens existants -->
        <div>
          <p class="text-xs font-semibold text-gray-500 mb-2">Liens de paiement existants</p>
          <div v-if="liensPaiement.length > 0" class="space-y-2">
            <div v-for="lien in liensPaiement" :key="lien.id" class="border border-gray-200 rounded-lg p-2">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium">{{ lien.nom }}</p>
                  <p class="text-xs text-gray-500 break-all">{{ lien.url }}</p>
                </div>
                <div class="flex gap-1">
                  <UButton variant="ghost" size="2xs" icon="i-heroicons-pencil" @click="editerLienPaiement(lien)" />
                  <UButton variant="ghost" size="2xs" icon="i-heroicons-trash" color="red" @click="supprimerLienPaiement(lien.id)" />
                </div>
              </div>
            </div>
          </div>
          <p v-else class="text-xs text-gray-400">Aucun lien de paiement existant.</p>
        </div>

        <div class="border-t border-gray-200" />

        <!-- Variables (sans liens de paiement) -->
        <div class="border border-gray-100 rounded-lg bg-gray-50 p-2">
          <p class="text-xs font-semibold text-gray-500 mb-2">Variables</p>
          <UInput
            v-model="lienVarsSearch"
            size="xs"
            placeholder="Rechercher..."
            icon="i-heroicons-magnifying-glass"
            class="mb-2"
          />
          <div class="space-y-2">
            <div v-for="group in filteredLienVars" :key="group.groupe">
              <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{{ group.groupe }}</p>
              <div class="flex flex-wrap gap-1">
                <button
                  v-for="v in group.vars"
                  :key="v.isPaymentLink ? v.name : v"
                  class="text-xs bg-white hover:bg-sky-50 hover:text-sky-700 border border-gray-200 rounded px-1.5 py-0.5 font-mono transition-colors"
                  @click="!v.isPaymentLink && insererVariableEnLien(v)"
                >
                  {{ v.isPaymentLink ? v.display : v }}
                </button>
              </div>
            </div>
          </div>
          <p class="text-xs text-gray-400 pt-1.5 mt-1.5 border-t border-gray-100">Clic → inséré à la position du curseur</p>
        </div>

        <!-- Création / Édition -->
        <div>
          <p class="text-xs font-semibold text-gray-500 mb-2">
            {{ editingLienId ? 'Modifier le lien de paiement' : 'Créer un nouveau lien de paiement' }}
          </p>
          <div class="space-y-2">
            <div>
              <label class="text-xs text-gray-500 mb-1 block">Nom du lien</label>
              <UInput v-model="nouveauLienNom" placeholder="Nom du lien de paiement" class="w-full" />
            </div>
            <div>
              <label class="text-xs text-gray-500 mb-1 block">URL avec variables</label>
              <textarea
                ref="lienPaiementTextareaEl"
                v-model="lienPaiementEdit"
                class="w-full border border-gray-300 rounded-md p-2 font-mono text-sm resize-y min-h-24 focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="https://paiement.exemple.com?facture=[[nfacture]]&montant=[[reste_a_payer]]"
              />
              <div v-if="lienPaiementEdit" class="bg-gray-50 rounded p-2 mt-2">
                <p class="text-xs text-gray-500 mb-1">Aperçu (valeurs d'exemple)</p>
                <p class="text-xs text-sky-700 font-mono break-all">{{ lienPaiementApercu }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end p-4 w-full gap-2">
        <UButton v-if="editingLienId" variant="outline" size="sm" class="flex-1" @click="annulerEditionLien">
          Annuler
        </UButton>
        <UButton variant="outline" size="sm" class="flex-1" @click="enregistrerNouveauLienPaiement">
          {{ editingLienId ? 'Mettre à jour' : 'Créer' }}
        </UButton>
      </div>
    </template>
  </UDrawer>
</template>

<script setup>
import { useLiensPaiement } from '~/composables/useLiensPaiement'
import { VARIABLES } from '~/composables/useSequenceEditor'

const props = defineProps({
  open: { type: Boolean, default: false },
  allVariables: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:open', 'updated'])

const open = computed({
  get: () => props.open,
  set: (v) => emit('update:open', v),
})

const { $parse } = useNuxtApp()

const {
  liensPaiement,
  lienPaiementEdit,
  lienPaiementTextareaEl,
  nouveauLienNom,
  editingLienId,
  lienVarsSearch,
  lienPaiementApercu,
  chargerLiensPaiement,
  enregistrerNouveauLienPaiement: _enregistrer,
  supprimerLienPaiement: _supprimer,
  ouvrirLienModal,
  editerLienPaiement,
  annulerEditionLien,
  insererVariableEnLien,
} = useLiensPaiement($parse)

// Reload on open
watch(() => props.open, (v) => {
  if (v) chargerLiensPaiement()
})

async function enregistrerNouveauLienPaiement() {
  await _enregistrer()
  emit('updated')
}

async function supprimerLienPaiement(id) {
  await _supprimer(id)
  emit('updated')
}

// Variables filtrées (sans liens de paiement)
const filteredLienVars = computed(() => {
  const s = lienVarsSearch.value.toLowerCase()
  const allVars = props.allVariables
    .map(g => ({
      ...g,
      vars: g.vars.filter(v => !(v && typeof v === 'object' && v.isPaymentLink))
    }))
    .filter(g => g.vars.length > 0)

  if (!s) return allVars
  return allVars
    .map(g => ({
      ...g,
      vars: g.vars.filter(v => {
        const name = typeof v === 'object' ? (v.name || v.display || '') : v
        return name.toLowerCase().includes(s)
      })
    }))
    .filter(g => g.vars.length > 0)
})
</script>
