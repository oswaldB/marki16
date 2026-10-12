// backend/cloud/workflows/generate-suivis-du-jour/index.js
// Méga-fonction Parse Cloud Code de génération quotidienne des suivis.
// Exécutée tous les jours à 17h20 (Paris).
// Seul le suivi théoriquement dû ce jour (selon la fréquence) est généré.

const Parse = require("parse/node");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

// ─── Configuration ────────────────────────────────────────────────────────────
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || "https://ollama.com/api";
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "mistral-large-3:675b";
const FRONTEND_URL = process.env.FRONTEND_URL || "https://adti.markidiags.com";
const PROMPT_BASE_PATH = "/home/ubuntu/prod/adti/configuration/prompts/scenarios";

// ─── Log interne ──────────────────────────────────────────────────────────────
function log(level, contactId, emailIndex, message) {
    const timestamp = new Date().toISOString();
    const prefix = contactId && emailIndex !== undefined
        ? `[${level}][${contactId}][${emailIndex}]`
        : `[GENERATE-SUIVIS-DU-JOUR][${level}]`;
    const logLine = `${timestamp} ${prefix} ${message}\n`;
    console.log(logLine.trim());
    try {
        const logDir = path.join(__dirname, "logs");
        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
        const logFile = path.join(logDir, `generate-suivis-du-jour-${new Date().toISOString().split("T")[0]}.log`);
        fs.appendFileSync(logFile, logLine);
    } catch (err) {
        console.error("Erreur log:", err.message);
    }
}

// ─── Vérification fréquence ───────────────────────────────────────────────────
function isFrequencyValid(frequence) {
    if (!frequence) return false;

    const aujourdhui = new Date();
    const jourDuMois = aujourdhui.getDate();
    const jourSemaine = aujourdhui.getDay(); // 0=dimanche, 1=lundi...

    const JOURS_SEMAINE = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

    // Nouveau format : objet structuré
    if (typeof frequence === "object" && frequence.type) {
        const type = frequence.type;
        const hour = parseInt(frequence.hour) || 0;
        const dayOfWeek = parseInt(frequence.dayOfWeek);
        const dayOfMonth = parseInt(frequence.dayOfMonth);

        const heureActuelle = aujourdhui.getHours();
        if (heureActuelle < hour) {
            return false;
        }

        switch (type) {
            case "quotidien":
                return true;
            case "hebdomadaire":
                return jourSemaine === (dayOfWeek || 1);
            case "mensuel":
                return jourDuMois === (dayOfMonth || 1);
            default:
                return false;
        }
    }

    // Ancien format : string (compatibilité descendante)
    const freqStr = String(frequence).toLowerCase();

    if (freqStr === "quotidien") return true;
    if (freqStr === "hebdomadaire") {
        return jourSemaine === 1; // Lundi
    }
    if (/^\d+$/.test(freqStr)) {
        return jourDuMois === parseInt(freqStr);
    }
    if (JOURS_SEMAINE.includes(freqStr)) {
        return JOURS_SEMAINE[jourSemaine] === freqStr;
    }

    return false;
}

// ─── Récupération broker impayés ──────────────────────────────────────────────
async function getBrokerImpayes(contact, currentImpayes) {
    const currentImpayeIds = new Set(currentImpayes.map((i) => i.id));
    const Impaye = Parse.Object.extend("Impaye");
    const query = new Parse.Query(Impaye);
    query.equalTo("facture_soldee", false);
    query.greaterThan("reste_a_payer", 0);
    query.equalTo("apporteur", contact);
    query.notEqualTo("payeur", contact);
    query.notEqualTo("contact_relance", contact);
    if (currentImpayeIds.size > 0) query.notContainedIn("objectId", Array.from(currentImpayeIds));
    query.limit(999999);
    try {
        return await query.find({ useMasterKey: true });
    } catch (error) {
        log("ERROR", contact.id, null, `Erreur récupération broker impayés: ${error.message}`);
        return [];
    }
}

// ─── Détection scénario ───────────────────────────────────────────────────────
function determineScenarioType(contact, impayes, brokerImpayes) {
    const contactType = contact.get("type_personne");
    const isBroker = contactType === "Apporteur d'affaire" ||
                     contactType === "Apporteur" ||
                     contactType === "apporteur" ||
                     contactType === "apporteur d'affaire";
    const hasBrokerImpayes = brokerImpayes && brokerImpayes.length > 0;
    const hasOwnImpayes = impayes.length > 0;

    const uniqueNfactures = new Set(impayes.map(i => i.get("nfacture")).filter(Boolean));
    const isSingleFacture = uniqueNfactures.size <= 1;

    if (isBroker && hasBrokerImpayes && hasOwnImpayes) return "both";
    if (isBroker && hasBrokerImpayes) return "broker";
    if (impayes.length === 1 || isSingleFacture) return "single";
    return "multiple";
}

// ─── Fonction principale ──────────────────────────────────────────────────────
async function generateSuivisDuJour() {
    log("INFO", null, null, "=== DÉMARRAGE generate-suivis-du-jour ===");

    let suivisCrees = 0;
    let suivisIgnorees = 0;
    let contactsIgnores = 0;
    let erreurs = 0;

    try {
        // ═══════════════════════════════════════════════════════════════════════
        // ÉTAPE 1 : RÉCUPÉRATION DES IMPAYÉS ACTIFS AVEC SÉQUENCE SUIVI
        // ═══════════════════════════════════════════════════════════════════════
        log("INFO", null, null, "Étape 1: Récupération impayés actifs avec séquence suivi...");

        const Impaye = Parse.Object.extend("Impaye");
        const impayeQuery = new Parse.Query(Impaye);
        impayeQuery.equalTo("facture_soldee", false);
        impayeQuery.greaterThan("reste_a_payer", 0);
        impayeQuery.exists("sequence");
        impayeQuery.include(["sequence", "contact_relance", "payeur"]);
        impayeQuery.limit(999999);

        const impayesBruts = await impayeQuery.find({ useMasterKey: true });
        log("INFO", null, null, `${impayesBruts.length} impayés bruts récupérés`);

        // ═══════════════════════════════════════════════════════════════════════
        // ÉTAPE 2 : FILTRAGE INITIAL
        // ═══════════════════════════════════════════════════════════════════════
        log("INFO", null, null, "Étape 2: Filtrage initial...");

        const impayesEligibles = [];
        for (const impaye of impayesBruts) {
            const sequence = impaye.get("sequence");
            if (!sequence || sequence.get("type") !== "suivi" || !sequence.get("publiee")) continue;

            let contact = impaye.get("contact_relance");
            if (!contact) contact = impaye.get("payeur");
            if (!contact) continue;
            if (contact.get("isBlacklisted") === true) continue;
            if (impaye.get("isBlacklisted") === true) continue;

            const email = contact.get("email");
            if (typeof email !== "string" || email.trim().length === 0 || email.indexOf("@") <= 0 || email.indexOf("@") === email.length - 1) continue;

            impayesEligibles.push(impaye);
        }
        log("INFO", null, null, `Après filtrage: ${impayesEligibles.length} impayés éligibles`);

        if (impayesEligibles.length === 0) {
            log("INFO", null, null, "Aucun impayé éligible");
            return { success: true, suivisCrees: 0, suivisIgnorees: 0, contactsIgnores: 0, erreurs: 0, message: "Aucun impayé éligible" };
        }

        // ═══════════════════════════════════════════════════════════════════════
        // ÉTAPE 3 : REGROUPEMENT PAR (contact.id, sequence.id)
        // ═══════════════════════════════════════════════════════════════════════
        log("INFO", null, null, "Étape 3: Regroupement par contact + séquence...");

        const groupes = new Map();
        for (const impaye of impayesEligibles) {
            let contact = impaye.get("contact_relance");
            if (!contact) contact = impaye.get("payeur");
            const sequence = impaye.get("sequence");
            if (!contact || !sequence) continue;

            const key = `${contact.id}_${sequence.id}`;
            if (!groupes.has(key)) {
                groupes.set(key, { contact, sequence, impayes: [] });
            }
            groupes.get(key).impayes.push(impaye);
        }
        log("INFO", null, null, `${groupes.size} groupes (contact, séquence) à traiter`);

        // ═══════════════════════════════════════════════════════════════════════
        // ÉTAPE 4 : TRAITEMENT PAR GROUPE
        // ═══════════════════════════════════════════════════════════════════════
        const aujourdhui = new Date();
        aujourdhui.setHours(0, 0, 0, 0);

        for (const [groupKey, { contact, sequence, impayes }] of groupes) {
            const contactId = contact.id;

            try {
                // ── a. RÉCUPÉRATION DES EMAILS DE LA SÉQUENCE ───────────────────
                const emails = sequence.get("emails") || [];
                if (emails.length === 0) {
                    contactsIgnores++;
                    log("INFO", contactId, null, "Séquence sans emails, ignoré");
                    continue;
                }

                // ── b. DÉTERMINATION DES EMAILS DONT LA FRÉQUENCE CORRESPOND ────
                const emailsDuJour = emails.filter(e => isFrequencyValid(e.frequence));
                if (emailsDuJour.length === 0) {
                    contactsIgnores++;
                    log("INFO", contactId, null, "Aucune fréquence ne correspond à aujourd'hui, ignoré");
                    continue;
                }

                // ── c. RÉCUPÉRATION DE L'HISTORIQUE DES SUIVIS ─────────────────
                const Suivi = Parse.Object.extend("Suivi");
                const histQuery = new Parse.Query(Suivi);
                histQuery.equalTo("contact", contact);
                histQuery.equalTo("sequence", sequence);
                histQuery.equalTo("manuelle", false);
                histQuery.exists("dateEnvoi");
                histQuery.descending("dateEnvoi");
                histQuery.limit(50);
                const historiqueSuivis = await histQuery.find({ useMasterKey: true });

                // Map des email_index déjà envoyés aujourd'hui
                const todayStart = new Date(aujourdhui);
                const todayEnd = new Date(aujourdhui);
                todayEnd.setDate(todayEnd.getDate() + 1);

                const indexEnvoyesAujourdhui = new Set();
                for (const s of historiqueSuivis) {
                    const de = s.get("dateEnvoi");
                    if (de && de >= todayStart && de < todayEnd) {
                        indexEnvoyesAujourdhui.add(s.get("email_index"));
                    }
                }

                // ── d. TRAITEMENT DE CHAQUE EMAIL DU JOUR ───────────────────────
                for (const emailConfig of emailsDuJour) {
                    const prochainIndex = emailConfig.email_index;

                    // Vérifier si déjà envoyé aujourd'hui
                    if (indexEnvoyesAujourdhui.has(prochainIndex)) {
                        suivisIgnorees++;
                        log("INFO", contactId, prochainIndex, `Suivi déjà envoyé aujourd'hui, ignoré`);
                        continue;
                    }

                    // Vérifier doublon suivi non envoyé (prêt pour envoi)
                    const existingQuery = new Parse.Query(Suivi);
                    existingQuery.equalTo("contact", contact);
                    existingQuery.equalTo("sequence", sequence);
                    existingQuery.equalTo("email_index", prochainIndex);
                    existingQuery.equalTo("manuelle", false);
                    existingQuery.equalTo("statut", "pret pour envoi");
                    const existingSuivi = await existingQuery.first({ useMasterKey: true });
                    if (existingSuivi) {
                        suivisIgnorees++;
                        log("INFO", contactId, prochainIndex, `Suivi déjà en attente (${existingSuivi.id}), ignoré`);
                        continue;
                    }

                    // ── e. DÉTECTION SCÉNARIO ──────────────────────────────────
                    const brokerImpayes = await getBrokerImpayes(contact, impayes);
                    const scenarioType = determineScenarioType(contact, impayes, brokerImpayes);

                    // ── f. SÉLECTION SCÉNARIO ACTIF + FALLBACK ──────────────────
                    const scenarios = emailConfig.scenarios || [];
                    let scenarioActif = scenarios.find((s) => s.format === scenarioType && s.active);
                    if (!scenarioActif) {
                        if (scenarioType === "both") scenarioActif = scenarios.find((s) => s.format === "multiple" && s.active);
                        if (!scenarioActif && scenarioType === "broker") scenarioActif = scenarios.find((s) => s.format === "single" && s.active);
                        if (!scenarioActif) scenarioActif = scenarios.find((s) => s.format === "multiple" && s.active);
                        if (!scenarioActif) scenarioActif = scenarios.find((s) => s.format === "single" && s.active);
                    }
                    if (!scenarioActif) {
                        suivisIgnorees++;
                        log("INFO", contactId, prochainIndex, `Aucun scénario actif trouvé (même après fallback), ignoré`);
                        continue;
                    }

                    // ── g. GÉNÉRATION DU CONTENU (Ollama) ────────────────────────
                    const promptFile = path.join(PROMPT_BASE_PATH, `suivi-${scenarioType}-prompt.txt`);
                    let promptTemplate;
                    try {
                        promptTemplate = fs.readFileSync(promptFile, "utf-8");
                    } catch (err) {
                        log("ERROR", contactId, prochainIndex, `Impossible de charger le prompt ${promptFile}: ${err.message}`);
                        throw err;
                    }

                    const impayesJson = JSON.stringify(impayes.map((i) => ({
                        id: i.id,
                        nfacture: i.get("nfacture"),
                        reference: i.get("reference"),
                        ref_piece: i.get("ref_piece"),
                        numero_dossier: i.get("numero_dossier"),
                        id_dossier: i.get("id_dossier"),
                        date_piece: i.get("date_piece"),
                        date_echeance: i.get("date_echeance"),
                        total_ht: i.get("total_ht"),
                        total_ttc: i.get("total_ttc"),
                        montant_total: i.get("montant_total"),
                        reste_a_payer: i.get("reste_a_payer"),
                        facture_soldee: i.get("facture_soldee"),
                        commentaire_piece: i.get("commentaire_piece"),
                        payeur_nom: i.get("payeur_nom"),
                        payeur_prenom: i.get("payeur_prenom"),
                        payeur_email: i.get("payeur_email"),
                        payeur_telephone: i.get("payeur_telephone"),
                        payeur_civilite: i.get("payeur_civilite"),
                        payeur_type: i.get("payeur_type"),
                        adresse_bien: i.get("adresse_bien"),
                        ville: i.get("ville"),
                        code_postal: i.get("code_postal"),
                        url_pdf: i.get("url_pdf"),
                        apporteur_nom: i.get("apporteur_nom"),
                        apporteur_prenom: i.get("apporteur_prenom"),
                        apporteur_email: i.get("apporteur_email"),
                        apporteur_telephone: i.get("apporteur_telephone"),
                        apporteur_civilite: i.get("apporteur_civilite"),
                        apporteur_societe: i.get("apporteur_societe"),
                        proprietaire_nom: i.get("proprietaire_nom"),
                        proprietaire_prenom: i.get("proprietaire_prenom"),
                        proprietaire_email: i.get("proprietaire_email"),
                        proprietaire_telephone: i.get("proprietaire_telephone"),
                        proprietaire_civilite: i.get("proprietaire_civilite"),
                        donneur_ordre_nom: i.get("donneur_ordre_nom"),
                        donneur_ordre_prenom: i.get("donneur_ordre_prenom"),
                        donneur_ordre_email: i.get("donneur_ordre_email"),
                        donneur_ordre_telephone: i.get("donneur_ordre_telephone"),
                        donneur_ordre_civilite: i.get("donneur_ordre_civilite"),
                    })));

                    const history = historiqueSuivis
                        .filter((r) => {
                            const arr = r.get("impayes") || [];
                            const impayeIds = new Set(impayes.map((i) => i.id));
                            return arr.some((imp) => {
                                const impId = imp.id || imp.objectId;
                                return impayeIds.has(impId);
                            });
                        })
                        .map((r) => ({
                            statut: r.get("statut"),
                            dateEnvoi: r.get("dateEnvoi"),
                            objet: r.get("objet"),
                            scenario: r.get("scenario"),
                            email_index: r.get("email_index"),
                            frequence: r.get("frequence"),
                        }));
                    const historyJson = JSON.stringify(history);

                    const contactJson = JSON.stringify({
                        id: contact.id,
                        nom: contact.get("nom"),
                        prenom: contact.get("prenom"),
                        email: contact.get("email"),
                        telephone: contact.get("telephone"),
                        civilite: contact.get("civilite"),
                        type_personne: contact.get("type_personne"),
                    });

                    const now = new Date();
                    const dateJour = now.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

                    const objetTemplateBrut = scenarioActif.objet || emailConfig.objet || "";
                    const corpsTemplateBrut = scenarioActif.corps || emailConfig.corps || "";

                    let prompt = promptTemplate
                        .replace(/{{objetTemplate}}/g, objetTemplateBrut)
                        .replace(/{{corpsTemplate}}/g, corpsTemplateBrut)
                        .replace(/{{impayesJson}}/g, impayesJson)
                        .replace(/{{historyJson}}/g, historyJson)
                        .replace(/{{emailIndex}}/g, String(prochainIndex))
                        .replace(/{{contactJson}}/g, contactJson)
                        .replace(/{{scenarioType}}/g, scenarioType)
                        .replace(/{{nombreImpayes}}/g, String(impayes.length))
                        .replace(/{{dateJour}}/g, dateJour);

                    if (scenarioType === "broker" || scenarioType === "both") {
                        const brokerJson = JSON.stringify(brokerImpayes.map((i) => ({
                            id: i.id,
                            nfacture: i.get("nfacture"),
                            reference: i.get("reference"),
                            numero_dossier: i.get("numero_dossier"),
                            date_piece: i.get("date_piece"),
                            date_echeance: i.get("date_echeance"),
                            total_ttc: i.get("total_ttc"),
                            reste_a_payer: i.get("reste_a_payer"),
                            adresse_bien: i.get("adresse_bien"),
                            ville: i.get("ville"),
                            code_postal: i.get("code_postal"),
                            payeur_nom: i.get("payeur_nom"),
                            payeur_prenom: i.get("payeur_prenom"),
                            payeur_email: i.get("payeur_email"),
                            apporteur_nom: i.get("apporteur_nom"),
                            apporteur_prenom: i.get("apporteur_prenom"),
                            apporteur_societe: i.get("apporteur_societe"),
                        })));
                        prompt = prompt.replace(/{{brokerImpayesJson}}/g, brokerJson);
                    }

                    // Appel Ollama avec retry
                    const MAX_RETRIES = 50;
                    const RETRY_DELAY_MS = 2000;
                    let generatedContent;
                    let lastError = null;

                    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
                        try {
                            log("INFO", contactId, prochainIndex, `Ollama tentative ${attempt}/${MAX_RETRIES}...`);
                            const response = await fetch(`${OLLAMA_API_URL}/generate`, {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    ...(OLLAMA_API_KEY && { Authorization: `Bearer ${OLLAMA_API_KEY}` }),
                                },
                                body: JSON.stringify({
                                    model: OLLAMA_MODEL,
                                    prompt,
                                    stream: false,
                                    temperature: 0.1,
                                }),
                            });
                            if (!response.ok) throw new Error(`HTTP ${response.status}`);
                            const data = await response.json();
                            const content = data.response || data.text || data.content || data.message?.content;
                            if (!content) throw new Error("Réponse Ollama vide");

                            const yamlMatch =
                                content.match(/---\n([\s\S]*?)\n---/) ||
                                content.match(/```yaml\n([\s\S]*?)```/) ||
                                (content.match(/^(objet:|corps:)/m) ? [null, content] : null);
                            if (!yamlMatch) throw new Error("Format YAML non trouvé");
                            const parsed = yaml.load(yamlMatch[1] || content);
                            if (!parsed || !parsed.objet || !parsed.corps) throw new Error("Champs 'objet' et 'corps' manquants");
                            generatedContent = { objet: parsed.objet, corps: parsed.corps };
                            log("INFO", contactId, prochainIndex, `Ollama réussi au bout de ${attempt} tentative(s)`);
                            break;
                        } catch (attemptErr) {
                            lastError = attemptErr;
                            log("WARN", contactId, prochainIndex, `Ollama tentative ${attempt} échouée: ${attemptErr.message}`);
                            if (attempt < MAX_RETRIES) {
                                log("INFO", contactId, prochainIndex, `Attente ${RETRY_DELAY_MS}ms avant nouvelle tentative...`);
                                await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
                            }
                        }
                    }

                    if (!generatedContent) {
                        log("ERROR", contactId, prochainIndex, `Ollama échoué après ${MAX_RETRIES} tentatives (${lastError.message}). Fallback sur template.`);
                        generatedContent = {
                            objet: scenarioActif.objet || emailConfig.objet || "Suivi",
                            corps: scenarioActif.corps || emailConfig.corps || "<p>Contenu du suivi...</p>",
                        };
                    }

                    // Remplacement placeholders
                    let objetFinal = generatedContent.objet;
                    let corpsFinal = generatedContent.corps;
                    if (impayes.length > 0) {
                        const lienPdf = `${FRONTEND_URL}/redirect-pdf/${impayes[0].id}`;
                        objetFinal = objetFinal.split("[[lien_pdf]]").join(lienPdf);
                        corpsFinal = corpsFinal.split("[[lien_pdf]]").join(lienPdf);
                    }
                    const lienEspace = `${FRONTEND_URL}/redirect-espace/${contact.id}`;
                    objetFinal = objetFinal.split("[[lien_espace]]").join(lienEspace);
                    corpsFinal = corpsFinal.split("[[lien_espace]]").join(lienEspace);

                    // ── h. CRÉATION DU SUIVI ───────────────────────────────────
                    const suivi = new Suivi();
                    suivi.set("contact", contact);
                    suivi.set("sequence", sequence);
                    suivi.set("email_index", prochainIndex);
                    suivi.set("impayes", impayes);
                    suivi.set("scenario", { format: scenarioType });
                    suivi.set("frequence", emailConfig.frequence);
                    suivi.set("statut", "pret pour envoi");
                    suivi.set("valide", !sequence.get("validation_obligatoire"));
                    suivi.set("manuelle", false);

                    const dateEnvoi = new Date();
                    dateEnvoi.setHours(19, 0, 0, 0);
                    suivi.set("dateEnvoi", dateEnvoi);

                    suivi.set("objet", objetFinal);
                    suivi.set("corps", corpsFinal);
                    suivi.set("erreur_count", 0);

                    if (scenarioActif.smtp) {
                        const SmtpProfile = Parse.Object.extend("SmtpProfile");
                        const smtpPtr = SmtpProfile.createWithoutData(scenarioActif.smtp);
                        suivi.set("smtpProfil", smtpPtr);
                    }
                    if (scenarioActif.cc) suivi.set("cc", scenarioActif.cc);
                    if (emailConfig.cc) suivi.set("cc", emailConfig.cc);

                    await suivi.save(null, { useMasterKey: true });
                    suivisCrees++;
                    log("INFO", contactId, prochainIndex, `Suivi créé avec succès (scenario: ${scenarioType})`);
                }

            } catch (groupError) {
                erreurs++;
                log("ERROR", contactId, null, `Erreur traitement groupe: ${groupError.message}`);
            }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // ÉTAPE 5 : RÉCAPITULATIF
        // ═══════════════════════════════════════════════════════════════════════
        log("INFO", null, null, "=== TERMINÉ ===");
        log("INFO", null, null, `Suivis créés: ${suivisCrees}, ignorés: ${suivisIgnorees}, contacts ignorés: ${contactsIgnores}, erreurs: ${erreurs}`);

        return {
            success: true,
            suivisCrees,
            suivisIgnorees,
            contactsIgnores,
            erreurs,
            message: `${suivisCrees} suivi(s) créé(s)`,
        };

    } catch (fatalError) {
        log("ERROR", null, null, `Erreur fatale: ${fatalError.message}`);
        throw fatalError;
    }
}

// ─── Parse Cloud Function ───────────────────────────────────────────────────
try {
    Parse.Cloud.define("generateSuivisDuJour", async (request) => {
        log("INFO", null, null, "Cloud Function generateSuivisDuJour appelée");
        try {
            const result = await generateSuivisDuJour();
            log("INFO", null, null, "Cloud Function terminée avec succès");
            return result;
        } catch (error) {
            log("ERROR", null, null, `Cloud Function échouée: ${error.message}`);
            throw error;
        }
    });
    log("INFO", null, null, "Cloud Function generateSuivisDuJour enregistrée");
} catch (err) {
    log("DEBUG", null, null, `Cloud Function non enregistrée (hors Parse?): ${err.message}`);
}

// ─── Export ───────────────────────────────────────────────────────────────────
module.exports = generateSuivisDuJour;

// ─── Exécution directe (local/test) ───────────────────────────────────────────
if (require.main === module) {
    const appId = process.env.PARSE_APP_ID || "adti-marki";
    const serverURL = process.env.PARSE_SERVER_URL || "https://dev.markidiags.com/api/parse";
    const masterKey = process.env.PARSE_MASTER_KEY;

    Parse.initialize(appId, null, masterKey);
    Parse.serverURL = serverURL;

    generateSuivisDuJour()
        .then((result) => {
            console.log("Résultat:", JSON.stringify(result, null, 2));
            process.exit(0);
        })
        .catch((error) => {
            console.error("Erreur:", error);
            process.exit(1);
        });
}
