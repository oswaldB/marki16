# Workflow: supprimer-relance

**Écran** : relances (toutes les vues)  
**Feature** : F-007 Relances email  
**Type** : Frontend  

## Description

Workflow de suppression (annulation) d'une relance. La relance n'est pas physiquement supprimée mais marquée comme "annulée".

## Déclencheur

- Clic sur "Annuler" dans le menu actions
- Action groupée "Annuler la sélection"

## Inputs

| Nom | Type | Description |
|-----|------|-------------|
| `relanceId` | String | ID de la relance à annuler |
| `motif` | String | Raison de l'annulation (optionnel) |

## Étapes / Checkpoints

### Étape 1: Confirmation

**Action**: Modal de confirmation avant annulation

```javascript
const confirmed = await confirm({
  title: 'Annuler la relance ?',
  description: 'Cette action est irréversible. La relance ne sera pas envoyée.',
  confirmLabel: 'Annuler la relance',
  cancelLabel: 'Retour'
})
```

**CHECKPOINT**: `relance-cancel-confirm-shown`

### Étape 2: Vérification

```javascript
const relance = await new Parse.Query('Relance').get(relanceId)

if (relance.get('envoyee')) {
  throw new Error('Impossible d\'annuler une relance déjà envoyée')
}
```

**CHECKPOINT**: `relance-cancel-validation`

### Étape 3: Annulation

```javascript
relance.set('statut', 'annulee')
relance.set('annuleePar', currentUser)
relance.set('dateAnnulation', new Date())
if (motif) relance.set('motifAnnulation', motif)
await relance.save()
```

**CHECKPOINT**: `relance-cancelled`
```json
{
  "relanceId": "rel_abc123",
  "userId": "user_456",
  "motif": "Client a payé entre temps",
  "timestamp": "2024-06-30T10:30:00Z"
}
```

### Étape 4: Mise à jour liste

Retirer la relance de la liste affichée.

## Gestion des erreurs

**CHECKPOINT**: `relance-cancel-failed`
```json
{
  "relanceId": "rel_abc123",
  "error": "Relance déjà envoyée"
}
```
