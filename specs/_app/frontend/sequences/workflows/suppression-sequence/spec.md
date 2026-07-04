# Workflow: suppression-sequence

**Écran** : sequences  
**Feature** : F-011 Configuration des séquences de relances  
**Type** : Frontend  

## Description

Workflow de suppression d'une séquence. Vérifie si la séquence est utilisée avant de permettre la suppression.

## Déclencheur

- Clic sur le bouton "Supprimer" d'une séquence dans le tableau

## Inputs

| Nom | Type | Description |
|-----|------|-------------|
| `sequenceId` | String | ID de la séquence à supprimer |

## Étapes / Checkpoints

### Étape 1: Vérification des dépendances

**Action**: Compter les relances utilisant cette séquence

```javascript
async function confirmerSuppression(sequence) {
  const Relance = Parse.Object.extend('Relance')
  const query = new Parse.Query(Relance)
  query.equalTo('sequence', sequence)
  const count = await query.count()
  
  relancesUsingSequence.value = count
  sequenceToDelete.value = sequence
  deleteModalOpen.value = true
}
```

**CHECKPOINT**: `sequence-delete-checked`
```json
{
  "sequenceId": "seq_abc123",
  "relancesCount": 5,
  "canDelete": false
}
```

### Étape 2: Affichage modal

**Cas 1**: Séquence utilisée (relancesCount > 0)
- Message: "Cette séquence est utilisée par X relances. Vous ne pouvez que la désactiver."
- Boutons: [Annuler] [Désactiver]

**Cas 2**: Séquence non utilisée (relancesCount = 0)
- Message: "Êtes-vous sûr de vouloir supprimer cette séquence ?"
- Boutons: [Annuler] [Supprimer]

**CHECKPOINT**: `sequence-delete-modal-opened`
```json
{
  "sequenceId": "seq_abc123",
  "mode": "deactivate" // ou "delete"
}
```

### Étape 3: Action

**Action Désactiver**:
```javascript
async function desactiver() {
  const sequence = sequenceToDelete.value
  sequence.set('estActive', false)
  await sequence.save()
}
```

**Action Supprimer**:
```javascript
async function supprimer() {
  await sequenceToDelete.value.destroy()
}
```

**CHECKPOINT**: `sequence-deleted` / `sequence-deactivated`
```json
{
  "id": "seq_abc123",
  "action": "deleted",
  "timestamp": "2024-06-30T10:35:00Z"
}
```

## Gestion des erreurs

**CHECKPOINT**: `sequence-deletion-failed`
```json
{
  "id": "seq_abc123",
  "error": "Cannot delete sequence with existing relances"
}
```
