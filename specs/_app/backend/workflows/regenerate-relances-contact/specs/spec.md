# Workflow Backend: regenerate-relances-contact

**Feature** : F-008 Blacklist des Impayés  
**Type** : Backend (Cloud Function)  
**Cloud Function** : `regenerateRelancesForContact`

## Description

Régénère les relances d'un contact après un changement de statut blacklist d'un de ses impayés. Supprime les relances brouillons existantes et recalcule les relances selon les nouveaux critères.

## Input

```javascript
{
  contactId: String,        // ID du contact concerné
  excludeImpayeId: String   // ID de l'impayé à exclure (si blacklist), null si unblacklist
}
```

## Étapes

### 1. Récupération du contact et de ses impayés

```javascript
const Contact = Parse.Object.extend('Contact')
const contact = await new Parse.Query(Contact).get(contactId)

if (!contact) {
  throw new Error('Contact non trouvé')
}

// Récupérer les impayés non soldés du contact
const Impaye = Parse.Object.extend('Impaye')
const impayeQuery = new Parse.Query(Impaye)
impayeQuery.equalTo('contact_relance', contact)
impayeQuery.equalTo('facture_soldee', false)
impayeQuery.greaterThan('reste_a_payer', 0)

// Si excludeImpayeId fourni, exclure cet impayé
if (excludeImpayeId) {
  impayeQuery.notEqualTo('objectId', excludeImpayeId)
}

const impayes = await impayeQuery.find()
```

**CHECKPOINT**: `regenerate-contact-loaded`
```json
{ 
  "contactId": "abc123", 
  "impayesCount": 5,
  "excludedImpayeId": "xyz789"
}
```

### 2. Récupération des relances brouillons

```javascript
const Relance = Parse.Object.extend('Relance')
const relanceQuery = new Parse.Query(Relance)
relanceQuery.equalTo('contact', contact)
relanceQuery.notEqualTo('statut', 'envoyee')
relanceQuery.notEqualTo('statut', 'annulee')
relanceQuery.doesNotExist('dateEnvoi')
relanceQuery.include('impayes')

const brouillons = await relanceQuery.find()
```

**CHECKPOINT**: `regenerate-contact-brouillons-found`
```json
{ "count": 3 }
```

### 3. Suppression des relances brouillons

```javascript
if (brouillons.length > 0) {
  await Parse.Object.destroyAll(brouillons)
}
```

**CHECKPOINT**: `regenerate-contact-brouillons-deleted`
```json
{ "deletedCount": 3 }
```

### 4. Cas d'arrêt - Pas d'impayés à relancer

```javascript
// Si aucun impayé à relancer (tous blacklistés ou soldés)
if (impayes.length === 0) {
  return {
    success: true,
    contactId,
    deletedCount: brouillons.length,
    createdCount: 0,
    reason: 'no_impayes_to_relance'
  }
}
```

**CHECKPOINT**: `regenerate-contact-no-impayes`
```json
{ "reason": "no_impayes_to_relance" }
```

### 5. Déclenchement de la génération des relances

```javascript
// Appeler generate-relances pour ce contact spécifiquement
const result = await Parse.Cloud.run('generateRelancesForContact', {
  contactId,
  impayes: impayes.map(i => i.id)
})
```

**CHECKPOINT**: `regenerate-contact-generated`
```json
{ 
  "contactId": "abc123",
  "createdCount": 2
}
```

### 6. Journalisation

```javascript
const Activite = Parse.Object.extend('Activite')
const activite = new Activite()
activite.set('type', 'relances_regenerees_contact')
activite.set('contact', contact)
activite.set('details', `Régénération des relances après blacklist/unblacklist`)
activite.set('metadata', { 
  deletedCount: brouillons.length,
  createdCount: result.createdCount,
  excludedImpayeId,
  contactId
})
await activite.save()
```

**CHECKPOINT**: `regenerate-contact-completed`

## Output

```javascript
{
  success: true,
  contactId: "abc123",
  deletedCount: 3,      // Relances brouillons supprimées
  createdCount: 2,      // Nouvelles relances créées
  reason: null          // Si arrêt prématuré (no_impayes_to_relance)
}
```

## Règles métier

- Les relances **déjà envoyées** ne sont jamais touchées
- Les relances **annulées** ne sont pas supprimées
- Seules les relances en **brouillon** ou **validées** mais non envoyées sont supprimées
- Si `excludeImpayeId` est fourni, cet impayé est exclu de la nouvelle génération
- Si aucun impayé n'est éligible après filtrage, aucune nouvelle relance n'est créée

## Gestion des erreurs

```javascript
{
  success: false,
  error: "Contact non trouvé",
  code: "CONTACT_NOT_FOUND"
}

{
  success: false,
  error: "Erreur lors de la suppression des relances",
  code: "DELETE_ERROR",
  details: { ... }
}

{
  success: false,
  error: "Erreur lors de la génération des relances",
  code: "GENERATE_ERROR",
  details: { ... }
}
```

---

## Scénarios de test

### Scénario 1 : Blacklist avec relances existantes
**Given** : Contact avec 3 impayés (A, B, C), relances brouillons existantes
**When** : `regenerateRelancesForContact(contactId, impayeA.id)` appelé
**Then** :
1. Relances brouillons supprimées (3)
2. Nouvelles relances générées pour B et C uniquement (2)
3. Impaye A exclu

### Scénario 2 : Unblacklist
**Given** : Contact avec impayés B, C (A était blacklisté, maintenant déblacklisté)
**When** : `regenerateRelancesForContact(contactId, null)` appelé
**Then** :
1. Relances brouillons supprimées
2. Nouvelles relances générées pour A, B, C (3)
3. Aucun impayé exclu

### Scénario 3 : Tous les impayés blacklistés
**Given** : Contact avec 2 impayés, tous les deux blacklistés
**When** : Appel avec exclusion d'un impayé
**Then** :
1. Relances brouillons supprimées (2)
2. Pas de nouvelles relances créées
3. Retour avec `reason: 'no_impayes_to_relance'`

### Scénario 4 : Pas de relances existantes
**Given** : Contact sans relances brouillons
**When** : Appel régénération
**Then** :
1. `deletedCount: 0`
2. Relances générées normalement
3. Pas d'erreur
