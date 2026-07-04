# Workflow: passer-relance

**Écran** : relances (vue validation)  
**Feature** : F-007 Relances email  
**Type** : Frontend  

## Description

Workflow pour passer à la relance suivante sans valider la courante. Permet de reporter la validation.

## Déclencheur

- Clic sur "Actions > Passer" dans la vue validation
- Raccourci clavier (flèche droite)

## Inputs

| Nom | Type | Description |
|-----|------|-------------|
| `currentId` | String | ID de la relance courante |
| `direction` | String | "next" ou "previous" |

## Étapes / Checkpoints

### Étape 1: Détection modifications

```javascript
if (hasUnsavedChanges.value) {
  const choice = await confirmUnsavedChanges()
  // Options: Enregistrer, Abandonner, Annuler
  if (choice === 'save') await enregistrerRelance()
  if (choice === 'cancel') return
}
```

**CHECKPOINT**: `relance-skip-unsaved-check`

### Étape 2: Passage

```javascript
const currentIndex = relancesAValider.findIndex(r => r.id === currentId)
let nextIndex

if (direction === 'next') {
  nextIndex = currentIndex + 1
  if (nextIndex >= relancesAValider.length) nextIndex = 0 // Boucle
} else {
  nextIndex = currentIndex - 1
  if (nextIndex < 0) nextIndex = relancesAValider.length - 1
}

selectionnerRelancePourValidation(relancesAValider[nextIndex])
```

**CHECKPOINT**: `relance-skipped`
```json
{
  "fromId": "rel_abc123",
  "toId": "rel_def456",
  "direction": "next",
  "position": "5/12"
}
```

## Gestion des modifications

Si l'utilisateur a des modifications non sauvegardées :
1. **Enregistrer** : Sauvegarde puis passe
2. **Abandonner** : Passe sans sauvegarder
3. **Annuler** : Reste sur la relance courante
