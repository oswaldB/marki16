// cloud/relances/jobs/envoyerRelances.js
// Envoie les relances par email et met à jour leur statut

const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const archiver = require("archiver");
const SftpClient = require("ssh2-sftp-client");

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

// Configuration
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10 Mo
const TEMP_DIR = "/tmp/adti-invoices";
const PUBLIC_DOWNLOAD_URL =
    process.env.PUBLIC_DOWNLOAD_URL ||
    "http://localhost:1555/download/invoices";

// Assurer que le dossier temporaire existe
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true, mode: 0o777 });
}

/**
 * Génère un token unique pour le téléchargement
 */
function generateDownloadToken() {
    return crypto.randomBytes(32).toString("hex");
}

/**
 * Télécharge un PDF depuis SFTP
 * @param {string} sftpPath - Chemin du fichier sur le serveur SFTP
 * @returns {Promise<string>} Chemin local du fichier téléchargé
 */
async function downloadPdfFromSftp(sftpPath) {
    const sftp = new SftpClient();
    const localFilename =
        path.basename(sftpPath) || `facture_${Date.now()}.pdf`;
    const localPath = path.join(TEMP_DIR, localFilename);

    try {
        await sftp.connect({
            host: process.env.FTP_HOST,
            port: parseInt(process.env.FTP_PORT || "2222", 10),
            username: process.env.FTP_USERNAME,
            password: process.env.FTP_PASSWORD,
        });

        const readStream = await sftp.createReadStream(sftpPath);
        const writeStream = fs.createWriteStream(localPath);

        await new Promise((resolve, reject) => {
            readStream
                .pipe(writeStream)
                .on("finish", () => {
                    sftp.end()
                        .then(() => resolve(localPath))
                        .catch(() => resolve(localPath));
                })
                .on("error", (err) => {
                    sftp.end().catch(() => {});
                    writeStream.close();
                    fs.unlink(localPath, () => {});
                    reject(err);
                });
        });

        return localPath;
    } catch (err) {
        console.error(
            "[downloadPdfFromSftp] Erreur téléchargement SFTP:",
            err.message,
        );
        if (fs.existsSync(localPath)) {
            fs.unlinkSync(localPath);
        }
        throw err;
    }
}

/**
 * Crée un ZIP à partir de plusieurs fichiers PDF
 * @param {Array<string>} pdfPaths - Liste des chemins des PDFs
 * @param {string} outputPath - Chemin de sortie du ZIP
 * @returns {Promise<string>} Chemin du fichier ZIP créé
 */
async function createZipFromPdfs(pdfPaths, outputPath) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outputPath);
        const archive = archiver("zip", { zlib: { level: 9 } });

        output.on("close", () => {
            resolve(outputPath);
        });

        archive.on("error", (err) => {
            output.close();
            if (fs.existsSync(outputPath)) {
                fs.unlinkSync(outputPath);
            }
            reject(err);
        });

        archive.pipe(output);

        for (const pdfPath of pdfPaths) {
            if (fs.existsSync(pdfPath)) {
                archive.file(pdfPath, { name: path.basename(pdfPath) });
            }
        }

        archive.finalize();
    });
}

/**
 * Vérifie la taille d'un fichier
 * @param {string} filePath - Chemin du fichier
 * @returns {Promise<number>} Taille en octets
 */
async function getFileSize(filePath) {
    return new Promise((resolve) => {
        fs.stat(filePath, (err, stats) => {
            resolve(err ? 0 : stats.size);
        });
    });
}

/**
 * Nettoie les fichiers temporaires
 * @param {Array<string>} files - Liste des fichiers à supprimer
 */
function cleanupTempFiles(files) {
    for (const file of files) {
        try {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        } catch (err) {
            console.warn(
                "[cleanupTempFiles] Impossible de supprimer",
                file,
                err.message,
            );
        }
    }
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

    const smtpConfig = await smtpProfile.fetch({ useMasterKey: true });

    const host = smtpConfig.get("host");
    const port = smtpConfig.get("port");
    const user = smtpConfig.get("username");
    const password = smtpConfig.get("password");
    const secure = false;

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
    query.limit(1000);

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
        to: contact ? contact.get("email") : "oswald.bernard@gmail.com",
        subject: relance.get("sujet"),
        html: contenuHtml,
        text: contenuText,
        headers: {
            "X-Relance-ID": relance.id,
            "X-Impaye-ID": relance.get("impaye").id,
        },
    };

    // Gestion des pièces jointes
    const impaye = relance.get("impaye");
    const tempFiles = [];
    let downloadLink = null;
    let downloadToken = null;

    try {
        // Récupérer tous les PDFs liés
        const pdfUrls = [];
        if (impaye && impaye.get("url_pdf")) {
            pdfUrls.push(impaye.get("url_pdf"));
        }

        // Support pour plusieurs impayés (si la relance en a plusieurs)
        const impayes = Array.isArray(relance.get("impayes"))
            ? relance.get("impayes")
            : impaye
              ? [impaye]
              : [];

        for (const imp of impayes) {
            if (
                imp &&
                imp.get("url_pdf") &&
                !pdfUrls.includes(imp.get("url_pdf"))
            ) {
                pdfUrls.push(imp.get("url_pdf"));
            }
        }

        if (pdfUrls.length > 0) {
            const downloadedPdfs = [];

            // Télécharger tous les PDFs depuis SFTP
            for (const urlPdf of pdfUrls) {
                try {
                    const localPath = await downloadPdfFromSftp(urlPdf);
                    downloadedPdfs.push(localPath);
                    tempFiles.push(localPath);
                } catch (err) {
                    console.warn(
                        `[envoyerRelances] Impossible de télécharger ${urlPdf}: ${err.message}`,
                    );
                }
            }

            if (downloadedPdfs.length > 0) {
                let attachmentPath = null;

                if (downloadedPdfs.length === 1) {
                    // Un seul PDF
                    const fileSize = await getFileSize(downloadedPdfs[0]);
                    if (fileSize <= MAX_ATTACHMENT_SIZE) {
                        attachmentPath = downloadedPdfs[0];
                    }
                } else {
                    // Plusieurs PDFs, créer un ZIP
                    const zipName = `factures_${relance.id}_${Date.now()}.zip`;
                    const zipPath = path.join(TEMP_DIR, zipName);
                    await createZipFromPdfs(downloadedPdfs, zipPath);
                    tempFiles.push(zipPath);

                    const zipSize = await getFileSize(zipPath);
                    if (zipSize <= MAX_ATTACHMENT_SIZE) {
                        attachmentPath = zipPath;
                    } else {
                        // ZIP trop gros, créer un lien public
                        downloadToken = generateDownloadToken();
                        const publicZipPath = path.join(
                            TEMP_DIR,
                            downloadToken + ".zip",
                        );
                        fs.renameSync(zipPath, publicZipPath);
                        tempFiles.push(publicZipPath);

                        downloadLink = `${PUBLIC_DOWNLOAD_URL}/${downloadToken}`;
                        console.log(
                            `[envoyerRelances] ZIP trop gros (${zipSize} octets), lien public: ${downloadLink}`,
                        );
                    }
                }

                // Joindre le fichier s'il n'est pas trop gros
                if (attachmentPath) {
                    const fileSize = await getFileSize(attachmentPath);
                    if (fileSize <= MAX_ATTACHMENT_SIZE) {
                        emailData.attachments = emailData.attachments || [];
                        emailData.attachments.push({
                            filename: path.basename(attachmentPath),
                            path: attachmentPath,
                        });
                        console.log(
                            `[envoyerRelances] Pièce jointe ajoutée: ${path.basename(attachmentPath)} (${fileSize} octets)`,
                        );
                    } else {
                        // Fichier trop gros même individuellement
                        downloadToken = generateDownloadToken();
                        const ext = path.extname(attachmentPath);
                        const publicPath = path.join(
                            TEMP_DIR,
                            downloadToken + ext,
                        );
                        fs.renameSync(attachmentPath, publicPath);
                        tempFiles.push(publicPath);
                        downloadLink = `${PUBLIC_DOWNLOAD_URL}/${downloadToken}`;
                        console.log(
                            `[envoyerRelances] Fichier trop gros (${fileSize} octets), lien public: ${downloadLink}`,
                        );
                    }
                }

                // Ajouter le lien dans le contenu si pas de pièce jointe
                if (downloadLink) {
                    emailData.html += `<p><strong>Factures à télécharger:</strong> <a href="${downloadLink}">Télécharger toutes les factures</a></p>`;
                }
            }
        }

        const info = await transporter.sendMail(emailData);
        console.log(
            `[envoyerRelances] Email envoyé à ${contact ? contact.get("email") : "test"}: ${info.messageId}`,
        );

        return {
            success: true,
            messageId: info.messageId,
            tempFiles,
            downloadToken,
            downloadLink,
        };
    } catch (error) {
        console.error(`[envoyerRelances] Erreur envoi email: ${error.message}`);
        // Nettoyer les fichiers en cas d'erreur
        cleanupTempFiles(tempFiles);
        return { success: false, error: error.message };
    }
}

/**
 * Met à jour le statut d'une relance
 */
async function mettreAJourStatutRelance(relance, statut, details = {}) {
    relance.set("statut", statut);
    relance.set("date_envoi", new Date());

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

        for (const relance of relances.slice(0, limit)) {
            try {
                console.log(
                    `[envoyerRelances] Traitement relance ${relance.id}`,
                );

                if (!dryRun) {
                    const smtpProfil = relance.get("smtpProfil");
                    const transporter = await createSmtpTransporter(smtpProfil);

                    const result = await envoyerEmail(relance, transporter);

                    // Nettoyer les fichiers temporaires après envoi
                    if (result.tempFiles && result.tempFiles.length > 0) {
                        // Ne pas nettoyer immédiatement si on a un lien public
                        // (le fichier doit rester disponible pour téléchargement)
                        if (!result.downloadLink) {
                            cleanupTempFiles(result.tempFiles);
                        }
                    }

                    if (result.success) {
                        await mettreAJourStatutRelance(relance, "envoye", {
                            messageId: result.messageId,
                            downloadToken: result.downloadToken,
                            downloadLink: result.downloadLink,
                        });
                        stats.relancesEnvoyees++;
                        console.log(
                            `[envoyerRelances] Relance ${relance.id} envoyée avec succès`,
                        );
                    } else {
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

                    await journaliserEnvoi(
                        relance,
                        result.success ? "envoye" : "erreur",
                        result,
                    );
                } else {
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
