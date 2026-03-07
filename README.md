# Marki15 — Application de relances automatiques de factures impayées

## Vue d'ensemble

Application permettant de gérer et d'automatiser les relances d'impayés via des séquences d'emails personnalisées, avec gestion des contacts, des profils SMTP, et un moteur d'envoi planifié.

---

## Architecture générale

```
Nuxt 3 (front)
  → Parse JS SDK        ← lecture/écriture classique (impayés, contacts, séquences...)
  → /api/* (Express)    ← import DB externe, FTP, SMTP, cron

Express (back)
  ├── Parse Server       monté sur /parse (MongoDB)
  ├── Cloud Code         ./cloud/main.js
  └── Routes custom      /api/*
```

---

## Stack technique

### Frontend

| Technologie | Rôle |
|---|---|
| **Nuxt 3** | Framework Vue 3, file-based routing, server routes |
| **TypeScript** | Typage partagé front/back |
| **TailwindCSS** | Styles utilitaires |
| **Naive UI** | Bibliothèque de composants moderne pour Vue 3 (boutons, dialogues, alertes, etc.) |
| **Toast UI Editor** | Éditeur WYSIWYG/Markdown pour les templates d'emails |
| **FullCalendar** | Vue calendrier des relances (`@fullcalendar/vue3`) |
| **Pinia** | State management (session Parse, filtres actifs...) |
| **TanStack Query** | Fetching, cache et invalidation des données Parse |
| **Parse JS SDK** | Appels directs à Parse Server depuis les composants |

### Backend

| Technologie | Rôle |
|---|---|
| **Express + Node.js** | Serveur principal, routes custom |
| **Parse Server** | ORM / base de données, Auth, ACL, monté dans Express |
| **MongoDB** | Base de données sous-jacente de Parse |
| **Nodemailer** | Envoi des emails via profils SMTP |
| **basic-ftp** | Accès FTP pour les PDFs issus de la sync DB automatique |
| **pdf-parse** | Extraction du texte brut des PDFs uploadés |
| **Ollama API + Mistral** | Parsing structuré des PDFs → JSON (extraction des champs facture) |
| **node-cron** | Sync DB externe toutes les heures + envoi relances à 18h |
| **PM2** | Process manager (déploiement sans Docker) |

### Déploiement backend

```bash
# Démarrage
pm2 start server.js --name marki15

# Mise à jour cloud code ou routes
git pull && pm2 restart marki15
```

## Scripts de démarrage

Le projet inclut des scripts pour faciliter le démarrage et l'arrêt des serveurs :

### Démarrer les serveurs
```bash
./start.sh
```

Ce script :
- Vérifie que les ports sont disponibles
- Installe les dépendances si nécessaire
- Démarre le backend Parse Server (port 1555)
- Démarre le frontend Nuxt (port 5001)
- Surveille les processus

### Arrêter les serveurs
```bash
./stop.sh
```

Ce script arrête proprement tous les processus liés au projet.

## Développement frontend

Le frontend Nuxt utilise un proxy pour éviter les problèmes CORS en développement :

```bash
# Démarrage manuel (si nécessaire)
cd frontend && npm run dev

# Le proxy est configuré dans nuxt.config.ts pour rediriger /api vers http://localhost:1555
```

### Naive UI

Le projet utilise [Naive UI](https://www.naiveui.com/) comme bibliothèque de composants :

- **Installation** : Déjà configuré dans le projet
- **Documentation** : https://www.naiveui.com/
- **Composants disponibles** : Boutons, dialogues, alertes, cartes, tableaux, etc.
- **Intégration** : 
  - Plugin configuré dans `frontend/plugins/naive-ui.ts`
  - Providers configurés dans `frontend/app.vue` (message, dialog, notification)

#### Configuration requise

Pour utiliser les composants discrets (messages, dialogues, notifications), assurez-vous que les providers sont ajoutés dans `app.vue` :

```vue
<template>
  <n-message-provider>
    <n-dialog-provider>
      <n-notification-provider>
        <!-- Votre contenu ici -->
      </n-notification-provider>
    </n-dialog-provider>
  </n-message-provider>
</template>
```

Exemple d'utilisation :
```vue
<template>
  <n-button type="primary" @click="handleClick">
    Bouton Naive UI
  </n-button>
</template>

<script setup>
import { NButton } from 'naive-ui'
</script>
```

Aucun Docker requis. Parse Server est monté directement dans Express.

```js
const express = require('express')
const ParseServer = require('parse-server').ParseServer

const app = express()

const parseServer = new ParseServer({
  databaseURI: process.env.MONGODB_URI,
  appId: process.env.PARSE_APP_ID,
  masterKey: process.env.PARSE_MASTER_KEY,
  serverURL: 'http://localhost:1555/parse',
  cloud: './cloud/main.js'
})

app.use('/parse', parseServer)
app.use('/api/import', importRouter)
app.use('/api/smtp', smtpRouter)
app.use('/api/ftp', ftpRouter)

app.listen(1555)
```

---

## Schéma de données (Classes Parse)

### Contacts
```
id
nom
prenom
email          (nullable — écran dédié si manquant)
telephone
type           payeur | apporteur
type_personne  M (morale) | autre
source         db_externe | upload  — si db_externe : non modifiable dans l'app, sync depuis Analyse immo
created_at
```

### Impayés
```
id
source                  db_externe | upload

-- Pièce (facture)
nfacture                numéro de facture
date_piece              date de la pièce — retard = aujourd'hui - date_piece (en jours)
total_ht
total_ttc
reste_a_payer
facture_soldee          boolean
commentaire_piece
ref_piece
url_pdf                 FTP (sync auto) ou chemin local (upload manuel)
                        Format FTP : /ADN/Reporting/Gco/Piece/{year}/{month}/{ref_clean}/standard/{refpiece} (GCO PI FA).pdf
                        Exemple    : /ADN/Reporting/Gco/Piece/2026/janvier/FA260121_50319/standard/FA260121 50319 (GCO PI FA).pdf
                        Règles     : mois en français minuscules sans accents, espaces du refpiece remplacés par _

-- Dossier
id_dossier
numero_dossier          d.numero
reference               d.reference
reference_externe       d.referenceExterne
statut_dossier          s.intitule
commentaire_dossier
date_debut_mission      dateDebutMission (date d'intervention)
employe_intervention    prénom + nom de l'employé

-- Adresse du bien (construite depuis les champs séparés)
adresse_bien            concaténation : numVoie cptNumVoie typeVoie adresse cptAdresse
code_postal
ville
numero_lot
etage
entree
escalier
porte

-- Contacts liés (stockés à plat + pointeur vers Contacts)
payeur_id               → Contacts (type: payeur)
payeur_nom
payeur_email
payeur_telephone
payeur_type_personne    M | autre
payeur_type             Propriétaire | Apporteur d'affaire | Autre
payeur_contact_nom      contact si personne morale
payeur_contact_email

apporteur_id            → Contacts (type: apporteur, nullable)
apporteur_nom
apporteur_email
apporteur_telephone
apporteur_type_personne
apporteur_contact_nom
apporteur_contact_email

-- Autres interlocuteurs (stockés à plat, pas de classe Contact dédiée)
acquereur_nom / email / telephone
donneur_ordre_nom / email / telephone
locataire_entrant_nom / email / telephone
locataire_sortant_nom / email / telephone
notaire_nom / email / telephone
proprietaire_nom / email / telephone / type_personne
syndic_nom / email / telephone

-- Séquence
sequence_id             → Séquences (nullable)

-- Statut applicatif
statut                  impaye | paye | en_cours

created_at
updated_at
```

### SMTP_Profiles
```
id
nom
host
port
user
password       (chiffré)
from_email
from_name
signature_html
```

### Séquences
```
id
nom
smtp_profile_id  → SMTP_Profiles
lien_paiement    template string avec variables [[]]
created_at
```

### Templates  _(appartient à une Séquence)_
```
id
sequence_id    → Séquences
smtp_profile_id → SMTP_Profiles  (défini par email, pas par séquence)
ordre          position dans la séquence (1, 2, 3...)
delai_jours    nombre de jours après date_piece
destinataire   avec variables [[]] (ex: [[payeur_email]])
cc             avec variables [[]] (nullable)
objet          avec variables [[]]
corps          HTML/Markdown avec variables [[]]
```

### Relances  _(générées à l'activation d'une séquence ou créées manuellement)_
```
id
impayes_id     → Impayés
template_id    → Templates (nullable si relance manuelle)
sequence_id    → Séquences (nullable si relance manuelle)
date_envoi     date_piece + delai_jours (séquence) ou date choisie manuellement
statut         pending | sent | failed | cancelled
objet_resolu   variables déjà remplacées par les vraies valeurs
corps_resolu   variables déjà remplacées par les vraies valeurs
manuel         boolean — true si créée ou modifiée manuellement
created_at
```

### Règles_Attribution  _(attribution automatique de séquence)_
```
id
sequence_id    → Séquences
filtres        JSON — conditions incluantes/excluantes sur colonnes Impayés
created_at
```

---

## Chemin d'une requête type

### Lister les impayés (lecture classique)

```
Nuxt component
  → Parse JS SDK : new Parse.Query('Impayes').include('contact').find()
    → Parse Server (Express /parse)
      → MongoDB
        → retourne JSON au front
```

### Importer depuis une DB externe ou un fichier

```
Nuxt component
  → POST /api/import (Express)
    → connexion DB externe ou parsing CSV/Excel
    → création des objets Parse (Impayés + Contacts)
    → application des règles d'attribution automatique
    → retourne résumé au front
```

### Envoi des relances (cron 18h)

```
node-cron (18h quotidien)
  → récupère toutes les Relances avec date_envoi = aujourd'hui et statut = pending
  → pour chaque Relance :
      → vérifie que l'Impayé n'est pas réglé
      → si réglé : annule toutes les relances à venir (statut = cancelled)
      → si non réglé :
          → récupère le PDF depuis FTP (basic-ftp)
          → envoie l'email via Nodemailer (profil SMTP de la séquence)
          → met le statut à sent
```

---

## Pages et routes

### Authentification
```
/login                    Login par username + password
```

### Dashboard
```
/                         Métriques globales (montant total, relances du jour, taux recouvrement, contacts sans email)
```

### Import
```
/import                   Wizard 3 étapes (upload PDF uniquement)
                            1. Upload : drag & drop d'un PDF, plusieurs PDFs, ou un dossier de PDFs
                            2. Parsing : extraction automatique via Ollama/Mistral, correction manuelle possible
                            3. Validation : résumé, application des règles d'attribution, liens vers impayés sans séquence et contacts sans email
```

Note : la sync depuis la base de données externe est automatique (cron toutes les heures, invisible pour l'utilisateur).


### Impayés
```
/impayes                  Liste (vue unitaire / groupée par payeur / groupée par contact)
/impayes/[id]             Détail + historique complet des actions
```

### Contacts
```
/contacts                 Liste des contacts
/contacts/sans-email      Contacts sans email (montant total + nb factures associées)
```

### Séquences
```
/sequences                Liste des séquences
/sequences/[id]           Édition complète :
                            - Templates d'emails (Toast UI Editor)
                            - Profil SMTP associé
                            - Lien de paiement (drawer avec variables [[]])
                            - Génération IA (prompt global ou par email)
                            - Règles d'attribution automatique (filtres live en bas de page)
```

### Relances
```
/relances                 Vue calendrier ou tableau — modification objet/corps avant envoi
```

### Administration
```
/settings/smtp            Gestion des profils SMTP
/settings/users           Gestion des utilisateurs (admin only)
```

---

## Fonctionnalités principales

### Import des impayés
- **Sync automatique** : cron toutes les heures depuis la DB externe, PDFs stockés sur FTP
- **Upload manuel** : drag & drop de PDFs (un, plusieurs, ou dossier entier)
  - Extraction texte via `pdf-parse`
  - Parsing structuré via Ollama API (`https://ollama.com/api`) + modèle Mistral → JSON
  - PDFs stockés localement sur le serveur (`/storage/uploads/`)
- Identification et enregistrement automatique des contacts dans les deux cas
- Application des règles d'attribution automatique de séquence à la fin de chaque import

### Contacts sans email
- Écran dédié listant les contacts sans email
- Affiche le montant total et le nombre de factures associées

### Séquences d'emails
- Succession de templates avec délai en jours
- Édition via Toast UI Editor (WYSIWYG/Markdown)
- Variables disponibles dans `/static/configs/variables.json` avec syntaxe `[[ ]]`
- Lien de paiement construit dans un drawer avec variables `[[ ]]`
- Profil SMTP associé (avec signature HTML)
- Génération par IA : prompt à copier-coller dans ChatGPT, réponse JSON à coller pour synchroniser
- Génération par IA email par email : prompt contextuel avec les emails précédents

### Attribution des séquences
- Unitaire ou groupée depuis l'écran Impayés
- Automatique via règles (filtres incluants/excluants sur les colonnes Impayés)
- Les règles s'appliquent sur les impayés sans séquence, à la fin de chaque import

### Écran Impayés
- Vue unitaire
- Vue groupée par payeur
- Vue groupée par contact (impayés directs + apporteur d'affaire)
- Drawer de prévisualisation des PDFs (depuis FTP)
- Page détail `/impayes/[id]` : historique complet des actions

### Écran Relances
- Vue calendrier
- Vue tableau
- Modification de l'objet et du corps avant envoi

### Auth & Utilisateurs
- Login par **username** (pas d'email)
- Gestion d'équipe réservée aux users avec `admin = true`

### Dashboard
- Métriques clés : montant total impayé, relances du jour, taux de recouvrement, contacts sans email

---

## Variables templates

Les variables sont définies dans `/static/configs/variables.json` et utilisées avec la syntaxe `[[ nom_variable ]]` dans les objets et corps des templates, ainsi que dans le lien de paiement.

Elles correspondent aux colonnes de la classe **Impayés** (ex: `[[ numero_facture ]]`, `[[ montant ]]`, `[[ date_echeance ]]`, etc.) et aux colonnes de la classe **Contacts**.

---

## Variables d'environnement

```env
# MongoDB
MONGODB_URI=

# Parse
PARSE_APP_ID=
PARSE_MASTER_KEY=
PARSE_SERVER_URL=

# FTP (sync DB externe uniquement)
FTP_HOST=
FTP_USER=
FTP_PASSWORD=
FTP_BASE_PATH=

# Ollama (parsing PDF)
OLLAMA_API_URL=https://ollama.com/api
OLLAMA_MODEL=mistral

# Stockage local PDFs uploadés
UPLOAD_STORAGE_PATH=./storage/uploads

# App
PORT=1555
```

---

## Structure du projet (à définir)

```
/
├── frontend/          Nuxt 3
├── backend/
│   ├── cloud/
│   │   └── main.js    Parse Cloud Code
│   ├── routes/        Routes Express custom
│   ├── services/      smtp, ftp, import, cron
│   └── server.js      Point d'entrée Express + Parse Server
└── README.md
```
