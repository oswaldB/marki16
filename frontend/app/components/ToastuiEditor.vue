<template>
  <div ref="editorEl" />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Editor from '@toast-ui/editor'

const props = defineProps({
  initialValue: { type: String, default: '' },
  options: { type: Object, default: () => ({}) },
  initialEditType: { type: String, default: 'wysiwyg' },
})

const emit = defineEmits(['change'])

const editorEl = ref(null)
let editorInstance = null

onMounted(() => {
  console.log('[ToastuiEditor] onMounted, initialValue:', props.initialValue?.slice(0, 80))
  editorInstance = new Editor({
    el: editorEl.value,
    initialEditType: props.initialEditType,
    ...props.options,
  })
  console.log('[ToastuiEditor] editor created, calling setHTML')
  if (props.initialValue) {
    editorInstance.setHTML(props.initialValue)
  }
  console.log('[ToastuiEditor] after setHTML, getHTML:', editorInstance.getHTML()?.slice(0, 80))
  editorInstance.on('change', () => {
    emit('change', editorInstance.getHTML())
  })
})

onBeforeUnmount(() => {
  if (editorInstance) {
    editorInstance.destroy()
    editorInstance = null
  }
})

function getInstance() {
  return editorInstance
}

defineExpose({ getInstance })
</script>
