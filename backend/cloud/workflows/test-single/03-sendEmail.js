/**
 * Node 3: Send Email
 * Noeud responsable de l'envoi de l'email via Nodemailer.
 */

require("dotenv").config({ path: "/home/ubuntu/prod/adti/.env" });

const nodemailer = require("nodemailer");
const { info, warn, error } = require("../../utils/logger");

/**
 * Noeud 3: Envoie l'email via Nodemailer.
 * @param {Object} data - Données du noeud précédent (templateProcessing).
 * @returns {Promise<Object>} - Résultat de l'envoi.
 */
async function sendEmail(data) {
    info(
        "\n═════════════════════════════════════════════════════════════",
        "test-single",
        "03-sendEmail",
    );
    info("DÉBUT: Noeud 3 - Envoi de l'email", "test-single", "03-sendEmail");
    
    const { request, subject, body } = data;
    
    try {
        // Étape 1: Configuration de Nodemailer
        info("Configuration de Nodemailer...", "test-single", "03-sendEmail");
        
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT, 10) || 587,
            secure: process.env.SMTP_SECURE === "true",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
        
        info("Transporter Nodemailer configuré", "test-single", "03-sendEmail");
        
        // Étape 2: Construction des options de l'email
        const emailOptions = {
            from: process.env.SMTP_FROM || "test@adti.com",
            to: request.testEmail,
            subject: subject,
            html: body,
            replyTo: process.env.REPLY_TO_EMAIL || undefined,
        };
        
        info(`Options de l'email: to=${request.testEmail}, subject="${subject.substring(0, 50)}..."`, "test-single", "03-sendEmail");
        
        // Étape 3: Envoi de l'email
        info("Envoi de l'email...", "test-single", "03-sendEmail");
        
        const info = await transporter.sendMail(emailOptions);
        
        info(
            `✅ Email envoyé à ${request.testEmail} (Message ID: ${info.messageId})`,
            "test-single",
            "03-sendEmail",
        );
        
        // Étape 4: Retourner le résultat
        info("✅ Noeud 3 terminé: Email envoyé avec succès", "test-single", "03-sendEmail");
        
        return {
            success: true,
            message: "Email de test envoyé avec succès",
            to: request.testEmail,
            subject: subject,
            preview: body.substring(0, 200) + (body.length > 200 ? "..." : ""),
            timestamp: new Date().toISOString(),
        };
    } catch (err) {
        error(`ERREUR dans Noeud 3: ${err.message}`, "test-single", "03-sendEmail");
        error(err.stack, "test-single", "03-sendEmail");
        
        // Retourner un objet d'erreur
        return {
            success: false,
            message: err.message || "Échec de l'envoi de l'email de test",
            error: err.message,
            timestamp: new Date().toISOString(),
        };
    }
}

module.exports = sendEmail;
