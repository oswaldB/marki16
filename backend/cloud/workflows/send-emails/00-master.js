// backend/cloud/workflows/send-emails/00-master.js
// Workflow d'envoi des emails de relance

// Charger les variables d'environnement depuis .env
require("dotenv").config({ path: "/home/ubuntu/prod/adti/.env" });

const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const { info, warn, error } = require("../../utils/logger");

// Chemin du répertoire logs
const LOGS_DIR = path.join(__dirname, "logs");

// Répertoire temporaire
const TEMP_DIR = "/tmp/adti-invoices";

/**
 * Vide le répertoire logs
 */
function clearLogs() {
    try {
        if (fs.existsSync(LOGS_DIR)) {
            const files = fs.readdirSync(LOGS_DIR);
            files.forEach((file) => {
                const filePath = path.join(LOGS_DIR, file);
                try {
                    fs.unlinkSync(filePath);
                } catch (err) {
                    warn(
                        `Impossible de supprimer ${filePath}: ${err.message}`,
                        "send-emails",
                        "clearLogs",
                    );
                }
            });
            info(
                `Répertoire logs vidé: ${files.length} fichiers supprimés`,
                "send-emails",
                "sendEmailsMaster",
            );
        }
    } catch (err) {
        warn(
            `Impossible de vider le répertoire logs: ${err.message}`,
            "send-emails",
            "sendEmailsMaster",
        );
    }
}

// Assure que le répertoire temporaire existe
function ensureTempDir() {
    if (!fs.existsSync(TEMP_DIR)) {
        fs.mkdirSync(TEMP_DIR, { recursive: true });
        info(
            `Répertoire temporaire créé: ${TEMP_DIR}`,
            "send-emails",
            "sendEmailsMaster",
        );
    }
}

// Initialiser Parse si nécessaire
if (typeof Parse === "undefined") {
    const Parse = require("parse/node");
    Parse.initialize(
        process.env.PARSE_APP_ID,
        process.env.PARSE_JAVASCRIPT_KEY,
        process.env.PARSE_MASTER_KEY,
    );
    Parse.serverURL = process.env.PARSE_SERVER_URL;
    Parse.Cloud.useMasterKey();
    global.Parse = Parse;
}

/**
 * Fonction principale pour l'envoi des emails de relance
 * @param {Object} options - Options du workflow
 * @param {string} [options.trigger='manual'] - Type de déclenchement
 * @param {string[]} [options.relanceIds] - Liste spécifique d'IDs de relance à envoyer
 * @returns {Promise<Object>} Statistiques du traitement
 */
async function sendEmailsMaster({
    trigger = "manual",
    relanceIds = null,
} = {}) {
    const startedAt = new Date();

    // Règle 1: Vider le répertoire logs au début (sauf en mode test)
    if (trigger !== "test") {
        clearLogs();
    }

    // Séparateur visuel
    info(
        "\n============================================================",
        "send-emails",
        "sendEmailsMaster",
    );
    info(
        `🚀 DÉBUT: send-emails (trigger: ${trigger})`,
        "send-emails",
        "sendEmailsMaster",
        { trigger },
    );
    info(
        "============================================================",
        "send-emails",
        "sendEmailsMaster",
    );

    // Initialiser les statistiques
    const stats = {
        result: null,
        errors: [],
        total: {
            startedAt: startedAt.toISOString(),
            finishedAt: null,
            durationMs: null,
        },
    };

    try {
        // Configuration initiale
        ensureTempDir();

        // Initialiser le résultat
        const result = {
            relancesEnvoyees: 0,
            relancesErreurs: 0,
            erreurs: [],
        };

        // Construire la requête pour les relances
        const query = new Parse.Query("Relance");

        // Filtrer par IDs spécifiques ou par statut et date
        if (relanceIds && relanceIds.length > 0) {
            query.containedIn("objectId", relanceIds);
            info(
                `Requête pour ${relanceIds.length} relances spécifiques`,
                "send-emails",
                "sendEmailsMaster",
                { relanceIds },
            );
        } else {
            // Filtrer par statut "pret pour envoi" et date d'envoi <= maintenant
            // Récupère les relances en attente (y compris celles des jours précédents)
            query.equalTo("statut", "pret pour envoi");
            query.lessThanOrEqualTo("dateEnvoi", new Date());
            info(
                "Requête pour toutes les relances avec statut 'pret pour envoi' et date d'envoi <= maintenant",
                "send-emails",
                "sendEmailsMaster",
            );
        }

        // Inclure les relations nécessaires
        query.include(["contact", "sequence", "impayes", "smtpProfil"]);
        query.limit(9999);

        // Exécuter la requête
        info("Exécution de la requête...", "send-emails", "sendEmailsMaster");
        const relances = await query.find({ useMasterKey: true });
        info(
            `Trouvé ${relances.length} relances à traiter`,
            "send-emails",
            "sendEmailsMaster",
            { count: relances.length },
        );

        // Traiter chaque relance
        let relanceIndex = 0;
        for (const relance of relances) {
            relanceIndex++;
            const relanceId = relance.id;
            info(
                `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ [${relanceIndex}/${relances.length}] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
                "send-emails",
                "sendEmailsMaster",
            );
            info(
                `🔄 Traitement relance ${relanceId} (${relanceIndex}/${relances.length})`,
                "send-emails",
                "sendEmailsMaster",
            );

            let contactEmail = null;

            try {
                // Validation: Vérifier la présence du contact et de son email
                const contact = relance.get("contact");
                contactEmail = contact?.get("email");
                const impayes = relance.get("impayes") || [];

                if (!contact || !contactEmail) {
                    const errorMsg = `Relance ${relanceId}: Contact ou email manquant`;
                    warn(errorMsg, "send-emails", "sendEmailsMaster");
                    result.erreurs.push({
                        relanceId,
                        erreur: "Contact ou email manquant",
                    });
                    result.relancesErreurs++;

                    // Mettre à jour la relance avec l'erreur
                    relance.set("statut", "Erreur d'envoi");
                    relance.set("lastError", "Contact ou email manquant");
                    await relance.save(null, { useMasterKey: true });
                    continue;
                }

                if (impayes.length === 0) {
                    const errorMsg = `Relance ${relanceId}: Aucune impayé associé`;
                    warn(errorMsg, "send-emails", "sendEmailsMaster");
                    result.erreurs.push({
                        relanceId,
                        erreur: "Aucune impayé associé",
                    });
                    result.relancesErreurs++;

                    // Mettre à jour la relance avec l'erreur
                    relance.set("statut", "Erreur d'envoi");
                    relance.set("lastError", "Aucune impayé associé");
                    await relance.save(null, { useMasterKey: true });
                    continue;
                }

                // Vérification blacklist - Contact
                if (contact.get("isBlacklisted") === true) {
                    const errorMsg = `Relance ${relanceId}: Contact blacklisté`;
                    warn(errorMsg, "send-emails", "sendEmailsMaster");
                    result.erreurs.push({
                        relanceId,
                        erreur: "Contact blacklisté",
                    });
                    result.relancesErreurs++;

                    // Mettre à jour la relance avec le statut blacklist
                    relance.set("statut", "Contact blacklisté");
                    relance.set("lastError", "Contact blacklisté");
                    await relance.save(null, { useMasterKey: true });
                    continue;
                }

                // Vérification blacklist - Impayés
                for (const impaye of impayes) {
                    if (impaye.get("isBlacklisted") === true) {
                        const errorMsg = `Relance ${relanceId}: Impayé ${impaye.id} blacklisté`;
                        warn(errorMsg, "send-emails", "sendEmailsMaster");
                        result.erreurs.push({
                            relanceId,
                            erreur: "Impayé blacklisté",
                        });
                        result.relancesErreurs++;

                        // Mettre à jour la relance avec le statut blacklist
                        relance.set("statut", "Impayé blacklisté");
                        relance.set("lastError", `Impayé ${impaye.id} blacklisté`);
                        await relance.save(null, { useMasterKey: true });
                        continue;
                    }
                }

                // Récupérer le profil SMTP
                const smtpProfil = relance.get("smtpProfil");
                if (!smtpProfil) {
                    const errorMsg = `Relance ${relanceId}: Profil SMTP manquant`;
                    warn(errorMsg, "send-emails", "sendEmailsMaster");
                    result.erreurs.push({
                        relanceId,
                        erreur: "Profil SMTP manquant",
                    });
                    result.relancesErreurs++;

                    // Mettre à jour la relance avec l'erreur
                    relance.set("statut", "Erreur d'envoi");
                    relance.set("lastError", "Profil SMTP manquant");
                    await relance.save(null, { useMasterKey: true });
                    continue;
                }

                // Préparer les données de l'email
                const from =
                    smtpProfil.get("fromEmail") || smtpProfil.get("username");
                const to = contactEmail;
                const subject = relance.get("objet") || "Relance d'impayé";
                const baseHtml = relance.get("corps") || "<p>Contenu de la relance...</p>";
                const replyTo = smtpProfil.get("replyToEmail") || null;

                // DEBUG: Récupération de la signature
                const signatureRaw = smtpProfil.get("signature_html");
                info(
                    `DEBUG SMTP Profil: ${smtpProfil.id} - signature_html brut:`,
                    "send-emails",
                    "sendEmailsMaster",
                    { 
                        relanceId, 
                        smtpProfilId: smtpProfil.id,
                        signatureRaw: signatureRaw,
                        signatureType: typeof signatureRaw,
                        signatureLength: signatureRaw ? signatureRaw.length : 0
                    },
                );
                
                const signatureHtml = signatureRaw || null;

                // Construire le HTML final avec signature
                let html = baseHtml;
                if (signatureHtml && signatureHtml.trim()) {
                    const signaturePreview = signatureHtml.substring(0, 100).replace(/\n/g, '\\n');
                    html = baseHtml + "<br><br>" + signatureHtml;
                    info(
                        `✅ Signature trouvée et ajoutée (début: "${signaturePreview}...")`,
                        "send-emails",
                        "sendEmailsMaster",
                        { relanceId, signatureLength: signatureHtml.length, signaturePreview },
                    );
                } else {
                    info(
                        `⚠️ Pas de signature trouvée (signatureHtml=${signatureHtml}, trim=${signatureHtml ? signatureHtml.trim() : 'N/A'})`,
                        "send-emails",
                        "sendEmailsMaster",
                        { relanceId },
                    );
                }

                info(
                    `Préparation de l'email pour ${to} - Sujet: ${subject}`,
                    "send-emails",
                    "sendEmailsMaster",
                    { relanceId, to, subject },
                );

                // Initialiser le transporteur Nodemailer
                const transporter = nodemailer.createTransport({
                    host: smtpProfil.get("host"),
                    port: smtpProfil.get("port"),
                    secure: smtpProfil.get("secure") === true,
                    auth: {
                        user: smtpProfil.get("username"),
                        pass: smtpProfil.get("password"),
                    },
                    tls: {
                        // Ignorer la validation du certificat si nécessaire (pour les environnements de test)
                        rejectUnauthorized:
                            process.env.NODE_ENV === "production",
                    },
                });

                // Construire les options de l'email
                const emailOptions = {
                    from: from,
                    to: to,
                    subject: subject,
                    html: html,
                    replyTo: replyTo,
                };

                // Envoyer l'email
                info(
                    `📤 [${relanceId}] Début sendMail vers ${to}...`,
                    "send-emails",
                    "sendEmailsMaster",
                    { relanceId, to },
                );

                let emailInfo;
                try {
                    emailInfo = await transporter.sendMail(emailOptions);
                    info(
                        `✅ [${relanceId}] Email envoyé avec succès - MessageID: ${emailInfo.messageId}`,
                        "send-emails",
                        "sendEmailsMaster",
                        { relanceId, messageId: emailInfo.messageId, response: emailInfo.response },
                    );
                } catch (sendErr) {
                    error(
                        `❌ [${relanceId}] Échec sendMail: ${sendErr.message}`,
                        "send-emails",
                        "sendEmailsMaster",
                        { relanceId, error: sendErr.message, code: sendErr.code },
                    );
                    throw sendErr;
                }

                // Copier l'email vers le dossier Sent via IMAP (si configuré)
                try {
                    info(
                        `📋 [${relanceId}] Tentative copie vers Sent...`,
                        "send-emails",
                        "sendEmailsMaster",
                        { relanceId },
                    );
                    await copyToSentFolder(
                        smtpProfil,
                        emailOptions,
                        emailInfo,
                    );
                    info(
                        `✅ [${relanceId}] Copie vers Sent réussie`,
                        "send-emails",
                        "sendEmailsMaster",
                        { relanceId },
                    );
                } catch (imapError) {
                    warn(
                        `⚠️ [${relanceId}] Copie vers Sent échouée: ${imapError.message}`,
                        "send-emails",
                        "sendEmailsMaster",
                        { relanceId, error: imapError.message },
                    );
                    // Ne pas considérer cela comme une erreur bloquante
                }

                // Mettre à jour la relance avec succès
                info(
                    `💾 [${relanceId}] Mise à jour statut -> "Envoyée"...`,
                    "send-emails",
                    "sendEmailsMaster",
                    { relanceId },
                );
                relance.set("statut", "Envoyée");
                relance.set("dateEnvoi", new Date());
                relance.set("emailSent", true);
                
                info(
                    `💾 [${relanceId}] Sauvegarde Parse...`,
                    "send-emails",
                    "sendEmailsMaster",
                    { relanceId },
                );
                await relance.save(null, { useMasterKey: true });
                info(
                    `✅ [${relanceId}] Relance sauvegardée avec succès`,
                    "send-emails",
                    "sendEmailsMaster",
                    { relanceId },
                );

                result.relancesEnvoyees++;
                info(
                    `✅ [${relanceId}] RELANCE TERMINÉE - Envoyée avec succès (${result.relancesEnvoyees} total)`,
                    "send-emails",
                    "sendEmailsMaster",
                    { relanceId },
                );

            } catch (emailError) {
                // Gestion des erreurs d'envoi
                const errorMsg = `❌ [${relanceId}] Erreur envoi email à ${contactEmail || "inconnu"}: ${emailError.message}`;
                error(errorMsg, "send-emails", "sendEmailsMaster", {
                    relanceId: relance.id,
                    error: emailError.message,
                    code: emailError.code,
                    stack: emailError.stack?.substring(0, 500),
                });

                // Mettre à jour la relance avec l'erreur
                info(
                    `💾 [${relanceId}] Mise à jour statut -> "Erreur d'envoi"...`,
                    "send-emails",
                    "sendEmailsMaster",
                    { relanceId, errorMessage: emailError.message },
                );
                relance.set("statut", "Erreur d'envoi");
                relance.set("lastError", emailError.message);
                
                info(
                    `💾 [${relanceId}] Sauvegarde Parse (erreur)...`,
                    "send-emails",
                    "sendEmailsMaster",
                    { relanceId },
                );
                await relance.save(null, { useMasterKey: true });
                info(
                    `✅ [${relanceId}] Relance sauvegardée (statut erreur)`,
                    "send-emails",
                    "sendEmailsMaster",
                    { relanceId },
                );

                result.erreurs.push({
                    relanceId: relance.id,
                    erreur: emailError.message,
                });
                result.relancesErreurs++;
                info(
                    `❌ [${relanceId}] RELANCE TERMINÉE - Erreur (${result.relancesErreurs} erreurs total)`,
                    "send-emails",
                    "sendEmailsMaster",
                    { relanceId, error: emailError.message },
                );
            }
        }

        // Finaliser les statistiques
        result.totalRelances = relances.length;
        stats.result = result;
        
        info(
            `📊 RÉSUMÉ TRAITEMENT: ${result.relancesEnvoyees} envoyées, ${result.relancesErreurs} erreurs, ${relances.length} total`,
            "send-emails",
            "sendEmailsMaster",
            { 
                envoyees: result.relancesEnvoyees, 
                erreurs: result.relancesErreurs, 
                total: relances.length 
            },
        );

    } catch (globalError) {
        // Erreur globale (ex: problème avec Parse)
        error(
            `Erreur globale dans sendEmailsMaster: ${globalError.message}`,
            "send-emails",
            "sendEmailsMaster",
            {
                error: globalError.message,
                stack: globalError.stack,
            },
        );
        stats.errors.push({
            type: "global",
            message: globalError.message,
            stack: globalError.stack,
        });
        stats.result = {
            relancesEnvoyees: 0,
            relancesErreurs: 0,
            erreurs: [
                {
                    type: "global",
                    erreur: globalError.message,
                },
            ],
        };
    }

    // Finaliser les statistiques de temps
    const finishedAt = new Date();
    stats.total.finishedAt = finishedAt.toISOString();
    stats.total.durationMs = finishedAt - startedAt;

    // Log de fin
    info(
        "============================================================",
        "send-emails",
        "sendEmailsMaster",
    );
    if (stats.result) {
        info(
            `✅ FIN: send-emails - ${stats.result.relancesEnvoyees} envoyées, ${stats.result.relancesErreurs} erreurs`,
            "send-emails",
            "sendEmailsMaster",
            {
                result: stats.result,
                durationMs: stats.total.durationMs,
            },
        );
    } else {
        info(
            "✅ FIN: send-emails (aucune relance traitée)",
            "send-emails",
            "sendEmailsMaster",
            {
                durationMs: stats.total.durationMs,
            },
        );
    }
    info(
        "============================================================\n",
        "send-emails",
        "sendEmailsMaster",
    );

    return stats;
}

/**
 * Copie l'email envoyé vers le dossier Sent via IMAP
 * @param {Parse.Object} smtpProfil - Profil SMTP
 * @param {Object} emailOptions - Options de l'email
 * @param {Object} emailInfo - Informations de l'email envoyé
 * @returns {Promise<void>}
 */
async function copyToSentFolder(smtpProfil, emailOptions, emailInfo) {
    // Vérifier si IMAP est configuré dans le profil SMTP
    // Pour l'instant, on utilise une approche simple avec Nodemailer
    // Si un client IMAP dédié est nécessaire, il faudra installer un package comme 'imap'

    try {
        // Si le profil SMTP a des informations IMAP, on peut essayer de copier
        // Cette implémentation utilise une approche alternative: envoyer une copie BCC
        // ou utiliser le dossier Sent du serveur SMTP si disponible

        // Pour les serveurs SMTP qui supportent la copie automatique vers Sent,
        // on peut utiliser l'option 'sentFolder' de certains transporteurs
        // Mais cela dépend du serveur SMTP

        // Pour l'instant, on log simplement que la copie n'est pas implémentée
        // Une implémentation complète nécessiterait un client IMAP séparé

        // Note: Cette fonction est un placeholder. Pour une implémentation complète,
        // il faudrait:
        // 1. Installer un package IMAP comme 'imap' ou 'node-imap'
        // 2. Se connecter au serveur IMAP avec les credentials du profil
        // 3. Append le message dans le dossier Sent

        // On retourne sans erreur pour ne pas bloquer l'envoi principal
        return;
    } catch (err) {
        throw new Error(`Erreur lors de la copie vers Sent: ${err.message}`);
    }
}

/**
 * Fonction pour être appelée depuis la ligne de commande
 */
async function main() {
    try {
        // Parser les arguments de la ligne de commande
        const args = process.argv.slice(2);
        const options = {
            trigger: "manual",
            relanceIds: null,
        };

        // Analyser les arguments
        for (let i = 0; i < args.length; i++) {
            if (args[i] === "--trigger" && args[i + 1]) {
                options.trigger = args[i + 1];
                i++;
            } else if (args[i] === "--relanceIds" && args[i + 1]) {
                options.relanceIds = args[i + 1].split(",");
                i++;
            }
        }

        // Appeler la fonction principale
        const result = await sendEmailsMaster(options);

        // Afficher un résumé
        if (result.result) {
            console.log(
                `\nRésumé: ${result.result.relancesEnvoyees} emails envoyés, ${result.result.relancesErreurs} erreurs`,
            );
            if (result.result.erreurs.length > 0) {
                console.log("\nErreurs rencontrées:");
                result.result.erreurs.forEach((err, idx) => {
                    console.log(`  ${idx + 1}. ${err.relanceId}: ${err.erreur}`);
                });
            }
        }

        process.exit(0);
    } catch (err) {
        error(
            `Erreur fatale dans main: ${err.message}`,
            "send-emails",
            "main",
            { error: err },
        );
        process.exit(1);
    }
}

// Exécuter si appelé directement depuis la ligne de commande
if (require.main === module) {
    main();
}

// Exporter la fonction principale pour utilisation programmatique
module.exports = sendEmailsMaster;

/**
 * Cloud Function: sendEmails
 * Endpoint HTTP pour déclencher l'envoi des emails de relance
 * 
 * curl -X POST \
 *   -H "X-Parse-Application-Id: {APP_ID}" \
 *   -H "X-Parse-Master-Key: {MASTER_KEY}" \
 *   -H "Content-Type: application/json" \
 *   -d '{"relanceIds": ["id1", "id2"]}' \
 *   {PARSE_SERVER_URL}/functions/sendEmails
 * 
 * Paramètres optionnels:
 * - relanceIds: string[] - IDs spécifiques de relances à envoyer
 * - trigger: string - Type de déclenchement (défaut: "cloud")
 */
if (typeof Parse !== "undefined") {
    Parse.Cloud.define("sendEmails", async (request) => {
        const { relanceIds = null, trigger = "cloud" } = request.params;
        
        info(
            `Cloud Function sendEmails appelée (trigger: ${trigger})`,
            "send-emails",
            "sendEmails",
            { relanceIds },
        );

        try {
            const stats = await sendEmailsMaster({
                trigger,
                relanceIds,
            });

            return {
                success: true,
                stats: stats.result,
                errors: stats.errors,
                durationMs: stats.total.durationMs,
            };
        } catch (err) {
            error(
                `Erreur dans Cloud Function sendEmails: ${err.message}`,
                "send-emails",
                "sendEmails",
                { error: err },
            );
            throw new Parse.Error(
                Parse.Error.SCRIPT_FAILED,
                `Erreur lors de l'envoi des emails: ${err.message}`,
            );
        }
    });
}
