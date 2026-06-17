// backend/cloud/workflows/send-sequence-test/02-sendEmails.js
// Étape 2 : Fonctions d'envoi d'email (intégrées depuis send-email)
// Utilisées par 01-sendSequenceTest.js

const nodemailer = require("nodemailer");

/**
 * Envoie un email simple via le transporteur par défaut
 * @param {Object} params - Paramètres d'email
 * @param {string} params.to - Destinataire
 * @param {string} params.subject - Sujet
 * @param {string} params.html - Corps HTML
 * @param {string} params.text - Corps texte (optionnel)
 * @param {Array} params.attachments - Pièces jointes (optionnel)
 * @returns {Promise<Object>} Résultat de l'envoi
 */
async function sendEmail({ to, subject, html, text, attachments }) {
    if (!to || !subject) {
        throw new Error("Paramètres manquants: to et subject sont requis");
    }

    try {
        // Utiliser le transporteur SMTP par défaut ou configuration globale
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "localhost",
            port: parseInt(process.env.SMTP_PORT || "587"),
            secure: process.env.SMTP_SECURE === "true",
            auth: {
                user: process.env.SMTP_USER || "",
                pass: process.env.SMTP_PASSWORD || "",
            },
            tls: {
                rejectUnauthorized: process.env.NODE_ENV === "production",
            },
        });

        const mailOptions = {
            from: process.env.SMTP_FROM || '"Marki15" <noreply@marki15.com>',
            to: to,
            subject: subject,
            html: html || "",
            text: text || html?.replace(/<[^>]*>/g, "") || "",
        };

        if (attachments && attachments.length > 0) {
            mailOptions.attachments = attachments;
        }

        const info = await transporter.sendMail(mailOptions);

        console.log(`[sendEmail] Email envoyé à ${to}: ${info.messageId}`);

        return {
            success: true,
            message: "Email envoyé avec succès",
            messageId: info.messageId,
        };
    } catch (error) {
        console.error(`[sendEmail] Erreur envoi à ${to}:`, error.message);
        throw new Error(`Erreur envoi email: ${error.message}`);
    }
}

/**
 * Envoie un email via un profil SMTP configuré depuis Parse
 * @param {Object} params - Paramètres d'email
 * @param {string} params.smtpId - ID du profil SMTP dans Parse
 * @param {string} params.to - Destinataire
 * @param {string} params.subject - Sujet
 * @param {string} params.html - Corps HTML
 * @param {string} params.text - Corps texte (optionnel)
 * @param {Array} params.attachments - Pièces jointes (optionnel)
 * @returns {Promise<Object>} Résultat de l'envoi
 */
async function sendEmailViaSmtp({
    smtpId,
    to,
    subject,
    html,
    text,
    attachments,
}) {
    if (!smtpId || !to || !subject) {
        throw new Error(
            "Paramètres manquants: smtpId, to et subject sont requis",
        );
    }

    try {
        // Récupérer le profil SMTP depuis Parse
        const SmtpProfile = Parse.Object.extend("SmtpProfile");
        const query = new Parse.Query(SmtpProfile);

        let smtpProfile;
        try {
            smtpProfile = await query.get(smtpId, { useMasterKey: true });
        } catch (fetchError) {
            // Profil SMTP introuvable, tombe en arrière sur sendEmail
            console.warn(
                `[sendEmailViaSmtp] Profil SMTP ${smtpId} introuvable, utilisation de l'envoi standard`,
            );
            return sendEmail({ to, subject, html, text, attachments });
        }

        // Récupérer la configuration
        const smtpConfig = await smtpProfile.fetch({ useMasterKey: true });

        const host = smtpConfig.get("host");
        const port = smtpConfig.get("port");
        const user = smtpConfig.get("username");
        const password = smtpConfig.get("password");
        const from =
            smtpConfig.get("email_from") ||
            process.env.SMTP_FROM ||
            '"Marki15" <noreply@marki15.com>';
        const signature =
            smtpConfig.get("signature") ||
            smtpConfig.get("signature_html") ||
            "";
        const secure = false;

        // Si le profil SMTP est incomplet, tombe en arrière sur sendEmail
        if (!host || !port || !user || !password) {
            console.warn(
                `[sendEmailViaSmtp] Profil SMTP ${smtpId} mal configuré (host=${host}, port=${port}, user=${user}, password=${password ? "***" : "missing"}), utilisation de l'envoi standard`,
            );
            return sendEmail({ to, subject, html, text, attachments });
        }

        // Créer le transporteur SMTP
        const transporter = nodemailer.createTransport({
            host: host,
            port: port,
            secure: secure || false,
            auth: {
                user: user,
                pass: password,
            },
            tls: {
                rejectUnauthorized: process.env.NODE_ENV === "production",
            },
        });

        // Ajouter la signature au HTML si elle existe
        const emailHtml = (html || "") + (signature ? signature : "");
        const emailText =
            (text || html?.replace(/<[^>]*>/g, "") || "") +
            (signature ? signature.replace(/<[^>]*>/g, "") : "");

        const mailOptions = {
            from: from,
            to: to,
            subject: subject,
            html: emailHtml,
            text: emailText,
        };

        if (attachments && attachments.length > 0) {
            mailOptions.attachments = attachments;
        }

        const info = await transporter.sendMail(mailOptions);

        console.log(
            `[sendEmailViaSmtp] Email envoyé via ${smtpId} à ${to}: ${info.messageId}`,
        );

        return {
            success: true,
            message: "Email envoyé avec succès via SMTP",
            messageId: info.messageId,
            smtpId: smtpId,
        };
    } catch (error) {
        console.error(
            `[sendEmailViaSmtp] Erreur envoi via ${smtpId} à ${to}:`,
            error.message,
        );
        throw new Error(
            `Erreur envoi email via SMTP ${smtpId}: ${error.message}`,
        );
    }
}

module.exports = { sendEmail, sendEmailViaSmtp };
