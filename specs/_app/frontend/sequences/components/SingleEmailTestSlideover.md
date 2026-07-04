# Component: SingleEmailTestSlideover

**Chemin** : `frontend/app/components/SingleEmailTestSlideover.vue`
**Utilisation** : Test d'un email individuel d'une séquence

## Description

Slideover pour tester un seul email spécifique d'une séquence de relances (par opposition à la séquence complète).

## Props

| Nom | Type | Requis | Description |
|-----|------|--------|-------------|
| `modelValue` | `Boolean` | | État d'ouverture |
| `sequence` | `Object` | ✓ | Séquence parente |
| `emails` | `Array` | ✓ | Tous les emails de la séquence |
| `emailIndex` | `Number` | ✓ | Index de l'email à tester |

## Différences avec SequenceTestSlideover

| Aspect | SequenceTestSlideover | SingleEmailTestSlideover |
|--------|----------------------|--------------------------|
| Portée | Tous les emails de la séquence | Un seul email (par index) |
| Cloud Function | `sendSequenceTest` | `sendTestSingleEmail` |
| Utilisation | Bouton "Tester" global | Bouton "Tester" sur chaque carte |

## Cloud Function

```javascript
$parse.Cloud.run('sendTestSingleEmail', {
  sequenceId: 'seq_xxx',
  testEmail: 'test@example.com',
  payeurId: 'contact_xxx',
  payeurData: { /* données avec impayés détaillés */ },
  emailIndex: 2, // Email spécifique
  userId: 'user_xxx',
  userEmail: 'user@company.com',
  userName: 'John Doe'
})
```

## Récupération des impayés

Récupère les impayés détaillés du payeur sélectionné :
- `nfacture`, `reference`
- `date_piece`, `date_echeance`
- `total_ht`, `total_ttc`, `montant_total`
- `reste_a_payer`
- `url_pdf`

## Mode fire and forget

Comme `SuiviTestSlideover`, l'envoi est asynchrone :
- Confirmation immédiate
- Envoi en arrière-plan
- Pas d'attente de réponse
