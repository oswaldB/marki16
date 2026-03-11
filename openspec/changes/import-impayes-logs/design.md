## Context

Marki16 synchronise les impayés depuis PostgreSQL via `syncImpayes.js`. Ce job est déclenché toutes les heures par `node-cron` dans `server.js` et manuellement via la Cloud Function `syncNow`. La fonction retourne actuellement `{ impayes, contacts, errors }` mais ce résultat n'est jamais persisté.

Le backend tourne sur Express + Parse Server (Node 18+). L'ensemble des données est stocké dans MongoDB Atlas via le SDK Parse. Le frontend est Nuxt 3 avec Naive UI.

## Goals / Non-Goals

**Goals :**
- Persister chaque exécution de `syncImpayes` dans une classe Parse `SyncLog`
- Afficher l'historique des logs dans une page frontend `/import-logs`
- Permettre de filtrer les logs par statut et de voir le détail des erreurs

**Non-Goals :**
- Alertes ou notifications push en cas d'échec
- Rétention automatique / purge des anciens logs
- Logs temps-réel (WebSocket, SSE)
- Logs des autres scripts (FTP, PDF)

## Decisions

### 1. Classe Parse `SyncLog` (pas de collection Mongo séparée)

**Choix** : Utiliser une classe Parse standard `SyncLog` sauvegardée avec le SDK Parse (`new Parse.Object('SyncLog')`).

**Rationale** : Cohérent avec le reste du projet — toute la persistence passe par Parse SDK. Pas besoin d'accès direct Mongo. Le schéma est simple (pas de relations complexes).

**Schéma `SyncLog` :**

| Champ | Type | Description |
|---|---|---|
| `startedAt` | Date | Heure de début du job |
| `finishedAt` | Date | Heure de fin |
| `durationMs` | Number | Durée en millisecondes |
| `trigger` | String | `'cron'` ou `'manual'` |
| `status` | String | `'success'` / `'partial'` / `'error'` |
| `impayes_created` | Number | Impayés nouvellement créés |
| `impayes_updated` | Number | Impayés mis à jour |
| `contacts_created` | Number | Contacts nouvellement créés |
| `contacts_updated` | Number | Contacts mis à jour |
| `errors` | Array | Liste des messages d'erreur (strings) |

**Statut :**
- `success` : 0 erreur
- `partial` : au moins 1 erreur mais au moins 1 impayé traité
- `error` : 0 impayé traité ou erreur fatale

### 2. Écriture du log en fin de job (try/finally)

**Choix** : Wrapper le corps de `syncImpayes` dans un `try/finally` — le log est toujours écrit, même en cas d'exception non catchée.

**Rationale** : Garantit qu'on ne perd pas le log si une erreur inattendue survient. Le log capture l'état partiel (`impayes_created` etc.) au moment du crash.

**Modification de `syncImpayes.js` :**
```js
async function syncImpayes({ trigger = 'cron' } = {}) {
  const startedAt = new Date();
  const stats = { impayes_created: 0, impayes_updated: 0, contacts_created: 0, contacts_updated: 0, errors: [] };
  try {
    // ... logique existante, met à jour stats au fil du parcours
  } finally {
    const finishedAt = new Date();
    const log = new Parse.Object('SyncLog');
    log.set({ startedAt, finishedAt, trigger,
      durationMs: finishedAt - startedAt,
      status: stats.errors.length === 0 ? 'success' : (stats.impayes_created + stats.impayes_updated > 0 ? 'partial' : 'error'),
      ...stats
    });
    await log.save(null, { useMasterKey: true });
  }
  return stats;
}
```

### 3. Page `/import-logs` — tableau Naive UI

**Choix** : Page Nuxt simple avec `NDataTable` (Naive UI) listant les `SyncLog` triés par `startedAt` DESC. Chargement via `Parse.Query`. Filtre par statut via `NSelect`. Détail des erreurs dans un `NModal` ou une ligne expandable.

**Colonnes du tableau :**
- Date/heure (`startedAt`, formatée)
- Durée (ms → s arrondi)
- Déclencheur (`cron` / `manual`)
- Statut (badge coloré : vert/orange/rouge)
- Impayés (créés + mis à jour)
- Contacts (créés + mis à jour)
- Erreurs (count, cliquable si > 0)

**Pagination** : 50 logs par page via `NDataTable` pagination.

### 4. Bouton "Synchroniser maintenant" sur la page logs

**Choix** : Réutiliser le même appel `$parse.Cloud.run('syncNow')` déjà présent dans `contacts.vue`. Après succès, recharger la liste des logs.

**Rationale** : Pas de duplication de logique — la Cloud Function existe déjà. La page logs est l'endroit naturel pour déclencher une sync manuelle et voir immédiatement le résultat.

## Risks / Trade-offs

- **Volume de logs** : À raison d'1 log/heure, on accumule ~720 logs/mois. Sans purge, la collection grossit indéfiniment. Acceptable à court terme ; une tâche de purge peut être ajoutée plus tard.
- **Échec d'écriture du log** : Si `log.save()` échoue (réseau, quota), l'erreur est loggée en console mais n'interrompt pas le job. Le log est perdu silencieusement.
- **Performances de la page** : Limiter à 50 entrées par requête évite de surcharger le client.

## Migration Plan

1. Modifier `syncImpayes.js` pour écrire le `SyncLog` (backend)
2. Vérifier que les logs s'écrivent correctement (via Parse Dashboard ou une sync manuelle)
3. Créer la page frontend `/import-logs`
4. Ajouter la route dans la sidebar
