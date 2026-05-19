# Fonctionnement du Test de Séquence - Backend

## Table des matières
1. [Données entrantes](#données-entrantes)
2. [Point d'entrée](#point-dentrée)
3. [Processus de traitement](#processus-de-traitement)
4. [Préparation des données](#préparation-des-données)
5. [Génération et envoi des emails](#génération-et-envoi-des-emails)
6. [Résultat](#résultat)
7. [Flux de données](#flux-de-données)
8. [Dépendances](#dépendances)

---

## Données entrantes

La Cloud Function `sendSequenceTest` reçoit les paramètres suivants via `request.params` :

| Paramètre | Type | Obligatoire | Description |
|----------|------|-------------|-------------|
| `sequenceId` | String | ✅ Oui | Identifiant unique de la séquence à tester |
| `testEmail` | String | ✅ Oui | Adresse email du destinataire pour le test |
| `payeurId` | String | ✅ Oui | Identifiant du payeur (Contact) en base de données |
| `payeurData` | Object | ❌ Non | Données du payeur (optionnel, utilisé si fourni) |
| `emails` | Array | ❌ Non | Liste des emails à envoyer (optionnel, sinon récupéré depuis la séquence) |

### Exemple de requête
```javascript
{
  "sequenceId": "zgPKAlVH65",
  "testEmail": "oswald.bernard@gmail.com",
  "payeurId": "P3OeWHUHp5",
  "payeurData": {
    "value": "P3OeWHUHp5",
    "nom": "SNEXI",
    "email": "jbarthe@snexi.fr",
    "impayesCount": 1,
    "impayesAmount": 2144.94
  },
  "emails": [...] // Optionnel
}
```

---

## Point d'entrée

**Fichier** : `backend/cloud/workflows/send-sequence-test/00-master.js`

```javascript
// Enregistrement de la Cloud Function Parse
Parse.Cloud.define('sendSequenceTest', sendSequenceTest);
```

La fonction est accessible via l'API Parse Server avec le nom `sendSequenceTest`.

---

## Processus de traitement

### Étapes principales (Fichier: `01-sendSequenceTest.js`)

```
1. Validation des paramètres
   ↓
2. Récupération de la séquence
   ↓
3. Récupération des emails de la séquence
   ↓
4. Récupération du payeur
   ↓
5. Récupération des impayés du payeur
   ↓
6. Appel à envoyerEmailsDeTest()
   ↓
7. Retour du résultat
```

### Détail des étapes

#### 1. Validation des paramètres
```javascript
if (!sequenceId || !testEmail || !payeurId) {
  throw new Error("Paramètres manquants: sequenceId, testEmail et payeurId sont requis");
}
```

#### 2. Récupération de la séquence
```javascript
const Sequence = Parse.Object.extend("Sequence");
const query = new Parse.Query(Sequence);
const sequence = await query.get(sequenceId);
```

#### 3. Récupération des emails de la séquence
```javascript
let emails = request.params.emails;
if (!emails || emails.length === 0) {
  emails = sequence.get("emails") || [];
}
```

Chaque email contient :
- `_key` : Identifiant unique
- `email_index` : Position dans la séquence (1, 2, 3...)
- `delai` : Délai en jours avant envoi
- `smtp` : ID du serveur SMTP à utiliser
- `to` : Destinataire (template avec variables)
- `cc` : Copie carbone
- `activeScenario` : Scénario actif par défaut
- `scenarios` : Array de scénarios (single, multiple, broker, both)

#### 4. Récupération du payeur
```javascript
const Contact = Parse.Object.extend("Contact");
const payeurQuery = new Parse.Query(Contact);
const payeur = await payeurQuery.get(payeurId);
```

#### 5. Récupération des impayés
```javascript
const Impaye = Parse.Object.extend("Impaye");
const impayeQuery = new Parse.Query(Impaye);
impayeQuery.equalTo("payeur", payeur);
impayeQuery.equalTo("facture_soldee", false);
impayeQuery.limit(100);
const impayes = await impayeQuery.find({ useMasterKey: true });
```

**Priorité** :
1. D'abord, récupère les impayés **non soldés**
2. Si aucun, récupère **tous les impayés** du payeur
3. Si toujours aucun → Erreur

---

## Préparation des données

### Fonction `prepareImpayeData()`

Convertit un objet Parse `Impaye` + `Contact` en objet simple pour Ollama.

**Données fusionnées** :
```javascript
{
  // Depuis l'impayé
  nfacture: "FACT-2024-001",
  ref_piece: "REF-001",
  date_piece: "2024-01-15",
  date_echeance: "2024-02-15",
  reste_a_payer: 2144.94,
  montant_total: 2144.94,
  adresse_bien: "40 avenue des Diables Bleus",
  code_postal: "06300",
  ville: "Nice",
  numero_dossier: "DOS-001",
  
  // Depuis le payeur
  payeur_nom: "SNEXI",
  payeur_email: "jbarthe@snexi.fr",
  payeur_telephone: "+33 1 23 45 67 89",
  payeur_type: "societe",
  payeur_adresse: "...",
  societe: "SNEXI",
  
  // Objet contact
  contact_relance: {
    nom: "SNEXI",
    email: "jbarthe@snexi.fr",
    telephone: "+33 1 23 45 67 89"
  }
}
```

### Fonction `prepareMultipleImpayeData()`

Pour les cas où plusieurs impayés existent pour le même payeur :

```javascript
{
  // Données consolidées
  nfacture: "FACT-001, FACT-002, FACT-003",
  reste_a_payer: 6434.82,  // Somme de tous les impayés
  montant_total: 6434.82,
  nfactures_liste: [
    { nfacture: "FACT-001", montant_total: 2144.94, ... },
    { nfacture: "FACT-002", montant_total: 2144.94, ... },
    { nfacture: "FACT-003", montant_total: 2144.94, ... }
  ],
  multiple: true,
  count_impayes: 3,
  // ... autres champs du payeur
}
```

---

## Génération et envoi des emails

### Fonction `envoyerEmailsDeTest()`

**Processus pour chaque email de la séquence** :

```
Pour chaque email dans emails[]:
    ↓
    1. Déterminer le scénario à utiliser
       - Si email.activeScenario existe → l'utiliser
       - Sinon, si plusieurs impayés → "multiple"
       - Sinon → "single"
    ↓
    2. Trouver le scénario correspondant dans email.scenarios[]
       - Chercher par format (single, multiple, both, broker)
       - Si non trouvé, essayer de trouver un scénario actif
    ↓
    3. Préparer les données de l'impayé
       - Utiliser prepareImpayeData() ou prepareMultipleImpayeData()
    ↓
    4. Générer l'email via Ollama (appel direct à l'API)
       - Appel à buildPrompt() et generateEmailContent()
       - Appel direct à l'API Ollama (identique à 02-generateRelances.js)
    ↓
    5. Envoyer l'email
       - Via sendEmailViaSmtp() si smtpId existe
       - Via sendEmail() sinon
    ↓
    6. Attendre 1 seconde (délai anti-spam)
```

### Génération via Ollama (appel direct à l'API)

**Fonctions** : `buildPrompt()` et `generateEmailContent()` dans `01-sendSequenceTest.js`

Identique à `02-generateRelances.js` :

1. **Construire le prompt** (`buildPrompt`)
   ```
   Tu es un redacteur de relances d'impayés par email.
   Ta mission consiste à générer l'objet et le corps de l'email
   à partir d'un template, des informations des impayés et de l'historique.
   
   Tu ne fais que remplacer les variables.
   Tu ne changes pas les textes.
   
   Règles:
   + Si tu vois du markdown tu le convertis en html surtout pour les liens.
   + Pour le payeur_nom si celui-ci n'est pas une personne alors tu mets vide.
   + Pas de virgule avec un espace avant
   + Si tu mets un tableau alors il faut un border sur tous les td.
   + Si la date d'échéance est arrivée avant alors il faut accorder les temps.
   + Si l'email dit que l'on applique les taux de pénalités alors rajouter 40€ au montant TTC.
   
   Informations:
   + objet: "{{scenario.objet}}"
   + corps: "{{scenario.corps}}"
   + impayés: [JSON des impayés]
   + historique: [JSON de l'historique]
   + email_index: {{emailIndex}}
   ```

2. **Appeler l'API Ollama** (`generateEmailContent`)
   - URL: `${OLLAMA_API_URL}/generate`
   - Méthode: POST
   - Headers: Authorization Bearer token
   - Body: { model, prompt, stream: false, format: "json", options }

3. **Parser la réponse JSON** :
   ```javascript
   {
     objet: "Rappel - Facture FACT-2024-001 en attente",
     corps: "<p>Bonjour SNEXI, votre facture...</p>"
   }
   ```

> **Note** : Le workflow utilise un appel **direct à l'API Ollama**, identique à `02-generateRelances.js`.

### Envoi de l'email

L'envoi est géré par **02-sendEmails.js** (intégré au workflow) :

**1. Via SMTP personnalisé** (`sendEmailViaSmtp`) :
```javascript
await sendEmailViaSmtp({
  smtpId: "YPsNANpWhC",
  to: testEmail,
  subject: objet,
  html: corps,
  text: corps.replace(/<[^>]*>/g, "")
});
```

**2. Via méthode par défaut** (`sendEmail`) :
```javascript
await sendEmail({
  to: testEmail,
  subject: objet,
  html: corps,
  text: corps.replace(/<[^>]*>/g, "")
});
```

---

## Résultat

### Objet retourné

```javascript
{
  success: true,
  sentEmails: 9,           // Nombre d'emails envoyés
  totalEmails: 9,         // Nombre total d'emails dans la séquence
  message: "9 emails de test envoyés à oswald.bernard@gmail.com",
  impayesCount: 1,        // Nombre d'impayés utilisés
  usingMultipleFormat: false  // Indique si format multiple utilisé
}
```

### Logging

Les logs sont écrits dans :
- `backend/cloud/workflows/send-sequence-test/logs/send-sequence-test.log`

Format :
```
[2026-04-24T09:04:57.976Z] SUCCESS: 9/9 emails envoyés à oswald.bernard@gmail.com (1234ms)
```

---

## Flux de données

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          sendSequenceTest()                               │
├─────────────────────────────────────────────────────────────────────────┤
│  REQUEST PARAMS:                                                          │
│  ├─ sequenceId: "zgPKAlVH65"                                             │
│  ├─ testEmail: "oswald.bernard@gmail.com"                               │
│  └─ payeurId: "P3OeWHUHp5"                                               │
└─────────────────────────┬──────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  1. RÉCUPÉRATION DONNÉES                                                  │
│  ├─ Sequence (emails[])                                                  │
│  ├─ Contact (payeur)                                                     │
│  └─ Impaye[] (non soldés, limit 100)                                    │
└─────────────────────────┬──────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  2. PRÉPARATION DONNÉES (pour chaque email)                              │
│  ├─ prepareImpayeData() ou prepareMultipleImpayeData()                   │
│  └─ Conversion Parse.Object → Objet JavaScript simple                     │
└─────────────────────────┬──────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  3. GÉNÉRATION EMAIL (pour chaque email)                                  │
│  ├─ Détermination du scénario (single/multiple/both/broker)              │
│  ├─ Appel à generator.generateFromTemplate()                             │
│  │  ├─ Construction du prompt                                             │
│  │  ├─ Appel à Ollama Cloud                                                │
│  │  └─ Remplacement des variables <%= variable %>                         │
│  └─ Retour: { object, body, destinataire }                               │
└─────────────────────────┬──────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  4. ENVOI EMAIL (pour chaque email)                                       │
│  ├─ sendEmailViaSmtp() si smtpId existe                                   │
│  └─ sendEmail() sinon                                                      │
│  └─ Délai: 1 seconde entre chaque email                                    │
└─────────────────────────┬──────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  5. RETOUR RÉSULTAT                                                       │
│  └─ { success, sentEmails, totalEmails, message, impayesCount, ... }      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Dépendances

### Fichiers internes

| Fichier | Rôle |
|--------|------|
| `00-master.js` | Point d'entrée - Registration Parse Cloud Function |
| `01-sendSequenceTest.js` | Étape 1 - Génération du contenu via Ollama |
| `02-sendEmails.js` | Étape 2 - Fonctions d'envoi email (intégrées) |

### Cloud Functions appelées

| Fonction | Description |
|----------|-------------|
| `sendEmail` | Envoi email via méthode par défaut (02-sendEmails.js) |
| `sendEmailViaSmtp` | Envoi email via serveur SMTP configuré (02-sendEmails.js) |

### Classes Parse Server

| Classe | Description |
|--------|-------------|
| `Sequence` | Contient les emails de la séquence |
| `Contact` | Informations du payeur |
| `Impaye` | Factures impayées |

### Services externes

| Service | Rôle |
|---------|------|
| **Ollama API** | Génération de contenu par IA (remplacement de variables dans les templates) |
| **SMTP** | Serveurs d'envoi d'emails configurés |

### Variables d'environnement

| Variable | Valeur par défaut | Description |
|----------|------------------|-------------|
| `OLLAMA_API_URL` | `https://ollama.com/api` | URL de l'API Ollama |
| `OLLAMA_API_KEY` | - | Clé API Ollama (requise) |
| `OLLAMA_MODEL` | `mistral` | Modèle à utiliser |
| `USE_OLLAMA` | `true` | Activer/désactiver Ollama |

---

## Variables de template supportées

Les templates d'email dans la séquence utilisent des variables qui seront remplacées par Ollama.
Les données des impayés sont passées en JSON dans le prompt.

### Données disponibles pour Ollama

```javascript
// Informations sur les impayés (JSON)
{
  "payeur_nom": "SNEXI",
  "payeur_email": "contact@snexi.fr",
  "payeur_telephone": "0123456789",
  "societe": "SNEXI",
  "nfacture": "FACT-2024-001",
  "ref_piece": "REF-001",
  "date_piece": "2024-01-15T00:00:00.000Z",
  "date_echeance": "2024-02-15T00:00:00.000Z",
  "reste_a_payer": 2144.94,
  "montant_total": 2144.94,
  "adresse_bien": "123 Rue de Paris, 75000 Paris",
  "code_postal": "75000",
  "ville": "Paris",
  "numero_dossier": "DOSS-2024-001"
}

// Pour les impayés multiples
{
  "multiple": true,
  "count_impayes": 3,
  "nfacture": "FACT-001, FACT-002, FACT-003",
  "reste_a_payer": 6434.82,
  "nfactures_liste": [...]
}

// Informations supplémentaires
{
  "email_index": 0,
  "contact": { "nom": "...", "email": "..." }
}
```

> **Note** : Ollama reçoit toutes ces données en JSON et doit générer un objet JSON avec `{ "objet": "...", "corps": "..." }`.
<%= proprietaire_telephone %> // Téléphone
```

### Variables pour format multiple

```javascript
<%= nfactures_liste %>    // Array complet des factures
// Dans les boucles:
<%= facture.nfacture %>   // Numéro de facture (dans foreach)
<%= facture.date_echeance %> // Date d'échéance (dans foreach)
<%= facture.montant_total %> // Montant (dans foreach)
```

### Filtres disponibles

```javascript
<%= filters.date(date_echeance, "DD/MM/YYYY") %>  // Formatage de date
```

---

## Exemple complet

### Requête entrée
```javascript
{
  "sequenceId": "zgPKAlVH65",
  "testEmail": "oswald.bernard@gmail.com",
  "payeurId": "P3OeWHUHp5"
}
```

### Processus
1. Récupère la séquence `zgPKAlVH65` avec 9 emails
2. Récupère le payeur `P3OeWHUHp5` (SNEXI)
3. Récupère 1 impayé non soldé pour ce payeur
4. Pour chaque email de la séquence :
   - Détermine le scénario (ex: "single")
   - Remplace les variables dans le template
   - Envoie à `oswald.bernard@gmail.com`
5. Retourne: `{ success: true, sentEmails: 9, totalEmails: 9, ... }`

### Logs générés
```
[2026-04-24T09:04:57.976Z] SUCCESS: 9/9 emails envoyés à oswald.bernard@gmail.com (1234ms)
```
