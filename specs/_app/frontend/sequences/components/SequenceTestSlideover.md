# Component: SequenceTestSlideover

**Chemin** : `frontend/app/components/SequenceTestSlideover.vue`
**Utilisation** : Test d'une séquence complète de relances

## Description

Slideover permettant de tester une séquence de relances complète en sélectionnant un payeur avec impayés et un email de destination.

## Props

| Nom | Type | Requis | Description |
|-----|------|--------|-------------|
| `modelValue` | `Boolean` | | État d'ouverture du slideover |
| `sequence` | `Object` | ✓ | Séquence à tester |
| `emails` | `Array` | ✓ | Emails de la séquence |

## Événements

| Nom | Payload | Description |
|-----|---------|-------------|
| `update:modelValue` | `Boolean` | Mise à jour de l'état d'ouverture |
| `test-sent` | | Test envoyé avec succès |

## Fonctionnement

1. **Chargement des payeurs** : Récupère les payeurs ayant des impayés actifs
2. **Sélection** : L'utilisateur choisit un payeur et saisit un email de test
3. **Prévisualisation** : Affiche les emails qui seront envoyés (délai, objet)
4. **Envoi** : Appel à la Cloud Function `sendSequenceTest`

## Cloud Function appelée

```javascript
await $parse.Cloud.run('sendSequenceTest', {
  sequenceId: 'seq_xxx',
  testEmail: 'test@example.com',
  payeurId: 'contact_xxx',
  payeurData: { /* données du payeur */ },
  emails: [ /* emails de la séquence */ ],
  userId: 'user_xxx',
  userEmail: 'user@company.com',
  userName: 'John Doe'
})
```

## Affichage des payeurs

Pour chaque payeur, affiche :
- Nom et email
- Nombre d'impayés
- Montant total (formaté en euros)

## Réinitialisation

Lors de la fermeture du slideover :
- Réinitialise le payeur sélectionné
- Vide les données du payeur
- Conserve l'email de test saisi
