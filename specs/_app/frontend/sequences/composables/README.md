# Composables de /sequences/

Documentation des composables Vue utilisés pour la gestion des séquences.

## Liste des composables

| Composable | Description | Fichier |
|------------|-------------|---------|
| [useSequenceEditor](./useSequenceEditor.md) | Constantes et utilitaires d'édition | `useSequenceEditor.js` |
| [useSequenceRules](./useSequenceRules.md) | Règles d'attribution automatique | `useSequenceRules.js` |

## Autres composables liés

Dans `frontend/app/composables/` :

| Composable | Description |
|------------|-------------|
| `useIaSequence.js` | Génération IA des templates |
| `useDynamicOptions.js` | Chargement des options dynamiques |
| `useLiensPaiement.js` | Gestion des liens de paiement |

## Usage typique

```vue
<script setup>
// Dans une page/sequence
const { SCENARIO_FORMATS, scenarioTabs } = useSequenceEditor()
const { groupesRegles, calculerApercu } = useSequenceRules($parse)
</script>
```
