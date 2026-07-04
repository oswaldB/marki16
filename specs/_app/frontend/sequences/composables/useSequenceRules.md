# Composable: useSequenceRules

**Chemin** : `frontend/app/composables/useSequenceRules.js`
**Utilisation** : Gestion des règles d'attribution automatique

## Description

Fournit la logique complète pour créer, éditer et évaluer les règles d'attribution automatique des impayés aux séquences.

## Paramètres

| Nom | Type | Description |
|-----|------|-------------|
| `parse` | `Object` | Instance Parse SDK |

## State retourné

| Nom | Type | Description |
|-----|------|-------------|
| `groupesRegles` | `Ref<Array>` | Groupes de règles |
| `attributionAutomatique` | `Ref<Boolean>` | Toggle activation |
| `validationObligatoire` | `Ref<Boolean>` | Validation requise |
| `apercuConcernes` | `Ref<Number>` | Nombre d'impayés concernés |
| `apercuExclus` | `Ref<Number>` | Nombre d'impayés exclus |
| `apercuSansEmail` | `Ref<Number>` | Nombre sans email |
| `impayesConcernes` | `Ref<Array>` | Liste des impayés concernés |
| `showImpayesTable` | `Ref<Boolean>` | Affichage du tableau |

## Méthodes

### Gestion des groupes

| Méthode | Paramètres | Description |
|---------|-----------|-------------|
| `ajouterGroupeRegles()` | - | Ajoute un nouveau groupe |
| `supprimerGroupe(index)` | `index` | Supprime un groupe |

### Gestion des règles

| Méthode | Paramètres | Description |
|---------|-----------|-------------|
| `ajouterRegleAuGroupe(groupeIdx)` | `groupeIdx` | Ajoute une règle au groupe |
| `supprimerRegle(groupeIdx, regleIdx)` | `groupeIdx`, `regleIdx` | Supprime une règle |
| `chargerOptionsPourChamp(regle)` | `regle` | Charge les options dynamiques |

### Évaluation

| Méthode | Paramètres | Description |
|---------|-----------|-------------|
| `calculerApercu()` | - | Calcule l'aperçu des impayés concernés |
| `evaluerCondition(impaye, regle)` | `impaye`, `regle` | Évalue une règle sur un impayé |

## Champs supportés

- `payeur_type` (options dynamiques)
- `statut` (options dynamiques)
- `statut_dossier` (options dynamiques)
- `ville` (options dynamiques)
- `code_postal` (options dynamiques)
- `reste_a_payer` (numérique)

## Opérateurs

- `egal` / `different`
- `superieur` / `inferieur`
- `contient`

## Logique de groupe

- `ET` : Toutes les règles du groupe doivent matcher
- `OU` : Au moins une règle du groupe doit matcher

## Exemple d'utilisation

```javascript
const {
  groupesRegles,
  attributionAutomatique,
  apercuConcernes,
  calculerApercu,
  ajouterGroupeRegles,
  ajouterRegleAuGroupe
} = useSequenceRules($parse)
```
