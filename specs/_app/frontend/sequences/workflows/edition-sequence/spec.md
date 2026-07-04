# Workflow: edition-sequence

**Écran** : sequences  
**Feature** : F-011 Configuration des séquences de relances  
**Type** : Frontend  

## Description

Workflow d'édition d'une séquence existante. Permet de modifier tous les champs sauf le type (relances/suivi).

## Déclencheur

- Clic sur une ligne du tableau des séquences
- Clic sur le bouton "Éditer" d'une séquence

## Inputs

| Nom | Type | Description |
|-----|------|-------------|
| `sequenceId` | String | ID de la séquence à éditer |

## Étapes / Checkpoints

### Étape 1: Chargement de la séquence

**Action**: Récupérer la séquence depuis Parse

```javascript
async function ouvrirEdition(sequenceId) {
  isCreating.value = false
  
  const sequence = await new Parse.Query(SequenceRelance).get(sequenceId)
  sequenceCourante.value = sequence
  
  // Pré-remplir le formulaire
  form.nom = sequence.get('nom')
  form.type = sequence.get('type')
  form.niveau = sequence.get('niveau')
  form.delaiJours = sequence.get('delaiJours')
  form.templateSujet = sequence.get('templateSujet')
  form.templateCorps = sequence.get('templateCorps')
  form.estActive = sequence.get('estActive')
  form.description = sequence.get('description') || ''
  
  activeTab.value = 'informations'
  slideoverOpen.value = true
}
```

**CHECKPOINT**: `sequence-form-opened`
```json
{
  "mode": "edition",
  "sequenceId": "seq_abc123",
  "timestamp": "2024-06-30T10:30:00Z"
}
```

### Étape 2: Modification des champs

**CHECKPOINT**: `sequence-field-modified`
```json
{
  "sequenceId": "seq_abc123",
  "field": "templateCorps",
  "oldLength": 800,
  "newLength": 950
}
```

### Étape 3: Sauvegarde

**Action**: Mettre à jour la séquence

```javascript
async function sauvegarder() {
  saving.value = true
  
  const sequence = sequenceCourante.value
  sequence.set('nom', form.nom)
  sequence.set('niveau', form.niveau)
  sequence.set('delaiJours', form.delaiJours)
  sequence.set('templateSujet', form.templateSujet)
  sequence.set('templateCorps', form.templateCorps)
  sequence.set('estActive', form.estActive)
  sequence.set('description', form.description)
  
  await sequence.save()
}
```

**CHECKPOINT**: `sequence-updated`
```json
{
  "id": "seq_abc123",
  "changes": ["nom", "templateCorps"],
  "timestamp": "2024-06-30T10:35:00Z"
}
```

## Gestion des erreurs

**CHECKPOINT**: `sequence-update-failed`
```json
{
  "id": "seq_abc123",
  "error": "Network error"
}
```

## Règles métier

- Le type (relances/suivi) ne peut pas être modifié
- Le niveau peut être modifié sauf si ça crée un conflit avec un niveau existant
- Si la séquence est utilisée par des relances, afficher un avertissement
