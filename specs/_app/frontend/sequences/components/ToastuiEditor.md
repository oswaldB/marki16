# Component: ToastuiEditor

**Chemin** : `frontend/app/components/ToastuiEditor.vue`
**Utilisation** : Éditeur WYSIWYG pour les templates d'email

## Description

Wrapper Vue 3 autour de l'éditeur Toast UI Editor, configuré pour l'édition de templates HTML d'emails.

## Props

| Nom | Type | Défaut | Description |
|-----|------|---------|-------------|
| `initialValue` | `String` | `''` | Contenu HTML initial |
| `options` | `Object` | `{}` | Options de configuration ToastUI |
| `initialEditType` | `String` | `'wysiwyg'` | Mode d'édition initial |

## Événements

| Nom | Payload | Description |
|-----|---------|-------------|
| `change` | `html` | Contenu HTML modifié |

## Méthodes exposées

| Nom | Retour | Description |
|-----|--------|-------------|
| `getInstance()` | `Editor` | Instance ToastUI Editor brute |

## Options par défaut

```javascript
{
  height: '400px',
  usageStatistics: false,
  hideModeSwitch: true,  // Pas de switch markdown/WYSIWYG
  initialEditType: 'wysiwyg',
  toolbarItems: [
    ['heading', 'bold', 'italic', 'strike'],
    ['hr', 'quote'],
    ['ul', 'ol', 'task', 'indent', 'outdent'],
    ['table', 'image', 'link'],
    ['code', 'codeblock']
  ]
}
```

## Cycle de vie

1. **onMounted** : Création de l'instance ToastUI
2. **setHTML** : Injection du contenu initial
3. **onChange** : Émission des modifications
4. **onBeforeUnmount** : Destruction propre de l'instance

## Utilisation avec v-model

```vue
<template>
  <ToastuiEditor
    ref="editorRef"
    :initial-value="templateCorps"
    @change="templateCorps = $event"
  />
</template>

<script setup>
const editorRef = ref(null)
const templateCorps = ref('')

// Accès à l'instance
function getHTML() {
  return editorRef.value?.getInstance()?.getHTML()
}
</script>
```
