<template>
  <USlideover v-model:open="open">
    <template #title>
      Mettre en pause les relances
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <p class="text-sm text-gray-500">
          Toutes les relances en attente seront décalées de la durée choisie.
        </p>

        <!-- Options rapides -->
        <div class="space-y-2">
          <button
            v-for="opt in options"
            :key="opt.value"
            class="w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors text-left"
            :class="choix === opt.value
              ? 'border-primary-500 bg-primary-50 text-primary-700'
              : 'border-gray-200 hover:border-gray-300 text-gray-700'"
            @click="choix = opt.value"
          >
            <UIcon :name="opt.icon" class="size-5 shrink-0" />
            <span class="font-medium text-sm">{{ opt.label }}</span>
          </button>
        </div>

        <!-- Date personnalisée -->
        <div v-if="choix === 'custom'" class="space-y-1">
          <label class="block text-sm font-medium text-gray-700">Reprendre les relances à partir du</label>
          <UInput v-model="dateCustom" type="date" :min="minDate" class="w-full" />
        </div>

        <!-- Résumé -->
        <div v-if="resume" class="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          {{ resume }}
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton color="neutral" variant="ghost" @click="open = false">Annuler</UButton>
        <UButton
          :loading="saving"
          :disabled="!peutSoumettre"
          icon="i-heroicons-pause-circle"
          @click="soumettre"
        >
          Appliquer la pause
        </UButton>
      </div>
    </template>
  </USlideover>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  impayelId:  { type: String,  default: null },
})
const emit = defineEmits(['update:modelValue', 'success'])

const { $parse } = useNuxtApp()
const toast = useToast()

const open = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const saving  = ref(false)
const choix   = ref(null)
const dateCustom = ref('')

const options = [
  { value: '7j',    label: '7 jours',   icon: 'i-heroicons-calendar' },
  { value: '1m',    label: '1 mois',    icon: 'i-heroicons-calendar' },
  { value: 'custom', label: 'Choisir une date…', icon: 'i-heroicons-calendar-days' },
]

const minDate = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
})

const joursDecalage = computed(() => {
  if (choix.value === '7j') return 7
  if (choix.value === '1m') return 30
  if (choix.value === 'custom' && dateCustom.value) {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const cible = new Date(dateCustom.value)
    return Math.round((cible - today) / 86_400_000)
  }
  return 0
})

const peutSoumettre = computed(() => {
  if (!choix.value) return false
  if (choix.value === 'custom') return dateCustom.value && joursDecalage.value > 0
  return true
})

const resume = computed(() => {
  if (!peutSoumettre.value) return null
  const j = joursDecalage.value
  return `Les relances en attente seront décalées de ${j} jour${j > 1 ? 's' : ''}.`
})

watch(open, val => {
  if (val) { choix.value = null; dateCustom.value = '' }
})

async function soumettre() {
  if (!peutSoumettre.value) return
  saving.value = true
  try {
    const jours = joursDecalage.value
    const impayePtr = $parse.Object.extend('Impaye').createWithoutData(props.impayelId)
    const q = new $parse.Query('Relance')
    q.equalTo('impaye', impayePtr)
    q.equalTo('statut', 'pending')
    q.limit(500)
    const relances = await q.find()

    for (const r of relances) {
      const d = r.get('dateEnvoi')
      if (d) {
        const nouvelle = new Date(d)
        nouvelle.setDate(nouvelle.getDate() + jours)
        r.set('dateEnvoi', nouvelle)
      }
    }
    if (relances.length) await $parse.Object.saveAll(relances)

    toast.add({
      title: `${relances.length} relance${relances.length > 1 ? 's' : ''} décalée${relances.length > 1 ? 's' : ''} de ${jours} jour${jours > 1 ? 's' : ''}`,
      color: 'green',
    })
    emit('success')
    open.value = false
  } catch (err) {
    toast.add({ title: 'Erreur', description: err.message, color: 'red' })
  } finally {
    saving.value = false
  }
}
</script>
