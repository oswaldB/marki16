## 1. Backend — Persistance des logs

- [x] 1.1 Dans `backend/cloud/jobs/syncImpayes.js`, ajouter un objet `stats` (`impayes_created`, `impayes_updated`, `contacts_created`, `contacts_updated`, `errors`) et incrémenter les compteurs à chaque upsert réussi / erreur catchée
- [x] 1.2 Wrapper le corps du job dans un `try/finally` : dans le `finally`, créer et sauvegarder un `Parse.Object('SyncLog')` avec `startedAt`, `finishedAt`, `durationMs`, `trigger`, `status` (calculé), et les champs de `stats`
- [x] 1.3 Accepter un paramètre `trigger` (`'cron'` par défaut) dans la signature de `syncImpayes`
- [x] 1.4 Dans `cloud/main.js`, passer `trigger: 'manual'` lors de l'appel à `syncImpayes` depuis la Cloud Function `syncNow`
- [x] 1.5 Dans `server.js`, passer `trigger: 'cron'` lors de l'appel depuis `node-cron`

## 2. Frontend — Page `/import-logs`

- [x] 2.1 Créer `frontend/pages/import-logs.vue` : au `onMounted`, requêter `SyncLog` trié par `startedAt` DESC, limite 50
- [x] 2.2 Afficher un `UTable` avec les colonnes : Date/heure, Durée (s), Déclencheur, Statut (badge coloré), Impayés (créés/MàJ), Contacts (créés/MàJ), Erreurs (count)
- [x] 2.3 Ajouter un `USelect` de filtre par statut (`tous` / `success` / `partial` / `error`) qui relance la requête Parse avec un filtre `equalTo('status', ...)`
- [x] 2.4 Au clic sur le count d'erreurs (si > 0), ouvrir un `UModal` listant les messages d'erreur du log sélectionné
- [x] 2.5 Ajouter un bouton "Synchroniser maintenant" qui appelle `$parse.Cloud.run('syncNow')` avec état de chargement, puis recharge la liste après succès
- [x] 2.6 Afficher une `UAlert` si la dernière sync est en statut `error` ou `partial`

## 3. Navigation

- [x] 3.1 Ajouter la route `/import-logs` dans la sidebar (label "Logs import", icône `i-heroicons-document-text`)
