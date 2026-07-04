# Store: sequenceRelanceStore (Pinia)

**Chemin** : `frontend/app/stores/sequenceRelanceStore.js`  
**Feature** : F-011  

## Description

Store Pinia pour la gestion des séquences de relances : CRUD, réorganisation, templates.

## State

```javascript
{
  sequences: [],          // Toutes les séquences
  sequenceCourante: null, // Séquence en cours d'édition
  loading: false,
  saving: false,
  deleting: false,
  reordering: false,
  lastFetched: null
}
```

## Getters

| Nom | Type | Description |
|-----|------|-------------|
| `sequencesActives` | Array | Séquences avec estActive = true |
| `sequencesByType` | Function(type) | Séquences filtrées par type |
| `sequencesOrdonnees` | Array | Séquences triées par niveau |
| `sequenceById` | Function(id) | Récupère une séquence par ID |
| `count` | Number | Nombre total de séquences |

## Actions

### Chargement

| Action | Paramètres | Description |
|--------|-----------|-------------|
| `fetchSequences` | `force = false` | Charge toutes les séquences |
| `fetchSequenceById` | `id` | Charge une séquence spécifique |

### CRUD

| Action | Paramètres | Description |
|--------|-----------|-------------|
| `createSequence` | `data` | Crée une nouvelle séquence |
| `updateSequence` | `id, data` | Met à jour une séquence |
| `deleteSequence` | `id` | Supprime une séquence |
| `toggleActive` | `id` | Active/désactive une séquence |

### Réorganisation

| Action | Paramètres | Description |
|--------|-----------|-------------|
| `reorderSequences` | `sequencesReordonnees` | Met à jour l'ordre |
| `moveUp` | `id` | Déplace vers le haut |
| `moveDown` | `id` | Déplace vers le bas |

### Génération

| Action | Paramètres | Description |
|--------|-----------|-------------|
| `regenerateRelances` | `id, options` | Régénère les relances |

## Exemple d'utilisation

```vue
<script setup>
const sequenceStore = useSequenceRelanceStore()

// Au montage
await sequenceStore.fetchSequences()

// Templates
const { sequencesActives } = storeToRefs(sequenceStore)

// Actions
await sequenceStore.createSequence({
  nom: 'Relance J+15',
  type: 'relances',
  niveau: 1,
  delaiJours: 15,
  templateSujet: '...',
  templateCorps: '...'
})
</script>
```
