// cloud/relances/jobs/envoyerRelances.js
// Envoie les relances par email et met à jour leur statut

const nodemailer = require("nodemailer");

// Initialiser Parse si ce n'est pas déjà fait
if (typeof Parse === "undefined") {
    const Parse = require("parse/node");
    Parse.initialize(
        process.env.PARSE_APP_ID || "marki15-app",
        process.env.PARSE_JAVASCRIPT_KEY || "",
        process.env.PARSE_MASTER_KEY ||
            "e2f4e4e89056af61dd95a71226fa0e51917313e09b68aca8bf434e5eb9bd8aa9",
    );
    Parse.serverURL =
        process.env.PARSE_SERVER_URL || "http://localhost:1555/parse";
    Parse.Cloud.useMasterKey();
    global.Parse = Parse;
}

/**
 * Crée un transporteur SMTP configuré à partir d'un profil SMTP
 * @param {Object} smtpProfile - Profil SMTP Parse
 * @returns {Object} Transporteur nodemailer
 * @throws {Error} Si le profil SMTP est mal configuré
 */
async function createSmtpTransporter(smtpProfile) {
    if (!smtpProfile) {
        throw new Error("Aucun profil SMTP spécifié pour la relance");
    }

    // Récupérer les informations du profil SMTP
    const smtpConfig = await smtpProfile.fetch({ useMasterKey: true });

    // Noms de champs dans Parse : host, port, username, password, email_from
    const host = smtpConfig.get("host");
    const port = smtpConfig.get("port");
    const user = smtpConfig.get("username");
    const password = smtpConfig.get("password");
    // secure n'existe pas dans la classe, on utilise false par défaut
    const secure = false;

    // Vérifier que toutes les informations nécessaires sont présentes
    if (!host || !port || !user || !password) {
        throw new Error(
            `Profil SMTP ${smtpProfile.id} mal configuré: host=${host}, port=${port}, user=${user}`,
        );
    }

    return nodemailer.createTransport({
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
}

/**
 * Sélectionne les relances prêtes à être envoyées
 * @returns {Promise<Array>} Liste des relances à envoyer
 */
async function selectionnerRelancesAEnvoyer() {
    const Relance = Parse.Object.extend("Relance");
    const query = new Parse.Query(Relance);

    query.equalTo("statut", "a_envoyer");
    query.lessThanOrEqualTo("date_envoi_prevue", new Date());
    query.limit(1000); // Limite pour éviter de surcharger le système

    return await query.find({ useMasterKey: true });
}

/**
 * Envoie un email via SMTP
 * @param {Object} relance - La relance à envoyer
 * @param {Object} transporter - Transporteur SMTP
 * @returns {Promise<Object>} Résultat de l'envoi
 */
async function envoyerEmail(relance, transporter) {
    const contact = relance.get("contact");

    // Récupérer la signature du profil SMTP si disponible
    let signature = "";
    const smtpProfil = relance.get("smtpProfil");
    if (smtpProfil) {
        try {
            const smtpConfig = await smtpProfil.fetch({ useMasterKey: true });
            signature =
                smtpConfig.get("signature") ||
                smtpConfig.get("signature_html") ||
                "";
        } catch (err) {
            console.warn(
                `[envoyerRelances] Impossible de récupérer la signature du profil SMTP ${smtpProfil.id}: ${err.message}`,
            );
        }
    }

    // Ajouter la signature au contenu
    const contenuHtml = relance.get("contenu") + (signature ? signature : "");
    const contenuText =
        relance.get("contenu").replace(/<[^>]*>/g, "") +
        (signature ? signature.replace(/<[^>]*>/g, "") : "");

    const emailData = {
        from:
            process.env.SMTP_FROM || '"Marki15 Relances" <noreply@marki15.com>',
        // to: contact.get('email'),
        to: "oswald.bernard@gmail.com",
        subject: relance.get("sujet"),
        html: contenuHtml,
        text: contenuText, // Version texte
        headers: {
            "X-Relance-ID": relance.id,
            "X-Impaye-ID": relance.get("impaye").id,
        },
    };

    // Ajouter les pièces jointes si nécessaire
    const impaye = relance.get("impaye");
    const urlPdf = impaye.get("url_pdf");
    if (urlPdf) {
        // Note: En production, il faudrait télécharger le PDF depuis l'URL
        // Pour l'instant, nous ajoutons juste un lien dans le contenu
        emailData.html += `<p><a href="${urlPdf}">Télécharger la facture</a></p>`;
    }

    try {
        const info = await transporter.sendMail(emailData);
        console.log(
            `[envoyerRelances] Email envoyé à ${contact.get("email")}: ${info.messageId}`,
        );
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(
            `[envoyerRelances] Erreur envoi email à ${contact.get("email")}:`,
            error.message,
        );
        return { success: false, error: error.message };
    }
}

/**
 * Met à jour le statut d'une relance
 * @param {Object} relance - La relance à mettre à jour
 * @param {string} statut - Nouveau statut
 * @param {Object} details - Détails supplémentaires
 * @returns {Promise<Object>} Relance mise à jour
 */
async function mettreAJourStatutRelance(relance, statut, details = {}) {
    relance.set("statut", statut);
    relance.set("date_envoi", new Date());

    // Ajouter les détails spécifiques au statut
    if (statut === "envoye") {
        relance.set("envoye_par", "smtp");
        relance.set("envoye_le", new Date());
    } else if (statut === "erreur") {
        relance.set("erreur_message", details.error);
        relance.set("erreur_count", (relance.get("erreur_count") || 0) + 1);
    }

    await relance.save(null, { useMasterKey: true });
    return relance;
}

/**
 * Crée une entrée de journal pour l'envoi
 * @param {Object} relance - La relance concernée
 * @param {string} statut - Statut de l'envoi
 * @param {Object} details - Détails supplémentaires
 */
async function journaliserEnvoi(relance, statut, details = {}) {
    try {
        const JournalEnvoi = Parse.Object.extend("JournalEnvoi");
        const journal = new JournalEnvoi();

        journal.set("relance_id", relance.id);
        journal.set("impaye_id", relance.get("impaye").id);
        journal.set("contact_id", relance.get("contact").id);
        journal.set("statut", statut);
        journal.set("date", new Date());
        journal.set("details", {
            sujet: relance.get("sujet"),
            scenario: relance.get("scenario"),
            ...details,
        });

        await journal.save(null, { useMasterKey: true });
    } catch (error) {
        console.error(
            `[envoyerRelances] Erreur journalisation pour ${relance.id}:`,
            error.message,
        );
    }
}

/**
 * Envoie toutes les relances prêtes
 * @param {Object} options - Options de configuration
 * @returns {Promise<Object>} Statistiques d'envoi
 */
async function envoyerRelances({ dryRun = false, limit = 100 } = {}) {
    const startedAt = new Date();
    const stats = {
        relancesSelectionnees: 0,
        relancesEnvoyees: 0,
        relancesErreurs: 0,
        erreurs: [],
    };

    try {
        console.log("[envoyerRelances] Début de l'envoi des relances");

        // 1. Sélectionner les relances à envoyer
        const relances = await selectionnerRelancesAEnvoyer();
        stats.relancesSelectionnees = relances.length;
        console.log(
            `[envoyerRelances] ${relances.length} relances sélectionnées`,
        );

        if (relances.length === 0) {
            console.log("[envoyerRelances] Aucune relance à envoyer");
            return stats;
        }

        if (dryRun) {
            console.log("[envoyerRelances] Mode dryRun - pas d'envoi réel");
        }

        // 3. Traiter chaque relance
        for (const relance of relances.slice(0, limit)) {
            try {
                console.log(
                    `[envoyerRelances] Traitement relance ${relance.id}`,
                );

                if (!dryRun) {
                    // 2. Créer le transporteur SMTP avec le profil de la relance
                    const smtpProfil = relance.get("smtpProfil");
                    const transporter = await createSmtpTransporter(smtpProfil);

                    // 4. Envoyer l'email
                    const result = await envoyerEmail(relance, transporter);

                    if (result.success) {
                        // 5. Mettre à jour le statut
                        await mettreAJourStatutRelance(relance, "envoye", {
                            messageId: result.messageId,
                        });
                        stats.relancesEnvoyees++;
                        console.log(
                            `[envoyerRelances] Relance ${relance.id} envoyée avec succès`,
                        );
                    } else {
                        // 6. Marquer comme erreur
                        await mettreAJourStatutRelance(relance, "erreur", {
                            error: result.error,
                        });
                        stats.relancesErreurs++;
                        stats.erreurs.push({
                            relanceId: relance.id,
                            impayeId: relance.get("impaye").id,
                            erreur: result.error,
                        });
                        console.error(
                            `[envoyerRelances] Échec envoi relance ${relance.id}: ${result.error}`,
                        );
                    }

                    // 7. Journaliser l'envoi
                    await journaliserEnvoi(
                        relance,
                        result.success ? "envoye" : "erreur",
                        result,
                    );
                } else {
                    // Mode dryRun - simuler l'envoi
                    stats.relancesEnvoyees++;
                    console.log(
                        `[envoyerRelances] Mode dryRun - relance ${relance.id} serait envoyée`,
                    );
                }
            } catch (error) {
                console.error(
                    `[envoyerRelances] Erreur relance ${relance.id}:`,
                    error.message,
                );
                stats.erreurs.push({
                    relanceId: relance.id,
                    impayeId: relance.get("impaye")?.id,
                    erreur: error.message,
                    stack: error.stack,
                });
                stats.relancesErreurs++;

                // Marquer la relance comme erreur même en dryRun
                if (!dryRun) {
                    await mettreAJourStatutRelance(relance, "erreur", {
                        error: error.message,
                    });
                    await journaliserEnvoi(relance, "erreur", {
                        error: error.message,
                    });
                }
            }
        }

        console.log(
            `[envoyerRelances] Terminé - ${stats.relancesEnvoyees} envoyées, ${stats.relancesErreurs} erreurs`,
        );
    } catch (error) {
        console.error("[envoyerRelances] Erreur globale:", error.message);
        stats.erreurs.push({
            source: "global",
            erreur: error.message,
            stack: error.stack,
        });
    }

    return stats;
}

// Export pour utilisation dans les jobs
module.exports = envoyerRelances;

// Exécution directe si appelé en CLI
if (require.main === module) {
    envoyerRelances()
        .then((stats) => {
            console.log("Envoi des relances terminé:", stats);
            process.exit(stats.erreurs.length > 0 ? 1 : 0);
        })
        .catch((error) => {
            console.error("Erreur lors de l'envoi des relances:", error);
            process.exit(1);
        });
}
