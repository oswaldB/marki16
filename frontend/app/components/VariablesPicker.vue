<template>
  <div class="border border-gray-100 rounded-lg bg-gray-50 p-2">
    <p class="text-xs font-semibold text-gray-500 mb-2">Variables</p>
    <UInput
      v-model="search"
      size="xs"
      placeholder="Rechercher..."
      icon="i-heroicons-magnifying-glass"
      class="mb-2"
    />
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="group in filteredGroups" :key="group.groupe" class="space-y-2">
        <template v-if="!(group.groupe === 'MULTIPLE' && activeScenario === 'single')">
          <div class="flex items-center justify-between mb-1">
            <div class="flex items-center gap-1">
              <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">{{ group.groupe }}</p>
              <UButton
                v-if="group.groupe === 'LIENS DE PAIEMENT'"
                variant="ghost"
                size="2xs"
                icon="i-heroicons-pencil-square"
                class="p-0 h-4 w-4"
                @click="$emit('openLiens')"
              />
            </div>
          </div>
          <div class="flex flex-wrap gap-1">
            <button
              v-for="v in group.vars"
              :key="v.isPaymentLink ? v.name : v"
              class="text-xs bg-white hover:bg-sky-50 hover:text-sky-700 border border-gray-200 rounded px-1.5 py-0.5 font-mono transition-colors"
              @click="v.isPaymentLink ? $emit('copyPaymentLink', v) : $emit('copy', v)"
            >
              {{ v.isPaymentLink ? v.display : v }}
            </button>
          </div>
          <UAlert v-if="group.groupe === 'MULTIPLE'" icon="i-heroicons-information-circle" color="sky" variant="soft" title="Variables multiples" class="text-xs mt-2 p-2">
            <template #description>
              Pour afficher plusieurs impayés, utilisez les variables avec <code class="bg-gray-100 px-1 rounded">+</code> suivi d'un numéro.<br>
              Exemple :
              <pre class="bg-gray-100 p-2 rounded mt-1 text-xs">| Numéro de facture | Montant |
|-------------------|---------|
| [[nfacture]]      | [[montant]] |
| [[nfacture+]]   | [[montant+]] |</pre>
            </template>
          </UAlert>
        </template>
      </div>
    </div>
    <p class="text-xs text-gray-400 pt-1.5 mt-1.5 border-t border-gray-100">Clic → copié · Ctrl+V</p>
  </div>
</template>

<script setup>
const props = defineProps({
  variables: { type: Array, required: true },
  activeScenario: { type: String, default: 'single' },
})

defineEmits(['copy', 'copyPaymentLink', 'openLiens'])

const search = ref('')

const filteredGroups = computed(() => {
  const s = search.value.toLowerCase()
  if (!s) return props.variables
  return props.variables
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
