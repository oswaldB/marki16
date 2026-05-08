// backend/cloud/workflows/send-email/01-sendEmail.js
// Fonctions d'envoi d'email (simple et via SMTP)

const nodemailer = require('nodemailer');

// Initialiser Parse si ce n'est pas déjà fait
if (typeof Parse === 'undefined') {
  const Parse = require('parse/node');
  Parse.initialize(
    process.env.PARSE_APP_ID || 'marki15-app',
    process.env.PARSE_JAVASCRIPT_KEY || '',
    process.env.PARSE_MASTER_KEY || 'e2f4e4e89056af61dd95a71226fa0e51917313e09b68aca8bf434e5eb9bd8aa9'
  );
  Parse.serverURL = process.env.PARSE_SERVER_URL || 'http://localhost:1555/parse';
  Parse.Cloud.useMasterKey();
  global.Parse = Parse;
}

/**
 * Envoie un email simple
 * @param {Object} request - Requête Parse Cloud
 * @returns {Promise<Object>} Résultat
 */
async function sendEmail(request) {
  const { to, subject, html, text } = request.params;

  if (!to || !subject) {
    throw new Error('Paramètres manquants: to et subject sont requis');
  }

  try {
    // Utiliser le transporteur SMTP par défaut ou configuration globale
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASSWORD || ''
      },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production'
      }
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || '"Marki15" <noreply@marki15.com>',
      to: to,
      subject: subject,
      html: html || '',
      text: text || html?.replace(/<[^>]*>/g, '') || ''
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`[sendEmail] Email envoyé à ${to}: ${info.messageId}`);
    
    return {
      success: true,
      message: 'Email envoyé avec succès',
      messageId: info.messageId
    };
  } catch (error) {
    console.error(`[sendEmail] Erreur envoi à ${to}:`, error.message);
    throw new Error(`Erreur envoi email: ${error.message}`);
  }
}

/**
 * Envoie un email via un profil SMTP configuré
 * @param {Object} request - Requête Parse Cloud
 * @returns {Promise<Object>} Résultat
 */
async function sendEmailViaSmtp(request) {
  const { smtpId, to, subject, html, text } = request.params;

  if (!smtpId || !to || !subject) {
    throw new Error('Paramètres manquants: smtpId, to et subject sont requis');
  }

  try {
    // Récupérer le profil SMTP depuis Parse
    const SmtpProfile = Parse.Object.extend('SmtpProfile');
    const query = new Parse.Query(SmtpProfile);
    
    let smtpProfile;
    try {
      smtpProfile = await query.get(smtpId, { useMasterKey: true });
    } catch (fetchError) {
      // Profil SMTP introuvable, tombe en arrière sur sendEmail
      console.warn(`[sendEmailViaSmtp] Profil SMTP ${smtpId} introuvable, utilisation de l'envoi standard`);
      return sendEmail(request);
    }

    // Récupérer la configuration - noms de champs dans Parse : host, port, username, password, email_from
    const smtpConfig = await smtpProfile.fetch({ useMasterKey: true });
    
    const host = smtpConfig.get('host');
    const port = smtpConfig.get('port');
    const user = smtpConfig.get('username');
    const password = smtpConfig.get('password');
    const from = smtpConfig.get('email_from') || process.env.SMTP_FROM || '"Marki15" <noreply@marki15.com>';
    // secure n'existe pas dans la classe, on utilise false par défaut
    const secure = false;

    // Si le profil SMTP est incomplet, tombe en arrière sur sendEmail
    if (!host || !port || !user || !password) {
      console.warn(`[sendEmailViaSmtp] Profil SMTP ${smtpId} mal configuré (host=${host}, port=${port}, user=${user}, password=${password ? '***' : 'missing'}), utilisation de l'envoi standard`);
      return sendEmail(request);
    }

    // Créer le transporteur SMTP
    const transporter = nodemailer.createTransport({
      host: host,
      port: port,
      secure: secure || false,
      auth: {
        user: user,
        pass: password
      },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production'
      }
    });

    const mailOptions = {
      from: from,
      to: to,
      subject: subject,
      html: html || '',
      text: text || html?.replace(/<[^>]*>/g, '') || ''
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`[sendEmailViaSmtp] Email envoyé via ${smtpId} à ${to}: ${info.messageId}`);
    
    return {
      success: true,
      message: 'Email envoyé avec succès via SMTP',
      messageId: info.messageId,
      smtpId: smtpId
    };
  } catch (error) {
    console.error(`[sendEmailViaSmtp] Erreur envoi via ${smtpId} à ${to}:`, error.message);
    throw new Error(`Erreur envoi email via SMTP ${smtpId}: ${error.message}`);
  }
}

module.exports = { sendEmail, sendEmailViaSmtp };
