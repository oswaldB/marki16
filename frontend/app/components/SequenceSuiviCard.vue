<template>
  <UCard class="border border-gray-100">
    <template #header>
      <div class="flex items-center justify-between">
        <span v-if="props.email" class="font-medium text-sm text-gray-700">
          Email de suivi — J+{{ props.email.delai }}
        </span>
        <span v-else class="font-medium text-sm text-gray-700">
          Email de suivi
        </span>
        <div class="flex items-center gap-2">
          <UButton
            v-if="props.email"
            :icon="collapsed ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
            variant="ghost"
            size="xs"
            @click="toggle"
          />
          <UButton
            v-if="props.email"
            icon="i-heroicons-trash"
            color="red"
            variant="ghost"
            size="xs"
            @click="supprimer"
          />
        </div>
      </div>
    </template>

    <div v-show="!collapsed" class="space-y-2">
      <!-- Fréquence (au lieu de Délai) -->
      <div>
        <label class="text-xs text-gray-500 mb-1 block">Fréquence</label>
        <div class="space-y-2">
          <!-- Choix du type de fréquence -->
          <div class="flex gap-2">
            <button
              v-for="opt in frequenceOptions"
              :key="opt.value"
              @click="frequenceType = opt.value"
              class="flex-1 px-3 py-1.5 text-sm rounded-md border transition-colors"
              :class="{
                'border-blue-500 bg-blue-50 text-blue-700': frequenceType === opt.value,
                'border-gray-300 hover:border-gray-400': frequenceType !== opt.value
              }"
            >
              {{ opt.label }}
            </button>
          </div>

          <!-- Configuration détaillée selon le type -->
          <div v-if="frequenceType === 'quotidien'" class="pl-2">
            <label class="text-xs text-gray-500 mb-1 block">Heure d'envoi</label>
            <div class="flex flex-wrap gap-1">
              <button
                v-for="hour in [0, 6, 9, 12, 15, 18, 21]"
                :key="hour"
                @click="frequenceHour = hour.toString()"
                class="px-2 py-1 text-xs rounded border transition-colors"
                :class="{
                  'border-blue-500 bg-blue-50 text-blue-700': frequenceHour === hour.toString(),
                  'border-gray-300 hover:border-gray-400': frequenceHour !== hour.toString()
                }"
              >
                {{ hour.toString().padStart(2, '0') }}:00
              </button>
            </div>
          </div>

          <div v-if="frequenceType === 'hebdomadaire'" class="pl-2">
            <label class="text-xs text-gray-500 mb-1 block">Jour de la semaine</label>
            <div class="flex flex-wrap gap-1">
              <button
                v-for="day in dayOfWeekOptions"
                :key="day.value"
                @click="frequenceDayOfWeek = day.value"
                class="px-2 py-1 text-xs rounded border transition-colors"
                :class="{
                  'border-blue-500 bg-blue-50 text-blue-700': frequenceDayOfWeek === day.value,
                  'border-gray-300 hover:border-gray-400': frequenceDayOfWeek !== day.value
                }"
              >
                {{ day.label }}
              </button>
            </div>
          </div>

          <div v-if="frequenceType === 'mensuel'" class="pl-2">
            <label class="text-xs text-gray-500 mb-1 block">Jour du mois</label>
            <div class="flex flex-wrap gap-1">
              <button
                v-for="day in dayOfMonthOptions"
                :key="day.value"
                @click="frequenceDayOfMonth = day.value"
                class="px-2 py-1 text-xs rounded border transition-colors"
                :class="{
                  'border-blue-500 bg-blue-50 text-blue-700': frequenceDayOfMonth === day.value,
                  'border-gray-300 hover:border-gray-400': frequenceDayOfMonth !== day.value
                }"
              >
                {{ day.label }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- À -->
      <div>
        <label class="text-xs text-gray-500 mb-1 block">À</label>
        <UInput
          :value="props.email?.to"
          @input="updateTo($event.target.value)"
          placeholder="{{payeur_email}}"
          class="w-full"
        />
      </div>

      <!-- Onglets scénario -->
      <div>
        <div class="flex items-center justify-between mb-1">
          <label class="text-xs text-gray-500">Contenu par format</label>
        </div>
        <div class="space-y-2">
          <UTabs
            :items="scenarioTabs"
            :model-value="props.email?.activeScenario"
            class="px-2 pt-1"
            @update:modelValue="(s) => updateScenario(s)"
          />
          <div class="px-1 space-y-3">
            <!-- Toggle format actif -->
            <div class="flex items-center justify-between py-1.5 border-b border-gray-100">
              <span class="text-xs font-medium text-gray-600">Format actif</span>
              <ToggleSwitch
                :model-value="currentScenario?.active"
                @update:model-value="currentScenario.active = $event"
              />
            </div>

            <template v-if="currentScenario?.active">
              <!-- Profil SMTP -->
              <div>
                <div v-if="smtpOptions.length > 0">
                  <div class="flex items-center justify-between mb-1">
                    <label class="text-xs text-gray-500">Profil expéditeur</label>
                  </div>
                  <USelect
                    v-model="currentScenario.smtp"
                    :items="smtpOptions"
                    class="w-full"
                    @change="updateSmtp(props.email?.activeScenario, $event)"
                  />
                </div>
                <UAlert v-else icon="i-heroicons-exclamation-triangle" color="amber" variant="soft" title="Aucun profil expéditeur configuré" class="text-xs">
                  <template #description>
                    <div class="flex items-center gap-2">
                      <span>Créez un profil expéditeur pour envoyer des emails.</span>
                    </div>
                  </template>
                </UAlert>
              </div>

              <!-- CC -->
              <div>
                <label class="text-xs text-gray-500 mb-1 block">CC</label>
                <UInput
                  :value="currentScenario.cc"
                  @input="updateCc($event.target.value)"
                  placeholder=""
                  class="w-full"
                />
              </div>

              <!-- Objet -->
              <div>
                <label class="text-xs text-gray-500 mb-1 block">Objet</label>
                <UInput
                  :value="currentScenario.objet"
                  @input="updateObjet($event.target.value)"
                  placeholder="Objet de l'email"
                  class="w-full"
                />
              </div>

              <!-- Corps -->
              <div class="border border-gray-200 rounded-md overflow-hidden">
                <slot name="editor"></slot>
              </div>
            </template>

            <div v-else class="text-xs text-gray-400 italic py-2 text-center">
              Ce format est désactivé — aucun email ne sera envoyé pour ce cas.
            </div>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import ToggleSwitch from '~/components/ToggleSwitch.vue'

const props = defineProps({
  email: {
    type: Object,
    required: false,
    default: null
  },
  smtpOptions: {
    type: Array,
    default: () => []
  },
  collapsed: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:to', 'update:cc', 'update:smtp', 'update:objet', 'delete', 'toggle', 'create'])

// Fréquence options
const frequenceOptions = [
  { value: 'quotidien', label: 'Quotidien' },
  { value: 'hebdomadaire', label: 'Hebdomadaire' },
  { value: 'mensuel', label: 'Mensuel' }
]

// Options pour la configuration détaillée
const hourOptions = Array.from({ length: 24 }, (_, i) => ({
  value: i.toString(),
  label: `${i.toString().padStart(2, '0')}:00`
}))

const dayOfWeekOptions = [
  { value: '1', label: 'Lundi' },
  { value: '2', label: 'Mardi' },
  { value: '3', label: 'Mercredi' },
  { value: '4', label: 'Jeudi' },
  { value: '5', label: 'Vendredi' },
  { value: '6', label: 'Samedi' },
  { value: '0', label: 'Dimanche' }
]

const dayOfMonthOptions = [
  { value: '1', label: '1er jour' },
  { value: '5', label: '5ème jour' },
  { value: '10', label: '10ème jour' },
  { value: '15', label: '15ème jour' },
  { value: '20', label: '20ème jour' },
  { value: '25', label: '25ème jour' },
  { value: 'last', label: 'Dernier jour' }
]

// Scénario tabs (comme dans SequenceEmailCard)
const scenarioTabs = [
  { label: '1 impayé', value: 'single' },
  { label: 'Plusieurs', value: 'multiple' },
  { label: 'Impayés + apporteur', value: 'both' },
  { label: 'Apporteur seul', value: 'broker' }
]

// Variables réactives pour la fréquence
const frequenceType = ref('hebdomadaire')
const frequenceHour = ref('9')
const frequenceDayOfWeek = ref('1')
const frequenceDayOfMonth = ref('1')

// Scénario courant
const currentScenario = computed(() => {
  if (!props.email) return null
  return props.email.scenarios.find(s => s.format === props.email.activeScenario) || props.email.scenarios[0]
})

function updateTo(val) {
  if (props.email) {
    props.email.to = val
  }
}

function updateCc(val) {
  if (currentScenario.value) {
    currentScenario.value.cc = val
  }
}

function updateSmtp(scenario, val) {
  if (currentScenario.value) {
    currentScenario.value.smtp = val
    emit('update:smtp', scenario, val)
  }
}

function updateObjet(val) {
  if (currentScenario.value) {
    currentScenario.value.objet = val
  }
}

function updateScenario(newScenario) {
  if (props.email) {
    props.email.activeScenario = newScenario
  }
}

function supprimer() {
  emit('delete')
}

function toggle() {
  emit('toggle')
}

// Watch for email prop changes to update frequency
watch(() => props.email, (newEmail) => {
  if (newEmail && newEmail.frequence) {
    frequenceType.value = newEmail.frequence.type || 'hebdomadaire'
    frequenceHour.value = newEmail.frequence.hour || '9'
    frequenceDayOfWeek.value = newEmail.frequence.dayOfWeek || '1'
    frequenceDayOfMonth.value = newEmail.frequence.dayOfMonth || '1'
  }
}, { deep: true, immediate: true })

// Mettre à jour l'objet email avec la configuration de fréquence
watch([frequenceType, frequenceHour, frequenceDayOfWeek, frequenceDayOfMonth], () => {
  if (props.email) {
    props.email.frequence = {
      type: frequenceType.value,
      hour: frequenceHour.value,
      dayOfWeek: frequenceDayOfWeek.value,
      dayOfMonth: frequenceDayOfMonth.value
    }
  }
}, { deep: true })
</script>