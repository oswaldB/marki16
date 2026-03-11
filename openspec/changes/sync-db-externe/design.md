## Context

Marki16 est une application de relances de factures impayées. La source de vérité des contacts et factures est une base PostgreSQL externe ("Analyse immo"). Actuellement, les données sont saisies manuellement ou importées via PDF — il n'existe aucune synchronisation automatique.

Le backend tourne sur Express + Parse Server (Node 18+). Parse Server gère un cron scheduler natif (`Parse.Cloud.job`). Les PDFs des factures sont disponibles sur un serveur FTP.

## Goals / Non-Goals

**Goals:**
- Synchroniser périodiquement (toutes les heures) les impayés et leurs contacts depuis PostgreSQL via un seul job `syncImpayes`
- Proxy PDF à la demande depuis le serveur SFTP
- Permettre un déclenchement manuel via Cloud Function `syncNow`
- Upsert idempotent sur `externe_id` pour éviter les doublons
- Marquer les entités sync avec `source: db_externe`

**Non-Goals:**
- Synchronisation en temps réel (webhooks/CDC)
- Écriture retour vers la DB externe
- Suppression des entités archivées côté Marki16
- Gestion des conflits complexes (données modifiées des deux côtés)

## Decisions

### 1. node-cron + Cloud Function simple (pas de Parse.Cloud.job)

**Choix** : `node-cron` dans `server.js` pour le scheduling horaire + `Parse.Cloud.define('syncNow', ...)` pour le déclenchement manuel depuis le frontend. Pas de `Parse.Cloud.job`.

**Rationale** : Parse Server ne dispose pas de scheduler natif récurrent — `Parse.Cloud.job` n'ajoute rien quand node-cron gère le scheduling. `Parse.Cloud.define` est suffisant pour le frontend : il est appelable via `Parse.Cloud.run()` et retourne un résultat (`{ impayes, contacts, errors }`). La logique de sync est extraite dans un module JS pur (`cloud/jobs/syncImpayes.js`) appelé par les deux.

**Alternative écartée** : `Parse.Cloud.job` — utile uniquement pour déclencher depuis le Dashboard, non nécessaire ici.

### 2. Driver PostgreSQL `pg` (node-postgres)

**Choix** : `pg` (pool de connexions) — lecture seule, une seule connexion poolée ouverte pendant la durée du job.

**Rationale** : Driver officiel, léger, bien maintenu. Pas besoin d'ORM pour des requêtes de lecture simples.

**Alternative écartée** : Prisma — trop lourd pour des selects simples en mode read-only.

### 3. Job unique `syncImpayes` — contacts extraits en même temps

**Choix** : Un seul job exécute la requête PostgreSQL et, pour chaque ligne, upserte d'abord les contacts (payeur, apporteur) puis l'impayé. Pas de job `syncContacts` séparé.

**Rationale** : La requête SQL retourne déjà tous les interlocuteurs à plat par ligne d'impayé. Séparer en deux jobs nécessiterait une deuxième requête redondante. La fusion simplifie le code et réduit les allers-retours DB.

**Identifiants externes :**
- `Impaye.externe_id` = `p."nfacture"`
- `Contact.externe_id` = `iloc."idInterlocuteur"` (sélectionné comme `payeur_id_externe` / `apporteur_id_externe`)

**Upsert** : Pour chaque entité, on cherche un objet Parse existant avec le même `externe_id`. Si trouvé → update ; sinon → create.

**Règle** : Les champs `email`, `telephone` d'un contact `db_externe` **ne sont mis à jour que s'ils sont vides** dans Marki16 — pour ne pas écraser une correction manuelle.

### 4. `ssh2-sftp-client` pour le SFTP

**Choix** : `ssh2-sftp-client` — API promise-based, support SFTP natif (SSH, port 2222).

**Rationale** : Le serveur de fichiers (`serveur.adti06.com:2222`) expose un accès SFTP et non FTP/FTPS. `basic-ftp` ne supporte pas le protocole SFTP. `ssh2-sftp-client` est le client Node.js de référence pour SFTP.

### 5. Proxy PDF à la demande via SFTP

**Choix** : Endpoint Express `GET /api/pdf/:impayelId` qui ouvre une connexion SFTP, streame le fichier et ferme la connexion. Le chemin distant est lu depuis `Impaye.url_pdf` (construit par `buildUrlPdf`).

**Rationale** : Les PDFs restent sur le serveur SFTP, aucun stockage local nécessaire. La connexion SFTP est éphémère (ouverte/fermée par requête) pour éviter de maintenir une session persistante.

## Risks / Trade-offs

- **DB externe indisponible** → Le job loggue l'erreur et sort proprement. La prochaine exécution reprendra normalement. Mitigation : timeout de connexion court (10s).
- **Parse jobs non persistés au redémarrage** → Si le serveur redémarre entre deux syncs, la prochaine sync aura lieu à la prochaine exécution du cron. Acceptable pour une sync horaire.
- **Champs mappés différemment** → Le mapping colonnes PostgreSQL → champs Parse est codé en dur dans le job. Tout changement de schéma côté Analyse immo casse la sync. Mitigation : documenter le mapping dans le code.

## Migration Plan

1. Ajouter `pg` et `ssh2-sftp-client` aux dépendances backend
2. Ajouter les variables d'env (`EXTERNAL_DB_URI`, `FTP_HOST`, `FTP_PORT`, `FTP_USERNAME`, `FTP_PASSWORD`) dans `.env`
3. Déployer le backend — les jobs se déclarent au démarrage de Parse Server
4. Vérifier dans le Parse Dashboard que les jobs `syncContacts`, `syncImpayes` apparaissent
5. Déclencher manuellement une première sync via `syncNow` depuis le frontend
6. Rollback : supprimer les déclarations `Parse.Cloud.job` et l'endpoint `/api/pdf/:impayelId` — aucun impact sur les données existantes

## Mapping SQL → Parse

### Requête principale
Tables : `(GCO) GcoPiece` (p) → `(GCO) GcoPieceMetier` (pm) → `(ADN_DIAG) Dossier` (d)
Joins : `(ADN_RG)Employe` (e), `(ADN_DIAG) StatutDossier` (s), `(ADN_DIAG) DossierInterlocuteur` (di), `(ADN_RG)Interlocuteur` (iloc / ilocContact), `(ADN_DIAG) RoleInterlocuteurDossier` (role)

**Filtres WHERE :**
- `p."nfacture" IS NOT NULL`
- `p."facturesoldee" = FALSE`
- `p."resteapayer" > 0`
- `p."valide" = TRUE`
- `p."datepiece" < NOW() - 7 days` (exclut les 7 derniers jours)
- EXISTS un interlocuteur avec rôle 'Payeur'

### Impaye (Parse) ← GcoPiece + Dossier

| Parse field | SQL |
|---|---|
| `externe_id` | `p."nfacture"` |
| `nfacture` | `p."nfacture"` |
| `date_piece` | `p."datepiece"` |
| `total_ht` | `p."totalhtnet"` |
| `total_ttc` | `p."totalttcnet"` |
| `reste_a_payer` | `p."resteapayer"` |
| `facture_soldee` | `p."facturesoldee"` |
| `commentaire_piece` | `p."commentaire"` |
| `ref_piece` | `p."refpiece"` |
| `id_dossier` | `d."idDossier"` |
| `numero_dossier` | `d."numero"` |
| `reference` | `d."reference"` |
| `reference_externe` | `d."referenceExterne"` |
| `statut_dossier` | `s."intitule"` |
| `commentaire_dossier` | `d."commentaire"` |
| `date_debut_mission` | `d."dateDebutMission"` |
| `employe_intervention` | `COALESCE(e."prenom" \|\| ' ' \|\| e."nom", '')` |
| `adresse_bien` | concaténation `numVoie cptNumVoie typeVoie adresse cptAdresse` |
| `code_postal` | `d."codePostal"` |
| `ville` | `d."ville"` |
| `numero_lot` | `d."numeroLot"` |
| `etage` | `d."etage"` |
| `entree` | `d."entree"` |
| `escalier` | `d."escalier"` |
| `porte` | `d."porte"` |
| `url_pdf` | construit par `buildUrlPdf(refpiece, datepiece)` |
| `payeur_nom` | `MAX(CASE role='Payeur' ...)` |
| `payeur_email` | `MAX(CASE role='Payeur' ...)` |
| `payeur_telephone` | `MAX(CASE role='Payeur' ...)` |
| `payeur_type_personne` | `MAX(CASE role='Payeur' iloc."typePersonne")` |
| `payeur_type` | calculé (Propriétaire / Apporteur d'affaire / Autre) |
| `payeur_contact_nom` | `MAX(CASE role='Payeur' ilocContact."nom"...)` |
| `payeur_contact_email` | `MAX(CASE role='Payeur' ilocContact."email")` |
| `apporteur_nom` | `MAX(CASE role='Apporteur d''affaire' ...)` |
| `apporteur_email` | idem |
| `apporteur_telephone` | idem |
| `acquereur_nom/email/telephone` | `MAX(CASE role='Acquéreur' ...)` |
| `donneur_ordre_nom/email/telephone` | `MAX(CASE role='Donneur d''ordre' ...)` |
| `locataire_entrant_nom/email/telephone` | `MAX(CASE role='Locataire entrant' ...)` |
| `locataire_sortant_nom/email/telephone` | `MAX(CASE role='Locataire sortant' ...)` |
| `notaire_nom/email/telephone` | `MAX(CASE role='Notaire' ...)` |
| `proprietaire_nom/email/telephone` | `MAX(CASE role='Propriétaire' ...)` |
| `syndic_nom/email/telephone` | `MAX(CASE role='Syndic' ...)` |

### Contact (Parse) ← Interlocuteur

Extraits par ligne d'impayé pour payeur et apporteur uniquement.

| Parse field | SQL |
|---|---|
| `externe_id` | `payeur_id_externe` / `apporteur_id_externe` |
| `nom` | `payeur_nom` / `apporteur_nom` |
| `email` | `payeur_email` / `apporteur_email` (si vide dans Parse seulement) |
| `telephone` | `payeur_telephone` / `apporteur_telephone` (si vide dans Parse seulement) |
| `type_personne` | `payeur_typePersonne` / `apporteur_typePersonne` |
| `source` | `db_externe` |

### Champ à ajouter à la requête SQL

```sql
MAX(CASE WHEN role."intitule" = 'Payeur' THEN iloc."idInterlocuteur" END) AS "payeur_id_externe",
MAX(CASE WHEN role."intitule" = 'Apporteur d''affaire' THEN iloc."idInterlocuteur" END) AS "apporteur_id_externe",
```

## Open Questions

- Faut-il un flag de maintenance pour suspendre la sync ?
