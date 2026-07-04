# Workflow: charger-relances

**Écran** : relances  
**Feature** : F-007 Relances email  
**Type** : Frontend  

## Description

Workflow de chargement initial des relances depuis Parse avec filtres et pagination.

## Déclencheur

- Chargement de la page `/relances`
- Changement de vue (tableau/calendrier/validation)
- Application de filtres

## Inputs

| Nom | Type | Description |
|-----|------|-------------|
| `filtres` | Object | { statut, sequence, dateDebut, dateFin } |
| `pagination` | Object | { page, limit } |

## Étapes / Checkpoints

### Étape 1: Construction requête

```javascript
const Relance = Parse.Object.extend('Relance')
const query = new Parse.Query(Relance)

// Inclusions
query.include(['contact', 'sequence', 'validePar', 'envoyeePar'])

// Filtres
if (filtres.statut && filtres.statut !== 'tous') {
  query.equalTo('statut', filtres.statut)
}

if (filtres.sequence && filtres.sequence !== 'tous') {
  const Sequence = Parse.Object.extend('SequenceRelance')
  query.equalTo('sequence', Sequence.createWithoutData(filtres.sequence))
}

// Ordre
query.descending('createdAt')

// Pagination
query.skip((pagination.page - 1) * pagination.limit)
query.limit(pagination.limit)
```

**CHECKPOINT**: `relances-query-built`

### Étape 2: Exécution

```javascript
const [relances, total] = await Promise.all([
  query.find(),
  query.count()
])
```

**CHECKPOINT**: `relances-loaded`
```json
{
  "count": 25,
  "total": 156,
  "page": 1,
  "filters": { "statut": "brouillon" }
}
```

### Étape 3: Transformation

```javascript
const relancesFormatees = relances.map(r => ({
  id: r.id,
  contact: r.get('contact'),
  sequence: r.get('sequence'),
  sujet: r.get('sujet'),
  contenu: r.get('contenu'),
  cc: r.get('cc'),
  statut: r.get('statut'),
  valide: r.get('valide'),
  envoyee: r.get('envoyee'),
  dateEnvoi: r.get('dateEnvoi'),
  createdAt: r.get('createdAt'),
  _parse: r // Référence Parse pour les modifications
}))
```

**CHECKPOINT**: `relances-formatted`

## Gestion des erreurs

**CHECKPOINT**: `relances-load-failed`
```json
{
  "error": "Network error",
  "filters": { "statut": "brouillon" }
}
```
