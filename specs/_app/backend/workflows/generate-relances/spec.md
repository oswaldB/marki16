# Workflow Backend: generate-relances

**Feature** : F-010 Génération automatique des relances  
**Type** : Backend (Cloud Job / Cloud Function)  

## Description

Workflow backend quotidien qui génère automatiquement les relances à partir des impayés selon les séquences configurées (J+15, J+30, etc.).

## Déclencheurs

- **CRON** : Tous les jours à 08:00 (`0 8 * * *`)
- **Manuel** : Via Cloud Function `generateRelances`

## Input

```javascript
{
  force: Boolean  // Force la régénération même si déjà exécuté aujourd'hui
}
```

## Étapes / Checkpoints

### Étape 1: Récupération des séquences actives

```javascript
const SequenceRelance = Parse.Object.extend('SequenceRelance')
const query = new Parse.Query(SequenceRelance)
query.equalTo('estActive', true)
query.equalTo('type', 'relances')
query.ascending('niveau')
const sequences = await query.find()
```

**CHECKPOINT**: `generate-relances-sequences-loaded`
```json
{ "count": 3, "sequences": ["Relance J+15", "Relance J+30", "Mise en demeure"] }
```

### Étape 2: Pour chaque séquence, identifier les impayés éligibles

```javascript
const maintenant = new Date()
const delaiJours = sequence.get('delaiJours')
const dateLimite = new Date(maintenant)
dateLimite.setDate(dateLimite.getDate() - delaiJours)

const Impaye = Parse.Object.extend('Impaye')
const query = new Parse.Query(Impaye)
query.lessThanOrEqualTo('date_echeance', dateLimite)
query.greaterThan('reste_a_payer', 0)
query.equalTo('sequence', sequence)
query.include(['payeur', 'contact_relance'])

const impayes = await query.find()
```

### Étape 3: Application des filtres

**Filtre 1.5** : Exclusion des contacts blacklistés
```javascript
impayes = impayes.filter(impaye => {
  const contact = impaye.get('contact_relance') || impaye.get('payeur')
  return contact && !contact.get('isBlacklisted')
})
```

**Filtre 1.6** : Exclusion des impayés blacklistés (F-008)
```javascript
impayes = impayes.filter(impaye => !impaye.get('isBlacklisted'))
```

**Filtre 2** : Exclusion des déjà relancés
```javascript
const relanceQuery = new Parse.Query('Relance')
relanceQuery.equalTo('sequence', sequence)
relanceQuery.greaterThan('createdAt', dateLimite)
const recents = await relanceQuery.find()
const contactsRelances = new Set(recents.map(r => r.get('contact')?.id))

impayes = impayes.filter(impaye => {
  const contact = impaye.get('contact_relance') || impaye.get('payeur')
  return !contactsRelances.has(contact?.id)
})
```

**Filtre 2bis** : Exclusion sans email
```javascript
impayes = impayes.filter(impaye => {
  const contact = impaye.get('contact_relance') || impaye.get('payeur')
  return contact?.get('email')
})
```

**CHECKPOINT**: `generate-relances-filters-applied`
```json
{ 
  "sequence": "Relance J+15",
  "beforeFilter": 45,
  "afterFilter": 12
}
```

### Étape 4: Regroupement par contact

```javascript
const relancesParContact = new Map()

for (const impaye of impayes) {
  const contact = impaye.get('contact_relance') || impaye.get('payeur')
  if (!contact) continue
  
  const contactId = contact.id
  if (!relancesParContact.has(contactId)) {
    relancesParContact.set(contactId, {
      contact,
      impayes: [],
      montantTotal: 0
    })
  }
  
  const groupe = relancesParContact.get(contactId)
  groupe.impayes.push(impaye)
  groupe.montantTotal += impaye.get('reste_a_payer') || 0
}
```

### Étape 5: Création des relances

```javascript
for (const [contactId, groupe] of relancesParContact) {
  // Génération du contenu avec templates
  const templateSujet = sequence.get('templateSujet')
  const templateCorps = sequence.get('templateCorps')
  
  const variables = {
    '{{contact_nom}}': groupe.contact.get('nom'),
    '{{montant_total}}': groupe.montantTotal.toFixed(2),
    '{{nb_factures}}': groupe.impayes.length,
    '{{date_jour}}': new Date().toLocaleDateString('fr-FR')
  }
  
  let sujet = templateSujet
  let corps = templateCorps
  
  for (const [key, value] of Object.entries(variables)) {
    sujet = sujet.replaceAll(key, value)
    corps = corps.replaceAll(key, value)
  }
  
  // Création
  const Relance = Parse.Object.extend('Relance')
  const relance = new Relance()
  
  relance.set('contact', groupe.contact)
  relance.set('impayes', groupe.impayes)
  relance.set('sequence', sequence)
  relance.set('sujet', sujet)
  relance.set('contenu', corps)
  relance.set('cc', '')
  relance.set('valide', false)  // À valider par un agent
  relance.set('envoyee', false)
  relance.set('statut', 'brouillon')
  
  await relance.save()
}
```

**CHECKPOINT**: `relances-generated`
```json
{ 
  "count": 12, 
  "sequence": "Relance J+15",
  "montantTotal": 152340.50
}
```

### Étape 6: Notification (optionnel)

Création d'activités pour notifier les agents :

```javascript
const Activite = Parse.Object.extend('Activite')
const activite = new Activite()
activite.set('type', 'relances_generees')
activite.set('details', `${total} relances générées`)
activite.set('metadata', { sequences: resultats })
await activite.save()
```

**CHECKPOINT**: `generate-relances-completed`
```json
{ 
  "totalRelances": 34,
  "bySequence": [
    { "sequence": "Relance J+15", "count": 12 },
    { "sequence": "Relance J+30", "count": 18 },
    { "sequence": "Mise en demeure", "count": 4 }
  ],
  "duration": "2.3s"
}
```

## Output

```javascript
{
  success: true,
  total: 34,
  details: [
    { sequence: 'Relance J+15', count: 12 },
    { sequence: 'Relance J+30', count: 18 },
    { sequence: 'Mise en demeure', count: 4 }
  ]
}
```

## Gestion des erreurs

**CHECKPOINT**: `generate-relances-failed`
```json
{
  "error": "Network error",
  "sequence": "Relance J+15",
  "step": "creating-relances",
  "partialCount": 5
}
```

## Métriques

- Nombre de relances générées par jour
- Taux d'exclusion par filtre
- Temps d'exécution moyen
- Montant total des relances générées
