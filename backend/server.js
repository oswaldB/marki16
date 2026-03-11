// backend/server.js
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const ParseServer = require('parse-server').ParseServer;
const ParseDashboard = require('parse-dashboard');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');

const cron = require('node-cron');
const syncImpayes = require('./cloud/jobs/syncImpayes');
const optimizeRelances = require('./cloud/jobs/optimizeRelances');

const app = express();
const PORT = process.env.PORT || 1555;

// Configuration CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Parse-Application-Id',
    'X-Parse-Javascript-Key',
    'X-Parse-REST-API-Key',
    'X-Parse-Session-Token',
    'X-Parse-Master-Key',
  ],
}));

// Configuration Parse Server
const parseServer = new ParseServer({
  databaseURI: process.env.MONGODB_URI || 'mongodb://dev.api.markidiags.com:27017/marki15',
  appId: process.env.PARSE_APP_ID || 'marki15-app-id',
  masterKey: process.env.PARSE_MASTER_KEY || 'marki15-master-key',
  javascriptKey: process.env.PARSE_JAVASCRIPT_KEY || '',
  serverURL: process.env.PARSE_SERVER_URL || 'http://127.0.0.1:1555/parse',
  cloud: path.resolve(__dirname, 'cloud/main.js'),
});

// Configuration Parse Dashboard
const dashboardConfig = {
  apps: [
    {
      serverURL: process.env.PARSE_SERVER_URL || 'http://127.0.0.1:1555/parse',
      appId: process.env.PARSE_APP_ID || 'marki15-app-id',
      masterKey: process.env.PARSE_MASTER_KEY || 'marki15-master-key',
      appName: 'Marki16 Parse Dashboard',
      production: false
    }
  ],
  users: [
    {
      user: process.env.PARSE_DASHBOARD_USER || 'admin',
      pass: process.env.PARSE_DASHBOARD_PASSWORD || 'admin'
    }
  ],
  useEncryptedPasswords: false
};

const parseDashboard = new ParseDashboard(dashboardConfig, { allowInsecureHTTP: true });

// Middleware pour Parse Dashboard
app.use('/parse-dashboard', parseDashboard);

// Endpoint health personnalisé
app.get('/healthy', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    parseServer: 'running'
  });
});

// Route de base
app.get('/', (req, res) => {
  res.send('Marki Backend - Hello World');
});

// Endpoint temporaire pour déclencher la mise à jour des options dynamiques
// À supprimer après la première exécution
app.get('/trigger-update-dynamic-options', async (req, res) => {
  try {
    console.log('[API] Déclenchement manuel de updateDynamicOptions...');
    const updateDynamicOptions = require('./cloud/jobs/updateDynamicOptions');
    await updateDynamicOptions();
    console.log('[API] Options dynamiques mises à jour avec succès');
    res.json({ success: true, message: 'Options dynamiques mises à jour' });
  } catch (error) {
    console.error('[API] Erreur mise à jour options dynamiques:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint pour déclencher manuellement l'optimisation des relances
app.get('/trigger-optimize-relances', async (req, res) => {
  try {
    console.log('[API] Déclenchement manuel de optimizeRelances...');
    const optimizeRelances = require('./cloud/jobs/optimizeRelances');
    const result = await optimizeRelances();
    console.log('[API] Optimisation des relances terminée:', result);
    res.json({ success: true, result });
  } catch (error) {
    console.error('[API] Erreur optimisation relances:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Proxy endpoint for testing cloud functions
app.get('/api/test-cloud-hello', async (req, res) => {
  try {
    const response = await fetch('http://localhost:1555/parse/functions/hello', {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': process.env.PARSE_APP_ID || 'marki15-app',
        'X-Parse-Master-Key': process.env.PARSE_MASTER_KEY || 'e2f4e4e89056af61dd95a71226fa0e51917313e09b68aca8bf434e5eb9bd8aa9',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error calling cloud function:', error);
    res.status(500).json({ error: 'Failed to call cloud function' });
  }
});

// ─── Import PDF routes ───────────────────────────────────────────────────────

const UPLOAD_PATH = process.env.UPLOAD_STORAGE_PATH || path.join(__dirname, '../storage/uploads');
if (!fs.existsSync(UPLOAD_PATH)) fs.mkdirSync(UPLOAD_PATH, { recursive: true });

const multerStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_PATH),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '-' + file.originalname);
  },
});
const upload = multer({
  storage: multerStorage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Seuls les fichiers PDF sont acceptés'));
  },
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB par fichier
});

// Étape 1 : upload + extraction texte
app.post('/import/upload', upload.array('files', 50), async (req, res) => {
  try {
    const results = await Promise.all((req.files || []).map(async (file) => {
      const buffer = fs.readFileSync(file.path);
      let text = '';
      let pages = 0;
      try {
        const data = await pdfParse(buffer);
        text = data.text;
        pages = data.numpages;
      } catch {
        text = '';
      }
      return {
        id: file.filename,
        originalName: file.originalname,
        storedPath: file.path,
        pages,
        text,
      };
    }));
    res.json({ files: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Étape 2 : parsing Ollama/Mistral
app.post('/import/parse', express.json({ limit: '10mb' }), async (req, res) => {
  const { files } = req.body;
  if (!Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: 'Aucun fichier' });
  }

  const ollamaUrl = (process.env.OLLAMA_API_URL || 'https://dev.api.markidiags.com:11434').replace(/\/$/, '');
  const model = process.env.OLLAMA_MODEL || 'mistral';

  const results = await Promise.all(files.map(async (file) => {
    try {
      const prompt = buildParsePrompt(file.text);
      const ollamaHeaders = { 'Content-Type': 'application/json' };
      if (process.env.OLLAMA_API_KEY) ollamaHeaders['Authorization'] = `Bearer ${process.env.OLLAMA_API_KEY}`;
      const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: ollamaHeaders,
        body: JSON.stringify({ model, prompt, stream: false, format: 'json' }),
        signal: AbortSignal.timeout(120_000),
      });
      if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);
      const data = await response.json();
      let parsed = {};
      try { parsed = JSON.parse(data.response); } catch { parsed = {}; }
      return { id: file.id, originalName: file.originalName, storedPath: file.storedPath, parsed };
    } catch (err) {
      return { id: file.id, originalName: file.originalName, storedPath: file.storedPath, parsed: {}, parseError: err.message };
    }
  }));

  res.json({ results });
});

function buildParsePrompt(text) {
  const excerpt = (text || '').substring(0, 4000);
  return `Tu es un assistant spécialisé dans l'extraction de données de factures immobilières françaises.
Extrait les informations suivantes du texte ci-dessous et retourne UNIQUEMENT un objet JSON valide.

Champs attendus :
- nfacture : numéro de facture (string)
- ndossier : numéro de dossier (string)
- ref_piece : référence complète de la pièce, ex "FA260121 50319" — utilisée pour construire l'URL du PDF (string)
- montant_ht : montant HT en euros sans symbole (number)
- montant_ttc : montant TTC en euros sans symbole (number)
- reste_a_payer : reste à payer en euros sans symbole (number)
- date_piece : date pièce au format YYYY-MM-DD (string)
- date_intervention : date intervention au format YYYY-MM-DD (string)
- adresse : adresse complète du bien (string)
- lot : numéro de lot (string)
- etage : étage (string)
- porte : numéro de porte (string)
- payeur_nom : nom complet du payeur (string)
- payeur_email : email du payeur (string)
- payeur_telephone : téléphone du payeur (string)
- payeur_type : type de contact parmi Propriétaire, Locataire sortant, Locataire entrant, Apporteur (string)
- employe : nom du gestionnaire/employé (string)
- commentaire : commentaire éventuel (string)

Si une information est absente, utilise null.

Texte de la facture :
${excerpt}`;
}

// ─── Fin import routes ────────────────────────────────────────────────────────

// ─── Proxy PDF via SFTP ───────────────────────────────────────────────────────

const SftpClient = require('ssh2-sftp-client');

app.get('/pdf/:impayelId', async (req, res) => {
  const { impayelId } = req.params;

  // Récupérer l'impayé depuis Parse
  let impaye;
  try {
    const Impaye = Parse.Object.extend('Impaye');
    const q = new Parse.Query(Impaye);
    impaye = await q.get(impayelId, { useMasterKey: true });
  } catch {
    return res.status(404).json({ error: 'Impayé introuvable' });
  }

  const source = impaye.get('source');

  // ── PDF local (upload manuel) ──────────────────────────────────────────────
  if (source === 'upload') {
    const localPath = impaye.get('pdf_local_path');
    if (!localPath) return res.status(404).json({ error: 'Chemin PDF local non renseigné' });

    // Sécurité : vérifier que le fichier est bien dans UPLOAD_PATH
    if (!localPath.startsWith(UPLOAD_PATH)) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    if (!fs.existsSync(localPath)) {
      return res.status(404).json({ error: 'Fichier PDF introuvable sur le serveur' });
    }

    const filename = path.basename(localPath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
    return res.sendFile(localPath);
  }

  // ── PDF SFTP (sync db_externe) ─────────────────────────────────────────────
  const urlPdf = impaye.get('url_pdf');
  if (!urlPdf) return res.status(404).json({ error: 'Aucun PDF associé à cet impayé' });

  const sftp = new SftpClient();
  try {
    await sftp.connect({
      host:     process.env.FTP_HOST,
      port:     parseInt(process.env.FTP_PORT || '2222', 10),
      username: process.env.FTP_USERNAME,
      password: process.env.FTP_PASSWORD,
    });

    const stream = await sftp.createReadStream(urlPdf);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(urlPdf.split('/').pop())}"`);
    stream.pipe(res);
    stream.on('end', () => sftp.end());
    stream.on('error', (err) => {
      console.error('[pdf-proxy] Stream error:', err.message);
      sftp.end();
      if (!res.headersSent) res.status(500).json({ error: 'Erreur lecture PDF' });
    });
  } catch (err) {
    console.error('[pdf-proxy] SFTP error:', err.message);
    sftp.end().catch(() => {});
    res.status(500).json({ error: 'Erreur connexion SFTP' });
  }
});

// ─── Fin proxy PDF ────────────────────────────────────────────────────────────

// ─── Test SMTP ────────────────────────────────────────────────────────────────

app.post('/smtp/test', express.json(), async (req, res) => {
  const { host, port, username, password } = req.body;
  if (!host || !username || !password) {
    return res.status(400).json({ ok: false, error: 'Champs manquants (host, username, password requis)' });
  }
  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port) || 587,
      secure: parseInt(port) === 465,
      auth: { user: username, pass: password },
    });
    await transporter.verify();
    res.json({ ok: true });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// ─── Démarrage async : Parse Server v7+ requiert start() avant montage
(async () => {
  await parseServer.start();
  app.use('/parse', parseServer.app);
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Parse Server available at https://dev.api.markidiags.com:8444/parse`);
    console.log(`Parse Dashboard available at http://localhost:${PORT}/parse-dashboard`);
    console.log(`Health check available at http://localhost:${PORT}/healthy`);

    // Cron horaire : sync impayés + contacts depuis la DB externe
    cron.schedule('0 * * * *', async () => {
      console.log('[cron] Démarrage sync impayés...');
      const stats = await syncImpayes({ trigger: 'cron' });
      console.log(`[cron] Sync terminée:`, stats);
    });
    console.log('[cron] Scheduler sync impayés actif (toutes les heures)');

    // Cron quotidien 18h : envoi des relances dues
    cron.schedule('0 18 * * *', async () => {
      console.log('[cron] Démarrage envoi relances...');
      try {
        const result = await Parse.Cloud.run('envoyerRelances', {}, { useMasterKey: true });
        console.log('[cron] Envoi relances terminé :', result);
      } catch (err) {
        console.error('[cron] Erreur envoi relances :', err.message);
      }
    });
    console.log('[cron] Scheduler envoi relances actif (tous les jours à 18h)');

    // Cron toutes les minutes : optimisation des relances (anti-spam)
    cron.schedule('* * * * *', async () => {
      console.log('[cron] Optimisation des relances (anti-spam)...');
      console.log('[cron] Heure actuelle:', new Date().toISOString());
      try {
        const result = await optimizeRelances();
        console.log('[cron] Optimisation terminée:', result);
      } catch (err) {
        console.error('[cron] Erreur optimisation relances:', err.message);
        console.error('[cron] Stack trace:', err.stack);
      }
    });
    console.log('[cron] Scheduler optimisation relances actif (toutes les minutes)');

    // Cron horaire : mise à jour des options dynamiques (à HH:03)
    cron.schedule('3 * * * *', async () => {
      console.log('[cron] Mise à jour des options dynamiques...');
      try {
        // Appeler la Cloud Function directement
        const result = await Parse.Cloud.run('updateDynamicOptions', {}, { useMasterKey: true });
        console.log('[cron] Options dynamiques mises à jour avec succès:', result.message);
      } catch (error) {
        console.error('[cron] Erreur mise à jour options dynamiques:', error);
      }
    });
    console.log('[cron] Scheduler options dynamiques actif (toutes les heures à HH:03)');
  });
})();