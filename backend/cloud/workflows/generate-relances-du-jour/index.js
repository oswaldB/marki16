// backend/cloud/workflows/generate-relances-du-jour/index.js
// Méga-fonction Parse Cloud Code de génération quotidienne des relances.
// Exécutée tous les jours à 17h00 (Paris).
// Seule la relance théoriquement due ce jour est générée.

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

// ─── Pré-traitement conjugaison échéance dans le template ───────────────────
function preprocessEcheanceTemplate(template, dateEcheance) {
    if (!template || !dateEcheance) return template;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const echeance = new Date(dateEcheance);
    echeance.setHours(0, 0, 0, 0);

    // Détecte si le template contient une phrase d'échéance à corriger
    const hasPattern = /(?:est arrivée?|arrivera|arrive) à échéance (?:le|a(?:u|)jourdhui) \[\[date_echeance\]\]/i.test(template);
    if (!hasPattern) return template;

    let replacement;
    if (echeance < today) {
        replacement = "est arrivée à échéance le [[date_echeance]]";
    } else if (echeance > today) {
        replacement = "arrivera à échéance le [[date_echeance]]";
    } else {
        replacement = "arrive à échéance aujourd'hui, le [[date_echeance]]";
    }

    return template
        .replace(/est arrivée à échéance le \[\[date_echeance\]\]/gi, replacement)
        .replace(/est arrivé à échéance le \[\[date_echeance\]\]/gi, replacement.replace("arrivée", "arrivé"))
        .replace(/arrivera à échéance le \[\[date_echeance\]\]/gi, replacement)
        .replace(/arrive à échéance le \[\[date_echeance\]\]/gi, replacement);
}

// ─── Résolution du contact de relance ────────────────────────────────────────
/**
 * Vérifie qu'une valeur est un email plausible (chaîne non vide, @ encadré)
 */
function emailValide(email) {
    if (typeof email !== "string") return false;
    const trimmed = email.trim();
    const atIndex = trimmed.indexOf("@");
    return atIndex > 0 && atIndex < trimmed.length - 1;
}

/**
 * Détermine le contact à relancer pour un impayé.
 *
 * Priorité :
 *   1. contact_relance s'il est joignable (email valide)
 *   2. payeur s'il est joignable
 *   3. contact_relance puis payeur (contact non joignable)
 *
 * Évite de bloquer une relance quand contact_relance pointe sur un
 * interlocuteur sans email alors que l'entité débitrice (payeur) en a un.
 */
function getContactRelance(impaye) {
    const contactRelance = impaye.get("contact_relance");
    const payeur = impaye.get("payeur");

    if (contactRelance && emailValide(contactRelance.get("email"))) {
        return contactRelance;
    }
    if (payeur && emailValide(payeur.get("email"))) {
        return payeur;
    }

    return contactRelance || payeur || null;
}

// ─── Log interne (inline, pas de fonction utilitaire externe) ─────────────────
function log(level, contactId, emailIndex, message) {
    const timestamp = new Date().toISOString();
    const prefix = contactId && emailIndex !== undefined
        ? `[${level}][${contactId}][${emailIndex}]`
        : `[GENERATE-DU-JOUR][${level}]`;
    const logLine = `${timestamp} ${prefix} ${message}\n`;
    console.log(logLine.trim());
    try {
        const logDir = path.join(__dirname, "logs");
        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
        const logFile = path.join(logDir, `generate-du-jour-${new Date().toISOString().split("T")[0]}.log`);
        fs.appendFileSync(logFile, logLine);
    } catch (err) {
        console.error("Erreur log:", err.message);
    }
}

// ─── Fonction principale (méga-fonction linéaire) ───────────────────────────
async function generateRelancesDuJour() {
    log("INFO", null, null, "=== DÉMARRAGE generate-relances-du-jour ===");

    let relancesCrees = 0;
    let relancesIgnorees = 0;
    let contactsIgnores = 0;
    let erreurs = 0;

    try {
        // ═══════════════════════════════════════════════════════════════════════
        // ÉTAPE 1 : RÉCUPÉRATION DES IMPAYÉS ACTIFS AVEC SÉQUENCE
        // ═══════════════════════════════════════════════════════════════════════
        log("INFO", null, null, "Étape 1: Récupération impayés actifs avec séquence...");

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
            if (!sequence || sequence.get("type") !== "relances" || !sequence.get("publiee")) continue;

            let contact = getContactRelance(impaye);
            if (!contact) continue;
            if (contact.get("isBlacklisted") === true) continue;

            if (impaye.get("isBlacklisted") === true) continue;

            if (!emailValide(contact.get("email"))) continue;

            impayesEligibles.push(impaye);
        }
        log("INFO", null, null, `Après filtrage: ${impayesEligibles.length} impayés éligibles`);

        if (impayesEligibles.length === 0) {
            log("INFO", null, null, "Aucun impayé éligible");
            return { success: true, relancesCrees: 0, relancesIgnorees: 0, contactsIgnores: 0, erreurs: 0, message: "Aucun impayé éligible" };
        }

        // ═══════════════════════════════════════════════════════════════════════
        // ÉTAPE 3 : REGROUPEMENT PAR (contact.id, sequence.id)
        // ═══════════════════════════════════════════════════════════════════════
        log("INFO", null, null, "Étape 3: Regroupement par contact + séquence...");

        const groupes = new Map();
        for (const impaye of impayesEligibles) {
            const contact = getContactRelance(impaye);
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
                // ── a. DATE D'ÉCHÉANCE DE RÉFÉRENCE ──────────────────────────────
                let dateEcheanceRef = null;
                for (const impaye of impayes) {
                    const de = impaye.get("date_echeance");
                    if (de) {
                        if (!dateEcheanceRef || de < dateEcheanceRef) dateEcheanceRef = new Date(de);
                    }
                }
                if (!dateEcheanceRef) dateEcheanceRef = new Date();
                dateEcheanceRef.setHours(0, 0, 0, 0);

                // ── b. PROCHAIN EMAIL_INDEX ──────────────────────────────────────
                const emails = sequence.get("emails") || [];
                const maxIndex = emails.length > 0 ? Math.max(...emails.map(e => e.email_index)) : 0;
                const Relance = Parse.Object.extend("Relance");
                const histQuery = new Parse.Query(Relance);
                histQuery.equalTo("contact", contact);
                histQuery.equalTo("sequence", sequence);
                histQuery.equalTo("manuelle", false);
                histQuery.equalTo("statut", "Envoyée");
                histQuery.descending("email_index");
                histQuery.limit(1);
                const lastSent = await histQuery.first({ useMasterKey: true });

                let prochainIndex;
                if (!lastSent) {
                    // Jamais relancé → début de séquence
                    prochainIndex = emails[0]?.email_index ?? 0;
                } else {
                    const relancesEnvoyees = lastSent.get("email_index") || 0;
                    const calculIndex = maxIndex - relancesEnvoyees;
                    // Vérifier que l'index calculé existe dans la séquence
                    const emailConfigCalcule = emails.find(e => e.email_index === calculIndex);
                    if (emailConfigCalcule) {
                        prochainIndex = calculIndex;
                    } else {
                        contactsIgnores++;
                        log("INFO", contactId, null, `Index calculé ${calculIndex} hors séquence (max=${maxIndex}, envoyées=${relancesEnvoyees}), ignoré`);
                        continue;
                    }
                }

                // ── c. VÉRIFICATION EXISTENCE DANS SÉQUENCE ──────────────────────
                const emailConfig = emails.find((e) => e.email_index === prochainIndex);
                if (!emailConfig) {
                    contactsIgnores++;
                    log("INFO", contactId, null, `Fin de séquence (prochainIndex=${prochainIndex}), ignoré`);
                    continue;
                }

                // ── c-bis. VÉRIFICATION DOUBLON (relance déjà existante pour ce triplet) ──
                const existingRelanceQuery = new Parse.Query(Relance);
                existingRelanceQuery.equalTo("contact", contact);
                existingRelanceQuery.equalTo("sequence", sequence);
                existingRelanceQuery.equalTo("email_index", prochainIndex);
                existingRelanceQuery.equalTo("manuelle", false);
                const existingRelance = await existingRelanceQuery.first({ useMasterKey: true });
                if (existingRelance) {
                    relancesIgnorees++;
                    log("INFO", contactId, prochainIndex, `Relance déjà existante (${existingRelance.id}), ignoré`);
                    continue;
                }

                // ── d. CALCUL DATE THÉORIQUE ─────────────────────────────────────
                const delai = emailConfig.delai || 0;
                const dateEnvoiTheorique = new Date(dateEcheanceRef);
                dateEnvoiTheorique.setDate(dateEnvoiTheorique.getDate() + delai);
                const theoriqueJour = new Date(dateEnvoiTheorique);
                theoriqueJour.setHours(0, 0, 0, 0);

                // ── e. FILTRE JOUR J ─────────────────────────────────────────────
                if (theoriqueJour.getTime() !== aujourdhui.getTime() && theoriqueJour > aujourdhui) {
                    contactsIgnores++;
                    log("INFO", contactId, prochainIndex, `Pas le jour J (${theoriqueJour.toISOString().split("T")[0]} vs ${aujourdhui.toISOString().split("T")[0]}), ignoré`);
                    continue;
                }
                if (theoriqueJour < aujourdhui) {
                    // Rattrapage : vérifier si déjà envoyé pour cet index
                    const rattrapageQuery = new Parse.Query(Relance);
                    rattrapageQuery.equalTo("contact", contact);
                    rattrapageQuery.equalTo("sequence", sequence);
                    rattrapageQuery.equalTo("email_index", prochainIndex);
                    rattrapageQuery.equalTo("statut", "Envoyée");
                    const dejaEnvoye = await rattrapageQuery.first({ useMasterKey: true });
                    if (dejaEnvoye) {
                        contactsIgnores++;
                        log("INFO", contactId, prochainIndex, `Rattrapage déjà effectué (relance ${dejaEnvoye.id}), ignoré`);
                        continue;
                    }
                    log("INFO", contactId, prochainIndex, `Rattrapage : date théorique passée, on génère quand même`);
                }

                // ── f. DÉTECTION SCENARIO_TYPE ───────────────────────────────────
                // Récupérer brokerImpayes (impayés où contact est apporteur mais pas payeur)
                const currentImpayeIds = new Set(impayes.map((i) => i.id));
                const brokerQuery = new Parse.Query(Impaye);
                brokerQuery.equalTo("facture_soldee", false);
                brokerQuery.greaterThan("reste_a_payer", 0);
                brokerQuery.equalTo("apporteur", contact);
                brokerQuery.notEqualTo("payeur", contact);
                brokerQuery.notEqualTo("contact_relance", contact);
                if (currentImpayeIds.size > 0) brokerQuery.notContainedIn("objectId", Array.from(currentImpayeIds));
                brokerQuery.limit(999999);
                const brokerImpayes = await brokerQuery.find({ useMasterKey: true });

                const contactType = contact.get("type_personne");
                const isBroker = contactType === "Apporteur d'affaire" || contactType === "Apporteur" || contactType === "apporteur" || contactType === "apporteur d'affaire";
                const hasBrokerImpayes = brokerImpayes.length > 0;
                const hasOwnImpayes = impayes.length > 0;

                // Si plusieurs impayés partagent la même nfacture → c'est une seule facture (single)
                const uniqueNfactures = new Set(impayes.map(i => i.get("nfacture")).filter(Boolean));
                const isSingleFacture = uniqueNfactures.size <= 1;

                let scenarioType;
                if (isBroker && hasBrokerImpayes && hasOwnImpayes) scenarioType = "both";
                else if (isBroker && hasBrokerImpayes) scenarioType = "broker";
                else if (impayes.length === 1 || isSingleFacture) scenarioType = "single";
                else scenarioType = "multiple";

                // ── g. SÉLECTION SCÉNARIO ACTIF + FALLBACK ──────────────────────
                const scenarios = emailConfig.scenarios || [];
                let scenarioActif = scenarios.find((s) => s.format === scenarioType && s.active);
                if (!scenarioActif) {
                    if (scenarioType === "both") scenarioActif = scenarios.find((s) => s.format === "multiple" && s.active);
                    if (!scenarioActif && scenarioType === "broker") scenarioActif = scenarios.find((s) => s.format === "single" && s.active);
                    if (!scenarioActif) scenarioActif = scenarios.find((s) => s.format === "multiple" && s.active);
                    if (!scenarioActif) scenarioActif = scenarios.find((s) => s.format === "single" && s.active);
                }
                if (!scenarioActif) {
                    relancesIgnorees++;
                    log("INFO", contactId, prochainIndex, `Aucun scénario actif trouvé (même après fallback), ignoré`);
                    continue;
                }

                // ── h. GÉNÉRATION DU CONTENU (Ollama) ───────────────────────────
                // Charger le prompt spécifique
                const promptFile = path.join(PROMPT_BASE_PATH, `relance-${scenarioType}-prompt.txt`);
                let promptTemplate;
                try {
                    promptTemplate = fs.readFileSync(promptFile, "utf-8");
                } catch (err) {
                    log("ERROR", contactId, prochainIndex, `Impossible de charger le prompt ${promptFile}: ${err.message}`);
                    throw err;
                }

                // Construire le JSON des impayés
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

                // Historique (10 dernières relances envoyées partageant un impayé)
                const histRelQuery = new Parse.Query(Relance);
                histRelQuery.equalTo("contact", contact);
                histRelQuery.equalTo("sequence", sequence);
                histRelQuery.exists("dateEnvoi");
                histRelQuery.descending("dateEnvoi");
                histRelQuery.limit(10);
                const histRelances = await histRelQuery.find({ useMasterKey: true });
                const impayeIds = new Set(impayes.map((i) => i.id));
                const history = histRelances
                    .filter((r) => {
                        const arr = r.get("impayes") || [];
                        return arr.some((imp) => {
                            const impId = imp.id || imp.objectId;
                            return impayeIds.has(impId);
                        });
                    })
                    .map((r) => ({
                        statut: r.get("statut"),
                        dateEnvoi: r.get("dateEnvoi"),
                        envoye_le: r.get("envoye_le"),
                        objet: r.get("objet"),
                        scenario: r.get("scenario"),
                        email_index: r.get("email_index"),
                    }));
                const historyJson = JSON.stringify(history);

                // Contact JSON
                const contactJson = JSON.stringify({
                    id: contact.id,
                    nom: contact.get("nom"),
                    prenom: contact.get("prenom"),
                    email: contact.get("email"),
                    telephone: contact.get("telephone"),
                    civilite: contact.get("civilite"),
                    type_personne: contact.get("type_personne"),
                });

                // Construire le prompt
                const now = new Date();
                const dateJour = now.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

                const objetTemplateBrut = scenarioActif.objet || emailConfig.objet || "";
                const corpsTemplateBrut = scenarioActif.corps || emailConfig.corps || "";
                const objetTemplate = preprocessEcheanceTemplate(objetTemplateBrut, dateEcheanceRef);
                const corpsTemplate = preprocessEcheanceTemplate(corpsTemplateBrut, dateEcheanceRef);

                let prompt = promptTemplate
                    .replace(/{{objetTemplate}}/g, objetTemplate)
                    .replace(/{{corpsTemplate}}/g, corpsTemplate)
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

                        // Parsing YAML
                        const yamlMatch =
                            content.match(/---\n([\s\S]*?)\n---/) ||
                            content.match(/```yaml\n([\s\S]*?)```/) ||
                            (content.match(/^(objet:|corps:)/m) ? [null, content] : null);
                        if (!yamlMatch) throw new Error("Format YAML non trouvé");
                        const parsed = yaml.load(yamlMatch[1] || content);
                        if (!parsed || !parsed.objet || !parsed.corps) throw new Error("Champs 'objet' et 'corps' manquants");
                        generatedContent = { objet: parsed.objet, corps: parsed.corps };
                        log("INFO", contactId, prochainIndex, `Ollama réussi au bout de ${attempt} tentative(s)`);
                        break; // Succès, on sort de la boucle
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
                        objet: scenarioActif.objet || emailConfig.objet || "Relance",
                        corps: scenarioActif.corps || emailConfig.corps || "<p>Contenu de la relance...</p>",
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

                // ── i. CRÉATION DE LA RELANCE ──────────────────────────────────
                const relance = new Relance();
                relance.set("contact", contact);
                relance.set("sequence", sequence);
                relance.set("email_index", prochainIndex);
                relance.set("impayes", impayes);
                relance.set("scenario", scenarioType);
                relance.set("statut", "pret pour envoi");
                relance.set("valide", !sequence.get("validation_obligatoire"));
                relance.set("manuelle", false);

                const dateEnvoi = new Date();
                dateEnvoi.setHours(19, 0, 0, 0);
                relance.set("dateEnvoi", dateEnvoi);

                relance.set("objet", objetFinal);
                relance.set("corps", corpsFinal);
                relance.set("erreur_count", 0);

                if (scenarioActif.smtp) {
                    const SmtpProfile = Parse.Object.extend("SmtpProfile");
                    const smtpPtr = SmtpProfile.createWithoutData(scenarioActif.smtp);
                    relance.set("smtpProfil", smtpPtr);
                }
                if (scenarioActif.cc) relance.set("cc", scenarioActif.cc);

                await relance.save(null, { useMasterKey: true });
                relancesCrees++;
                log("INFO", contactId, prochainIndex, `Relance créée avec succès (scenario: ${scenarioType})`);

            } catch (groupError) {
                erreurs++;
                log("ERROR", contactId, null, `Erreur traitement groupe: ${groupError.message}`);
            }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // ÉTAPE 5 : RÉCAPITULATIF
        // ═══════════════════════════════════════════════════════════════════════
        log("INFO", null, null, "=== TERMINÉ ===");
        log("INFO", null, null, `Relances créées: ${relancesCrees}, ignorées: ${relancesIgnorees}, contacts ignorés: ${contactsIgnores}, erreurs: ${erreurs}`);

        return {
            success: true,
            relancesCrees,
            relancesIgnorees,
            contactsIgnores,
            erreurs,
            message: `${relancesCrees} relance(s) créée(s)`,
        };

    } catch (fatalError) {
        log("ERROR", null, null, `Erreur fatale: ${fatalError.message}`);
        throw fatalError;
    }
}

// ─── Parse Cloud Function ───────────────────────────────────────────────────
try {
    Parse.Cloud.define("generateRelancesDuJour", async (request) => {
        log("INFO", null, null, "Cloud Function generateRelancesDuJour appelée");
        try {
            const result = await generateRelancesDuJour();
            log("INFO", null, null, "Cloud Function terminée avec succès");
            return result;
        } catch (error) {
            log("ERROR", null, null, `Cloud Function échouée: ${error.message}`);
            throw error;
        }
    });
    log("INFO", null, null, "Cloud Function generateRelancesDuJour enregistrée");
} catch (err) {
    log("DEBUG", null, null, `Cloud Function non enregistrée (hors Parse?): ${err.message}`);
}

// ─── Export ───────────────────────────────────────────────────────────────────
module.exports = generateRelancesDuJour;

// ─── Exécution directe (local/test) ───────────────────────────────────────────
if (require.main === module) {
    const appId = process.env.PARSE_APP_ID || "adti-marki";
    const serverURL = process.env.PARSE_SERVER_URL || "https://dev.markidiags.com/api/parse";
    const masterKey = process.env.PARSE_MASTER_KEY;

    Parse.initialize(appId, null, masterKey);
    Parse.serverURL = serverURL;

    generateRelancesDuJour()
        .then((result) => {
            console.log("Résultat:", JSON.stringify(result, null, 2));
            process.exit(0);
        })
        .catch((error) => {
            console.error("Erreur:", error);
            process.exit(1);
        });
}
