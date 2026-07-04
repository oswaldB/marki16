# Workflow: valider-relance

**Écran** : relances (vue validation)  
**Feature** : F-009 Bouton Enregistrer - Validation  
**Type** : Frontend  

## Description

Workflow de validation d'une relance avant envoi. Sauvegarde les modifications, marque la relance comme validée, et passe automatiquement à la suivante.

## Déclencheur

- Clic sur le bouton "Valider" dans la vue validation

## Inputs

| Nom | Type | Description |
|-----|------|-------------|
| `relanceId` | String | ID de la relance à valider |
| `modifications` | Object | { sujet, contenu, cc } |

## Étapes / Checkpoints

### Étape 1: Sauvegarde implicite

**Action**: Sauvegarder les modifications avant validation

```javascript
// Même logique que enregistrerRelance()
const relance = await new Parse.Query('Relance').get(relanceId)
relance.set('sujet', modifications.sujet)
relance.set('contenu', modifications.contenu)
relance.set('cc', modifications.cc)
await relance.save()
```

**CHECKPOINT**: `relance-saved-before-validation`

### Étape 2: Marquer comme validée

```javascript
relance.set('valide', true)
relance.set('dateValidation', new Date())
relance.set('validePar', currentUser)
relance.set('statut', 'valide')
await relance.save()
```

**CHECKPOINT**: `relance-validated`
```json
{
  "relanceId": "rel_abc123",
  "userId": "user_456",
  "timestamp": "2024-06-30T10:30:00Z"
}
```

### Étape 3: Passage automatique

**Action**: Sélectionner la relance suivante dans la liste

```javascript
const index = relancesAValider.findIndex(r => r.id === relanceId)
if (index < relancesAValider.length - 1) {
  selectionnerRelancePourValidation(relancesAValider[index + 1])
}
```

**CHECKPOINT**: `relance-next-auto-selected`

## Gestion des erreurs

**CHECKPOINT**: `relance-validation-failed`
```json
{
  "relanceId": "rel_abc123",
  "error": "Network error",
  "step": "saving" // ou "validating"
}
```

## Règles métier

- Une relance validée ne peut plus être modifiée (sauf par admin)
- La validation enregistre l'utilisateur et la date
- Le passage à la suivante est automatique sauf si dernière de la liste
- Un toast de confirmation s'affiche après validation

## Toast de confirmation

```
✅ Relance validée (3/12)
```
