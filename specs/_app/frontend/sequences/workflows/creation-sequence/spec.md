# Workflow: creation-sequence

**Écran** : sequences  
**Feature** : F-011 Configuration des séquences de relances  
**Type** : Frontend  

## Description

Workflow de création d'une nouvelle séquence de relances ou de suivi. Ouvre un slideover avec formulaire multi-onglets pour configurer la séquence et son template d'email.

## Déclencheur

- Clic sur le bouton "+ Nouvelle séquence" sur la page `/sequences`

## Inputs

| Nom | Type | Description |
|-----|------|-------------|
| `typeParDefaut` | String | Type pré-sélectionné ('relances' ou 'suivi') |

## Étapes / Checkpoints

### Étape 1: Ouverture du slideover

**Action**: Ouvrir le slideover de création

```javascript
function ouvrirCreation(type = 'relances') {
  isCreating.value = true
  sequenceCourante.value = null
  
  // Initialiser le formulaire avec valeurs par défaut
  form.nom = ''
  form.type = type
  form.niveau = calculerProchainNiveau(type)
  form.delaiJours = 15
  form.templateSujet = ''
  form.templateCorps = ''
  form.estActive = true
  form.description = ''
  
  activeTab.value = 'informations'
  slideoverOpen.value = true
}
```

**CHECKPOINT**: `sequence-form-opened`
```json
{
  "mode": "creation",
  "type": "relances",
  "timestamp": "2024-06-30T10:30:00Z"
}
```

### Étape 2: Remplissage des informations

**Action**: L'utilisateur remplit l'onglet "Informations"

**Champs**:
- Nom de la séquence (input text)
- Type (select: relances/suivi)
- Niveau (input number, auto-calculé)
- Délai en jours (input number)
- Description (textarea optionnel)

**CHECKPOINT**: `sequence-informations-filled`
```json
{
  "nom": "Relance amicale",
  "type": "relances",
  "niveau": 1,
  "delaiJours": 15
}
```

### Étape 3: Configuration du template

**Action**: L'utilisateur passe à l'onglet "Template"

**Composants**:
- Input pour l'objet de l'email
- Éditeur WYSIWYG ToastUI pour le corps
- Chips des variables disponibles (cliquables pour insertion)

**CHECKPOINT**: `sequence-template-edited`
```json
{
  "templateSujetLength": 45,
  "templateCorpsLength": 850,
  "variablesUsed": ["{{contact_nom}}", "{{montant_total}}"]
}
```

### Étape 4: Aperçu (optionnel)

**Action**: L'utilisateur consulte l'onglet "Aperçu"

**CHECKPOINT**: `sequence-preview-viewed`
```json
{
  "renderedSujet": "Rappel : 3 factures en attente - Dupont SARL",
  "renderedCorpsLength": 920
}
```

### Étape 5: Validation et sauvegarde

**Action**: Clic sur le bouton "Créer la séquence"

**Validation**:
- Tous les champs requis sont remplis
- Le nom a au moins 3 caractères
- Le délai est un nombre positif
- Le corps du template a au moins 50 caractères

**CHECKPOINT**: `sequence-form-validated`
```json
{
  "validation": "passed",
  "fields": ["nom", "type", "niveau", "delaiJours", "templateSujet", "templateCorps"]
}
```

### Étape 6: Sauvegarde Parse

**Action**: Appel API pour créer la séquence

```javascript
async function sauvegarder() {
  saving.value = true
  
  const sequence = new SequenceRelance()
  sequence.set('nom', form.nom)
  sequence.set('type', form.type)
  sequence.set('niveau', form.niveau)
  sequence.set('delaiJours', form.delaiJours)
  sequence.set('templateSujet', form.templateSujet)
  sequence.set('templateCorps', form.templateCorps)
  sequence.set('estActive', form.estActive)
  sequence.set('description', form.description)
  
  await sequence.save()
}
```

**CHECKPOINT**: `sequence-created`
```json
{
  "id": "seq_abc123",
  "nom": "Relance amicale",
  "type": "relances",
  "niveau": 1,
  "delaiJours": 15,
  "timestamp": "2024-06-30T10:35:00Z"
}
```

### Étape 7: Fermeture et rafraîchissement

**Action**: Fermer le slideover et mettre à jour la liste

**CHECKPOINT**: `sequence-form-closed`
```json
{
  "mode": "creation",
  "result": "success"
}
```

## Gestion des erreurs

### Erreur de validation

**CHECKPOINT**: `sequence-form-validation-failed`
```json
{
  "errors": [
    { "field": "nom", "message": "Le nom est requis" },
    { "field": "templateCorps", "message": "Le corps est trop court" }
  ]
}
```

### Erreur API

**CHECKPOINT**: `sequence-creation-failed`
```json
{
  "error": "Network error",
  "form": { "nom": "Relance amicale", "type": "relances" }
}
```

## Scénarios de test

### Scénario nominal: Création réussie
1. Cliquer "+ Nouvelle séquence"
2. Remplir nom: "Relance amicale"
3. Sélectionner type: "Relances"
4. Vérifier niveau: auto = 1
5. Définir délai: 15
6. Passer à l'onglet Template
7. Remplir objet: "Rappel : {{nb_factures}} factures..."
8. Remplir corps avec template
9. Consulter l'aperçu
10. Cliquer "Créer la séquence"
11. **Attendu**: Toast succès, séquence dans la liste

### Scénario erreur: Champs manquants
1. Cliquer "+ Nouvelle séquence"
2. Remplir uniquement le nom
3. Cliquer "Créer"
4. **Attendu**: Messages d'erreur sur les champs requis

### Scénario: Annulation
1. Ouvrir le slideover
2. Remplir quelques champs
3. Cliquer "Annuler" ou fermer
4. **Attendu**: Modal de confirmation si changements non sauvegardés

## Dépendances

- Parse SDK pour la sauvegarde
- ToastUI Editor pour l'édition du template
- Nuxt UI pour le slideover et les composants de formulaire
