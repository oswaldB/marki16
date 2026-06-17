/**
 * Envoie des emails de test pour une séquence
 * Workflow: 01-sendSequenceTest
 * Utilise Ollama directement (identique à 02-generateRelances.js)
 * Étape 1 : Génération du contenu via Ollama
 * Étape 2 : Envoi via 02-sendEmails.js (intégré)
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const archiver = require("archiver");
const SftpClient = require("ssh2-sftp-client");

// Importer les fonctions d'envoi d'email (étape 2)
const { sendEmail, sendEmailViaSmtp } = require("./02-sendEmails");

// Configuration pour les pièces jointes
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10 Mo
const TEMP_DIR = "/tmp/adti-invoices-test";
const PUBLIC_DOWNLOAD_URL =
    process.env.PUBLIC_DOWNLOAD_URL ||
    "http://localhost:1555/download/invoices";

// Assurer que le dossier temporaire existe
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true, mode: 0o777 });
}

// Configuration Ollama (identique à 02-generateRelances.js)
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || "https://ollama.com/api";
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "mistral";
const USE_OLLAMA = process.env.USE_OLLAMA !== "false" && !!OLLAMA_API_KEY;

// Helper pour écriture dans le fichier de log
function writeLog(message, workflowName = "send-sequence-test") {
    const logDir = path.join(__dirname, "logs");
    const logFile = path.join(logDir, `${workflowName}.log`);

    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${message}\n`;

    try {
        fs.appendFileSync(logFile, logLine, "utf8");
    } catch (err) {
        console.error(
            "[logger] Impossible d'écrire dans le fichier de log:",
            err.message,
        );
    }
}

// =========================================================================
// FONCTIONS UTILITAIRES POUR LES PIÈCES JOINTES
// =========================================================================

/**
 * Génère un token unique pour le téléchargement
 */
function generateDownloadToken() {
    return crypto.randomBytes(32).toString("hex");
}

/**
 * Télécharge un PDF depuis SFTP
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
        console.error("[downloadPdfFromSftp] Erreur:", err.message);
        if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
        throw err;
    }
}

/**
 * Crée un ZIP à partir de plusieurs PDFs
 */
async function createZipFromPdfs(pdfPaths, outputPath) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outputPath);
        const archive = archiver("zip", { zlib: { level: 9 } });

        output.on("close", () => resolve(outputPath));
        archive.on("error", (err) => {
            output.close();
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
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
 */
async function getFileSize(filePath) {
    return new Promise((resolve) => {
        fs.stat(filePath, (err, stats) => resolve(err ? 0 : stats.size));
    });
}

/**
 * Nettoie les fichiers temporaires
 */
function cleanupTempFiles(files) {
    if (!files || files.length === 0) return;
    for (const file of files) {
        try {
            if (fs.existsSync(file)) fs.unlinkSync(file);
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
 * Prépare les pièces jointes à partir des impayés
 */
async function prepareAttachments(impayesArray) {
    const attachments = [];
    const tempFiles = [];
    let downloadLink = null;

    try {
        const pdfUrls = [];
        for (const impaye of impayesArray) {
            const impayeData = convertToSimpleObject(impaye);
            const urlPdf = impayeData.url_pdf || impayeData.get?.("url_pdf");
            if (urlPdf && !pdfUrls.includes(urlPdf)) {
                pdfUrls.push(urlPdf);
            }
        }

        if (pdfUrls.length === 0) {
            return { attachments, tempFiles, downloadLink };
        }

        const downloadedPdfs = [];
        for (const urlPdf of pdfUrls) {
            try {
                const localPath = await downloadPdfFromSftp(urlPdf);
                downloadedPdfs.push(localPath);
                tempFiles.push(localPath);
            } catch (err) {
                console.warn(
                    `[prepareAttachments] Impossible de télécharger ${urlPdf}: ${err.message}`,
                );
            }
        }

        if (downloadedPdfs.length === 0) {
            return { attachments, tempFiles, downloadLink };
        }

        if (downloadedPdfs.length === 1) {
            const fileSize = await getFileSize(downloadedPdfs[0]);
            if (fileSize <= MAX_ATTACHMENT_SIZE) {
                attachments.push({
                    filename: path.basename(downloadedPdfs[0]),
                    path: downloadedPdfs[0],
                });
                console.log(
                    `[prepareAttachments] Pièce jointe: ${path.basename(downloadedPdfs[0])} (${fileSize} octets)`,
                );
            } else {
                const downloadToken = generateDownloadToken();
                const ext = path.extname(downloadedPdfs[0]);
                const publicPath = path.join(TEMP_DIR, downloadToken + ext);
                fs.renameSync(downloadedPdfs[0], publicPath);
                tempFiles.push(publicPath);
                downloadLink = `${PUBLIC_DOWNLOAD_URL}/${downloadToken}`;
                console.log(
                    `[prepareAttachments] Fichier trop gros (${fileSize} octets), lien: ${downloadLink}`,
                );
            }
        } else {
            const zipName = `factures_test_${Date.now()}.zip`;
            const zipPath = path.join(TEMP_DIR, zipName);
            await createZipFromPdfs(downloadedPdfs, zipPath);
            tempFiles.push(zipPath);

            const zipSize = await getFileSize(zipPath);
            if (zipSize <= MAX_ATTACHMENT_SIZE) {
                attachments.push({ filename: zipName, path: zipPath });
                console.log(
                    `[prepareAttachments] ZIP: ${zipName} (${zipSize} octets)`,
                );
            } else {
                const downloadToken = generateDownloadToken();
                const publicZipPath = path.join(
                    TEMP_DIR,
                    downloadToken + ".zip",
                );
                fs.renameSync(zipPath, publicZipPath);
                tempFiles.push(publicZipPath);
                downloadLink = `${PUBLIC_DOWNLOAD_URL}/${downloadToken}`;
                console.log(
                    `[prepareAttachments] ZIP trop gros (${zipSize} octets), lien: ${downloadLink}`,
                );
            }

            for (const pdfPath of downloadedPdfs) {
                try {
                    if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
                } catch (e) {}
            }
        }

        return { attachments, tempFiles, downloadLink };
    } catch (err) {
        console.error("[prepareAttachments] Erreur:", err.message);
        cleanupTempFiles(tempFiles);
        return { attachments: [], tempFiles: [], downloadLink: null };
    }
}

/**
 * Helper pour accéder aux propriétés d'un objet Parse ou JSON
 */
function getValue(obj, key) {
    if (!obj) return undefined;
    if (typeof obj.get === "function") {
        return obj.get(key);
    }
    if (typeof obj === "object" && key in obj) {
        return obj[key];
    }
    return undefined;
}

/**
 * Convertit un objet Parse en objet simple pour le template
 */
function convertToSimpleObject(parseObj) {
    if (!parseObj || !parseObj.get) return parseObj;

    const result = {};
    const attributes = parseObj.attributes || parseObj;

    for (const key of Object.keys(attributes)) {
        const value = attributes[key];
        if (value && typeof value === "object" && value.get) {
            result[key] = convertToSimpleObject(value);
        } else if (value instanceof Date) {
            result[key] = value.toISOString();
        } else {
            result[key] = value;
        }
    }
    return result;
}

/**
 * Prépare les données d'impayé
 */
function prepareImpayeData(impaye, payeur) {
    const impayeData = convertToSimpleObject(impaye);
    const payeurData = convertToSimpleObject(payeur);

    return {
        ...impayeData,
        payeur_nom: payeurData.nom || impayeData.payeur_nom || "",
        payeur_email: payeurData.email || impayeData.payeur_email || "",
        payeur_telephone:
            payeurData.telephone || impayeData.payeur_telephone || "",
        payeur_type: payeurData.type_personne || impayeData.payeur_type || "",
        payeur_adresse: payeurData.adresse || impayeData.payeur_adresse || "",
        societe: payeurData.societe || payeurData.nom || "",
        nfacture: impayeData.nfacture || "",
        ref_piece: impayeData.ref_piece || "",
        date_piece: impayeData.date_piece || "",
        date_echeance: impayeData.date_echeance || "",
        reste_a_payer:
            impayeData.reste_a_payer || impayeData.montant_total || 0,
        montant_total:
            impayeData.montant_total || impayeData.reste_a_payer || 0,
        adresse_bien: impayeData.adresse_bien || "",
        code_postal: impayeData.code_postal || "",
        ville: impayeData.ville || "",
        numero_dossier: impayeData.numero_dossier || "",
        contact_relance: {
            nom: payeurData.nom || "",
            email: payeurData.email || "",
            telephone: payeurData.telephone || "",
        },
    };
}

/**
 * Prépare les données pour un impayé multiple (consolidé)
 */
function prepareMultipleImpayeData(impayesArray, payeur) {
    if (impayesArray.length === 1) {
        return prepareImpayeData(impayesArray[0], payeur);
    }

    const payeurData = convertToSimpleObject(payeur);

    // Calculer les totaux
    const totalResteAPayer = impayesArray.reduce((sum, i) => {
        const data = convertToSimpleObject(i);
        return (
            sum +
            (parseFloat(data.reste_a_payer) ||
                parseFloat(data.montant_total) ||
                0)
        );
    }, 0);

    const totalMontant = impayesArray.reduce((sum, i) => {
        const data = convertToSimpleObject(i);
        return sum + (parseFloat(data.montant_total) || 0);
    }, 0);

    // Liste des numéros de facture
    const nfactures = impayesArray
        .map((i) => convertToSimpleObject(i).nfacture)
        .filter(Boolean)
        .join(", ");
    const ndossiers = impayesArray
        .map((i) => convertToSimpleObject(i).numero_dossier)
        .filter(Boolean)
        .join(", ");

    return {
        payeur_nom: payeurData.nom || "",
        payeur_email: payeurData.email || "",
        payeur_telephone: payeurData.telephone || "",
        payeur_type: payeurData.type_personne || "",
        payeur_adresse: payeurData.adresse || "",
        societe: payeurData.societe || payeurData.nom || "",
        nfacture: nfactures,
        ref_piece: impayesArray
            .map((i) => convertToSimpleObject(i).ref_piece)
            .filter(Boolean)
            .join(", "),
        reste_a_payer: totalResteAPayer,
        montant_total: totalMontant,
        nfactures_liste: impayesArray.map((i) => convertToSimpleObject(i)),
        multiple: true,
        count_impayes: impayesArray.length,
        contact_relance: {
            nom: payeurData.nom || "",
            email: payeurData.email || "",
            telephone: payeurData.telephone || "",
        },
    };
}

// =========================================================================
// FONCTIONS OLLAMA (identiques à 02-generateRelances.js)
// =========================================================================

/**
 * Construit le prompt pour l'LLM
 * Identique à buildPrompt dans 02-generateRelances.js
 */
const buildPrompt = (scenario, impayes, history, emailIndex) => {
    const impayesJson = JSON.stringify(
        impayes.map((i) => convertToSimpleObject(i)),
    );
    const historyJson = JSON.stringify(
        history.map((h) => convertToSimpleObject(h)),
    );

    return `Tu es un redacteur de relances d'impayés par email. Ta mission consiste à générer l'objet et le corps de l'email à partir d'un template, des informations des impayes et de l'historique.

Tu ne fais que remplacer les variables.
Tu ne changes pas les textes.

Quelques règles importantes:
+ Si tu vois du markdown tu le convertis en html surtout pour les liens.
+ Pour le payeur_nom si celui-ci n'est pas une personne alors tu mets vide. Par exemple Bonjour INDIVISION toto doit devenir Bonjour,
+ Pas de virgule avec un espace avant
+ Si tu mets un tableau alors il faut un border sur tous les td.
+ Si la date d'échéance est arrivée avant alors il faut accorder les temps en fonction.
+ Si l'email dit que l'on applique les taux de pénalités alors il faut rajouter 40€ au montant TTC.

---
Voici les informations :
+ la trame d'email:
  objet: ${scenario.objet || ""}
  corps: ${scenario.corps || ""}
+ les informations sur les impayés: ${impayesJson}
+ l'historique: ${historyJson}
+ informations supplémentaires:
  email_index: ${emailIndex}

Génère un objet JSON avec exactement ces champs: {"objet": "...", "corps": "..."}`;
};

/**
 * Génère le contenu de l'email via l'API Ollama
 * Identique à generateEmailContent dans 02-generateRelances.js
 */
async function generateEmailContent(prompt) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    try {
        const response = await fetch(`${OLLAMA_API_URL}/generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${OLLAMA_API_KEY}`,
            },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt: prompt,
                stream: false,
                format: "json",
                options: {
                    temperature: 0.1,
                    top_p: 0.9,
                    num_predict: 4096,
                },
            }),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}: ${await response.text()}`,
            );
        }

        const data = await response.json();
        const rawResponse = data.response || data.choices?.[0]?.text || "";

        // Extraire et parser le JSON
        const jsonMatch = rawResponse.match(/\{[\[\]\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : rawResponse;
        const jsonResponse = JSON.parse(jsonStr);

        if (jsonResponse.objet && jsonResponse.corps) {
            return { objet: jsonResponse.objet, corps: jsonResponse.corps };
        }

        // Fallback si réponse incomplète
        return {
            objet: jsonResponse.objet || "Relance d'impayé",
            corps:
                jsonResponse.corps ||
                jsonResponse.body ||
                "<p>Contenu à compléter</p>",
        };
    } catch (err) {
        clearTimeout(timeoutId);
        throw err;
    }
}

// =========================================================================
// ENVOI DES EMAILS DE TEST
// =========================================================================

/**
 * Envoie les emails de test avec Ollama (appel direct à l'API)
 */
async function envoyerEmailsDeTest(
    emails,
    impayes,
    payeur,
    testEmail,
    payeurData,
    startedAt,
) {
    const impayesArray = Array.isArray(impayes) ? impayes : [impayes];
    const isMultiple = impayesArray.length > 1;

    let emailsSent = 0;

    for (const email of emails) {
        if (!email.scenarios || !Array.isArray(email.scenarios)) {
            console.warn(`Pas de scénarios valides pour cet email`);
            continue;
        }

        // Utiliser le scénario actif de l'email, ou déterminer automatiquement
        const scenarioActif =
            email.activeScenario || (isMultiple ? "multiple" : "single");
        console.log(
            `Scénario utilisé: ${scenarioActif} (${impayesArray.length} impayé(s)), email.activeScenario=${email.activeScenario}`,
        );

        const scenario = email.scenarios.find(
            (s) => s.format === scenarioActif,
        );

        if (!scenario) {
            console.warn(
                `Scénario ${scenarioActif} non trouvé pour l'email, essayons de trouver un scénario actif...`,
            );
            // Essayer de trouver un scénario actif parmi tous les scénarios
            const activeScenario = email.scenarios.find(
                (s) => s.active !== false,
            );
            if (activeScenario) {
                console.log(
                    `  -> Utilisation du premier scénario actif: ${activeScenario.format}`,
                );

                try {
                    // Préparer les données de l'impayé
                    const impayeData = isMultiple
                        ? prepareMultipleImpayeData(impayesArray, payeur)
                        : prepareImpayeData(impayesArray[0], payeur);

                    // Préparer les pièces jointes
                    const { attachments, tempFiles, downloadLink } =
                        await prepareAttachments(impayesArray);
                    let corpsWithLink = null;

                    // Générer l'email via Ollama (appel direct)
                    console.log(
                        `[Ollama] Génération pour scénario ${activeScenario.format}...`,
                    );

                    let objet, corps;
                    const emailIndex =
                        email.email_index !== undefined ? email.email_index : 0;

                    if (USE_OLLAMA) {
                        const prompt = buildPrompt(
                            activeScenario,
                            impayesArray,
                            [], // Pas d'historique pour le test
                            emailIndex,
                        );
                        const result = await generateEmailContent(prompt);
                        objet = result.objet;
                        corps = result.corps;
                        console.log(`[Ollama] Contenu généré par LLM`);
                    } else {
                        // Fallback sans Ollama
                        objet =
                            activeScenario.objet ||
                            activeScenario.object ||
                            "Relance - Facture impayée";
                        corps =
                            activeScenario.corps ||
                            activeScenario.body ||
                            "Veuillez régulariser votre situation.";
                        console.log(
                            `[Ollama] Mode fallback (USE_OLLAMA=false)`,
                        );
                    }

                    // Ajouter le lien de téléchargement si pas de pièce jointe
                    if (downloadLink) {
                        corpsWithLink =
                            corps +
                            `<p><strong>Factures à télécharger:</strong> <a href="${downloadLink}">Télécharger toutes les factures</a></p>`;
                    }

                    console.log(`Objet généré: ${objet.substring(0, 80)}...`);

                    const smtpId = activeScenario.smtp || email.smtp;

                    try {
                        if (smtpId) {
                            await sendEmailViaSmtp({
                                smtpId: smtpId,
                                to: testEmail,
                                subject: objet,
                                html: corpsWithLink || corps,
                                text: (corpsWithLink || corps).replace(
                                    /<[^>]*>/g,
                                    "",
                                ),
                                attachments:
                                    attachments.length > 0
                                        ? attachments
                                        : undefined,
                            });
                        } else {
                            await sendEmail({
                                to: testEmail,
                                subject: objet,
                                html: corpsWithLink || corps,
                                text: (corpsWithLink || corps).replace(
                                    /<[^>]*>/g,
                                    "",
                                ),
                                attachments:
                                    attachments.length > 0
                                        ? attachments
                                        : undefined,
                            });
                        }
                        emailsSent++;
                        console.log(
                            `✅ Email envoyé via ${smtpId ? "SMTP" : "défaut"} avec ${attachments.length} pièce(s) jointe(s)`,
                        );
                    } catch (emailError) {
                        console.error(
                            `❌ Erreur envoi email ${smtpId ? "via SMTP " + smtpId : "par défaut"}:`,
                            emailError.message,
                        );
                    } finally {
                        if (!downloadLink) cleanupTempFiles(tempFiles);
                    }
                } catch (genError) {
                    console.error(
                        `❌ Erreur génération Ollama:`,
                        genError.message,
                    );
                }

                await new Promise((resolve) => setTimeout(resolve, 1000));
                continue;
            }
            console.warn(`Aucun scénario valide trouvé pour l'email`);
            continue;
        }

        try {
            // Préparer les données de l'impayé
            const impayeData = isMultiple
                ? prepareMultipleImpayeData(impayesArray, payeur)
                : prepareImpayeData(impayesArray[0], payeur);

            // Préparer les pièces jointes
            const { attachments, tempFiles, downloadLink } =
                await prepareAttachments(impayesArray);
            let corpsWithLink = null;

            // Générer l'email via Ollama (appel direct)
            console.log(
                `[Ollama] Génération pour scénario ${scenario.format}...`,
            );

            let objet, corps;
            const emailIndex =
                email.email_index !== undefined ? email.email_index : 0;

            if (USE_OLLAMA) {
                const prompt = buildPrompt(
                    scenario,
                    impayesArray,
                    [], // Pas d'historique pour le test
                    emailIndex,
                );
                const result = await generateEmailContent(prompt);
                objet = result.objet;
                corps = result.corps;
                console.log(`[Ollama] Contenu généré par LLM`);
            } else {
                // Fallback sans Ollama
                objet =
                    scenario.objet ||
                    scenario.object ||
                    "Relance - Facture impayée";
                corps =
                    scenario.corps ||
                    scenario.body ||
                    "Veuillez régulariser votre situation.";
                console.log(`[Ollama] Mode fallback (USE_OLLAMA=false)`);
            }

            // Ajouter le lien de téléchargement si pas de pièce jointe
            if (downloadLink) {
                corpsWithLink =
                    corps +
                    `<p><strong>Factures à télécharger:</strong> <a href="${downloadLink}">Télécharger toutes les factures</a></p>`;
            }

            console.log(`Objet généré: ${objet.substring(0, 80)}...`);

            const smtpId = scenario.smtp || email.smtp;

            try {
                if (smtpId) {
                    await sendEmailViaSmtp({
                        smtpId: smtpId,
                        to: testEmail,
                        subject: objet,
                        html: corpsWithLink || corps,
                        text: (corpsWithLink || corps).replace(/<[^>]*>/g, ""),
                        attachments:
                            attachments.length > 0 ? attachments : undefined,
                    });
                } else {
                    await sendEmail({
                        to: testEmail,
                        subject: objet,
                        html: corpsWithLink || corps,
                        text: (corpsWithLink || corps).replace(/<[^>]*>/g, ""),
                        attachments:
                            attachments.length > 0 ? attachments : undefined,
                    });
                }
                emailsSent++;
                console.log(
                    `✅ Email envoyé via ${smtpId ? "SMTP" : "défaut"} avec ${attachments.length} pièce(s) jointe(s)`,
                );
            } catch (emailError) {
                console.error(
                    `❌ Erreur envoi email ${smtpId ? "via SMTP " + smtpId : "par défaut"}:`,
                    emailError.message,
                );
            } finally {
                if (!downloadLink) cleanupTempFiles(tempFiles);
            }
        } catch (genError) {
            console.error(`❌ Erreur génération Ollama:`, genError.message);
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const result = {
        success: true,
        sentEmails: emailsSent,
        totalEmails: emails.length,
        message: `${emailsSent} emails de test envoyés à ${testEmail}`,
        impayesCount: isMultiple ? impayes.length : 1,
        usingMultipleFormat: isMultiple,
        useOllama: USE_OLLAMA,
    };

    // Persistance du log dans le fichier
    const finishedAt = new Date();
    writeLog(
        `SUCCESS: ${emailsSent}/${emails.length} emails envoyés à ${testEmail} (${finishedAt - startedAt}ms) | USE_OLLAMA=${USE_OLLAMA}`,
    );

    return result;
}

// =========================================================================
// FONCTION PRINCIPALE
// =========================================================================

/**
 * Fonction principale pour envoyer des emails de test
 * @param {Object} request - Requête Parse Cloud
 * @returns {Promise<Object>} Résultat
 */
async function sendSequenceTest(request) {
    const startedAt = new Date();
    const { sequenceId, testEmail, payeurId, payeurData } = request.params;

    // Validation
    if (!sequenceId || !testEmail || !payeurId) {
        throw new Error(
            "Paramètres manquants: sequenceId, testEmail et payeurId sont requis",
        );
    }

    // Récupérer la séquence
    const Sequence = Parse.Object.extend("Sequence");
    const query = new Parse.Query(Sequence);
    const sequence = await query.get(sequenceId);

    // Récupérer les emails de la séquence
    let emails = request.params.emails;
    if (!emails || emails.length === 0) {
        emails = sequence.get("emails") || [];
    }

    if (emails.length === 0) {
        throw new Error("La séquence ne contient aucun email");
    }

    // Récupérer le payeur
    const Contact = Parse.Object.extend("Contact");
    const payeurQuery = new Parse.Query(Contact);
    const payeur = await payeurQuery.get(payeurId);

    // Récupérer les impayés non soldés pour ce payeur
    const Impaye = Parse.Object.extend("Impaye");
    const impayeQuery = new Parse.Query(Impaye);
    impayeQuery.equalTo("payeur", payeur);
    impayeQuery.equalTo("facture_soldee", false);
    impayeQuery.limit(100);

    const impayes = await impayeQuery.find({ useMasterKey: true });

    // Si aucun impayé non soldé, essayer avec tous les impayés
    if (impayes.length === 0) {
        console.log(
            `⚠ Aucun impayé non soldé trouvé pour ${payeur.get("nom")}`,
        );

        const allImpayeQuery = new Parse.Query(Impaye);
        allImpayeQuery.equalTo("payeur", payeur);
        allImpayeQuery.limit(100);
        const allImpayes = await allImpayeQuery.find({ useMasterKey: true });

        if (allImpayes.length === 0) {
            throw new Error(
                `Aucun impayé trouvé pour le payeur ${payeur.get("nom")}`,
            );
        }

        console.log(
            `✓ Utilisation de ${allImpayes.length} impayé(s) pour le test`,
        );
        return envoyerEmailsDeTest(
            emails,
            allImpayes,
            payeur,
            testEmail,
            payeurData,
            startedAt,
        );
    }

    console.log(
        `✓ ${impayes.length} impayé(s) non soldé(s) trouvé(s) pour le test`,
    );
    const impayesToUse = impayes.length === 1 ? [impayes[0]] : impayes;
    return envoyerEmailsDeTest(
        emails,
        impayesToUse,
        payeur,
        testEmail,
        payeurData,
        startedAt,
    );
}

module.exports = sendSequenceTest;
