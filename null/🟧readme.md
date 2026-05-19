# 🟧 ADTI - Analyse de la Codebase

## Introduction

### Objectif
Ce document fournit une analyse détaillée de la codebase **ADTI**, une application full-stack conçue pour la gestion des impayés, relances et workflows administratifs dans le domaine immobilier. Le système permet l'importation, le parsing et le traitement automatisé de factures, ainsi que l'envoi de séquences d'emails de relance.

### Périmètre
- **Backend** : Serveur Parse avec Express, gestion des API, cloud functions et tâches cron
- **Frontend** : Application Nuxt 4 avec interface utilisateur pour la gestion des données
- **Base de données** : MongoDB (Parse Server) + PostgreSQL (base externe)
- **Stockage** : SFTP pour les PDF et stockage local pour les uploads
- **Fonctionnalités clés** :
  - Import et parsing de factures PDF via Ollama/Mistral
  - Gestion des impayés et relances automatisées
  - Envoi d'emails via SMTP
  - Tableau de bord Parse Dashboard

---

## Structure du Projet

### Architecture Globale
```
adti/
├── backend/                  # Serveur backend (Parse + Express)
│   ├── cloud/                # Cloud functions et workflows
│   │   ├── main.js           # Point d'entrée des cloud functions
│   │   ├── utils/            # Utilitaires (logger, helpers)
│   │   └── workflows/        # Workflows métiers
│   │       ├── appliquer-regles-attribution/
│   │       ├── generate-relances/
│   │       ├── import-invoice/
│   │       ├── send-emails/
│   │       ├── send-sequence-test/
│   │       ├── sync-contacts/
│   │       ├── unknown-workflow/
│   │       ├── update-dynamic-options/
│   │       ├── users/
│   │       └── verify-paid-invoices/
│   ├── server.js            # Configuration du serveur Express + Parse
│   ├── cron.js              # Tâches planifiées (node-cron)
│   ├── .env                 # Variables d'environnement backend
│   └── package.json         # Dépendances backend
│
├── frontend/                 # Application Nuxt 4
│   ├── app/                  # Code source principal
│   │   ├── components/       # Composants Vue.js
│   │   ├── composables/      # Logique réutilisable
│   │   ├── layouts/          # Mises en page
│   │   ├── middleware/       # Middleware Nuxt
│   │   ├── pages/            # Pages de l'application
│   │   │   ├── contacts/     # Gestion des contacts
│   │   │   ├── impayes/      # Gestion des impayés
│   │   │   ├── sequences/    # Gestion des séquences
│   │   │   ├── settings/     # Paramètres
│   │   │   ├── activites.vue
│   │   │   ├── blacklist.vue
│   │   │   ├── import.vue    # Import de factures
│   │   │   ├── index.vue     # Tableau de bord
│   │   │   ├── login.vue
│   │   │   ├── recalcitrants.vue
│   │   │   ├── relances.vue  # Gestion des relances
│   │   │   └── services.vue
│   │   ├── plugins/          # Plugins Nuxt
│   │   ├── stores/           # Stores Pinia (état global)
│   │   └── app.vue           # Point d'entrée Vue
│   ├── public/               # Assets statiques
│   ├── scripts/              # Scripts utilitaires
│   ├── tests/                # Tests Playwright
│   ├── nuxt.config.ts        # Configuration Nuxt
│   ├── package.json         # Dépendances frontend
│   └── .env                  # Variables d'environnement frontend
│
├── storage/                  # Stockage des fichiers uploadés
├── logs/                     # Journaux d'application
├── schema.sql                # Schéma de la base PostgreSQL externe
├── start.sh                  # Script de démarrage
├── stop.sh                   # Script d'arrêt
├── get_parse_schema.sh       # Script pour extraire le schéma Parse
├── package.json              # Dépendances globales (Playwright, etc.)
└── .env                      # Variables d'environnement globales
```

### Dossiers et Fichiers Clés

#### Backend
| **Dossier/Fichier** | **Description** |
|---------------------|----------------|
| `backend/server.js` | Configuration principale du serveur Express + Parse Server. Gère les endpoints API, le proxy PDF, et l'intégration avec Ollama pour le parsing de PDF. |
| `backend/cron.js` | Définition des tâches planifiées (cron jobs) pour l'automatisation des workflows. |
| `backend/cloud/main.js` | Point d'entrée des cloud functions Parse. |
| `backend/cloud/utils/logger.js` | Utilitaire de logging pour les workflows. |
| `backend/cloud/workflows/import-invoice/` | Workflow d'importation et traitement des factures (parsing, attribution de séquences, création de relances). |
| `backend/cloud/workflows/send-emails/` | Workflow d'envoi d'emails (relances, séquences). |
| `backend/cloud/workflows/sync-contacts/` | Synchronisation des contacts avec la base externe. |
| `backend/cloud/workflows/verify-paid-invoices/` | Vérification des factures payées. |

#### Frontend
| **Dossier/Fichier** | **Description** |
|---------------------|----------------|
| `frontend/app/pages/` | Pages principales de l'application (tableau de bord, import, relances, etc.). |
| `frontend/app/stores/` | Stores Pinia pour la gestion d'état globale. |
| `frontend/app/composables/` | Logique réutilisable (composables Vue 3). |
| `frontend/app/components/` | Composants Vue.js partagés. |
| `frontend/nuxt.config.ts` | Configuration de Nuxt 4 (modules, CSS, etc.). |
| `frontend/tests/` | Tests end-to-end avec Playwright. |

#### Racine
| **Fichier** | **Description** |
|-------------|----------------|
| `.env` | Variables d'environnement globales (MongoDB, Parse, SFTP, Ollama, etc.). |
| `schema.sql` | Schéma de la base de données PostgreSQL externe (adn_adti). |
| `start.sh` / `stop.sh` | Scripts de gestion du cycle de vie de l'application. |

---

## Technologies Utilisées

### Backend

#### Langages & Frameworks
- **Node.js** : Runtime JavaScript côté serveur
- **Express** (v5.2.1) : Framework web pour la gestion des routes HTTP
- **Parse Server** (v9.8.0) : Backend as a Service (BaaS) pour la gestion des données et cloud functions
- **Parse Dashboard** (v9.1.1) : Interface d'administration pour Parse Server

#### Bases de Données
- **MongoDB** : Base de données principale pour Parse Server (via `mongodb+srv`)
- **PostgreSQL** (via `pg` v8.20.0) : Base de données externe pour les données métiers (adn_adti)
- **Better SQLite3** (v12.9.0) : Utilisé pour le stockage local (optionnel)

#### Traitement de Fichiers
- **Multer** (v2.1.1) : Middleware pour l'upload de fichiers (PDF)
- **PDF-Parse** (v2.4.5) : Extraction de texte depuis les PDF
- **Officegen** (v0.6.5) : Génération de documents Office (Excel, etc.)
- **ssh2-sftp-client** (v12.1.1) : Client SFTP pour la récupération de PDF distants

#### Communication & API
- **Axios** (v1.15.0) : Client HTTP pour les requêtes externes
- **Node Fetch** (v3.3.2) : Alternative à Axios pour les appels API
- **CORS** (v2.8.6) : Middleware pour la gestion des requêtes cross-origin

#### Emails
- **Nodemailer** (v8.0.5) : Envoi d'emails via SMTP
- **EJS** (v5.0.2) : Moteur de templates pour les emails HTML

#### Planification
- **Node Cron** (v4.2.1) : Gestion des tâches planifiées (cron jobs)

#### Développement & Tests
- **Mocha** (v10.2.0) : Framework de tests unitaires
- **Chai** (v4.3.7) : Assertion library pour les tests
- **Sinon** (v15.2.0) : Mocking et stubbing pour les tests
- **Nyc** (v15.1.0) : Coverage de code (Istanbul)
- **Nodemon** (v3.1.14) : Redémarrage automatique du serveur en développement

### Frontend

#### Frameworks & Libraries
- **Nuxt 4** (v4.3.1) : Framework Vue.js pour les applications universelles (SSR/SSG)
- **Vue 3** : Framework JavaScript réactif pour les interfaces utilisateur
- **Pinia** (v3.0.4) : Gestion d'état globale (remplace Vuex)
- **@pinia/nuxt** (v0.11.3) : Intégration de Pinia avec Nuxt

#### UI & Styling
- **@nuxt/ui** (v4.5.1) : Bibliothèque de composants UI pour Nuxt
- **Tailwind CSS** (v4.2.1) : Framework CSS utilitaire pour le styling

#### Graphiques & Visualisation
- **Chart.js** (v4.5.1) : Bibliothèque de graphiques
- **vue-chartjs** (v5.3.3) : Intégration de Chart.js avec Vue 3

#### Édition de Texte
- **@toast-ui/vue-editor** (v3.2.3) : Éditeur de texte riche (WYSIWYG)

#### Calendrier
- **FullCalendar** (v6.1.20) : Composant de calendrier interactif
  - `@fullcalendar/core`
  - `@fullcalendar/daygrid`
  - `@fullcalendar/interaction`
  - `@fullcalendar/vue3`

#### Parse Client
- **Parse** (v3.3.0) : SDK client pour interagir avec Parse Server

#### Tests
- **Playwright** (v1.59.1) : Framework de tests end-to-end
- **@playwright/test** (v1.59.1) : API de test pour Playwright

### Outils DevOps
- **Dotenv** (v17.4.2) : Gestion des variables d'environnement
- **JS-YAML** (v4.1.1) : Parsing de fichiers YAML

### Intégrations Externes
| **Service** | **Technologie** | **Usage** |
|-------------|----------------|-----------|
| **Ollama** | API REST | Parsing de PDF via modèle Mistral (LLM) |
| **SFTP** | ssh2-sftp-client | Récupération de PDF depuis un serveur distant |
| **SMTP** | Nodemailer | Envoi d'emails de relance |
| **MongoDB Atlas** | MongoDB Driver | Stockage des données Parse Server |
| **PostgreSQL** | pg | Base de données externe (adn_adti) |

---

## Algorithmes et Workflows Métiers

### 1. Importation et Parsing de Factures
**Fichiers impliqués** :
- `backend/server.js` (endpoints `/api/import/upload`, `/api/import/parse`)
- `backend/cloud/workflows/import-invoice/`

**Processus** :
1. **Upload de PDF** : Les utilisateurs uploadent des PDF via un formulaire (Multer)
2. **Extraction de texte** : PDF-Parse extrait le texte brut du PDF
3. **Parsing via LLM** : Le texte est envoyé à Ollama (Mistral) pour extraction structurée des données
4. **Validation et stockage** : Les données extraites sont validées et stockées dans Parse Server

**Technologies** : Multer, PDF-Parse, Ollama API (Mistral), Axios

---

### 2. Gestion des Relances
**Fichiers impliqués** :
- `backend/cloud/workflows/generate-relances/`
- `backend/cloud/workflows/send-emails/`
- `frontend/app/pages/relances.vue`

**Processus** :
1. **Création de relances** : Génération automatique de relances basées sur les impayés
2. **Attribution de séquences** : Association des relances à des séquences d'emails prédéfinies
3. **Envoi automatisé** : Envoi des emails via Nodemailer selon un calendrier
4. **Suivi** : Tracking des emails envoyés et des réponses

**Technologies** : Parse Server, Nodemailer, Node Cron

---

### 3. Proxy PDF
**Fichiers impliqués** :
- `backend/server.js` (endpoint `/api/pdf/:impayelId`)

**Processus** :
1. **Récupération de l'impayé** : Requête à Parse Server pour obtenir les métadonnées
2. **Source locale ou SFTP** :
   - Si `source === "upload"` : Récupération depuis le stockage local
   - Sinon : Connexion SFTP et streaming du PDF distant
3. **Streaming vers le client** : Le PDF est streamé directement vers le navigateur

**Technologies** : ssh2-sftp-client, Express, Parse Server

---

### 4. Synchronisation des Contacts
**Fichiers impliqués** :
- `backend/cloud/workflows/sync-contacts/`

**Processus** :
1. **Connexion à PostgreSQL** : Récupération des contacts depuis la base externe
2. **Comparaison des données** : Identification des contacts à créer/mettre à jour
3. **Synchronisation** : Mise à jour de Parse Server avec les données externes

**Technologies** : pg, Parse Server

---

### 5. Vérification des Factures Payées
**Fichiers impliqués** :
- `backend/cloud/workflows/verify-paid-invoices/`

**Processus** :
1. **Requête à la base externe** : Vérification du statut de paiement
2. **Mise à jour des impayés** : Marquage des factures comme payées dans Parse Server
3. **Arrêt des relances** : Suspension des séquences de relance pour les factures réglées

**Technologies** : pg, Parse Server

---

## Configuration et Environnement

### Variables d'Environnement Principales

#### Backend (`.env`)
```env
# MongoDB (Parse Server)
MONGODB_URI=mongodb+srv://.../adti-marki

# Parse Server
PARSE_APP_ID=adti-marki
PARSE_MASTER_KEY=...
PARSE_JAVASCRIPT_KEY=...
PARSE_SERVER_URL=https://adti.api.markidiags.com:8445/parse

# SFTP (Proxy PDF)
FTP_HOST=serveur.adti06.com
FTP_PORT=2222
FTP_USERNAME=...
FTP_PASSWORD=...

# Ollama (Parsing PDF)
OLLAMA_API_URL=https://ollama.com/api
OLLAMA_API_KEY=...
OLLAMA_MODEL=mistral

# Base Externe (PostgreSQL)
EXTERNAL_DB_URI=postgresql://.../adn_adti

# Stockage
UPLOAD_STORAGE_PATH=./storage/uploads

# Port
PORT=1555
```

#### Frontend (`.env`)
```env
# URL du backend Parse
PARSE_SERVER_URL=https://adti.api.markidiags.com:8445/parse
PARSE_APP_ID=adti-marki
PARSE_JAVASCRIPT_KEY=...

# URL du frontend
FRONTEND_URL=https://adti.markidiags.com
```

---

## Points d'API Principaux

### Backend Endpoints
| **Endpoint** | **Méthode** | **Description** |
|--------------|-------------|----------------|
| `/parse` | * | Toutes les routes Parse Server (GraphQL, REST, etc.) |
| `/parse-dashboard` | * | Parse Dashboard (interface admin) |
| `/api/healthy` | GET | Health check du serveur |
| `/api/import/upload` | POST | Upload de PDF (Multer) |
| `/api/import/parse` | POST | Parsing de PDF via Ollama |
| `/api/pdf/:impayelId` | GET | Proxy PDF (local ou SFTP) |
| `/api/smtp/test` | POST | Test de configuration SMTP |
| `/trigger-import-invoices` | GET | Déclenchement manuel de l'import des factures |
| `/trigger-assign-sequences` | GET | Déclenchement manuel de l'attribution des séquences |
| `/trigger-update-dynamic-options` | GET | Mise à jour des options dynamiques |

### Cloud Functions (Parse)
| **Fonction** | **Description** |
|--------------|----------------|
| `sendSequenceTest` | Envoi d'emails de test pour une séquence |
| `sendEmail` | Envoi d'un email simple |
| `sendEmailViaSmtp` | Envoi d'un email via un profil SMTP |

---

## Dépendances et Écosystème

### Arbre des Dépendances
- **Backend** : 22 dépendances (production) + 5 dépendances (développement)
- **Frontend** : 10 dépendances (production) + 4 dépendances (développement)
- **Global** : Playwright, Dotenv, JS-YAML, Better-SQLite3

### Dépendances Critiques
| **Package** | **Version** | **Usage** | **Criticité** |
|-------------|-------------|-----------|---------------|
| parse-server | 9.8.0 | Backend principal | ⭐⭐⭐⭐⭐ |
| express | 5.2.1 | Serveur web | ⭐⭐⭐⭐⭐ |
| nuxt | 4.3.1 | Framework frontend | ⭐⭐⭐⭐⭐ |
| nodemailer | 8.0.5 | Envoi d'emails | ⭐⭐⭐⭐ |
| pg | 8.20.0 | Connexion PostgreSQL | ⭐⭐⭐⭐ |
| ssh2-sftp-client | 12.1.1 | Accès SFTP | ⭐⭐⭐ |
| pdf-parse | 2.4.5 | Extraction texte PDF | ⭐⭐⭐ |
| ollama | - | Parsing LLM | ⭐⭐⭐ |

---

## Bonnes Pratiques et Conventions

### Backend
- **Structure modulaire** : Séparation claire entre routes, cloud functions et workflows
- **Gestion des erreurs** : Try/catch systématique pour les opérations asynchrones
- **Logging** : Utilisation de `console.log` et d'un logger personnalisé (`logger.js`)
- **Sécurité** :
  - Validation des uploads (Multer : PDF uniquement, 20MB max)
  - Vérification des chemins de fichiers (sécurité contre les path traversal)
  - Utilisation des master keys pour les opérations sensibles

### Frontend
- **Composables** : Logique réutilisable extraite des composants
- **Pinia** : Gestion d'état centralisée
- **Typescript** : Configuration Nuxt en TypeScript (`nuxt.config.ts`)
- **Tests E2E** : Couverture des workflows principaux avec Playwright

### Nommage
- **Cloud functions** : Préfixes numériques pour l'ordre d'exécution (ex: `00-master.js`, `01-envoyerRelances.js`)
- **Workflows** : Dossiers par fonctionnalité métiers
- **Pages** : Nommage en français (ex: `relances.vue`, `import.vue`)

---

## Sécurité

### Mesures Implémentées
1. **Authentification** : Parse Server gère l'authentification via tokens
2. **CORS** : Middleware CORS activé pour toutes les routes
3. **Master Key** : Utilisation de la master key pour les opérations sensibles
4. **Validation des uploads** :
   - Type de fichier (PDF uniquement)
   - Taille maximale (20MB)
   - Noms de fichiers uniques (timestamp + random)
5. **Sécurité SFTP** : Vérification des chemins pour éviter les accès non autorisés
6. **HTTPS** : Configuration pour HTTPS (Parse Dashboard en HTTP autorisé en dev)

### Points d'Attention
- **Clés API** : Les clés Ollama et mots de passe SMTP sont stockés en clair dans `.env`
- **Parse Dashboard** : Accès en HTTP non sécurisé en développement (`allowInsecureHTTP: true`)
- **SFTP** : Les identifiants SFTP sont stockés dans les variables d'environnement

---

## Performances

### Optimisations
- **Streaming de fichiers** : Les PDF sont streamés depuis SFTP sans téléchargement complet
- **Parsing asynchrone** : Les requêtes Ollama sont parallélisées pour les uploads multiples
- **Cron Jobs** : Tâches planifiées pour éviter les traitements manuels
- **Cache** : Pas de cache implémenté actuellement (à améliorer)

### Goulots d'Étranglement Potentiels
1. **Parsing LLM** : Les appels à Ollama peuvent être lents (timeout à 120s)
2. **Uploads multiples** : Traitement séquentiel des fichiers (améliorable avec des workers)
3. **Base de données externe** : Requêtes PostgreSQL synchrones (à optimiser)

---

## Déploiement

### Scripts Disponibles
| **Script** | **Description** |
|------------|----------------|
| `start.sh` | Démarrage complet de l'application (backend + frontend) |
| `stop.sh` | Arrêt des processus |
| `get_parse_schema.sh` | Extraction du schéma Parse Server |

### Commandes NPM

#### Backend
```bash
npm start          # Démarrage en production
npm run dev        # Démarrage avec nodemon (développement)
npm test           # Exécution des tests unitaires
npm run test:watch # Tests en mode watch
npm run test:coverage # Tests avec coverage
```

#### Frontend
```bash
npm run dev        # Démarrage en développement (port 5000)
npm run build      # Build pour la production
npm run generate   # Génération statique
npm run preview    # Prévisualisation du build
npm run test:e2e   # Tests end-to-end avec Playwright
```

---

## Améliorations Potentielles

### Court Terme
1. **Cache** : Implémenter un cache pour les résultats de parsing Ollama
2. **Workers** : Utiliser des workers pour le traitement parallèle des PDF
3. **Sécurité** : Chiffrer les secrets sensibles (clés API, mots de passe)
4. **Monitoring** : Ajouter des métriques de performance (Prometheus, etc.)

### Long Terme
1. **Microservices** : Séparer les fonctionnalités en microservices (parsing, emails, etc.)
2. **Queue** : Utiliser une queue (Bull, RabbitMQ) pour les tâches asynchrones
3. **CI/CD** : Automatiser le déploiement avec GitHub Actions ou GitLab CI
4. **Documentation** : Générer une documentation API automatique (Swagger/OpenAPI)

---

## Conclusion

La codebase **ADTI** est une application full-stack mature avec une architecture bien structurée. Elle combine :
- Un **backend robuste** basé sur Parse Server et Express
- Un **frontend moderne** avec Nuxt 4 et Vue 3
- Des **intégrations externes** (Ollama, SFTP, SMTP, PostgreSQL)
- Des **workflows métiers** automatisés pour la gestion des impayés

Les principales forces du projet sont :
- **Modularité** : Séparation claire des responsabilités
- **Automatisation** : Tâches cron et cloud functions pour les processus métiers
- **Flexibilité** : Configuration via variables d'environnement
- **Technologies modernes** : Utilisation de frameworks à jour (Nuxt 4, Parse Server 9, etc.)

Les axes d'amélioration prioritaires concernent la **performance** (cache, workers) et la **sécurité** (chiffrement des secrets, HTTPS systématique).
