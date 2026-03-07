## Context

Marki16 est une application de relances de factures impayées. La source de vérité des contacts et factures est une base PostgreSQL externe ("Analyse immo"). Actuellement, les données sont saisies manuellement ou importées via PDF — il n'existe aucune synchronisation automatique.

Le backend tourne sur Express + Parse Server (Node 18+). Parse Server gère un cron scheduler natif (`Parse.Cloud.job`). Les PDFs des factures sont disponibles sur un serveur FTP.

## Goals / Non-Goals

**Goals:**
- Synchroniser périodiquement (toutes les heures) les contacts et impayés depuis PostgreSQL
- Télécharger les PDFs depuis le FTP et les stocker localement
- Permettre un déclenchement manuel via Cloud Function `syncNow`
- Upsert idempotent sur `externe_id` pour éviter les doublons
- Marquer les entités sync avec `source: db_externe`

**Non-Goals:**
- Synchronisation en temps réel (webhooks/CDC)
- Écriture retour vers la DB externe
- Suppression des entités archivées côté Marki16
- Gestion des conflits complexes (données modifiées des deux côtés)

## Decisions

### 1. Parse Cloud Jobs pour le cron

**Choix** : `Parse.Cloud.job` + scheduler Parse (interval via `parse-server` config `jobs`) plutôt qu'un cron système (node-cron, crontab).

**Rationale** : S'intègre naturellement dans l'architecture Parse existante. Les jobs sont visibles dans le Parse Dashboard. Pas de dépendance supplémentaire. Parse Server v7+ supporte les jobs planifiés via la config `jobs`.

**Alternative écartée** : `node-cron` dans server.js — fonctionne mais sort du cadre Parse, perd le monitoring du Dashboard.

### 2. Driver PostgreSQL `pg` (node-postgres)

**Choix** : `pg` (pool de connexions) — lecture seule, une seule connexion poolée ouverte pendant la durée du job.

**Rationale** : Driver officiel, léger, bien maintenu. Pas besoin d'ORM pour des requêtes de lecture simples.

**Alternative écartée** : Prisma — trop lourd pour des selects simples en mode read-only.

### 3. Upsert via `externe_id`

**Choix** : Pour chaque entité (contact, impayé), on cherche un objet Parse existant avec `externe_id === row.id`. Si trouvé → update ; sinon → create.

**Rationale** : Garantit l'idempotence. En cas de crash ou re-sync, aucun doublon n'est créé.

**Règle** : Les champs `email`, `telephone` d'un contact `db_externe` **ne sont mis à jour que s'ils sont vides** dans Marki16 — pour ne pas écraser une correction manuelle.

### 4. `basic-ftp` pour le FTP

**Choix** : `basic-ftp` — API promise-based, passive mode, compatible FTPS.

**Rationale** : Plus simple que `ftp` (callback) et plus léger que `ssh2-sftp-client`. Support natif TLS.

### 5. Téléchargement FTP incrémental

**Choix** : On garde en base la liste des fichiers déjà téléchargés (`pdf_path` non null sur l'Impayé). On ne re-télécharge que les PDFs manquants.

**Rationale** : Évite les re-téléchargements inutiles et réduit la charge réseau.

## Risks / Trade-offs

- **DB externe indisponible** → Le job loggue l'erreur et sort proprement. La prochaine exécution reprendra normalement. Mitigation : timeout de connexion court (10s).
- **FTP lent ou grand volume** → Le job FTP tourne en parallèle du job DB mais ne bloque pas l'application. Mitigation : limit de 10 fichiers par exécution (configurable via `FTP_BATCH_SIZE`).
- **Parse jobs non persistés au redémarrage** → Si le serveur redémarre entre deux syncs, la prochaine sync aura lieu à la prochaine exécution du cron. Acceptable pour une sync horaire.
- **Champs mappés différemment** → Le mapping colonnes PostgreSQL → champs Parse est codé en dur dans le job. Tout changement de schéma côté Analyse immo casse la sync. Mitigation : documenter le mapping dans le code.

## Migration Plan

1. Ajouter `pg` et `basic-ftp` aux dépendances backend
2. Ajouter les variables d'env (`EXTERNAL_DB_URI`, `FTP_*`) dans `.env`
3. Déployer le backend — les jobs se déclarent au démarrage de Parse Server
4. Vérifier dans le Parse Dashboard que les jobs `syncContacts`, `syncImpayes`, `syncFtpPdfs` apparaissent
5. Déclencher manuellement une première sync via `syncNow` depuis le frontend
6. Rollback : supprimer les déclarations `Parse.Cloud.job` — aucun impact sur les données existantes

## Open Questions

- Quelles tables et colonnes exactes dans la DB Analyse immo ? (à confirmer avec mapping réel lors de l'implémentation)
- Le FTP nécessite-t-il FTPS (TLS) ou FTP simple ?
- Faut-il un flag de maintenance pour suspendre la sync ?
