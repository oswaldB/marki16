# Component: VariablesPicker

**Chemin** : `frontend/app/components/VariablesPicker.vue`
**Utilisation** : Sélection et copie rapide des variables de template

## Description

Composant affichant les variables disponibles pour les templates d'email, organisées par groupes, avec recherche et copie en un clic.

## Props

| Nom | Type | Requis | Description |
|-----|------|--------|-------------|
| `variables` | `Array` | ✓ | Liste des groupes de variables |
| `activeScenario` | `String` | | Scénario actif (filtre les variables multiples) |

## Événements

| Nom | Payload | Description |
|-----|---------|-------------|
| `copy` | `varName` | Copie d'une variable dans le presse-papiers |
| `copyPaymentLink` | `paymentLink` | Copie d'un lien de paiement |
| `openLiens` | | Ouverture du gestionnaire de liens de paiement |

## Structure des variables

```javascript
[
  {
    groupe: 'PAYEUR',
    vars: ['payeur_nom', 'payeur_email', 'payeur_adresse']
  },
  {
    groupe: 'LIENS DE PAIEMENT',
    vars: [
      { name: 'payment_1', display: 'Paiement CB', isPaymentLink: true, url: '...' }
    ]
  },
  {
    groupe: 'MULTIPLE',
    vars: ['loop impayes', 'endloop', 'nfacture', 'montant']
  }
]
```

## Variables de date

Les variables de date sont automatiquement formatées avec la syntaxe EJS :
- `[[date_piece]]` → `[[date_piece, date("DD/MM/YYYY")]]`

## Variables de relance

Pour les emails après le premier, des variables spéciales sont disponibles :
- `relance.1.objet` - Objet de la relance précédente
- `relance.1.dateEnvoi` - Date d'envoi de la relance précédente

## Responsive

- Desktop : 2 colonnes pour les groupes de variables
- Mobile : 1 colonne empilée

## Exemple d'utilisation

```vue
<VariablesPicker
  :variables="variablesForEmail"
  :active-scenario="email.activeScenario"
  @copy="onCopyVariable"
  @copy-payment-link="onCopyPaymentLink"
  @open-liens="openLiensDrawer"
/>
```
