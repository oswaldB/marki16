## 1. Dépendances & Configuration

- [x] 1.1 Ajouter `pg` (^8), `ssh2-sftp-client` (^9) et `node-cron` (^3) à `backend/package.json` et lancer `npm install`
- [x] 1.2 Vérifier que `EXTERNAL_DB_URI`, `FTP_HOST`, `FTP_PORT`, `FTP_USERNAME`, `FTP_PASSWORD` sont présents dans `.env`

## 2. Module de sync — syncImpayes.js

- [x] 2.1 Créer `backend/cloud/jobs/syncImpayes.js` : fonction pure exportée qui exécute la requête SQL complète (GcoPiece + Dossier + Interlocuteurs) et retourne `{ impayes, contacts, errors }`
- [x] 2.2 Ajouter `payeur_id_externe` et `apporteur_id_externe` à la requête SQL (`MAX(CASE WHEN role='Payeur' THEN iloc."idInterlocuteur" END)`)
- [x] 2.3 Pour chaque ligne : upsert `Contact` payeur (via `payeur_id_externe`) puis `Contact` apporteur (via `apporteur_id_externe`) si présent
- [x] 2.4 Respecter la règle : ne pas écraser `email`/`telephone` si déjà renseignés dans Parse
- [x] 2.5 Upsert `Impaye` via `externe_id = nfacture`, lier au `Contact` payeur via pointer
- [x] 2.6 Ne pas écraser `statut` si différent de `impaye` (modification manuelle)

## 3. Cloud Function — syncNow

- [x] 3.1 Créer `Parse.Cloud.define('syncNow', ...)` dans `cloud/main.js` : appelle le module `syncImpayes.js` et retourne le résumé
- [x] 3.2 Ajouter un flag en mémoire (`isSyncing`) pour éviter les exécutions concurrentes
- [x] 3.3 Vérifier l'authentification de l'appelant (`request.user` obligatoire)

## 4. Cron horaire

- [x] 4.1 Ajouter `node-cron` dans `server.js` : `cron.schedule('0 * * * *', syncImpayes)` après démarrage de Parse Server
- [ ] 4.2 Vérifier dans les logs que le cron se déclenche bien toutes les heures

## 5. Endpoint proxy PDF

- [x] 5.1 Créer `GET /api/pdf/:impayelId` dans `server.js` : lire `Impaye.url_pdf`, ouvrir connexion SFTP, streamer le fichier, fermer la connexion
- [x] 5.2 Retourner 404 si l'impayé n'existe pas ou si `url_pdf` est null
- [ ] 5.3 Tester manuellement avec un impayé connu

## 6. Frontend — Bouton Synchroniser

- [x] 6.1 Créer `frontend/pages/contacts.vue` avec le bouton "Synchroniser"
- [x] 6.2 Appeler `$parse.Cloud.run('syncNow')` au clic, afficher un état de chargement
- [x] 6.3 Afficher une notification de succès (ex. "42 impayés synchronisés") ou d'erreur
