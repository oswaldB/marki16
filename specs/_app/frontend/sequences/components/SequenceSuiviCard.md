# Component: SequenceSuiviCard

**Chemin** : `frontend/app/components/SequenceSuiviCard.vue`
**Utilisation** : Édition d'un email dans une séquence de suivi (emails réguliers)

## Description

Carte d'édition pour un email de suivi, avec configuration de fréquence (quotidienne, hebdomadaire, mensuelle) au lieu d'un délai fixe.

## Props

| Nom | Type | Requis | Description |
|-----|------|--------|-------------|
| `email` | `Object` | ✓ | Données de l'email de suivi |
| `smtpOptions` | `Array` | | Liste des profils SMTP disponibles |
| `collapsed` | `Boolean` | | État réduit/développé |

## Événements

| Nom | Payload | Description |
|-----|---------|-------------|
| `update:to` | `value` | Mise à jour du destinataire |
| `update:cc` | `value` | Mise à jour du CC |
| `update:smtp` | `scenario, value` | Mise à jour du SMTP |
| `update:objet` | `value` | Mise à jour de l'objet |
| `update:scenario` | `scenario` | Changement de scénario |
| `delete` | | Suppression de l'email |
| `toggle` | | Toggle réduit/développé |
| `test` | | Test de l'email |
| `create` | | Création d'un nouvel email |

## Types de fréquence

| Type | Configuration | Description |
|------|-------------|-------------|
| `quotidien` | Heure (0-23) | Envoi tous les jours à la même heure |
| `hebdomadaire` | Jour de la semaine (0-6) | Envoi hebdomadaire |
| `mensuel` | Jour du mois (1-31, 'last') | Envoi mensuel |

## Structure de la fréquence

```javascript
{
  frequence: {
    type: 'hebdomadaire', // 'quotidien' | 'hebdomadaire' | 'mensuel'
    hour: '9',              // pour quotidien
    dayOfWeek: '1',         // pour hebdomadaire (1 = Lundi)
    dayOfMonth: '15'        // pour mensuel
  }
}
```

## Différences avec SequenceEmailCard

| Aspect | SequenceEmailCard (Relances) | SequenceSuiviCard (Suivi) |
|--------|------------------------------|---------------------------|
| Déclenchement | Délai après échéance (J+X) | Fréquence régulière |
| Scénarios | 4 scénarios détaillés | Même scénarios simplifiés |
| Cible | Impayés spécifiques | Tous les impayés actifs |
| Règles | Non applicable | Attribution automatique |
