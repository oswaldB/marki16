## Why

Les contacts et factures impayées proviennent d'une base PostgreSQL externe (Analyse immo) et de PDFs stockés sur un FTP. Sans synchronisation automatique, les données dans Marki16 seraient toujours en retard ou incomplètes, rendant les relances inexactes. La sync doit tourner en tâche de fond, sans intervention manuelle.

## What Changes

- Ajout d'un job de synchronisation horaire (`syncImpayes`) qui importe impayés **et contacts** en une seule requête PostgreSQL — les contacts (payeur, apporteur) sont extraits et upsertés au fil du parcours des lignes
- Exposition d'un endpoint backend `/api/pdf/:impayelId` qui streame le PDF depuis le serveur SFTP à la demande
- Les contacts issus de la sync sont marqués `source: db_externe` et **non modifiables** dans Marki16
- Les impayés existants sont mis à jour (upsert sur `ref_externe`) ; les nouveaux sont créés avec `statut: impayé`
- Exposition d'une Cloud Function `syncNow` pour déclencher manuellement la sync depuis le frontend
- Les contacts et impayés supprimés côté Analyse immo ne sont pas supprimés dans Marki16 (soft-delete via flag `archived`)
- Ajout des variables d'environnement `EXTERNAL_DB_URI` (PostgreSQL) et `FTP_HOST/USER/PASSWORD/BASE_PATH`

## Capabilities

### New Capabilities

- `impaye-sync`: Synchronisation des impayés et de leurs contacts (payeur, apporteur) depuis la DB PostgreSQL externe en un seul job `syncImpayes`. Chaque ligne retournée contient tous les interlocuteurs — contacts upsertés via `payeur_id_externe` / `apporteur_id_externe`
- `pdf-proxy`: Endpoint backend `GET /api/pdf/:impayelId` qui ouvre une connexion SFTP à la demande et streame le PDF vers le frontend
- `manual-sync-trigger`: Cloud Function et bouton frontend pour déclencher la synchronisation manuellement

### Modified Capabilities

<!-- Aucune spec existante à modifier -->

## Impact

- **Backend** : `cloud/main.js` — ajout des crons et cloud functions ; installation de `pg` (driver PostgreSQL) et `ssh2-sftp-client`
- **Données** : création des classes Parse `Contact` et `Impaye` avec champs `source`, `externe_id`, `archived`
- **Frontend** : bouton "Synchroniser" dans `/contacts` appelle la Cloud Function `syncNow`
- **Environnement** : `.env` doit contenir `EXTERNAL_DB_URI`, `FTP_HOST`, `FTP_USERNAME`, `FTP_PASSWORD`, `FTP_PORT`
- **Dépendances** : `pg@^8`, `ssh2-sftp-client@^9`, `node-cron@^3`
