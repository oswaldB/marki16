<template>
  <UTable
    :data="entites"
    :columns="colonnes"
    :loading="loading"
    :expanded="expanded"
    :get-sub-rows="(row) => row.subRows"
    @update:expanded="expanded = $event"
    :empty="{ label: 'Aucune entité trouvée' }"
    sticky="header"
  >
    <template #nom-cell="{ row }">
      <div class="flex items-center gap-2" :style="{ paddingLeft: `${row.depth * 1.5}rem` }">
        <!-- Bouton d'expansion pour les lignes parentes -->
        <UButton
          v-if="row.getCanExpand()"
          :icon="row.getIsExpanded() ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
          color="neutral"
          variant="ghost"
          size="xs"
          @click.stop="row.toggleExpanded()"
        />
        
        <!-- Icône pour différencier entreprises et employés -->
        <UIcon
          v-if="row.original.isEntite"
          name="i-heroicons-building-office-2"
          class="size-4 text-blue-600 flex-shrink-0"
        />
        <UIcon
          v-else
          name="i-heroicons-user-circle"
          class="size-4 text-gray-400 flex-shrink-0"
        />
        
        <!-- Nom -->
        <span :class="row.original.isEntite ? 'font-semibold text-gray-900' : 'text-gray-700'">
          {{ row.original.nom }}
        </span>
        
        <!-- Badge avec nombre d'employés pour les entreprises -->
        <UBadge v-if="row.original.isEntite && row.original.subRows" color="neutral" variant="subtle">
          {{ row.original.subRows.length }} employé{{ row.original.subRows.length > 1 ? 's' : '' }}
        </UBadge>
      </div>
    </template>

    <template #email-cell="{ row }">
      <!-- Email de l'entreprise ou de l'employé -->
      <span v-if="row.original.email" class="text-gray-700">
        {{ row.original.email }}
      </span>
      <span v-else class="text-gray-400 italic">—</span>
    </template>

    <template #telephone-cell="{ row }">
      <!-- Téléphone de l'entreprise ou de l'employé -->
      <span class="text-gray-700">
        {{ row.original.telephone }}
      </span>
    </template>
  </UTable>
</template>

<script setup>
const props = defineProps({
  entites: {
    type: Array,
    required: true,
    default: () => []
  },
  colonnes: {
    type: Array,
    required: true,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const expanded = ref({})
</script>