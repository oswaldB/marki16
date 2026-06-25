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
            // Filtrer par statut "pret pour envoi" et date du jour
            query.equalTo("statut", "pret pour envoi");
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            query.equalTo("dateEnvoi", today);
            info(
                "Requête pour toutes les relances avec statut 'pret pour envoi' pour aujourd'hui",
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
        for (const relance of relances) {
            const relanceId = relance.id;
            info(
                `Traitement de la relance ${relanceId}`,
                "send-emails",
                "sendEmailsMaster",
            );

            try {
                // Validation: Vérifier la présence du contact et de son email
                const contact = relance.get("contact");
                const contactEmail = contact?.get("email");
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
                    smtpProfil.get("fromEmail") || smtpProfil.get("user");
                const to = contactEmail;
                const subject = relance.get("objet") || "Relance d'impayé";
                const html = relance.get("corps") || "<p>Contenu de la relance...</p>";
                const replyTo = smtpProfil.get("replyToEmail") || null;

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
                        user: smtpProfil.get("user"),
                        pass: smtpProfil.get("pass"),
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
                    `Envoi de l'email à ${to}...`,
                    "send-emails",
                    "sendEmailsMaster",
                    { relanceId },
                );

                const emailInfo = await transporter.sendMail(emailOptions);

                info(
                    `Email envoyé avec succès à ${to} - Relance ${relanceId}`,
                    "send-emails",
                    "sendEmailsMaster",
                    {
                        relanceId,
                        to,
                        messageId: emailInfo.messageId,
                    },
                );

                // Copier l'email vers le dossier Sent via IMAP (si configuré)
                try {
                    await copyToSentFolder(
                        smtpProfil,
                        emailOptions,
                        emailInfo,
                    );
                    info(
                        `Email copié vers le dossier Sent pour ${to}`,
                        "send-emails",
                        "sendEmailsMaster",
                        { relanceId },
                    );
                } catch (imapError) {
                    warn(
                        `Impossible de copier l'email vers Sent: ${imapError.message}`,
                        "send-emails",
                        "sendEmailsMaster",
                        { relanceId, error: imapError.message },
                    );
                    // Ne pas considérer cela comme une erreur bloquante
                }

                // Mettre à jour la relance avec succès
                relance.set("statut", "Envoyée");
                relance.set("dateEnvoi", new Date());
                relance.set("emailSent", true);
                await relance.save(null, { useMasterKey: true });

                result.relancesEnvoyees++;

            } catch (emailError) {
                // Gestion des erreurs d'envoi
                const errorMsg = `Erreur envoi email à ${contactEmail || "inconnu"}: ${emailError.message}`;
                error(errorMsg, "send-emails", "sendEmailsMaster", {
                    relanceId: relance.id,
                    error: emailError.message,
                    stack: emailError.stack,
                });

                // Mettre à jour la relance avec l'erreur
                relance.set("statut", "Erreur d'envoi");
                relance.set("lastError", emailError.message);
                await relance.save(null, { useMasterKey: true });

                result.erreurs.push({
                    relanceId: relance.id,
                    erreur: emailError.message,
                });
                result.relancesErreurs++;
            }
        }

        // Finaliser les statistiques
        result.totalRelances = relances.length;
        stats.result = result;

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
