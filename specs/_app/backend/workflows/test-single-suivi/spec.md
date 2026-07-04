# Workflow Backend: test-single-suivi

**Feature** : F-008 Suivi de relances email
**Type** : Backend (Cloud Function)
**Cloud Function** : `sendTestSingleSuivi`

## Description

Envoie un email de test unique pour le workflow de suivi de relances. Ce workflow permet de tester l'envoi d'un email de suivi à partir d'une séquence de type "suivi", en utilisant les données d'un payeur réel mais sans marquer la relance comme envoyée.

## Input

```javascript
{
  sequenceId: String,    // ID de la séquence de suivi
  testEmail: String,     // Email de destination pour le test
  payeurId: String,      // ID du payeur (Contact)
  emailIndex: Number,    // Index de l'email dans la séquence (défaut: 0)
  userId: String,        // ID de l'utilisateur (optionnel)
  userEmail: String,     // Email de l'utilisateur (optionnel)
  userName: String       // Nom de l'utilisateur (optionnel)
}
```

## Étapes

### Étape 1: Validation et Récupération

```javascript
// Validation des paramètres requis
if (!sequenceId || !testEmail || !payeurId) {
  throw new Error('Paramètres requis manquants: sequenceId, testEmail, payeurId')
}

// Récupérer la séquence de suivi
const Sequence = Parse.Object.extend('Sequence')
const sequence = await new Parse.Query(Sequence).get(sequenceId)

// Vérifier le type de séquence (optionnel, warning si pas 'suivi')
const typeSequence = sequence.get('type')
if (typeSequence !== 'suivi') {
  warn(`La séquence ${sequenceId} n'est pas de type 'suivi'`)
}

// Extraire l'email de suivi (premier email de la séquence)
const emails = sequence.get('emails') || []
const emailConfig = emails[emailIndex] || emails[0]

// Récupérer le Contact (payeur)
const Contact = Parse.Object.extend('Contact')
const contact = await new Parse.Query(Contact).get(payeurId)

// Construire l'objet contactData
const contactData = {
  objectId: contact.id,
  nom: contact.get('nom'),
  prenom: contact.get('prenom'),
  email: contact.get('email'),
  telephone: contact.get('telephone'),
  civilite: contact.get('civilite'),
  type_personne: contact.get('type_personne'),
  adresse: contact.get('adresse'),
}

// Récupérer les impayés non soldés du payeur
const Impaye = Parse.Object.extend('Impaye')
const impayeQuery = new Parse.Query(Impaye)
impayeQuery.equalTo('payeur', contact)
impayeQuery.equalTo('facture_soldee', false)
impayeQuery.greaterThan('reste_a_payer', 0)
impayeQuery.descending('date_piece')
impayeQuery.limit(1000)

const impayes = await impayeQuery.find()

// Construire payeurData avec les impayés
const payeurData = {
  ...contactData,
  impayesCount: impayes.length,
  impayesAmount: impayes.reduce((sum, i) => sum + (i.get('reste_a_payer') || 0), 0),
  impayes: impayes.map(i => i.toJSON())
}
```

**CHECKPOINT**: `test-single-suivi-validation`
```json
{
  "sequenceId": "seq_xxx",
  "sequenceName": "Suivi relances",
  "payeurId": "contact_xxx",
  "payeurName": "Dupont SARL",
  "impayesCount": 3,
  "impayesAmount": 5000.00
}
```

### Étape 2: Traitement du Template

```javascript
// Déterminer le scénario (single, multiple, both, broker)
const scenarios = emailConfig.scenarios || []
const scenarioType = emailConfig.activeScenario || 'single'

// Trouver le scénario actif
const scenarioActif = scenarios.find(
  s => s.format === scenarioType && s.active !== false
)

// Templates initiaux
let objetFinal = scenarioActif?.objet || emailConfig.objet || ''
let corpsFinal = scenarioActif?.corps || emailConfig.corps || ''

// Génération via Ollama si activé (USE_OLLAMA && OLLAMA_API_KEY)
if (USE_OLLAMA) {
  const prompt = buildPrompt(emailConfig, scenarioActif, payeurData.impayes, contactData, scenarioType)
  const generated = await generateContentWithRetry(prompt)
  objetFinal = generated.objet
  corpsFinal = generated.corps
}

// Remplacement des variables
const FRONTEND_URL = process.env.FRONTEND_URL

// [[lien_pdf]] - Lien vers le PDF de la première facture impayée
if (payeurData.impayes.length > 0) {
  const lienPdf = `${FRONTEND_URL}/redirect-pdf/${payeurData.impayes[0].objectId}`
  objetFinal = objetFinal.replace(/\[\[lien_pdf\]\]/g, lienPdf)
  corpsFinal = corpsFinal.replace(/\[\[lien_pdf\]\]/g, lienPdf)
}

// [[lien_espace]] - Lien vers l'espace client
const lienEspace = `${FRONTEND_URL}/redirect-espace/${payeurId}`
objetFinal = objetFinal.replace(/\[\[lien_espace\]\]/g, lienEspace)
corpsFinal = corpsFinal.replace(/\[\[lien_espace\]\]/g, lienEspace)

// Variables de contact
objetFinal = objetFinal
  .replace(/\[\[payeur_nom\]\]/g, payeurData.nom || '')
  .replace(/\[\[payeur_prenom\]\]/g, payeurData.prenom || '')
  .replace(/\[\[payeur_email\]\]/g, payeurData.email || '')

corpsFinal = corpsFinal
  .replace(/\[\[payeur_nom\]\]/g, payeurData.nom || '')
  .replace(/\[\[payeur_prenom\]\]/g, payeurData.prenom || '')
  .replace(/\[\[payeur_email\]\]/g, payeurData.email || '')
```

**CHECKPOINT**: `test-single-suivi-template`
```json
{
  "scenarioType": "single",
  "objetLength": 45,
  "corpsLength": 1200,
  "variablesReplaced": ["lien_pdf", "lien_espace", "payeur_nom"]
}
```

### Étape 3: Envoi de l'Email avec Signature

```javascript
// Déterminer le profil SMTP
let smtpId = null
if (scenarioActif && scenarioActif.smtp) {
  smtpId = scenarioActif.smtp
} else if (emailConfig.smtp) {
  smtpId = emailConfig.smtp
}

// Créer le transport SMTP
const transporter = await createSmtpTransport(smtpId)

// Récupérer les infos SMTP pour l'expéditeur
const SmtpProfile = Parse.Object.extend('SmtpProfile')
const smtpQuery = new Parse.Query(SmtpProfile)
const smtpProfile = await smtpQuery.get(smtpId)

const fromEmail = smtpProfile.get('email_from') || smtpProfile.get('username')

// Récupération de la signature HTML du profil SMTP
const signatureHtml = smtpProfile.get('signature_html') || null

// Ajouter la signature au corps si elle existe
if (signatureHtml && signatureHtml.trim()) {
  corpsFinal = corpsFinal + '<br><br>' + signatureHtml
  info(`✅ Signature trouvée et ajoutée (${signatureHtml.length} caractères)`)
} else {
  info('⚠️ Pas de signature trouvée pour le profil SMTP')
}

// Construire l'email
const fromName = userName ? `${userName} (Test Suivi)` : 'Test Suivi ADTI'
const mailOptions = {
  from: `"${fromName}" <${fromEmail}>`,
  to: testEmail,
  subject: `[TEST SUIVI] ${objetFinal}`,
  html: corpsFinal,
  headers: {
    'X-Test-Email': 'true',
    'X-Sequence-Id': sequenceId,
    'X-Sequence-Type': 'suivi',
    'X-User-Id': userId || 'system',
  },
}

// Envoyer l'email
const sendResult = await transporter.sendMail(mailOptions)
```

**CHECKPOINT**: `test-single-suivi-email-sent`
```json
{
  "messageId": "<message-id@domain.com>",
  "to": "test@example.com",
  "from": "sender@adti.com",
  "subject": "[TEST SUIVI] Votre relance...",
  "signatureAttached": true,
  "signatureLength": 450
}
```

## Output

```javascript
{
  success: true,
  emailSent: true,
  preview: {
    objet: "[TEST SUIVI] Votre relance concernant...",
    corps: "<html>...</html>",
    from: "sender@adti.com",
    to: "test@example.com",
    smtpProfile: "Profil SMTP Principal"
  },
  metadata: {
    sequenceId: "seq_xxx",
    emailIndex: 0,
    testEmail: "test@example.com",
    payeurId: "contact_xxx",
    userId: "user_xxx",
    userEmail: "user@example.com",
    sentAt: "2024-01-15T10:30:00.000Z",
    durationMs: 1250,
    messageId: "<message-id@domain.com>",
    impayesCount: 3,
    scenarioType: "single",
    sequenceType: "suivi"
  }
}
```

## Gestion des erreurs

**CHECKPOINT**: `test-single-suivi-failed`
```json
{
  "error": "Paramètres requis manquants: sequenceId",
  "stage": "validation"
}
```

**CHECKPOINT**: `test-single-suivi-smtp-failed`
```json
{
  "error": "SMTP connection failed",
  "smtpId": "smtp_xxx",
  "email": "test@example.com"
}
```

## Fonctions auxiliaires

### createSmtpTransport(smtpId)

```javascript
async function createSmtpTransport(smtpId) {
  const SmtpProfile = Parse.Object.extend('SmtpProfile')
  const smtpProfile = await new Parse.Query(SmtpProfile).get(smtpId)
  
  return nodemailer.createTransport({
    host: smtpProfile.get('host'),
    port: smtpProfile.get('port'),
    secure: smtpProfile.get('secure') || false,
    auth: {
      user: smtpProfile.get('username'),
      pass: smtpProfile.get('password'),
    },
  })
}
```

### buildPrompt(emailConfig, scenarioActif, impayes, contact, scenarioType)

```javascript
function buildPrompt(emailConfig, scenarioActif, impayes, contact, scenarioType) {
  const promptFile = '/home/ubuntu/prod/adti/configuration/prompts/suivi-email-prompt.txt'
  const fallbackFile = '/home/ubuntu/prod/adti/configuration/prompts/relance-email-prompt.txt'
  
  let promptTemplate
  try {
    promptTemplate = fs.readFileSync(promptFile, 'utf-8')
  } catch (e) {
    promptTemplate = fs.readFileSync(fallbackFile, 'utf-8')
  }
  
  const objetTemplate = scenarioActif?.objet || emailConfig.objet || ''
  const corpsTemplate = scenarioActif?.corps || emailConfig.corps || ''
  
  return promptTemplate
    .replace(/{{objetTemplate}}/g, objetTemplate)
    .replace(/{{corpsTemplate}}/g, corpsTemplate)
    .replace(/{{impayesJson}}/g, JSON.stringify(impayes))
    .replace(/{{historyJson}}/g, JSON.stringify([]))
    .replace(/{{contactJson}}/g, JSON.stringify(contact))
    .replace(/{{scenarioType}}/g, scenarioType)
}
```

### generateContentWithRetry(prompt, retries)

```javascript
async function generateContentWithRetry(prompt, retries = 0) {
  try {
    const response = await fetch(`${OLLAMA_API_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OLLAMA_API_KEY}`,
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        temperature: 0.1,
      }),
    })
    
    const data = await response.json()
    return parseLLMResponse(data.response)
  } catch (err) {
    if (retries < MAX_RETRIES) {
      return generateContentWithRetry(prompt, retries + 1)
    }
    throw err
  }
}
```

## Variables d'environnement

- `PARSE_APP_ID` : ID de l'application Parse
- `PARSE_JAVASCRIPT_KEY` : Clé JavaScript Parse
- `PARSE_MASTER_KEY` : Clé Master Parse
- `PARSE_SERVER_URL` : URL du serveur Parse
- `FRONTEND_URL` : URL du frontend (ex: https://adti.markidiags.com)
- `OLLAMA_API_URL` : URL de l'API Ollama (optionnel)
- `OLLAMA_API_KEY` : Clé API Ollama (optionnel)
- `OLLAMA_MODEL` : Modèle Ollama (défaut: mistral-large-3:675b-cloud)
- `USE_OLLAMA` : Activer/désactiver Ollama (défaut: true si OLLAMA_API_KEY présent)

## Signature Email

Le workflow récupère la signature HTML depuis le profil SMTP (`signature_html`) et l'ajoute automatiquement à la fin du corps de l'email. La signature n'est ajoutée que si :
- Le champ `signature_html` existe et n'est pas vide
- Le contenu de la signature n'est pas vide après trim()

La signature est insérée avec deux sauts de ligne HTML (`<br><br>`) avant :
```javascript
corpsFinal = corpsFinal + '<br><br>' + signatureHtml
```