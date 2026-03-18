<template>
  <USlideover v-model:open="open">
    <template #title>
      {{ mode === 'create' ? 'Nouvelle relance' : 'Modifier la relance' }}
    </template>

    <template #body>
      <div class="p-6 space-y-4">
        <!-- Destinataires -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Destinataires (To)</label>
          <UInput v-model="form.to" placeholder="email1@example.com, email2@example.com" class="w-full" />
        </div>

        <!-- Date d'envoi -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Date d'envoi</label>
          <UInput v-model="form.dateEnvoi" type="date" required class="w-full" />
        </div>

        <!-- Objet -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Objet</label>
          <UInput v-model="form.objet" placeholder="Objet du message" class="w-full" />
        </div>

        <!-- Corps -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Corps du message</label>
          <div class="border border-gray-200 rounded-md overflow-hidden">
            <ToastuiEditor
              ref="editorRef"
              :initial-value="form.corps"
              :options="editorOptions"
              initial-edit-type="wysiwyg"
            />
          </div>
        </div>

        <!-- Variables -->
        <VariablesPicker
          :variables="allVariables"
          @copy="insererVariable"
          @copy-payment-link="insererLienPaiement"
        />
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
  </USlideover>
</template>

<script setup>
import ToastuiEditor from '~/components/ToastuiEditor.vue'
import VariablesPicker from '~/components/VariablesPicker.vue'
import { editorOptions, VARIABLES } from '~/composables/useSequenceEditor'

const props = defineProps({
  modelValue:  { type: Boolean, default: false },
  mode:        { type: String,  default: 'create' },
  relance:     { type: Object,  default: null },
  impayelId:   { type: String,  default: null },
  relances:    { type: Array,   default: () => [] },
})
const emit = defineEmits(['update:modelValue', 'success'])

const { $parse } = useNuxtApp()
const toast = useToast()

const open = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const saving = ref(false)
const editorRef = ref(null)
const liensPaiement = ref([])

const form = ref({ dateEnvoi: '', objet: '', corps: '', to: '' })

// Variables des relances précédentes
const relanceVars = computed(() =>
  props.relances.map((r, i) => ({
    groupe: `RELANCE ${i + 1} — ${r.objet || '(sans objet)'}`,
    vars: [`relance.${i + 1}.objet`, `relance.${i + 1}.dateEnvoi`],
  }))
)

// Variables liens de paiement
const liensPaiementVars = computed(() => {
  if (!liensPaiement.value.length) return []
  return [{
    groupe: 'LIENS DE PAIEMENT',
    vars: liensPaiement.value.map(l => ({
      name: `lien_paiement_${l.id}`,
      display: l.nom,
      url: l.url,
      isPaymentLink: true,
    })),
  }]
})

const allVariables = computed(() => [
  ...VARIABLES,
  ...liensPaiementVars.value,
  ...relanceVars.value,
])

async function chargerLiensPaiement() {
  try {
    const q = new $parse.Query('LienPaiement')
    q.limit(100)
    const results = await q.find()
    liensPaiement.value = results.map(l => ({
      id:  l.id,
      nom: l.get('nom') || l.get('name') || l.id,
      url: l.get('url') || '',
    }))
  } catch { /* silencieux */ }
}

function insererVariable(varName) {
  editorRef.value?.getInstance()?.insertText(`[[${varName}]]`)
}

function insererLienPaiement(lien) {
  editorRef.value?.getInstance()?.insertText(lien.url)
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
        to:        r.get('to') || '',
      }
    }
  },
  { immediate: true },
)

watch(open, (val) => {
  if (!val) return
  chargerLiensPaiement()
  if (props.mode === 'create') {
    form.value = { dateEnvoi: '', objet: '', corps: '' }
    nextTick(() => editorRef.value?.getInstance()?.setHTML(''))
  } else if (props.mode === 'edit' && props.relance) {
    nextTick(() => editorRef.value?.getInstance()?.setHTML(form.value.corps || ''))
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
    const corps = editorRef.value?.getInstance()?.getHTML() || ''

    if (props.mode === 'create') {
      const impayePtr = $parse.Object.extend('Impaye').createWithoutData(props.impayelId)
      const r = new $parse.Object('Relance')
      r.set('impaye',    impayePtr)
      r.set('dateEnvoi', dateEnvoi)
      r.set('objet',     form.value.objet)
      r.set('corps',     corps)
      r.set('to',        form.value.to)
      r.set('statut',    'pending')
      r.set('manuelle',  true)
      await r.save()
    } else {
      props.relance.set('dateEnvoi', dateEnvoi)
      props.relance.set('objet',     form.value.objet)
      props.relance.set('corps',     corps)
      props.relance.set('to',        form.value.to)
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
