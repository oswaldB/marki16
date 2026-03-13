<template>
  <USlideover
    v-model:open="localOpen"
    side="right"
    :title="contact?.nom || 'Détails du contact'"
  >
    <template v-if="contact" #header>
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center gap-2">
          <p class="font-semibold">{{ contact.nom }}</p>
          <UBadge
            :color="contact.source === 'db_externe' ? 'blue' : 'violet'"
            variant="subtle"
          >
            {{ contact.source === 'db_externe' ? 'BD externe' : 'Upload' }}
          </UBadge>
        </div>
        <UButton
          color="gray"
          variant="ghost"
          icon="i-heroicons-x-mark"
          size="sm"
          @click="localOpen = false; $emit('close')"
        />
      </div>
    </template>

    <template v-if="contact" #body>
      <div class="space-y-4">
        <!-- Alerte lecture seule -->
        <UAlert
          v-if="contact.source === 'db_externe'"
          color="blue"
          icon="i-heroicons-information-circle"
          title="Contact issu de la synchronisation"
          description="Ce contact est géré par la base de données externe. Les modifications sont impossibles ici."
        />

        <!-- Champs -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-gray-500 mb-1 block">Nom</label>
            <UInput v-model="localForm.nom" :disabled="contact.source === 'db_externe'" />
          </div>
          <div>
            <label class="text-gray-500 mb-1 block">Type</label>
            <USelect
              v-model="localForm.type"
              :items="typeOptionsForm"
              :disabled="contact.source === 'db_externe'"
            />
          </div>
          <div>
            <label class="text-gray-500 mb-1 block">Email</label>
            <UInput
              v-model="localForm.email"
              type="email"
              :disabled="contact.source === 'db_externe'"
            />
          </div>
          <div>
            <label class="text-gray-500 mb-1 block">Téléphone</label>
            <UInput v-model="localForm.telephone" :disabled="contact.source === 'db_externe'" />
          </div>
        </div>

        <!-- Impayés liés -->
        <div>
          <p class="font-semibold text-gray-700 mb-2">
            Impayés liés
            <span class="text-gray-400 font-normal">({{ impayes.length }})</span>
          </p>
          <div v-if="loadingImpayes" class="text-gray-400 py-2">Chargement…</div>
          <div v-else-if="impayes.length === 0" class="text-gray-400">Aucun impayé associé</div>
          <div v-else class="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
            <div
              v-for="imp in impayes"
              :key="imp.id"
              class="flex items-center justify-between px-3 py-2 hover:bg-gray-50"
            >
              <div class="flex items-center gap-3">
                <span class="font-mono text-gray-700 w-28">{{ imp.get('nfacture') || '—' }}</span>
                <span class="font-medium">{{ formatMontant(imp.get('reste_a_payer')) }}</span>
                <UBadge :color="statutColor(imp.get('statut'))" variant="subtle">
                  {{ imp.get('statut') || '—' }}
                </UBadge>
              </div>
              <NuxtLink
                :to="`/impayes/${imp.id}`"
                class="text-sky-600 hover:text-sky-800"
                @click="localOpen = false; $emit('close')"
              >
                <UIcon name="i-heroicons-arrow-top-right-on-square" class="size-4" />
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-if="contact" #footer>
      <div class="flex items-center justify-between w-full">
        <UButton
          v-if="contact.source === 'upload'"
          color="red"
          variant="ghost"
          size="sm"
          icon="i-heroicons-trash"
          :loading="deleting"
          @click="$emit('delete')"
        >
          Supprimer
        </UButton>
        <div v-else />
        <div class="flex gap-2">
          <UButton color="neutral" variant="ghost" @click="localOpen = false; $emit('close')">Fermer</UButton>
          <UButton
            v-if="contact.source === 'upload'"
            :loading="saving"
            @click="$emit('save', localForm)"
          >
            Enregistrer
          </UButton>
        </div>
      </div>
    </template>
  </USlideover>
</template>

<script setup>
const props = defineProps({
  open:           { type: Boolean, default: false },
  contact:        { type: Object,  default: null  },
  impayes:        { type: Array,   default: () => [] },
  loadingImpayes: { type: Boolean, default: false },
  saving:         { type: Boolean, default: false },
  deleting:       { type: Boolean, default: false },
})

const emit = defineEmits(['update:open', 'save', 'delete', 'close'])

const localOpen = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val),
})

const typeOptionsForm = [
  { label: '—',                  value: '' },
  { label: 'Propriétaire',       value: 'Propriétaire' },
  { label: 'Locataire sortant',  value: 'Locataire sortant' },
  { label: 'Locataire entrant',  value: 'Locataire entrant' },
  { label: 'Apporteur',          value: 'Apporteur' },
]

// Copie locale initialisée depuis le contact — évite la mutation directe de prop
const localForm = ref({ nom: '', email: '', telephone: '', type: '' })

watch(() => props.contact, (c) => {
  if (!c) return
  localForm.value = {
    nom:       c._parse?.get('nom')       || '',
    email:     c._parse?.get('email')     || '',
    telephone: c._parse?.get('telephone') || '',
    type:      c._parse?.get('type')      || '',
  }
}, { immediate: true })

function formatMontant(val) {
  if (val == null) return '—'
  return Number(val).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

function statutColor(statut) {
  if (statut === 'payé')     return 'green'
  if (statut === 'en cours') return 'blue'
  return 'orange'
}
</script>
