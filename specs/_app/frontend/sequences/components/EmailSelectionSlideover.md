# Component: EmailSelectionSlideover

**Chemin** : `frontend/app/components/EmailSelectionSlideover.vue`
**Utilisation** : Sélection ou création d'un email de relance pour un contact/impayé

## Description

Slideover permettant de sélectionner un email de relance existant parmi les contacts ou d'en créer un nouveau.

## Props

| Nom | Type | Requis | Description |
|-----|------|--------|-------------|
| `modelValue` | `Boolean` | | État d'ouverture |
| `contactId` | `String` | | ID du contact principal (optionnel) |
| `impayelId` | `String` | | ID de l'impayé (optionnel) |

## Événements

| Nom | Payload | Description |
|-----|---------|-------------|
| `update:modelValue` | `Boolean` | Mise à jour de l'état |
| `emailSelected` | `email, contactId` | Email sélectionné ou créé |

## Fonctionnalités

### Recherche d'emails existants
- Champ de recherche avec filtrage en temps réel
- Liste des contacts avec email configuré
- Affichage du nom + email

### Création d'un nouvel email
- Formulaire : email (requis) + nom (optionnel)
- Création d'un contact standard
- Relation `email_relance` vers le contact principal si fourni

## Création du contact relance

```javascript
const contactRelance = new Contact()
contactRelance.set('email', newEmail.value)
contactRelance.set('nom', newName.value || newEmail.value)
contactRelance.set('estActif', true)
contactRelance.set('nombreUtilisations', 0)

if (props.contactId) {
  contactRelance.set('email_relance', contactPrincipal)
}

await contactRelance.save()
```

## Traçabilité

Création d'une activité pour tracer :
```javascript
const activite = new Activite()
activite.set('type', 'email_relance_cree')
activite.set('details', `Email de relance créé: ${email}`)
activite.set('contactRelance', contactRelance)
activite.set('contact', contactPtr) // si contactId
```
