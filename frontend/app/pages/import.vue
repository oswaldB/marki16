<template>
  <div class="max-w-4xl mx-auto space-y-6">

    <!-- Indicateur d'étapes -->
    <div class="flex items-center gap-0">
      <template v-for="(step, idx) in steps" :key="step.label">
        <div class="flex items-center gap-2">
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors"
            :class="stepCircleClass(idx)"
          >
            <UIcon v-if="idx < currentStep" name="i-heroicons-check" class="size-4" />
            <span v-else>{{ idx + 1 }}</span>
          </div>
          <span class="text-sm font-medium" :class="idx <= currentStep ? 'text-gray-900' : 'text-gray-400'">
            {{ step.label }}
          </span>
        </div>
        <div v-if="idx < steps.length - 1" class="flex-1 h-px mx-3" :class="idx < currentStep ? 'bg-sky-500' : 'bg-gray-200'" />
      </template>
    </div>

    <!-- ── Étape 1 : Upload ──────────────────────────────────────────────────── -->
    <UCard v-if="currentStep === 0">
      <template #header>
        <h3 class="text-base font-semibold text-gray-900">Sélectionner les PDFs</h3>
        <p class="mt-0.5 text-sm text-gray-500">Glissez vos fichiers ou cliquez pour parcourir</p>
      </template>

      <!-- Zone de dépôt -->
      <div
        class="border-2 border-dashed rounded-lg p-10 text-center transition-colors cursor-pointer"
        :class="isDragging ? 'border-sky-400 bg-sky-50' : 'border-gray-300 hover:border-gray-400'"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="onDrop"
        @click="fileInput?.click()"
      >
        <UIcon name="i-heroicons-document-arrow-up" class="mx-auto size-12 text-gray-300 mb-3" />
        <p class="text-sm font-medium text-gray-700">Glissez vos PDFs ici</p>
        <p class="text-xs text-gray-400 mt-1">Un ou plusieurs fichiers, 20 Mo max par fichier</p>
        <input ref="fileInput" type="file" accept="application/pdf" multiple class="hidden" @change="onFileSelect" />
      </div>

      <!-- Liste des fichiers sélectionnés -->
      <ul v-if="selectedFiles.length" class="mt-4 space-y-2">
        <li
          v-for="(file, idx) in selectedFiles"
          :key="idx"
          class="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-md text-sm"
        >
          <UIcon name="i-heroicons-document-text" class="size-4 text-gray-400 shrink-0" />
          <span class="flex-1 truncate text-gray-700">{{ file.name }}</span>
          <span class="text-xs text-gray-400 shrink-0">{{ formatSize(file.size) }}</span>
          <UButton icon="i-heroicons-x-mark" color="neutral" variant="ghost" size="xs" @click="removeFile(idx)" />
        </li>
      </ul>

      <template #footer>
        <div class="flex justify-between items-center">
          <span class="text-sm text-gray-500">
            {{ selectedFiles.length ? `${selectedFiles.length} fichier(s) sélectionné(s)` : 'Aucun fichier' }}
          </span>
          <UButton
            :disabled="!selectedFiles.length || uploading"
            :loading="uploading"
            icon="i-heroicons-sparkles"
            trailing
            @click="runUploadAndParse"
          >
            Analyser avec Mistral
          </UButton>
        </div>
        <p v-if="uploadError" class="mt-2 text-sm text-red-600">{{ uploadError }}</p>
      </template>
    </UCard>

    <!-- ── Étape 2 : Révision ────────────────────────────────────────────────── -->
    <template v-if="currentStep === 1">
      <UAlert
        v-if="parsedFiles.some(f => f.parseError)"
        color="warning"
        icon="i-heroicons-exclamation-triangle"
        title="Certains fichiers n'ont pas pu être analysés"
        description="Vous pouvez saisir les informations manuellement dans les champs vides."
        class="mb-2"
      />

      <UCard v-for="(file, fi) in parsedFiles" :key="file.id" class="mb-4">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-document-text" class="size-4 text-gray-400" />
            <span class="font-medium text-gray-900">{{ file.originalName }}</span>
            <UBadge v-if="file.parseError" color="warning" variant="subtle" size="sm">Non analysé</UBadge>
            <UBadge v-else color="success" variant="subtle" size="sm">Analysé</UBadge>
          </div>
        </template>

        <div class="grid grid-cols-2 gap-4">
          <!-- Facture -->
          <div class="space-y-3">
            <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">Facture</p>
            <ImportField v-model="editedData[fi].nfacture" label="N° Facture" />
            <ImportField v-model="editedData[fi].ndossier" label="N° Dossier" />
            <ImportField v-model="editedData[fi].ref_piece" label="Réf. pièce" placeholder="ex: FA260121 50319" />
            <ImportField v-model="editedData[fi].date_piece" label="Date pièce" placeholder="YYYY-MM-DD" />
            <ImportField v-model="editedData[fi].montant_ht" label="Montant HT (€)" />
            <ImportField v-model="editedData[fi].montant_ttc" label="Montant TTC (€)" />
            <ImportField v-model="editedData[fi].reste_a_payer" label="Reste à payer (€)" />
          </div>

          <!-- Contact payeur -->
          <div class="space-y-3">
            <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">Contact payeur</p>
            <ImportField v-model="editedData[fi].payeur_nom" label="Nom" required />
            <ImportField v-model="editedData[fi].payeur_email" label="Email" />
            <ImportField v-model="editedData[fi].payeur_telephone" label="Téléphone" />
            <ImportField v-model="editedData[fi].payeur_type" label="Type" placeholder="Propriétaire, Locataire…" />
          </div>

          <!-- Bien -->
          <div class="space-y-3">
            <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">Bien</p>
            <ImportField v-model="editedData[fi].adresse" label="Adresse" />
            <ImportField v-model="editedData[fi].lot" label="Lot" />
            <ImportField v-model="editedData[fi].etage" label="Étage" />
            <ImportField v-model="editedData[fi].porte" label="Porte" />
          </div>

          <!-- Autres -->
          <div class="space-y-3">
            <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">Autres</p>
            <ImportField v-model="editedData[fi].date_intervention" label="Date intervention" placeholder="YYYY-MM-DD" />
            <ImportField v-model="editedData[fi].employe" label="Employé" />
            <ImportField v-model="editedData[fi].commentaire" label="Commentaire" />
          </div>
        </div>
      </UCard>

      <div class="flex justify-between">
        <UButton color="neutral" variant="outline" icon="i-heroicons-arrow-left" @click="currentStep = 0">
          Retour
        </UButton>
        <UButton
          :loading="importing"
          :disabled="importing"
          icon="i-heroicons-arrow-down-tray"
          trailing
          @click="runImport"
        >
          Importer
        </UButton>
      </div>
      <p v-if="importError" class="mt-2 text-sm text-red-600 text-right">{{ importError }}</p>
    </template>

    <!-- ── Étape 3 : Résumé ──────────────────────────────────────────────────── -->
    <UCard v-if="currentStep === 2">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-check-circle" class="size-6 text-green-500" />
          <h3 class="text-base font-semibold text-gray-900">Import terminé</h3>
        </div>
      </template>

      <dl class="divide-y divide-gray-100">
        <SummaryRow label="Impayés importés" :value="importStats.imported" color="text-green-600" />
        <SummaryRow label="Contacts créés" :value="importStats.contactsCreated" color="text-sky-600" />
        <SummaryRow label="Contacts mis à jour" :value="importStats.contactsUpdated" color="text-gray-700" />
        <SummaryRow
          label="Impayés sans séquence"
          :value="importStats.noSequence"
          color="text-orange-600"
        />
        <SummaryRow
          label="Contacts sans email"
          :value="importStats.noEmail"
          color="text-orange-600"
        />
      </dl>

      <ul v-if="importStats.errors?.length" class="mt-4 space-y-1">
        <li
          v-for="(e, i) in importStats.errors"
          :key="i"
          class="text-sm text-red-600 flex gap-2"
        >
          <UIcon name="i-heroicons-exclamation-circle" class="size-4 shrink-0 mt-0.5" />
          <span>{{ e.file }} — {{ e.error }}</span>
        </li>
      </ul>

      <template #footer>
        <div class="flex flex-wrap gap-3">
          <UButton color="neutral" variant="outline" @click="resetWizard">
            Nouvel import
          </UButton>
          <UButton v-if="importStats.noSequence" color="warning" variant="outline" to="/impayes">
            Voir les impayés sans séquence
          </UButton>
          <UButton v-if="importStats.noEmail" color="warning" variant="outline" to="/contacts/sans-email">
            Voir les contacts sans email
          </UButton>
          <UButton to="/impayes">
            Aller aux impayés
          </UButton>
        </div>
      </template>
    </UCard>

  </div>
</template>

<script setup>
// ── Composants inline ──────────────────────────────────────────────────────────

const ImportField = defineComponent({
  props: {
    modelValue: { default: null },
    label: String,
    placeholder: String,
    required: Boolean,
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const isEmpty = computed(() => props.modelValue === null || props.modelValue === undefined || props.modelValue === '')
    return () => h('div', { class: 'flex flex-col gap-1' }, [
      h('label', { class: 'text-xs text-gray-500' }, [
        props.label,
        props.required ? h('span', { class: 'text-red-500 ml-0.5' }, '*') : null,
      ]),
      h('input', {
        value: props.modelValue ?? '',
        placeholder: props.placeholder || '',
        onInput: (e) => emit('update:modelValue', e.target.value || null),
        class: [
          'w-full px-2.5 py-1.5 text-sm rounded-md border transition-colors outline-none',
          'focus:ring-2 focus:ring-sky-500 focus:border-sky-500',
          isEmpty.value
            ? 'border-orange-300 bg-orange-50 placeholder-orange-300'
            : 'border-gray-300 bg-white',
        ].join(' '),
      }),
    ])
  },
})

const SummaryRow = defineComponent({
  props: { label: String, value: Number, color: String },
  setup(props) {
    return () => h('div', { class: 'py-3 flex justify-between items-center text-sm' }, [
      h('dt', { class: 'text-gray-600' }, props.label),
      h('dd', { class: `font-semibold ${props.color}` }, props.value ?? 0),
    ])
  },
})

// ── State ──────────────────────────────────────────────────────────────────────

const { $parse } = useNuxtApp()

const steps = [
  { label: 'Upload' },
  { label: 'Parsing' },
  { label: 'Validation' },
]

const currentStep = ref(0)
const fileInput = ref(null)
const isDragging = ref(false)
const selectedFiles = ref([])
const uploading = ref(false)
const uploadError = ref('')

const parsedFiles = ref([])   // [{ id, originalName, storedPath, parsed, parseError }]
const editedData = ref([])    // données éditables (step 2)

const importing = ref(false)
const importError = ref('')
const importStats = ref({})

// ── Step circle CSS ────────────────────────────────────────────────────────────

const stepCircleClass = (idx) => {
  if (idx < currentStep.value) return 'bg-sky-500 text-white'
  if (idx === currentStep.value) return 'bg-sky-600 text-white ring-4 ring-sky-100'
  return 'bg-gray-100 text-gray-400'
}

// ── Sélection fichiers ─────────────────────────────────────────────────────────

const onDrop = (e) => {
  isDragging.value = false
  const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf')
  selectedFiles.value.push(...files)
}

const onFileSelect = (e) => {
  selectedFiles.value.push(...Array.from(e.target.files))
  e.target.value = ''
}

const removeFile = (idx) => {
  selectedFiles.value.splice(idx, 1)
}

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

// ── Upload + Parse ─────────────────────────────────────────────────────────────

const runUploadAndParse = async () => {
  uploadError.value = ''
  uploading.value = true
  try {
    const config = useRuntimeConfig()
    
    // 1. Upload
    const formData = new FormData()
    for (const file of selectedFiles.value) {
      formData.append('files', file)
    }
    const uploadRes = await fetch(`${config.public.apiBaseUrl}/api/import/upload`, { method: 'POST', body: formData })
    if (!uploadRes.ok) throw new Error(`Erreur upload (HTTP ${uploadRes.status})`)
    const { files: uploadedFiles } = await uploadRes.json()

    // 2. Parse avec Mistral
    const parseRes = await fetch(`${config.public.apiBaseUrl}/api/import/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files: uploadedFiles }),
    })
    if (!parseRes.ok) throw new Error(`Erreur parsing (HTTP ${parseRes.status})`)
    const { results } = await parseRes.json()

    parsedFiles.value = results
    editedData.value = results.map(f => ({
      pdf_filename: f.originalName,
      pdf_path: f.storedPath,
      ...f.parsed,
    }))
    currentStep.value = 1
  } catch (err) {
    uploadError.value = err.message
  } finally {
    uploading.value = false
  }
}

// ── Import ─────────────────────────────────────────────────────────────────────

const runImport = async () => {
  importError.value = ''
  importing.value = true
  try {
    const stats = await $parse.Cloud.run('importImpayes', { impayes: editedData.value })
    importStats.value = stats
    currentStep.value = 2
  } catch (err) {
    importError.value = err.message || 'Erreur lors de l\'import'
  } finally {
    importing.value = false
  }
}

// ── Reset ──────────────────────────────────────────────────────────────────────

const resetWizard = () => {
  currentStep.value = 0
  selectedFiles.value = []
  parsedFiles.value = []
  editedData.value = []
  importStats.value = {}
  uploadError.value = ''
  importError.value = ''
}
</script>
