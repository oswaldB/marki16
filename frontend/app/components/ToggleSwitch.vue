<template>
  <button
    type="button"
    class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
    :class="modelValue ? 'bg-green-500' : 'bg-gray-300'"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <span
      class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
      :class="modelValue ? 'translate-x-6' : 'translate-x-1'"
    />
    <span
      class="absolute text-[9px] font-bold tracking-wide transition-opacity"
      :class="modelValue ? 'left-1.5 text-white opacity-100' : 'opacity-0'"
    >ON</span>
    <span
      class="absolute text-[9px] font-bold tracking-wide transition-opacity"
      :class="!modelValue ? 'right-1.5 text-gray-500 opacity-100' : 'opacity-0'"
    >OFF</span>
  </button>
</template>

<script setup>
defineProps({ modelValue: Boolean })
defineEmits(['update:modelValue'])
</script>
