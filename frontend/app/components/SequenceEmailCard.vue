<template>
  <UCard class="border border-gray-100">
    <template #header>
      <div class="flex items-center justify-between">
        <span class="font-medium text-sm text-gray-700">Email {{ index + 1 }} — J+{{ email.delai }}</span>
        <div class="flex items-center gap-2">
          <UButton
            :icon="collapsed ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
            variant="ghost"
            size="xs"
            @click="collapsed = !collapsed"
          />
          <UButton
            icon="i-heroicons-trash"
            color="red"
            variant="ghost"
            size="xs"
            @click="$emit('delete', email._key)"
          />
        </div>
      </div>
    </template>

    <div v-show="!collapsed" class="space-y-2">
      <!-- Délai -->
      <div>
        <label class="text-xs text-gray-500 mb-1 block">J+</label>
        <UInput v-model.number="email.delai" type="number" min="0" class="w-full" />
      </div>

      <!-- À -->
      <div>
        <label class="text-xs text-gray-500 mb-1 block">À</label>
        <UInput v-model="email.to" placeholder="[[payeur_email]]" class="w-full" />
      </div>

      <!-- Onglets scénario -->
      <div>
        <div class="flex items-center justify-between mb-1">
          <label class="text-xs text-gray-500">Contenu par format</label>
          <UButton size="xs" variant="ghost" @click="$emit('openChatgpt', index)">
            <UIcon name="i-heroicons-sparkles" class="size-4" />
            IA
          </UButton>
        </div>
        <div class="space-y-2">
          <UTabs
            :items="scenarioTabs"
            :model-value="email.activeScenario"
            class="px-2 pt-1"
            @update:modelValue="(s) => handleSwitchScenario(s)"
          />
          <div class="px-1 space-y-3">
            <!-- Toggle format actif -->
            <div class="flex items-center justify-between py-1.5 border-b border-gray-100">
              <span class="text-xs font-medium text-gray-600">Format actif</span>
              <ToggleSwitch
                :model-value="currentScenario.active"
                @update:model-value="currentScenario.active = $event"
              />
            </div>

            <template v-if="currentScenario.active">
              <!-- Profil expéditeur -->
              <div>
                <div v-if="smtpOptions.length > 0">
                  <div class="flex items-center justify-between mb-1">
                    <label class="text-xs text-gray-500">Profil expéditeur</label>
                    <UButton size="xs" variant="link" class="text-xs" @click="$emit('openSmtp')">+ Créer un profil</UButton>
                  </div>
                  <USelect
                    v-model="currentScenario.smtp"
                    :items="smtpOptions"
                    class="w-full"
                    @change="$emit('smtpChange', email, currentScenario, $event)"
                  />
                </div>
                <UAlert v-else icon="i-heroicons-exclamation-triangle" color="amber" variant="soft" title="Aucun profil expéditeur configuré" class="text-xs">
                  <template #description>
                    <div class="flex items-center gap-2">
                      <span>Créez un profil expéditeur pour envoyer des emails.</span>
                      <UButton size="xs" variant="solid" @click="$emit('openSmtp')">Créer un profil</UButton>
                    </div>
                  </template>
                </UAlert>
              </div>

              <!-- CC -->
              <div>
                <label class="text-xs text-gray-500 mb-1 block">CC</label>
                <UInput v-model="currentScenario.cc" class="w-full" />
              </div>

              <!-- Objet -->
              <div>
                <label class="text-xs text-gray-500 mb-1 block">Objet</label>
                <UInput v-model="currentScenario.objet" placeholder="Relance — [[nfacture]]" class="w-full" />
              </div>

              <!-- Corps -->
              <div class="border border-gray-200 rounded-md overflow-hidden">
                <ToastuiEditor
                  :ref="el => { if (el) $emit('editorMounted', email._key, el) }"
                  :initial-value="currentScenario.corps || ''"
                  :options="editorOptions"
                  initial-edit-type="wysiwyg"
                  @change="$emit('corpsChange', email, $event)"
                />
              </div>
            </template>

            <div v-else class="text-xs text-gray-400 italic py-2 text-center">
              Ce format est désactivé — aucun email ne sera envoyé pour ce cas.
            </div>
          </div>
        </div>
      </div>

      <!-- Variables -->
      <VariablesPicker
        :variables="variablesForEmail"
        :active-scenario="email.activeScenario"
        @copy="onCopyVariable"
        @copy-payment-link="onCopyPaymentLink"
        @open-liens="$emit('openLiens')"
      />
    </div>
  </UCard>
</template>

<script setup>
import ToastuiEditor from '~/components/ToastuiEditor.vue'
import ToggleSwitch from '~/components/ToggleSwitch.vue'
import VariablesPicker from '~/components/VariablesPicker.vue'
import {
  getScenario,
  switchScenario,
  VARIABLES,
  editorOptions,
  scenarioTabs,
} from '~/composables/useSequenceEditor'

const props = defineProps({
  email: { type: Object, required: true },
  index: { type: Number, required: true },
  smtpOptions: { type: Array, default: () => [] },
  allVariables: { type: Array, default: () => [] },
  editorRefs: { type: Object, required: true },
})

const emit = defineEmits([
  'delete', 'openChatgpt', 'openSmtp', 'openLiens',
  'corpsChange', 'smtpChange', 'editorMounted',
])

const toast = useToast()

const collapsed = ref(false)

const currentScenario = computed(() => getScenario(props.email, props.email.activeScenario || 'single'))

function handleSwitchScenario(newScenario) {
  switchScenario(props.email, newScenario, props.editorRefs)
}

// Variables filtrées pour cet email (avec les relances des emails précédents)
const variablesForEmail = computed(() => {
  const emailIdx = props.index
  const relanceVars = Array.from({ length: emailIdx }, (_, i) => ({
    groupe: `RELANCE ${i + 1}`,
    vars: [`relance.${i + 1}.objet`, `relance.${i + 1}.dateEnvoi`]
  }))
  const paymentLinkVars = props.allVariables.find(g => g.groupe === 'LIENS DE PAIEMENT')
  const baseVars = VARIABLES.filter(g => g.groupe !== 'LIENS DE PAIEMENT')
  return [
    ...baseVars,
    ...(paymentLinkVars ? [paymentLinkVars] : []),
    ...relanceVars,
  ]
})

async function onCopyVariable(varName) {
  await navigator.clipboard.writeText(`[[${varName}]]`)
  toast.add({ title: 'Copié', description: "Collez avec Ctrl+V dans l'éditeur", color: 'green', timeout: 2000 })
}

async function onCopyPaymentLink(paymentLink) {
  await navigator.clipboard.writeText(paymentLink.url)
  toast.add({ title: 'Copié', description: "Collez avec Ctrl+V dans l'éditeur", color: 'green', timeout: 2000 })
}
</script>
