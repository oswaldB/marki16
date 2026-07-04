# Composable: useSequenceEditor

**Chemin** : `frontend/app/composables/useSequenceEditor.js`
**Utilisation** : Logique partagée pour l'édition des séquences

## Description

Fournit les constantes, options et utilitaires pour l'édition des séquences de relances.

## Exports

### Constantes

| Nom | Type | Description |
|-----|------|-------------|
| `SCENARIO_FORMATS` | `Array<String>` | `['single', 'multiple', 'both', 'broker']` |

### DOCUMENTATION

Objet de documentation pour les variables EJS utilisées dans les templates.

### Variables de scénario

```javascript
export const SCENARIO_VARIABLES = {
  single: [...],
  multiple: [...],
  both: [...],
  broker: [...]
}
```

### Options de l'éditeur

```javascript
export const editorOptions = {
  height: '300px',
  usageStatistics: false,
  hideModeSwitch: true,
  toolbarItems: [...]
}
```

### Onglets de scénario

```javascript
export const scenarioTabs = [
  { label: '1 impayé', value: 'single' },
  { label: 'Plusieurs', value: 'multiple' },
  { label: 'Impayés + apporteur', value: 'both' },
  { label: 'Apporteur seul', value: 'broker' }
]
```

### VARIABLES

Liste complète des variables disponibles pour les templates, groupées par catégorie.

## Fonctions utilitaires

### getScenario(email, format)
Récupère le scénario actif pour un email donné.

### switchScenario(email, newScenario, editorRefs)
Change le scénario actif et met à jour l'éditeur.

### createDefaultScenarios()
Crée les 4 scénarios par défaut pour un nouvel email.

### generateEmailTemplate(sequence, index)
Génère un template d'email par défaut basé sur le niveau.
