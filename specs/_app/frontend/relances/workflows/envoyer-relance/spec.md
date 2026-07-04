# Workflow: envoyer-relance

**Écran** : relances  
**Feature** : F-007 Relances email  
**Type** : Frontend  

## Description

Workflow d'envoi effectif d'une relance validée via SMTP. Appelle le backend pour l'envoi réel de l'email.

## Déclencheur

- Clic sur le bouton "Envoyer" (pour les relances déjà validées)
- Action groupée "Envoyer la sélection"

## Inputs

| Nom | Type | Description |
|-----|------|-------------|
| `relanceIds` | Array<String> | IDs des relances à envoyer |

## Étapes / Checkpoints

### Étape 1: Vérification pré-envoi

```javascript
for (const id of relanceIds) {
  const relance = await new Parse.Query('Relance').get(id)
  
  // Vérifier que la relance est validée
  if (!relance.get('valide')) {
    throw new Error(`Relance ${id} n'est pas validée`)
  }
  
  // Vérifier qu'elle n'est pas déjà envoyée
  if (relance.get('envoyee')) {
    throw new Error(`Relance ${id} déjà envoyée`)
  }
}
```

**CHECKPOINT**: `relances-pre-send-check`
```json
{ "count": 3, "allValid": true }
```

### Étape 2: Appel API envoi

```javascript
const result = await Parse.Cloud.run('sendRelanceEmail', {
  relanceIds: relanceIds,
  userId: currentUser.id
})
```

**CHECKPOINT**: `relances-send-api-called`

### Étape 3: Mise à jour locale

```javascript
for (const id of relanceIds) {
  const relance = relances.value.find(r => r.id === id)
  if (relance) {
    relance.statut = 'envoyee'
    relance.envoyee = true
    relance.dateEnvoi = new Date()
  }
}
```

**CHECKPOINT**: `relances-sent-local-update`

### Étape 4: Confirmation

```javascript
toast.add({
  title: `${result.sentCount} relance(s) envoyée(s)`,
  color: 'green'
})
```

**CHECKPOINT**: `relances-sent-confirmed`
```json
{
  "sentCount": 3,
  "failedCount": 0,
  "timestamp": "2024-06-30T10:30:00Z"
}
```

## Gestion des erreurs

**CHECKPOINT**: `relances-send-failed`
```json
{
  "relanceId": "rel_abc123",
  "error": "SMTP connection failed",
  "smtpError": "..."
}
```

## Cas particuliers

- **Échec SMTP** : La relance reste en statut "valide" mais marquée avec erreur
- **Échec partiel** : Afficher les succès et les échecs séparément
- **Timeout** : Retry automatique x3 avant abandon
