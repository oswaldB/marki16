<template>
  <USlideover
    :open="open"
    title="Attribuer une séquence"
    :description="`${payeur} · ${impayes.length} impayé${impayes.length > 1 ? 's' : ''}`"
    side="right"
    @update:open="$emit('update:open', $event)"
  >
    <template #body>
      <div class="flex flex-col gap-5 p-4">

        <!-- Sélecteur de séquence -->
        <div class="space-y-1.5">
          <label class="text-sm font-medium text-gray-700">Séquence</label>
          <USelect
            v-model="sequenceChoisie"
            :items="sequenceOptions"
            placeholder="Choisir une séquence..."
            class="w-full"
          />
        </div>

        <!-- Liste des impayés -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-700">
              Impayés ({{ impayes.length }})
            </span>
            <UButton
              size="xs"
              variant="ghost"
              color="neutral"
              @click="toggleTout"
            >
              {{ toutCoche ? 'Tout décocher' : 'Tout cocher' }}
            </UButton>
          </div>

          <div class="border border-gray-200 rounded-lg divide-y divide-gray-100 overflow-hidden">
            <label
              v-for="item in impayes"
              :key="item.objectId"
              class="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                :checked="selection.has(item.objectId)"
                class="rounded flex-shrink-0"
                @change="toggleItem(item.objectId)"
              />
              <span class="font-mono text-sm text-gray-700 w-28 flex-shrink-0">{{ item.nfacture }}</span>
              <span class="text-sm font-medium flex-1">{{ formatMontant(item.reste_a_payer) }}</span>
              <UBadge
                v-if="item.sequenceNom"
                color="sky"
                variant="subtle"
                size="sm"
                class="flex-shrink-0 max-w-[140px] truncate"
              >
                {{ item.sequenceNom }}
              </UBadge>
              <span v-else class="text-gray-400 text-xs flex-shrink-0">—</span>
            </label>
          </div>
        </div>

      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 p-4">
        <UButton color="neutral" variant="ghost" @click="$emit('update:open', false)">
          Annuler
        </UButton>
        <UButton
          :loading="assigning"
          :disabled="!sequenceChoisie || selection.size === 0"
          @click="attribuer"
        >
          Attribuer ({{ selection.size }})
        </UButton>
      </div>
    </template>
  </USlideover>
</template>

<script setup>
const { $parse } = useNuxtApp()
const toast = useToast()

const props = defineProps({
  open:      { type: Boolean, required: true },
  payeur:    { type: String,  default: '' },
  impayes:   { type: Array,   default: () => [] },
  sequences: { type: Array,   default: () => [] },
})

const emit = defineEmits(['update:open', 'assigned'])

// ── État interne ──
const selection = ref(new Set())
const sequenceChoisie = ref(null)
const assigning = ref(false)

// Initialiser la sélection quand les impayés changent (ouverture du drawer)
watch(() => props.impayes, (items) => {
  selection.value = new Set(items.map(i => i.objectId))
  sequenceChoisie.value = null
}, { immediate: true })

// ── Computed ──
const sequenceOptions = computed(() =>
  props.sequences.map(s => ({ label: s.get('nom'), value: s.id }))
)

const toutCoche = computed(() => selection.value.size === props.impayes.length)

// ── Actions ──
function toggleItem(objectId) {
  const s = new Set(selection.value)
  if (s.has(objectId)) s.delete(objectId)
  else s.add(objectId)
  selection.value = s
}

function toggleTout() {
  if (toutCoche.value) {
    selection.value = new Set()
  } else {
    selection.value = new Set(props.impayes.map(i => i.objectId))
  }
}

function formatMontant(val) {
  if (val == null) return '—'
  return Number(val).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

async function attribuer() {
  if (!sequenceChoisie.value || selection.value.size === 0) return

  assigning.value = true
  try {
    const cibles = props.impayes.filter(i => selection.value.has(i.objectId))

    for (const item of cibles) {
      // Mise à jour directe en frontend au lieu d'appeler le cloud
      const impayeObj = $parse.Object.extend('Impaye').createWithoutData(item.objectId)
      const sequenceObj = $parse.Object.extend('Sequence').createWithoutData(sequenceChoisie.value)
      impayeObj.set('sequence', sequenceObj)
      await impayeObj.save()
      
      // Mettre à jour directement dans le store pour la réactivité
      const impayeIndex = useImpayesStore().allImpayes.findIndex(i => i.objectId === item.objectId)
      if (impayeIndex !== -1) {
        useImpayesStore().allImpayes[impayeIndex] = useImpayesStore().rowToPlain(impayeObj)
      }
      
      // Appeler la fonction cloud pour créer les relances
      try {
        await $parse.Cloud.run('createOneRelanceWithTemplates', { impayeId: item.objectId })
        console.log(`Relances créées pour l'impayé ${item.objectId}`)
      } catch (error) {
        console.error(`Erreur création relances pour ${item.objectId}:`, error)
        // Ne pas bloquer l'assignation même si la création des relances échoue
      }
    }

    toast.add({
      title: `Séquence assignée à ${cibles.length} impayé${cibles.length > 1 ? 's' : ''}`,
      color: 'green',
    })

    emit('update:open', false)
    emit('assigned')
    
  } catch (err) {
    toast.add({ title: 'Erreur lors de l\'attribution', description: err.message, color: 'red' })
  } finally {
    assigning.value = false
  }
}
</script>
