# Marki - Application de Gestion des Relances d'Impayés

## 📋 Description

**Marki** est une application web complète de **gestion et automatisation des relances d'impayés** destinée aux entreprises et cabinets comptables. Elle permet de récupérer efficacement les créances clients en automatisant le processus de relance via des séquences d'emails personnalisables, un suivi structuré et une gestion intelligente des contacts.

### Fonctionnalités Clés
- Import automatique de factures depuis divers formats (CSV, Excel, PDF)
- Gestion centralisée des impayés avec filtres et recherche avancée
- Création de séquences de relances personnalisables avec délais configurables
- Envoi automatique d'emails avec templates dynamiques
- Suivi en temps réel des relances et de leur statut
- Gestion des contacts clients et entités
- Vérification automatique des paiements
- Attribution intelligente des séquences selon des règles métier
- Tableau de bord avec KPIs et statistiques
- Blacklist pour exclure certains clients des relances automatiques

---

## 🏗️ Architecture Technique

### Stack Technique

| Couche | Technologie | Version | Rôle |
|--------|-------------|---------|------|
| **Frontend** | Nuxt 4 | Latest | Framework full-stack |
| **Langage** | Vue 3 + TypeScript | 3.x | UI réactive |
| **CSS** | Tailwind CSS | 3.x | Styling |
| **State Management** | Pinia | 2.x | Gestion d'état |
| **UI Components** | Nuxt UI | Latest | Composants prêts à l'emploi |
| **Backend** | Parse Server | 5.x | API + Base de données |
| **Base de données** | MongoDB | 6.x | Stockage des données |
| **Runtime** | Node.js | 18+ | Environnement d'exécution |
| **Tests E2E** | Playwright | Latest | Tests fonctionnels |
| **Container** | PM2 | Latest | Gestion des processus |

### Architecture Globale
```
┌─────────────────────────────────────────────────────────────────┐
│                        NAVIGATEUR WEB                              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    FRONTEND (Nuxt 4)                         ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  ││
│  │  │   Pages     │  │ Components  │  │   Composables/Stores │  ││
│  │  │   (Routes)  │  │   (UI)       │  │   (Logique/État)     │  ││
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘  ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Parse Server)                        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  ┌─────────────┐  ┌─────────────────┐  ┌─────────────────┐  ││
│  │  │  API REST   │  │ Cloud Functions │  │   Cron Jobs     │  ││
│  │  │  (Express)  │  │   (Workflows)    │  │   (Planifiés)   │  ││
│  │  └─────────────┘  └─────────────────┘  └─────────────────┘  ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BASE DE DONNÉES                              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                        MongoDB                                ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  ││
│  │  │ Impayés  │  │ Contacts │  │ Séquences│  │   Relances   │  ││
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘  ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Structure du Projet

```
adti/
├── .env                          # Variables d'environnement (global)
├── .gitignore                    # Fichiers ignorés par Git
├── package.json                  # Dépendances racine
├── package-lock.json             # Verrouillage des versions
├── README.md                     # Documentation principale (ce fichier)
├── schema.sql                    # Schéma de base de données (historique)
├── parse_schemas.json            # Schéma Parse exporté
├── get_parse_schema.sh           # Script d'export du schéma
│
├── start.sh                      # Script de démarrage (développement)
├── start-pro.sh                  # Script de démarrage (production)
├── stop.sh                       # Script d'arrêt
│
├── logs/                         # Logs applicatifs
│   ├── backend.log               # Logs backend
│   └── frontend.log              # Logs frontend
│
├── storage/                      # Stockage partagé
│   └── (fichiers uploadés, exports, etc.)
│
├── specs/                        # Spécifications fonctionnelles
│   └── (documentation métier)
│
├── backend/                      # 📦 BACKEND (Parse Server + Node.js)
│   ├── .env                      # Variables d'environnement backend
│   ├── package.json
│   ├── package-lock.json
│   ├── server.js                 # 🚀 Point d'entrée du serveur Express + Parse Server
│   ├── cron.js                   # ⏰ Tâches planifiées (CRON)
│   │
│   └── cloud/                    # ☁️ Cloud Functions (Parse)
│       ├── main.js               # Point d'entrée des cloud functions
│       │
│       ├── lib/                  # 📚 Librairies partagées
│       │   └── llmHelper.js      # Helper pour intégration LLM (IA)
│       │
│       ├── relances/             # 📧 Services de génération de relances
│       │   └── services/
│       │       ├── dateUtils.js          # Utilitaires de gestion des dates
│       │       ├── ollamaClient.js       # Client pour Ollama (IA locale)
│       │       ├── relanceGenerator.js   # Générateur de relances
│       │       └── templateEngine.js     # Moteur de templates emails
│       │
│       ├── services/             # 🔧 Services métier partagés
│       │
│       ├── utils/                # 🛠️ Utilitaires
│       │   └── logger.js         # Logger centralisé
│       │
│       └── workflows/            # 🔄 Workflows d'automatisation
│           ├── appliquer-regles-attribution/    # Application des règles d'attribution
│           │   ├── 00-master.js
│           │   └── 01-appliquerReglesAttributionAutomatique.js
│           │
│           ├── assign-sequence/        # Attribution manuelle de séquences
│           │   ├── 00-master.js
│           │   └── 01-assignSpecificSequence.js
│           │
│           ├── import-invoice/         # Import de factures
│           │   ├── 00-master.js
│           │   ├── 01-syncImpayes.js
│           │   ├── 02-assignSequencesAutomatically.js
│           │   ├── 03-fetchImpayesWithSequence.js
│           │   ├── 04-createRelances.js
│           │   └── 05-generateRelances.js
│           │
│           ├── send-emails/            # Envoi des relances par email
│           │   ├── 00-master.js
│           │   └── 01-envoyerRelances.js
│           │
│           ├── send-sequence-test/     # Test d'une séquence
│           │   ├── 00-master.js
│           │   └── 01-sendSequenceTest.js
│           │
│           ├── trigger-import-invoices/ # Déclenchement des imports
│           │   ├── 00-master.js
│           │   └── 01-triggerImportInvoices.js
│           │
│           ├── update-dynamic-options/ # Mise à jour des options dynamiques
│           │   ├── 00-master.js
│           │   └── 01-updateDynamicOptions.js
│           │
│           └── verify-paid-invoices/   # Vérification des paiements
│               ├── 00-master.js
│               └── 01-verifyPaidInvoices.js
│
└── frontend/                     # 🎨 FRONTEND (Nuxt 4)
    ├── .env                      # Variables d'environnement frontend
    ├── .output/                  # Build de production
    ├── package.json
    ├── package-lock.json
    ├── nuxt.config.ts            # Configuration Nuxt
    │
    ├── app/                      # 📁 Code source Nuxt
    │   ├── app.config.ts         # Configuration de l'application
    │   ├── app.vue               # Composant racine
    │   └── loading.vue           # Composant de chargement global
    │
    │   ├── components/           # 🧩 Composants Vue réutilisables
    │   │   ├── ContactDeleteModal.vue         # Modal de suppression contact
    │   │   ├── ContactsDrawer.vue               # Drawer de gestion contacts
    │   │   ├── ContactsEntitesTable.vue        # Tableau des entités contacts
    │   │   ├── DrawerAssignSequence.vue         # Drawer d'assignation séquence
    │   │   ├── DrawerLienPaiement.vue          # Drawer de gestion liens paiement
    │   │   ├── EmailSelectionSlideover.vue      # Slideover sélection emails
    │   │   ├── ImpayeDrawerPdf.vue              # Drawer PDF impayé
    │   │   ├── ModalChatGptEmail.vue             # Modal génération email IA
    │   │   ├── ModalIaSequence.vue              # Modal génération séquence IA
    │   │   ├── NaiveTest.vue                    # Composant de test
    │   │   ├── PauseSequenceDrawer.vue          # Drawer pause séquence
    │   │   ├── PdfIframe.vue                    # Iframe pour PDF
    │   │   ├── RelanceDrawer.vue                # Drawer détail relance
    │   │   ├── SequenceEmailCard.vue            # Carte email de séquence
    │   │   ├── SequenceRulesSection.vue         # Section règles de séquence
    │   │   ├── SequenceSuiviCard.vue            # Carte suivi séquence
    │   │   ├── SequenceTestSlideover.vue        # Slideover test séquence
    │   │   ├── SlideoverRegenererRelances.vue   # Slideover régénération relances
    │   │   ├── SmtpDrawer.vue                   # Drawer configuration SMTP
    │   │   ├── SyncButton.vue                   # Bouton de synchronisation
    │   │   ├── ToastuiEditor.vue                # Éditeur riche (ToastUI)
    │   │   ├── ToggleSwitch.vue                 # Interrupteur ON/OFF
    │   │   └── VariablesPicker.vue              # Sélecteur de variables
    │   │
    │   ├── composables/          # ⚡ Composition API (logique réutilisable)
    │   │   ├── useBlacklist.js              # Gestion de la blacklist
    │   │   ├── useContactEditor.js          # Édition des contacts
    │   │   ├── useContactsStore.js          # Store des contacts
    │   │   ├── useDynamicOptions.js         # Gestion options dynamiques
    │   │   ├── useIaSequence.js             # Génération IA de séquences
    │   │   ├── useImpayesStore.js           # Store des impayés
    │   │   ├── useLiensPaiement.js          # Gestion liens de paiement
    │   │   ├── useSequenceEditor.js         # Édition des séquences
    │   │   └── useSequenceRules.js          # Gestion règles de séquences
    │   │
    │   ├── layouts/              # 📐 Layouts d'application
    │   │   ├── auth.vue          # Layout authentification
    │   │   └── default.vue       # Layout principal (connecté)
    │   │
    │   ├── middleware/           # 🔒 Middleware Nuxt
    │   │   ├── admin.ts          # Vérification rôle admin
    │   │   └── auth.global.ts   # Authentification globale
    │   │
    │   ├── pages/                # 📄 Pages/Routes (file-based routing)
    │   │   ├── index.vue                 # Tableau de bord
    │   │   ├── login.vue                 # Page de connexion
    │   │   ├── a-corriger.vue            # Éléments à corriger
    │   │   ├── activites.vue             # Activités et logs
    │   │   ├── blacklist.vue             # Gestion blacklist
    │   │   ├── import.vue                # Import de factures
    │   │   ├── recalcitrants.vue         # Clients récalcitrants
    │   │   ├── relances.vue              # Calendrier des relances
    │   │   ├── services.vue              # Gestion des services
    │   │   │
    │   │   ├── contacts/
    │   │   │   ├── index.vue             # Liste des contacts
    │   │   │   └── sans-email.vue        # Contacts sans email
    │   │   │
    │   │   ├── impayes/
    │   │   │   ├── index.vue             # Liste des impayés
    │   │   │   └── [id].vue              # Détail d'un impayé
    │   │   │
    │   │   ├── sequences/
    │   │   │   ├── index.vue             # Liste des séquences
    │   │   │   └── [id].vue              # Édition d'une séquence
    │   │   │
    │   │   └── settings/
    │   │       ├── smtp.vue              # Configuration SMTP
    │   │       └── users.vue             # Gestion utilisateurs
    │   │
    │   ├── plugins/              # 🔌 Plugins Nuxt
    │   │   ├── chartjs.client.js  # Configuration Chart.js
    │   │   └── parse.client.js    # Client Parse SDK
    │   │
    │   └── stores/               # 🗃️ Stores Pinia (état global)
    │       ├── auth.ts                   # Authentification utilisateur
    │       ├── blacklistStore.js         # Gestion de la blacklist
    │       ├── contactsStore.js          # Gestion des contacts
    │       └── impayesStore.js           # Gestion des impayés
    │
    ├── public/                     # 📂 Assets statiques
    │   └── (images, favicon, etc.)
    │
    ├── scripts/                    # 📜 Scripts utilitaires
    │   └── trigger-dynamic-options.js   # Déclenchement options dynamiques
    │
    └── tests/                      # 🧪 Tests
        └── (tests Playwright E2E)
```

---

## 🚀 Installation et Démarrage

### Prérequis
- Node.js 18+ (recommandé : 20 LTS)
- MongoDB 6.x
- PM2 (pour la production)
- Git

### Installation

#### 1. Cloner le dépôt
```bash
cd ~/prod/
git clone <repository-url> adti
cd adti
```

#### 2. Installer les dépendances
```bash
# Backend
npm install

# Frontend
cd frontend
npm install
cd ..
```

#### 3. Configurer les variables d'environnement

**Backend** (fichier `backend/.env` ou `/home/ubuntu/prod/adti/.env`):
```env
# Serveur
PORT=1555
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/marki15

# Parse Server
PARSE_APP_ID=marki15-app-id
PARSE_MASTER_KEY=marki15-master-key
PARSE_JAVASCRIPT_KEY=marki15-javascript-key
PARSE_SERVER_URL=http://localhost:1555/parse

# Dashboard Parse
PARSE_DASHBOARD_USER=admin
PARSE_DASHBOARD_PASSWORD=admin

# SMTP (envoi d'emails)
SMTP_HOST=smtp.votredomaine.com
SMTP_PORT=587
SMTP_USER=user@votredomaine.com
SMTP_PASS=votre-mot-de-passe
SMTP_FROM=noreply@votredomaine.com
SMTP_SECURE=false

# Clés API IA (optionnel)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
OLLAMA_BASE_URL=http://localhost:11434

# SFTP (pour les PDF)
FTP_HOST=
FTP_PORT=2222
FTP_USERNAME=
FTP_PASSWORD=
```

**Frontend** (fichier `frontend/.env`):
```env
# Parse Server
PARSE_APP_ID=marki15-app
PARSE_SERVER_URL=https://adti.api.markidiags.com:8445/parse
PARSE_JS_KEY=votre-cle-js

# API
API_BASE_URL=https://adti.api.markidiags.com
```

### Démarrage

#### Développement
```bash
# Démarrer tous les services (backend + frontend)
./start.sh dev

# Accéder à l'application
# Frontend: http://localhost:3000
# Backend: http://localhost:1555
# Parse Dashboard: http://localhost:1555/dashboard
```

#### Production
```bash
# Démarrer avec PM2
./start-pro.sh

# Arrêter les services
./stop.sh

# Vérifier les logs
pm2 logs
```

---

## 📊 Fonctionnalités Principales

### 1. **Tableau de Bord** (`/`)
- KPIs en temps réel (impayés actifs, montant total, taux de récupération)
- Graphiques et statistiques
- Vue d'ensemble de l'activité

### 2. **Gestion des Impayés** (`/impayes`)
- Liste complète des factures impayées
- Filtres par statut, date, montant, client
- Recherche avancée
- Vue détaillée avec historique
- Actions : assigner séquence, marquer comme payé, ajouter note

### 3. **Séquences de Relances** (`/sequences`)
- Création et édition de séquences
- Configuration des délais entre relances
- Définition des templates d'emails
- Attribution automatique ou manuelle
- Test des séquences avant déploiement

### 4. **Calendrier des Relances** (`/relances`)
- Vue calendrier des relances planifiées
- Statut de chaque relance (à envoyer, envoyée, échouée)
- Historique des envois
- Filtrage par date, séquence, client

### 5. **Gestion des Contacts** (`/contacts`)
- Liste des clients et entités
- Fiche contact détaillée
- Gestion des coordonnées (emails, téléphones)
- Association avec les impayés
- Catégorisation (payeur, apporteur d'affaire)

### 6. **Import de Factures** (`/import`)
- Import depuis CSV, Excel, PDF
- Mapping des colonnes
- Validation des données
- Synchronisation automatique

### 7. **Configuration SMTP** (`/settings/smtp`)
- Configuration du serveur SMTP
- Test de connexion
- Gestion des signatures d'emails

### 8. **Gestion des Utilisateurs** (`/settings/users`)
- Création et suppression d'utilisateurs
- Attribution des rôles (Admin, Utilisateur)
- Réinitialisation des mots de passe

### 9. **Blacklist** (`/blacklist`)
- Liste des clients exclus des relances automatiques
- Ajout/suppression manuelle
- Raison de l'exclusion

### 10. **Clients Récalcitrants** (`/recalcitrants`)
- Identification des clients avec impayés répétés
- Statistiques par client
- Actions spécifiques

### 11. **Éléments à Corriger** (`/a-corriger`)
- Liste des problèmes détectés
- Erreurs d'import
- Emails non envoyés
- Données manquantes

### 12. **Activités** (`/activites`)
- Historique complet des actions
- Logs des workflows
- Audit trail

---

## 🔧 Workflows Backend

Les workflows sont des processus automatisés exécutés par Parse Cloud Functions. Chaque workflow suit un pattern **master + étapes** :

### Pattern des Workflows
```
workflows/[nom-workflow]/
├── 00-master.js          # Orchestrateur principal
└── NN-nomEtape.js        # Étapes numérotées (01, 02, 03...)
```

### Liste des Workflows

| Workflow | Classe Parse | Description | Étapes |
|----------|--------------|-------------|--------|
| `import-invoice` | `ImportInvoiceWorkflow` | Import de factures depuis fichiers | 6 étapes |
| `assign-sequence` | `AssignSequenceWorkflow` | Attribution manuelle d'une séquence | 2 étapes |
| `send-emails` | `SendEmailsWorkflow` | Envoi des relances par email | 2 étapes |
| `send-sequence-test` | `SendSequenceTestWorkflow` | Test d'une séquence sur un email | 2 étapes |
| `trigger-import-invoices` | `TriggerImportInvoicesWorkflow` | Déclenchement des imports | 2 étapes |
| `update-dynamic-options` | `UpdateDynamicOptionsWorkflow` | Mise à jour des options dynamiques | 2 étapes |
| `verify-paid-invoices` | `VerifyPaidInvoicesWorkflow` | Vérification des paiements | 2 étapes |
| `appliquer-regles-attribution` | `AppliquerReglesAttributionWorkflow` | Attribution auto par règles | 2 étapes |

### Détail : Workflow `import-invoice`

Le workflow d'import de factures est le plus complexe avec 6 étapes :

1. **00-master.js** - Orchestrateur
   - Reçoit la requête d'import
   - Valide les données
   - Lance les étapes séquentielles

2. **01-syncImpayes.js** - Synchronisation
   - Parse le fichier importé
   - Crée/Met à jour les impayés en base
   - Gère les doublons

3. **02-assignSequencesAutomatically.js** - Attribution automatique
   - Applique les règles d'attribution
   - Assigne les séquences aux nouveaux impayés

4. **03-fetchImpayesWithSequence.js** - Récupération
   - Récupère les impayés avec leur séquence assignée
   - Prépare les données pour la création des relances

5. **04-createRelances.js** - Création
   - Crée les objets Relance en base
   - Définit les dates d'envoi

6. **05-generateRelances.js** - Génération
   - Génère le contenu des emails
   - Applique les templates
   - Prépare l'envoi

---

## 👥 Rôles et Permissions

### Rôles Utilisateurs (Humains)

| Rôle | Description | Permissions |
|------|-------------|--------------|
| **Admin** | Administrateur système | Accès complet à toutes les fonctionnalités, gestion des utilisateurs |
| **Utilisateur** | Utilisateur standard | Accès limité selon permissions, pas de gestion utilisateurs |

### Rôles Contacts (Métier)

| Rôle | Description | Utilisation |
|------|-------------|--------------|
| **Payeur** | Responsable du paiement | Contact principal pour les relances |
| **Apporteur d'affaire** | Source du client | À des fins de suivi commercial |

### Rôle Système

| Rôle | Description | Utilisation |
|------|-------------|--------------|
| **Systeme** | Processus automatisés | Workflows backend, tâches CRON, imports, envoi de relances, vérification paiements |

---

## 📝 Conventions de Nommage

### Fichiers et Dossiers

| Type | Convention | Exemple |
|------|------------|---------|
| **Fichiers de configuration** | kebab-case | `start-pro.sh`, `nuxt.config.ts` |
| **Scripts shell** | kebab-case | `start.sh`, `stop.sh`, `get_parse_schema.sh` |
| **Fichiers JavaScript** | camelCase | `sequenceEditor.js`, `useImpayesStore.js` |
| **Composants Vue** | PascalCase | `SequenceEmailCard.vue`, `ModalIaSequence.vue` |
| **Pages Vue** | kebab-case ou [param] | `index.vue`, `login.vue`, `[id].vue` |
| **Classes Parse** | PascalCase | `ImportInvoiceWorkflow`, `Relance` |
| **Variables d'environnement** | UPPER_SNAKE_CASE | `PARSE_APP_ID`, `SMTP_HOST` |

### Backend - Workflows

| Élément | Convention | Exemple |
|---------|------------|---------|
| Dossier workflow | kebab-case | `import-invoice/`, `send-emails/` |
| Fichier master | `00-master.js` | `00-master.js` |
| Fichier étape | `NN-nomEtape.js` | `01-syncImpayes.js`, `02-assignSequencesAutomatically.js` |
| Nom d'étape | camelCase | `syncImpayes`, `assignSequencesAutomatically` |

### Frontend - Composants

| Type | Préfixe | Exemple |
|------|---------|---------|
| **Modal** | `Modal` | `ModalIaSequence.vue`, `ModalChatGptEmail.vue` |
| **Drawer** | `Drawer` | `RelanceDrawer.vue`, `ContactsDrawer.vue` |
| **Slideover** | `Slideover` | `SequenceTestSlideover.vue`, `EmailSelectionSlideover.vue` |
| **Table** | `Table` | `ContactsEntitesTable.vue` |
| **Card** | `Card` | `SequenceEmailCard.vue`, `SequenceSuiviCard.vue` |

### Frontend - Composables

| Type | Pattern | Exemple |
|------|---------|---------|
| **Store Pinia** | `use[Nom]Store` | `useImpayesStore.js`, `useContactsStore.js` |
| **Éditeur** | `use[Nom]Editor` | `useSequenceEditor.js`, `useContactEditor.js` |
| **Fonctionnalité** | `use[Nom]` | `useIaSequence.js`, `useSequenceRules.js` |

### Frontend - Pages

| Type | Pattern | Exemple |
|------|---------|---------|
| Page simple | `[nom-page].vue` | `index.vue`, `login.vue`, `relances.vue` |
| Page avec sous-routes | `[dossier]/index.vue` | `impayes/index.vue`, `contacts/index.vue` |
| Page dynamique | `[dossier]/[id].vue` | `impayes/[id].vue`, `sequences/[id].vue` |
| Page sous-catégorie | `[dossier]/[sous-page].vue` | `contacts/sans-email.vue`, `settings/smtp.vue` |

---

## 🔌 Intégrations Externes

### API et Services

| Service | Utilisation | Configuration |
|---------|-------------|---------------|
| **Parse Server** | Backend + Base de données | Variables d'environnement |
| **MongoDB** | Stockage des données | `MONGODB_URI` |
| **SMTP** | Envoi d'emails | `SMTP_HOST`, `SMTP_PORT`, etc. |
| **OpenAI** | Génération IA (optionnel) | `OPENAI_API_KEY` |
| **Anthropic** | Génération IA (optionnel) | `ANTHROPIC_API_KEY` |
| **Ollama** | IA locale | `OLLAMA_BASE_URL` |
| **SFTP** | Accès aux PDF distants | `FTP_HOST`, `FTP_PORT`, etc. |

### Librairies Principales

**Frontend** :
- `@nuxt/ui` - Composants UI
- `pinia` - State management
- `parse` - SDK Parse Server
- `chart.js` - Graphiques
- `playwright` - Tests E2E

**Backend** :
- `express` - Serveur HTTP
- `parse-server` - Parse Server
- `mongodb` - Driver MongoDB
- `nodemailer` - Envoi d'emails
- `axios` - Requêtes HTTP
- `node-cron` - Tâches planifiées
- `ssh2-sftp-client` - Accès SFTP
- `pdf-parse` - Parsing PDF
- `multer` - Upload de fichiers

---

## 🧪 Tests

### Tests E2E (Playwright)

```bash
# Exécuter tous les tests
cd frontend
npm run test:e2e

# Mode UI (navigateur visible)
npm run test:e2e:headed

# Mode debug
npm run test:e2e:debug

# Test spécifique
npm run test:e2e:ui
```

### Structure des tests
```
frontend/tests/
├── auth/
│   ├── login.spec.ts
│   └── register.spec.ts
├── dashboard/
│   └── dashboard.spec.ts
├── impayes/
│   ├── list.spec.ts
│   └── detail.spec.ts
├── sequences/
│   ├── list.spec.ts
│   └── edit.spec.ts
└── ...
```

---

## 📊 Modèle de Données (Parse Classes)

### Classes Principales

| Classe | Description | Champs clés |
|--------|-------------|-------------|
| `User` | Utilisateurs | username, password, email, role |
| `Impaye` | Facture impayée | numero, montant, dateEcheance, client, statut |
| `Contact` | Contact client | nom, prenom, email, telephone, entite |
| `Entite` | Entité/Entreprise | nom, adresse, siret, contacts |
| `Sequence` | Séquence de relances | nom, description, delais, templates |
| `Relance` | Relance individuelle | impaye, sequence, dateEnvoi, statut, email |
| `Template` | Template d'email | nom, sujet, contenu, variables |
| `RegleAttribution` | Règle d'attribution | nom, conditions, sequenceCible |
| `Blacklist` | Clients exclus | contact, raison, dateAjout |
| `LienPaiement` | Lien de paiement | impaye, url, dateExpiration |
| `Activite` | Historique actions | type, utilisateur, details, date |

### Workflows Classes

| Classe | Description |
|--------|-------------|
| `ImportInvoiceWorkflow` | Import de factures |
| `AssignSequenceWorkflow` | Attribution séquence |
| `SendEmailsWorkflow` | Envoi emails |
| `SendSequenceTestWorkflow` | Test séquence |
| `TriggerImportInvoicesWorkflow` | Déclenchement imports |
| `UpdateDynamicOptionsWorkflow` | Maj options |
| `VerifyPaidInvoicesWorkflow` | Vérification paiements |
| `AppliquerReglesAttributionWorkflow` | Application règles |

### Logs Classes

| Classe | Description |
|--------|-------------|
| `ImportInvoicesMasterLog` | Logs d'import des factures |
| `SendEmailsMasterLog` | Logs d'envoi des emails |

---

## 📞 Support et Contribution

### Problèmes Connus
- Vérifier les logs dans `/logs/` et `/backend/logs/`
- Les workflows peuvent échouer si MongoDB n'est pas accessible
- Les emails ne s'envoient pas si SMTP n'est pas configuré

### Contribution
1. Forker le repository
2. Créer une branche (`git checkout -b feature/ma-fonctionnalite`)
3. Commiter les changements (`git commit -m 'Ajout fonctionnalité X'`)
4. Pousser vers la branche (`git push origin feature/ma-fonctionnalite`)
5. Ouvrir une Pull Request

### Bonnes Pratiques
- Respecter les conventions de nommage
- Ajouter des commentaires dans le code
- Écrire des tests pour les nouvelles fonctionnalités
- Mettre à jour la documentation

---

## 📄 Licence

MIT License - Copyright (c) 2025 Marki Team

---

## 🏷️ Version

**Version**: 1.0.0  
**Dernière mise à jour**: 3 mai 2026  
**Auteur**: Marki Team
