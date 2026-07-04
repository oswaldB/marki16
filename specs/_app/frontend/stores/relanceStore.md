# Store: relanceStore (Pinia)

**Chemin** : `frontend/app/stores/relanceStore.js`  
**Feature** : F-007, F-009  

## Description

Store Pinia pour la gestion des relances : chargement, création, validation, envoi.

## State

```javascript
{
  relances: [],           // Liste des relances
  relanceCourante: null,  // Relance en cours d'édition
  filtres: {
    statut: 'tous',
    sequence: 'tous',
    dateDebut: null,
    dateFin: null
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0
  },
  loading: false,
  saving: false,
  validating: false,
  sending: false
}
```

## Getters

| Nom | Type | Description |
|-----|------|-------------|
| `relancesAValider` | Array | Relances avec statut 'brouillon' |
| `relancesFiltrees` | Array | Relances selon filtres actuels |
| `relancesValidees` | Array | Relances avec statut 'valide' |
| `relancesEnvoyees` | Array | Relances avec statut 'envoyee' |
| `countByStatus` | Object | { brouillon: 5, valide: 3, ... } |

## Actions

### Chargement

| Action | Paramètres | Description |
|--------|-----------|-------------|
| `fetchRelances` | `force = false` | Charge les relances depuis Parse |
| `fetchRelanceById` | `id` | Charge une relance spécifique |

### CRUD

| Action | Paramètres | Description |
|--------|-----------|-------------|
| `saveRelance` | `{ id, sujet, contenu, cc }` | Sauvegarde (F-009) |
| `validateRelance` | `id` | Valide une relance (F-009) |
| `sendRelance` | `id` | Envoie une relance (F-007) |
| `cancelRelance` | `id, motif` | Annule une relance |
| `deleteRelance` | `id` | Supprime (marque annulée) |

### Actions groupées

| Action | Paramètres | Description |
|--------|-----------|-------------|
| `validateMultiple` | `ids` | Valide plusieurs relances |
| `sendMultiple` | `ids` | Envoie plusieurs relances |
| `cancelMultiple` | `ids, motif` | Annule plusieurs relances |

### Navigation

| Action | Paramètres | Description |
|--------|-----------|-------------|
| `selectNext` | | Passe à la relance suivante |
| `selectPrevious` | | Passe à la précédente |
| `setRelanceCourante` | `relance` | Définit la relance en cours |

## Exemple d'utilisation

```vue
<script setup>
const relanceStore = useRelanceStore()

// Chargement
await relanceStore.fetchRelances()

// Navigation
const { relancesAValider, relanceCourante } = storeToRefs(relanceStore)

// Actions
await relanceStore.validateRelance(relanceCourante.value.id)
await relanceStore.selectNext()
</script>
```
