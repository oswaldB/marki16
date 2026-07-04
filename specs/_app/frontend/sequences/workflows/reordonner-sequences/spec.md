# Workflow: reordonner-sequences

**Écran** : sequences  
**Feature** : F-011 Configuration des séquences de relances  
**Type** : Frontend  

## Description

Workflow de réorganisation des séquences par drag & drop. Met à jour automatiquement les niveaux des séquences.

## Déclencheur

- Déplacement d'une séquence via drag & drop dans le tableau
- Clic sur les flèches haut/bas d'une séquence

## Inputs

| Nom | Type | Description |
|-----|------|-------------|
| `sequenceId` | String | ID de la séquence déplacée |
| `nouvelIndex` | Number | Nouvelle position dans la liste |

## Étapes / Checkpoints

### Étape 1: Détection du déplacement

**Action**: Utilisateur déplace une séquence

```javascript
function onDragEnd(event) {
  const { oldIndex, newIndex } = event
  if (oldIndex === newIndex) return
  
  const sequencesReordonnees = [...sequences.value]
  const [movedItem] = sequencesReordonnees.splice(oldIndex, 1)
  sequencesReordonnees.splice(newIndex, 0, movedItem)
  
  reordonner(sequencesReordonnees)
}
```

**CHECKPOINT**: `sequence-drag-started`
```json
{
  "sequenceId": "seq_abc123",
  "oldIndex": 2,
  "timestamp": "2024-06-30T10:30:00Z"
}
```

### Étape 2: Calcul des nouveaux niveaux

**Action**: Recalculer les niveaux selon le nouvel ordre

```javascript
function reordonner(nouvelOrdre) {
  // Grouper par type
  const parType = { relances: [], suivi: [] }
  
  nouvelOrdre.forEach((seq, index) => {
    const type = seq.get('type')
    parType[type].push({ seq, index: parType[type].length })
  })
  
  // Mettre à jour les niveaux (index + 1)
  for (const type of ['relances', 'suivi']) {
    parType[type].forEach(({ seq }, index) => {
      seq.set('niveau', index + 1)
    })
  }
}
```

**CHECKPOINT**: `sequence-levels-recalculated`
```json
{
  "sequences": [
    { "id": "seq_abc123", "oldLevel": 3, "newLevel": 2 },
    { "id": "seq_def456", "oldLevel": 2, "newLevel": 3 }
  ]
}
```

### Étape 3: Sauvegarde batch

**Action**: Sauvegarder toutes les séquences modifiées

```javascript
async function sauvegarderOrdre() {
  reordering.value = true
  
  const sequencesAMettreAJour = sequences.value.filter(seq => 
    seq.dirty('niveau')
  )
  
  await Parse.Object.saveAll(sequencesAMettreAJour)
}
```

**CHECKPOINT**: `sequence-reordered`
```json
{
  "count": 2,
  "sequences": ["seq_abc123", "seq_def456"],
  "timestamp": "2024-06-30T10:35:00Z"
}
```

## Gestion des erreurs

**CHECKPOINT**: `sequence-reorder-failed`
```json
{
  "error": "Network error",
  "sequences": ["seq_abc123", "seq_def456"]
}
```

## Scénarios de test

### Scénario: Réorganisation simple
1. Séquence A (niveau 1), B (niveau 2), C (niveau 3)
2. Déplacer C entre A et B
3. **Attendu**: A (1), C (2), B (3)

### Scénario: Séparation par type
1. Les séquences "relances" et "suivi" sont réordonnées séparément
2. Déplacer une séquence "relances" n'affecte pas les niveaux "suivi"
