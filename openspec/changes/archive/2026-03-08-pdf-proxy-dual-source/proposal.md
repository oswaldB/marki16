## Why

L'endpoint `/api/pdf/:impayelId` tente toujours de servir le PDF via SFTP, quelle que soit l'origine de l'impayé. Pour les impayés importés manuellement (`source: 'upload'`), le PDF est stocké localement dans `UPLOAD_STORAGE_PATH` — pas sur le SFTP. Résultat : le bouton "Voir PDF" ne fonctionne jamais pour les PDFs uploadés manuellement.

De plus, la Cloud Function `importImpayes` ne persiste pas le chemin local du fichier (`pdf_path`) dans Parse, ce qui rend impossible de retrouver le fichier a posteriori.

## What Changes

- **`cloud/main.js`** — `importImpayes` : sauvegarder `pdf_path` (chemin absolu local du fichier stocké) dans le champ `pdf_local_path` de l'`Impaye`
- **`server.js`** — `/api/pdf/:impayelId` : brancher sur `source` pour choisir entre SFTP et fichier local :
  - `source = 'db_externe'` → comportement inchangé (SFTP via `url_pdf`)
  - `source = 'upload'` → `res.sendFile(pdf_local_path)` depuis `UPLOAD_STORAGE_PATH`

## Capabilities

### Modified Capabilities

- `pdf-proxy`: L'endpoint `/api/pdf/:impayelId` sert désormais les PDFs depuis deux sources selon `source` de l'impayé — SFTP pour les impayés synchronisés depuis Analyse immo, système de fichiers local pour les uploads manuels.

## Impact

- **Backend `cloud/main.js`** : 1 ligne ajoutée dans `importImpayes` pour persister `pdf_local_path`
- **Backend `server.js`** : remplacement de la logique SFTP-only par un branchement `source`-aware dans `/api/pdf/:impayelId`
- **Pas de changement frontend** : l'URL `/api/pdf/:id` reste identique
