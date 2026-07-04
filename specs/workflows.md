# Inventaire des workflows ADTI

**Source** : specs/features/*.md  
**Date** : 2026-06-25  
**Total** : 25 workflows

---

## F-001 : Import de données

### Workflows frontend (écran : importer)

| Workflow | Dossier spec | Description |
|----------|--------------|-------------|
| `upload-fichier` | `specs/_app/frontend/importer/workflows/upload-fichier/` | Gérer le drag & drop et sélection fichier |
| `preview-import` | `specs/_app/frontend/importer/workflows/preview-import/` | Afficher l'aperçu des données et mapping |
| `valider-import` | `specs/_app/frontend/importer/workflows/valider-import/` | Valider et envoyer au backend |

### Workflows backend

| Workflow | Dossier spec | Justification |
|----------|--------------|---------------|
| `parse-csv` | `specs/_app/backend/workflows/parse-csv/` | Parsing CSV/Excel avec validation format |
| `enregistrer-factures` | `specs/_app/backend/workflows/enregistrer-factures/` | Insertion en base avec gestion doublons |

---

## F-002 : Tableau de bord

### Workflows frontend (écran : dashboard)

| Workflow | Dossier spec | Description |
|----------|--------------|-------------|
| `charger-kpis` | `specs/_app/frontend/dashboard/workflows/charger-kpis/` | Calculer et afficher les KPIs globaux |
| `charger-top-debiteurs` | `specs/_app/frontend/dashboard/workflows/charger-top-debiteurs/` | Charger les 10 plus gros débiteurs |
| `charger-graphique` | `specs/_app/frontend/dashboard/workflows/charger-graphique/` | Générer le graphique évolution 12 mois |
| `refresh-auto` | `specs/_app/frontend/dashboard/workflows/refresh-auto/` | Rafraîchir toutes les 5 minutes |

---

## F-003 : Liste des factures

### Workflows frontend (écran : liste-factures)

| Workflow | Dossier spec | Description |
|----------|--------------|-------------|
| `charger-factures` | `specs/_app/frontend/liste-factures/workflows/charger-factures/` | Charger la liste paginée |
| `filtrer-statut` | `specs/_app/frontend/liste-factures/workflows/filtrer-statut/` | Appliquer le filtre par statut |
| `trier-colonnes` | `specs/_app/frontend/liste-factures/workflows/trier-colonnes/` | Gérer le tri ASC/DESC sur colonnes |
| `rechercher` | `specs/_app/frontend/liste-factures/workflows/rechercher/` | Recherche temps réel numéro/client |
| `paginer` | `specs/_app/frontend/liste-factures/workflows/paginer/` | Gérer la pagination |

---

## F-004 : Fiche client

### Workflows frontend (écran : fiche-client)

| Workflow | Dossier spec | Description |
|----------|--------------|-------------|
| `charger-client` | `specs/_app/frontend/fiche-client/workflows/charger-client/` | Charger les infos du client |
| `charger-historique` | `specs/_app/frontend/fiche-client/workflows/charger-historique/` | Charger l'historique des factures |
| `calculer-score` | `specs/_app/frontend/fiche-client/workflows/calculer-score/` | Calculer le score A/B/C/D |
| `afficher-solde` | `specs/_app/frontend/fiche-client/workflows/afficher-solde/` | Calculer et afficher le solde débiteur |

---

## F-005 : Détection anomalies

### Workflows frontend (écran : dashboard)

| Workflow | Dossier spec | Description |
|----------|--------------|-------------|
| `detecter-risques` | `specs/_app/frontend/dashboard/workflows/detecter-risques/` | Algorithme de détection clients à risque |
| `afficher-alertes` | `specs/_app/frontend/dashboard/workflows/afficher-alertes/` | Afficher la liste des alertes détectées |
| `ignorer-alerte` | `specs/_app/frontend/dashboard/workflows/ignorer-alerte/` | Masquer une alerte avec raison |

---

## F-006 : Export rapports

### Workflows frontend (global)

| Workflow | Dossier spec | Description |
|----------|--------------|-------------|
| `preparer-export` | `specs/_app/frontend/global/workflows/preparer-export/` | Ouvrir le modal et préparer les données |
| `generer-pdf` | `specs/_app/frontend/global/workflows/generer-pdf/` | Générer le PDF côté client (ou appel API) |
| `generer-excel` | `specs/_app/frontend/global/workflows/generer-excel/` | Générer le fichier Excel |
| `telecharger` | `specs/_app/frontend/global/workflows/telecharger/` | Déclencher le téléchargement |

### Workflows backend

| Workflow | Dossier spec | Justification |
|----------|--------------|---------------|
| `generer-rapport-pdf` | `specs/_app/backend/workflows/generer-rapport-pdf/` | Génération PDF server-side avec librairie |
| `generer-excel-data` | `specs/_app/backend/workflows/generer-excel-data/` | Génération fichier Excel avec streaming |

---

## F-007 : Relances email

### Workflows frontend (global)

| Workflow | Dossier spec | Description |
|----------|--------------|-------------|
| `preparer-template` | `specs/_app/frontend/global/workflows/preparer-template/` | Pré-remplir le template de relance |
| `editer-message` | `specs/_app/frontend/global/workflows/editer-message/` | Gérer l'édition du message |
| `envoyer-email` | `specs/_app/frontend/global/workflows/envoyer-email/` | Appeler l'API d'envoi d'email |
| `historiser-relance` | `specs/_app/frontend/fiche-client/workflows/historiser-relance/` | Mettre à jour l'historique après envoi |

### Workflows backend

| Workflow | Dossier spec | Justification |
|----------|--------------|---------------|
| `send-email-smtp` | `specs/_app/backend/workflows/send-email-smtp/` | Envoi réel via SMTP avec gestion retry |
| `journal-relances` | `specs/_app/backend/workflows/journal-relances/` | Stockage de l'historique des relances |

---

## F-008 : Blacklist des Impayés

### Workflows frontend (écran : fiche-facture)

| Workflow | Dossier spec | Description |
|----------|--------------|-------------|
| `toggle-blacklist-impaye` | `specs/_app/frontend/fiche-facture/workflows/toggle-blacklist-impaye/` | Mettre/retirer un impayé de la blacklist avec régénération |
| `verifier-blacklist` | `specs/_app/frontend/fiche-facture/workflows/verifier-blacklist/` | Vérifier si un impayé est blacklisté avant action |
| `afficher-badge-blacklist` | `specs/_app/frontend/fiche-facture/workflows/afficher-badge-blacklist/` | Afficher le badge selon le statut blacklist |

### Workflows frontend (écran : dashboard)

| Workflow | Dossier spec | Description |
|----------|--------------|-------------|
| `charger-blacklistes` | `specs/_app/frontend/dashboard/workflows/charger-blacklistes/` | Charger la liste des impayés blacklistés |
| `filtrer-blacklistes` | `specs/_app/frontend/dashboard/workflows/filtrer-blacklistes/` | Filtrer par motif/type |
| `unblacklist-depuis-liste` | `specs/_app/frontend/dashboard/workflows/unblacklist-depuis-liste/` | Réactiver depuis la vue liste |

### Workflows backend

| Workflow | Dossier spec | Justification |
|----------|--------------|---------------|
| `regenerate-relances-contact` | `specs/_app/backend/workflows/regenerate-relances-contact/` | Régénère les relances d'un contact après blacklist/unblacklist (F-008) |
| `supprimer-relances-contact-blackliste` | `specs/_app/backend/workflows/supprimer-relances-contact-blackliste/` | Supprime les relances non envoyées dont le contact est blacklisté (nettoyage périodique) |

---

## Workflows globaux (frontend)

**Dossier** : `specs/_app/frontend/global/workflows/`

| Workflow | Description |
|----------|-------------|
| `auth` | Vérifier l'authentification utilisateur |
| `logger` | Émettre les checkpoints console `[CHECKPOINT]` |
| `notifications` | Système de toasts succès/erreur/info |
| `navigation` | Router entre les écrans (si multi-page) |
| `offline-detector` | Détecter et afficher le statut hors ligne |
| `gestion-erreurs` | Intercepter et afficher les erreurs globales |

---

## Récapitulatif par type

| Type | Nombre | Liste |
|------|--------|-------|
| Frontend écran | 24 | charger-kpis, charger-top-debiteurs, charger-graphique, refresh-auto, charger-factures, filtrer-statut, trier-colonnes, rechercher, paginer, charger-client, charger-historique, calculer-score, afficher-solde, detecter-risques, afficher-alertes, ignorer-alerte, upload-fichier, preview-import, valider-import, toggle-blacklist-impaye, verifier-blacklist, afficher-badge-blacklist, charger-blacklistes, filtrer-blacklistes, unblacklist-depuis-liste |
| Frontend global | 10 | preparer-export, generer-pdf, generer-excel, telecharger, preparer-template, editer-message, envoyer-email, auth, logger, notifications, navigation, offline-detector, gestion-erreurs |
| Backend | 7 | parse-csv, enregistrer-factures, generer-rapport-pdf, generer-excel-data, send-email-smtp, journal-relances, regenerate-relances-contact |
| **Total** | **31** | |
