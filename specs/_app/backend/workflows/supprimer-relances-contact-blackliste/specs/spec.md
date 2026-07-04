---
id: F-008-cleanup-relances
type: backend
folder: specs/_app/backend/workflows/supprimer-relances-contact-blackliste/
description: Supprime les relances non envoyées dont le contact est blacklisté (nettoyage périodique).
depends_on: [F-008, F-010]
justification: Cron job + DB + batch processing pour nettoyer les relances obsolètes sur contacts blacklistés
---

# F-008-cleanup-relances : Nettoyage relances contacts blacklistés

## Description

Parcourir toutes les relances non envoyées (brouillons) et supprimer celles dont le contact associé est marqué comme blacklisté. Ce workflow peut être exécuté périodiquement (quotidien) ou sur demande pour maintenir la base propre et éviter d'envoyer des relances à des contacts suspendus.

## Étapes

```javascript
/**
 * @action Se connecter à la DB Parse
 * @checkpoint db-connected, ping réussi sur classes Relance et Contact
 */

/**
 * @action Récupérer les contacts blacklistés (tous ou un seul si contactId fourni)
 * @checkpoint contacts-blacklist-fetched, count >= 0 (peut être 0 ou 1 si filtre)
 */

/**
 * @action Récupérer les relances non envoyées liées aux contacts blacklistés
 * @checkpoint relances-fetched, relances identifiées avec leurs IDs
 */

/**
 * @action Supprimer les relances identifiées
 * @checkpoint relances-deleted, deletedCount == fetchedCount, errors == 0
 */

/**
 * @action Écrire le log Markdown dans logs/
 * @checkpoint log-written, fichier créé avec count, contactIds, timestamp
 */
```

## Détail des étapes

### Étape 1 : Connexion DB
Vérifier l'accès aux classes `Relance` et `Contact` via Parse SDK.

### Étape 2 : Récupérer contacts blacklistés
```javascript
const Contact = Parse.Object.extend('Contact');
const query = new Parse.Query(Contact);
query.equalTo('isBlacklisted', true);
query.select('objectId');
const blacklistedContacts = await query.find();
```

### Étape 3 : Récupérer relances à supprimer
```javascript
const contactIds = blacklistedContacts.map(c => c.id);
const Relance = Parse.Object.extend('Relance');
const relanceQuery = new Parse.Query(Relance);
relanceQuery.containedIn('contact', blacklistedContacts);
relanceQuery.notEqualTo('envoyee', true);
relanceQuery.doesNotExist('dateEnvoi');
const relancesToDelete = await relanceQuery.find();
```

### Étape 4 : Suppression batch
```javascript
if (relancesToDelete.length > 0) {
    await Parse.Object.destroyAll(relancesToDelete, { useMasterKey: true });
}
```

### Étape 5 : Log
Fichier `logs/cleanup-relances-YYYY-MM-DD-HHmmss.md` avec récapitulatif.

## API Endpoint Cloud Function

```javascript
Parse.Cloud.define("cleanupRelancesBlacklist", async (request) => {
    const { contactId = null } = request.params;
    
    // Si contactId fourni, ne traiter que ce contact
    // Sinon, traiter tous les contacts blacklistés
    
    return { 
        success: true, 
        blacklistedContactsCount,
        deletedCount,
        relanceIds,
        contactId  // null si run global, ou l'ID spécifique
    };
});
```

## Déclenchement

Ce workflow s'exécute via **appel Cloud Code Function** `cleanupRelancesBlacklist`.

### Modes de déclenchement

1. **CRON planifié** : Appel automatique toutes les heures
   ```
   0 * * * *  →  curl -X POST $PARSE_SERVER/functions/cleanupRelancesBlacklist
   ```

2. **Manuel** : Appel direct depuis le dashboard ou CLI
   ```javascript
   await Parse.Cloud.run('cleanupRelancesBlacklist');
   ```

3. **Trigger** : Appel automatique lorsqu'un contact est blacklisté
   ```javascript
   // Dans le afterSave du Contact
   if (contact.get('isBlacklisted') === true && 
       contact.previous('isBlacklisted') !== true) {
       await Parse.Cloud.run('cleanupRelancesBlacklist', { 
           contactId: contact.id 
       });
   }
   ```

### Paramètres optionnels

```javascript
{
  "contactId": "string|null"  // Si fourni, ne nettoie que pour ce contact spécifique
}
```
