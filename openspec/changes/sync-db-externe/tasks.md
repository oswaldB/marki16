## 1. Dépendances & Configuration

- [ ] 1.1 Ajouter `pg` (^8) à `backend/package.json` et lancer `npm install`
- [ ] 1.2 Vérifier que `EXTERNAL_DB_URI` est présent dans `.env` (connexion PostgreSQL)
- [ ] 1.3 Documenter dans le code le mapping colonnes PostgreSQL → champs Parse

## 2. Cloud Job — Sync Contacts

- [ ] 2.1 Créer `backend/cloud/jobs/syncContacts.js` : connexion pg, query contacts, upsert Parse `Contact` (source: db_externe, externe_id)
- [ ] 2.2 Respecter la règle : ne pas écraser `email`/`telephone` si déjà renseignés dans Parse
- [ ] 2.3 Enregistrer le job dans `cloud/main.js` via `Parse.Cloud.job('syncContacts', ...)`
- [ ] 2.4 Tester manuellement via le Parse Dashboard (Jobs > Run)

## 3. Cloud Job — Sync Impayés

- [ ] 3.1 Créer `backend/cloud/jobs/syncImpayes.js` : query factures, upsert Parse `Impaye` (source: db_externe, externe_id)
- [ ] 3.2 Lier chaque `Impaye` à son `Contact` payeur via pointer
- [ ] 3.3 Ne pas écraser `statut` si différent de `impayé` (modification manuelle)
- [ ] 3.4 Enregistrer le job dans `cloud/main.js` et tester via le Dashboard

## 4. Cloud Function — syncNow

- [ ] 4.1 Créer la Cloud Function `syncNow` dans `cloud/main.js` : exécute syncContacts + syncImpayes séquentiellement
- [ ] 4.2 Ajouter un flag en mémoire (`isSyncing`) pour éviter les exécutions concurrentes
- [ ] 4.3 Retourner le résumé `{ contactsSynced, impayes Synced, errors }`
- [ ] 4.4 Vérifier l'authentification de l'appelant (`request.user` obligatoire)

## 5. Cron horaire Parse

- [ ] 5.1 Configurer le scheduler Parse dans `server.js` pour exécuter `syncContacts` et `syncImpayes` toutes les heures
- [ ] 5.2 Vérifier l'apparition des jobs dans le Parse Dashboard > Jobs

## 6. Frontend — Bouton Synchroniser

- [ ] 6.1 Créer `frontend/pages/contacts.vue` avec le bouton "Synchroniser tous"
- [ ] 6.2 Appeler `$parse.Cloud.run('syncNow')` au clic, afficher un état de chargement
- [ ] 6.3 Afficher une notification de succès (ex. "42 contacts synchronisés") ou d'erreur
