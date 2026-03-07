## Why

Les contacts et factures impayées proviennent d'une base PostgreSQL externe (Analyse immo) et de PDFs stockés sur un FTP. Sans synchronisation automatique, les données dans Marki16 seraient toujours en retard ou incomplètes, rendant les relances inexactes. La sync doit tourner en tâche de fond, sans intervention manuelle.

## What Changes

- Ajout d'un job de synchronisation horaire (cron Parse) qui importe contacts et impayés depuis la DB PostgreSQL externe
- Ajout d'un job de synchronisation des PDFs depuis le FTP vers le stockage local
- Les contacts issus de la sync sont marqués `source: db_externe` et **non modifiables** dans Marki16
- Les impayés existants sont mis à jour (upsert sur `ref_externe`) ; les nouveaux sont créés avec `statut: impayé`
- Exposition d'une Cloud Function `syncNow` pour déclencher manuellement la sync depuis le frontend
- Les contacts et impayés supprimés côté Analyse immo ne sont pas supprimés dans Marki16 (soft-delete via flag `archived`)
- Ajout des variables d'environnement `EXTERNAL_DB_URI` (PostgreSQL) et `FTP_HOST/USER/PASSWORD/BASE_PATH`

## Capabilities

### New Capabilities

- `contact-sync`: Synchronisation des contacts (payeurs, apporteurs, etc.) depuis la DB PostgreSQL externe vers la collection Parse `Contact`
- `impaye-sync`: Synchronisation des factures impayées depuis la DB PostgreSQL externe vers la collection Parse `Impaye`
- `ftp-pdf-sync`: Téléchargement des PDFs associés aux factures depuis le serveur FTP vers le stockage local
- `manual-sync-trigger`: Cloud Function et bouton frontend pour déclencher la synchronisation manuellement

### Modified Capabilities

<!-- Aucune spec existante à modifier -->

## Impact

- **Backend** : `cloud/main.js` — ajout des crons et cloud functions ; installation de `pg` (driver PostgreSQL) et `basic-ftp`
- **Données** : création des classes Parse `Contact` et `Impaye` avec champs `source`, `externe_id`, `archived`
- **Frontend** : bouton "Synchroniser" dans `/contacts` appelle la Cloud Function `syncNow`
- **Environnement** : `.env` doit contenir `EXTERNAL_DB_URI`, `FTP_HOST`, `FTP_USER`, `FTP_PASSWORD`, `FTP_BASE_PATH`
- **Dépendances** : `pg@^8`, `basic-ftp@^5`
