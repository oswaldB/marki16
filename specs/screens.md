# Inventaire des écrans frontend ADTI

**Source** : specs/features/*.md  
**Date** : 2026-06-25

---

## Écrans par feature

### F-001 : Import de données

#### Écran : importer
**Type** : écran lié (page dédiée accessible depuis dashboard)  
**Chemin mockup** : `specs/_app/frontend/importer/mockups/`  
**Workflows attachés** : upload-fichier, preview-import, valider-import

| État | Description | Source |
|------|-------------|--------|
| `nominal` | Zone de drop prête, bouton upload visible | US-001-1 |
| `loading` | Upload en cours, barre de progression | implicite |
| `preview` | Aperçu des données avec mapping colonnes | US-001-2 |
| `error` | Message d'erreur format invalide | US-001-3 |
| `success` | Import réussi, récapitulatif affiché | critère succès |

---

### F-002 : Tableau de bord

#### Écran : dashboard
**Type** : écran lié (page d'accueil)  
**Chemin mockup** : `specs/_app/frontend/dashboard/mockups/`  
**Workflows attachés** : charger-kpis, charger-top-debiteurs, charger-graphique, refresh-auto

| État | Description | Source |
|------|-------------|--------|
| `nominal` | KPIs affichés, graphiques chargés | US-002-1 à 4 |
| `loading` | Skeleton cards et graphiques | implicite |
| `empty` | Aucune donnée importée, message + CTA import | critère empty |
| `error` | Erreur de chargement données | F-T-ERROR |

---

### F-003 : Liste des factures

#### Écran : liste-factures
**Type** : écran lié  
**Chemin mockup** : `specs/_app/frontend/liste-factures/mockups/`  
**Workflows attachés** : charger-factures, filtrer-statut, trier-colonnes, rechercher, paginer

| État | Description | Source |
|------|-------------|--------|
| `nominal` | Tableau paginé avec données | US-003-1 |
| `loading` | Skeleton rows | implicite |
| `empty` | Aucune facture trouvée | US-003-4 |
| `filtered` | Résultats filtrés affichés | US-003-2 |
| `error` | Erreur API | F-T-ERROR |

---

### F-004 : Fiche client

#### Écran : fiche-client
**Type** : écran lié  
**Chemin mockup** : `specs/_app/frontend/fiche-client/mockups/`  
**Workflows attachés** : charger-client, charger-historique, calculer-score, afficher-solde

| État | Description | Source |
|------|-------------|--------|
| `nominal` | Infos client, solde, historique affichés | US-004-1 à 4 |
| `loading` | Skeleton page | implicite |
| `error` | Client non trouvé | F-T-ERROR |
| `no-history` | Client sans facture | cas limite |

---

### F-005 : Détection anomalies

#### Écran : alerts (section du dashboard)
**Type** : écran lié (intégré dans dashboard)  
**Chemin mockup** : `specs/_app/frontend/dashboard/mockups/` (état `with-alerts`)  
**Workflows attachés** : detecter-risques, afficher-alertes, ignorer-alerte

| État | Description | Source |
|------|-------------|--------|
| `nominal` | Liste des alertes affichée | US-005-1 |
| `empty` | Aucune alerte à afficher | cas limite |
| `ignored` | Alerte masquée avec confirmation | US-005-4 |

---

### F-006 : Export rapports

#### Écran : modal-export (composant partagé)
**Type** : écran lié (modal sur plusieurs écrans)  
**Chemin mockup** : `specs/_app/frontend/global/mockups/`  
**Workflows attachés** : preparer-export, generer-pdf, generer-excel, telecharger

| État | Description | Source |
|------|-------------|--------|
| `nominal` | Modal avec choix format | US-006-1 |
| `loading` | Génération en cours | implicite |
| `success` | Fichier prêt, bouton télécharger | US-006-2 |
| `error` | Erreur génération | F-T-ERROR |

---

### F-007 : Relances email

#### Écran : modal-relance
**Type** : écran lié (modal)  
**Chemin mockup** : `specs/_app/frontend/global/mockups/`  
**Workflows attachés** : preparer-template, editer-message, envoyer-email, historiser-relance

| État | Description | Source |
|------|-------------|--------|
| `nominal` | Template pré-rempli, éditable | US-007-1 |
| `loading` | Envoi en cours | implicite |
| `success` | Email envoyé, confirmation | US-007-4 |
| `error` | Erreur SMTP | F-T-ERROR |

---

### F-008 : Blacklist des Impayés

#### Écran : fiche-facture
**Type** : écran lié
**Chemin mockup** : `specs/_app/frontend/fiche-facture/mockups/`
**Workflows attachés** : toggle-blacklist-impaye, verifier-blacklist, afficher-badge-blacklist

| État | Description | Source |
|------|-------------|--------|
| `nominal` | Facture affichée avec badge "Relances actives" | US-008-6 |
| `blacklisted` | Badge "🚫 Relances suspendues" visible avec motif | US-008-6 |
| `slideover-blacklist` | Slideover ouvert pour saisie motif | US-008-1 |
| `slideover-unblacklist` | Slideover confirmation réactivation | US-008-3 |
| `processing` | Sauvegarde en cours, spinner actif | implicite |
| `success-blacklist` | Blacklist enregistrée, badge mis à jour | US-008-1 |
| `success-unblacklist` | Déblacklist effectué, relances régénérées | US-008-3, US-008-7 |
| `error` | Erreur de sauvegarde ou de régénération | F-T-ERROR |

#### Composant : slideover-blacklist
**Type** : écran lié (panneau latéral)
**Workflows attachés** : toggle-blacklist-impaye

| État | Description | Source |
|------|-------------|--------|
| `open` | Slideover ouvert avec formulaire motif | US-008-4 |
| `validation-error` | Erreur champ motif obligatoire | critère validation |
| `saving` | Sauvegarde en cours | implicite |
| `success` | Fermeture et retour fiche facture | US-008-1 |

#### Écran : liste-blacklistés (section dashboard)
**Type** : écran lié (intégré dans dashboard)
**Chemin mockup** : `specs/_app/frontend/dashboard/mockups/` (état `blacklist-view`)
**Workflows attachés** : charger-blacklistes, filtrer-blacklistes, unblacklist-depuis-liste

| État | Description | Source |
|------|-------------|--------|
| `nominal` | Tableau des impayés blacklistés affiché | US-008-2 |
| `loading` | Skeleton rows | implicite |
| `empty` | Aucun impayé blacklisté | cas limite |
| `filtered` | Résultats filtrés par motif | US-008-2 |

---

## Workflows globaux (frontend)

**Dossier** : `specs/_app/frontend/global/workflows/`

| Workflow | Description |
|----------|-------------|
| `auth` | Vérifier l'authentification (si implémentée) |
| `logger` | Émission de checkpoints console |
| `notifications` | Afficher/masquer les toasts |
| `navigation` | Gérer les transitions entre écrans |
| `offline-detector` | Détecter la perte de connexion |

---

## Récapitulatif des écrans

| Écran | Dossier | Nb états |
|-------|---------|----------|
| dashboard | `_app/frontend/dashboard/` | 4 |
| importer | `_app/frontend/importer/` | 5 |
| liste-factures | `_app/frontend/liste-factures/` | 5 |
| fiche-client | `_app/frontend/fiche-client/` | 4 |
| global/modal-* | `_app/frontend/global/` | 4+4 |

**Total** : 5 écrans principaux + composants globaux
