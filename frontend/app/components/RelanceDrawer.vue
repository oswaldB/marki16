<template>
  <UModal v-model:open="open" :title="mode === 'create' ? 'Nouvelle relance' : 'Modifier la relance'">
    <template #body>
      <div class="space-y-4">
        <!-- Date d'envoi -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Date d'envoi</label>
          <UInput v-model="form.dateEnvoi" type="date" required />
        </div>

        <!-- Objet -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Objet</label>
          <UInput v-model="form.objet" placeholder="Objet du message" />
        </div>

        <!-- Insérer une variable (mode create uniquement) -->
        <div v-if="mode === 'create'">
          <label class="block text-sm font-medium text-gray-700 mb-1">Insérer une variable dans l'objet</label>
          <USelect
            :options="variableOptions"
            value-attribute="value"
            option-attribute="label"
            placeholder="Choisir une variable..."
            @change="insererVariable"
          />
        </div>

        <!-- Corps -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Corps du message</label>
          <UTextarea v-model="form.corps" :rows="8" placeholder="Corps du message..." />
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton color="neutral" variant="ghost" @click="open = false">Annuler</UButton>
        <UButton :loading="saving" @click="soumettre">
          {{ mode === 'create' ? 'Créer' : 'Enregistrer' }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  mode: { type: String, default: 'create' }, // 'create' | 'edit'
  relance: { type: Object, default: null },   // Parse object (pour edit)
  impayelId: { type: String, default: null },
})
const emit = defineEmits(['update:modelValue', 'success'])

const { $parse } = useNuxtApp()
const toast = useToast()

const open = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const saving = ref(false)

const form = ref({ dateEnvoi: '', objet: '', corps: '' })

const variableOptions = [
  { label: '[[nfacture]] — N° facture',       value: '[[nfacture]]' },
  { label: '[[reste_a_payer]] — Reste à payer', value: '[[reste_a_payer]]' },
  { label: '[[payeur_nom]] — Nom du payeur',   value: '[[payeur_nom]]' },
  { label: '[[payeur_email]] — Email payeur',  value: '[[payeur_email]]' },
  { label: '[[date_piece]] — Date pièce',      value: '[[date_piece]]' },
]

function insererVariable(val) {
  if (val) form.value.objet += val
}

// Pré-remplir en mode edit
watch(
  () => props.relance,
  (r) => {
    if (r && props.mode === 'edit') {
      const d = r.get('dateEnvoi')
      form.value = {
        dateEnvoi: d ? d.toISOString().split('T')[0] : '',
        objet:     r.get('objet') || '',
        corps:     r.get('corps') || '',
      }
    }
  },
  { immediate: true },
)

// Réinitialiser en mode create à l'ouverture
watch(open, (val) => {
  if (val && props.mode === 'create') {
    form.value = { dateEnvoi: '', objet: '', corps: '' }
  }
})

async function soumettre() {
  if (!form.value.dateEnvoi) {
    toast.add({ title: 'Date d\'envoi obligatoire', color: 'red' })
    return
  }
  saving.value = true
  try {
    const dateEnvoi = new Date(form.value.dateEnvoi)

    if (props.mode === 'create') {
      const impayePtr = $parse.Object.extend('Impaye').createWithoutData(props.impayelId)
      const r = new $parse.Object('Relance')
      r.set('impaye',    impayePtr)
      r.set('dateEnvoi', dateEnvoi)
      r.set('objet',     form.value.objet)
      r.set('corps',     form.value.corps)
      r.set('statut',    'pending')
      r.set('manuelle',  true)
      await r.save()
    } else {
      props.relance.set('dateEnvoi', dateEnvoi)
      props.relance.set('objet',     form.value.objet)
      props.relance.set('corps',     form.value.corps)
      props.relance.set('manuelle',  true)
      await props.relance.save()
    }

    emit('success')
    open.value = false
  } catch (err) {
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
  } finally {
    saving.value = false
  }
}
</script>
