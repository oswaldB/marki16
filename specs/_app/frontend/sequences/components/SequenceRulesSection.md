# Component: SequenceRulesSection

**Chemin** : `frontend/app/components/SequenceRulesSection.vue`
**Utilisation** : Configuration des règles d'attribution automatique des impayés aux séquences de suivi

## Description

Composant permettant de définir des règles métier pour attribuer automatiquement les impayés à une séquence de suivi. Les règles sont organisées en groupes avec logique conditionnelle (ET/OU).

## Props

| Nom | Type | Requis | Description |
|-----|------|--------|-------------|
| `groupes` | `Array` | ✓ | Liste des groupes de règles |
| `attributionAutomatiqueValue` | `Boolean` | | État du toggle d'activation |

## Événements

| Nom | Payload | Description |
|-----|---------|-------------|
| `update:groupes` | `Array` | Mise à jour des groupes de règles |
| `update:attributionAutomatiqueValue` | `Boolean` | Mise à jour du toggle |

## Structure des règles

```javascript
// Groupe de règles
{
  logique: 'ET', // ou 'OU'
  regles: [
    {
      champ: 'statut',
      operateur: 'egal',
      valeur: 'impayé',
      options: ['impayé', 'en attente', 'validé']
    }
  ]
}
```

## Champs disponibles pour les règles

| Champ | Type | Opérateurs supportés |
|-------|------|---------------------|
| `statut` | String | égal, différent |
| `montant` | Number | supérieur, inférieur, égal |
| `date_echeance` | Date | avant, après |
| `payeur` | Référence | égal, différent |

## Aperçu live

Le composant affiche en temps réel :
- Nombre d'impayés concernés par les règles
- Nombre d'impayés exclus
- Nombre d'impayés sans email
- Tableau détaillé des impayés avec indicateurs de conformité

## Exemple d'utilisation

```vue
<SequenceRulesSection
  v-model:groupes="sequence.groupesRegles"
  v-model:attributionAutomatiqueValue="sequence.attributionAutomatique"
/>
```
