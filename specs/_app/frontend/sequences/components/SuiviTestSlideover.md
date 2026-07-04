# Component: SuiviTestSlideover

**Chemin** : `frontend/app/components/SuiviTestSlideover.vue`
**Utilisation** : Test d'un email de suivi (séquence régulière)

## Description

Slideover pour tester un email de suivi, avec filtrage optionnel selon les règles d'attribution automatique.

## Props

| Nom | Type | Requis | Description |
|-----|------|--------|-------------|
| `modelValue` | `Boolean` | | État d'ouverture |
| `sequence` | `Object` | ✓ | Séquence de suivi |
| `emails` | `Array` | ✓ | Emails de la séquence |
| `groupesRegles` | `Array` | | Règles d'attribution automatique |
| `attributionAutomatique` | `Boolean` | | État de l'attribution auto |

## Événements

| Nom | Payload | Description |
|-----|---------|-------------|
| `update:modelValue` | `Boolean` | Mise à jour de l'état |
| `test-sent` | | Test envoyé (fire and forget) |

## Filtrage par règles

Si `attributionAutomatique` est activé et des règles sont définies :
- Affiche uniquement les payeurs correspondant aux règles
- Montre les tags de conformité pour chaque payeur
- Sinon, affiche tous les payeurs avec impayés

## Construction de la requête

```javascript
// Conversion des règles en requête Parse
const query = buildImpayeQueryFromRegles()
query.equalTo('facture_soldee', false)
query.greaterThan('reste_a_payer', 0)
```

## Mode fire and forget

Contrairement à `SequenceTestSlideover`, l'envoi est asynchrone :
- Ferme immédiatement le slideover
- Affiche une confirmation instantanée
- L'envoi se fait en arrière-plan
- Les erreurs sont logguées en console

## Cloud Function

```javascript
$parse.Cloud.run('sendTestSingleSuivi', {
  sequenceId: 'seq_xxx',
  testEmail: 'test@example.com',
  payeurId: 'contact_xxx',
  payeurData: { /* données */ },
  emailIndex: 0,
  userId: 'user_xxx',
  // ...
})
```
