# Component: SequenceEmailCard

**Chemin** : `frontend/app/components/SequenceEmailCard.vue`
**Utilisation** : Édition d'un email dans une séquence de relances

## Description

Carte d'édition complète pour un email de relance, incluant la configuration du délai, du destinataire, et du contenu par scénario (1 impayé, plusieurs impayés, etc.).

## Props

| Nom | Type | Requis | Description |
|-----|------|--------|-------------|
| `email` | `Object` | ✓ | Données de l'email (délai, scénarios, etc.) |
| `index` | `Number` | ✓ | Index de l'email dans la séquence |
| `smtpOptions` | `Array` | | Liste des profils SMTP disponibles |
| `allVariables` | `Array` | | Variables disponibles pour les templates |
| `editorRefs` | `Object` | ✓ | Références des éditeurs ToastUI |

## Événements

| Nom | Payload | Description |
|-----|---------|-------------|
| `delete` | `emailKey` | Suppression de l'email |
| `test-email` | `index` | Test de l'email individuel |
| `openChatgpt` | `index` | Ouverture du modal IA |
| `openSmtp` | | Ouverture du drawer SMTP |
| `openLiens` | | Ouverture du drawer liens de paiement |
| `corpsChange` | `email, html` | Modification du corps |
| `smtpChange` | `email, scenario, smtpId` | Changement de profil SMTP |
| `editorMounted` | `emailKey, editorInstance` | Éditeur initialisé |

## Scénarios supportés

| Scénario | Description |
|----------|-------------|
| `single` | 1 impayé à relancer |
| `multiple` | Plusieurs impayés du même client |
| `both` | Impayés + apporteur (courtier) |
| `broker` | Apporteur seul |

## Structure d'un email

```javascript
{
  delai: 15, // J+15
  to: '<%= payeur_email %>',
  activeScenario: 'single',
  scenarios: [
    {
      format: 'single',
      active: true,
      smtp: 'smtp_123',
      cc: 'manager@company.com',
      objet: 'Relance - <%= nfacture %>',
      corps: '<p>Bonjour...</p>'
    },
    // ... autres scénarios
  ]
}
```

## Variables disponibles

- Variables de base : `payeur_nom`, `payeur_email`, `montant_total`, etc.
- Variables de relance précédente : `relance.1.objet`, `relance.1.dateEnvoi`
- Variables de paiement : liens de paiement configurables

## Fonctionnalités

- Réduction/développement de la carte
- Test individuel de l'email
- Génération IA du contenu
- Sélection du profil SMTP par scénario
- Copie rapide des variables
- Prévisualisation du rendu
