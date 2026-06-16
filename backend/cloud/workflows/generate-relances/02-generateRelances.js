// backend/cloud/workflows/generate-relances/02-generateRelances.js
// Étape 2 : Génère les relances avec Nunjucks
// Input: { }
// Output: { stats }

const { info, warn, error } = require("../../utils/logger");
const { renderTemplateSafe, env } = require("../../utils/nunjucks");

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

async function getRelancesStats() {
    try {
        const Relance = Parse.Object.extend("Relance");
        const q = new Parse.Query(Relance);
        q.equalTo("statut", "En attente de generation");
        const results = await q.find({ useMasterKey: true });
        const q2 = new Parse.Query(Relance);
        q2.equalTo("statut", "genere");
        const pret = await q2.find({ useMasterKey: true });
        return {
            totalRelances: results.length,
            pretPourEnvoi: pret.length,
            enAttente: results.length,
        };
    } catch (err) {
        error(
            `Erreur verification Parse: ${err.message}`,
            "generate-relances",
            "generateRelances",
        );
        return { totalRelances: 0, pretPourEnvoi: 0, enAttente: 0 };
    }
}

function toJSONForTemplate(obj) {
    if (!obj) return null;
    if (typeof obj.toJSON === "function") {
        const json = obj.toJSON();
        // Convertir en JSON string puis reparser pour garantir des objets simples
        // Cela convertit aussi les dates en strings ISO
        try {
            return JSON.parse(JSON.stringify(json));
        } catch (e) {
            return json;
        }
    }
    // Pour les objets normaux, faire une copie profonde
    try {
        return JSON.parse(JSON.stringify(obj));
    } catch (e) {
        // Si la conversion échoue, retourner l'objet tel quel
        return obj;
    }
}

function extractVariablesFromTemplate(template) {
    if (!template) return [];
    const matches = template.match(/\{{\s*[^{]+?\s*\}}/g) || [];
    return matches.map((m) => m.replace(/\{{\s*|\s*\}}/g, "").trim());
}

function extractVariableNames(expression) {
    // Extraire le nom de la variable avant le premier |
    const firstPipe = expression.indexOf("|");
    if (firstPipe === -1) return [expression.trim()];
    return [expression.substring(0, firstPipe).trim()];
}

function checkMissingVariables(template, context, relanceId) {
    // Extraire toutes les variables du template (sans les pipes)
    const templateVars = extractVariablesFromTemplate(template);
    const missing = [];
    const empty = [];

    for (const varExpr of templateVars) {
        const varNames = extractVariableNames(varExpr);
        for (const varName of varNames) {
            if (!(varName in context)) {
                missing.push(varName);
            } else if (
                context[varName] === "" ||
                context[varName] === null ||
                context[varName] === undefined
            ) {
                empty.push(varName);
            }
        }
    }

    if (missing.length > 0 || empty.length > 0) {
        warn(
            `VARIABLES MANQUANTES/VIDES pour ${relanceId}: manquantes=[${missing.join(", ")}], vides=[${empty.join(", ")}]`,
            "generate-relances",
            "generateRelances",
        );
    }

    return { missing, empty };
}

function prepareNunjucksContext(scenario, impayes, history, relance) {
    const contact = relance.get("contact");
    const sequence = relance.get("sequence");
    const contactData = toJSONForTemplate(contact) || {};
    const sequenceData = toJSONForTemplate(sequence) || {};

    const impayesData = (impayes || []).map((i) => {
        const json = toJSONForTemplate(i);
        const today = new Date();
        let delai = 0;
        if (json.date_echeance) {
            const diff = today - new Date(json.date_echeance);
            delai = Math.floor(diff / (1000 * 60 * 60 * 24));
        }
        return {
            ...json,
            nfacture: json.nfacture || "",
            date_echeance: json.date_echeance,
            montant_total:
                json.montant_ttc || json.montantTTC || json.montant_total || 0,
            montant_ttc: json.montant_ttc || json.montantTTC || 0,
            reste_a_payer: json.reste_a_payer || 0,
            statut: json.statut || [],
            lien_pdf: json.lien_pdf || json.url_pdf || "",
            numero_dossier: json.numero_dossier || "",
            delai: delai,
        };
    });

    const delai =
        impayesData.length > 0
            ? Math.max(...impayesData.map((i) => i.delai), 0)
            : 0;
    const totalResteAPayer = impayesData.reduce(
        (sum, i) => sum + (i.reste_a_payer || 0),
        0,
    );
    const montant_avec_penalites =
        delai >= 18 ? totalResteAPayer + 40 : totalResteAPayer;

    const isPersonne = contactData.civilite || contactData.prenom || false;
    const nom = contactData.nom || contactData.raison_sociale || "";
    const prenom = contactData.prenom || "";

    // Extraire les valeurs du premier impayé pour les variables courantes
    const firstImpaye = impayesData[0] || {};

    // Gérer le cas où delai est NaN
    const safeDelai = isNaN(delai) || !isFinite(delai) ? 0 : delai;
    const safeFirstImpayeDelai =
        isNaN(firstImpaye.delai) || !isFinite(firstImpaye.delai)
            ? 0
            : firstImpaye.delai;

    return {
        // Variables payeur
        payeur_civilite: contactData.civilite || "",
        payeur_prenom: prenom,
        payeur_nom: isPersonne ? `${prenom} ${nom}`.trim() : nom,
        payeur_email: contactData.email || "",
        payeur_telephone: contactData.telephone || "",

        // Variables individuelles
        civilite: contactData.civilite || "",
        prenom: prenom,
        nom: nom,

        // Adresse
        adresse_bien: contactData.adresse || firstImpaye.adresse || "",
        code_postal: contactData.code_postal || firstImpaye.code_postal || "",
        ville: contactData.ville || firstImpaye.ville || "",

        // Numéro de dossier
        numero_dossier:
            firstImpaye.numero_dossier ||
            contactData.numero_dossier ||
            sequenceData.numero_dossier ||
            "",

        // Autres infos contact
        adresse: contactData.adresse || "",
        email: contactData.email || "",
        telephone: contactData.telephone || "",

        // Variables du premier impayé (pour compatibilité avec les anciens templates)
        nfacture: firstImpaye.nfacture || "",
        date_echeance: firstImpaye.date_echeance || "",
        montant_total:
            firstImpaye.montant_total || firstImpaye.montant_ttc || 0,
        montant_ttc: firstImpaye.montant_ttc || 0,
        reste_a_payer: firstImpaye.reste_a_payer || 0,

        // Données complètes
        impayes: impayesData,
        delai: safeDelai,
        first_impaye_delai: safeFirstImpayeDelai,
        total_reste_a_payer: totalResteAPayer,
        montant_avec_penalites:
            safeDelai >= 18 ? totalResteAPayer + 40 : totalResteAPayer,
        nb_impayes: impayesData.length,

        // Historique
        history: (history || []).map((h) => toJSONForTemplate(h) || {}),
        has_history: (history || []).length > 0,
        is_personne: isPersonne,

        // Liens
        lien_pdf: firstImpaye.lien_pdf || firstImpaye.url_pdf || "",

        // Math est déjà disponible dans le contexte via nunjucks.js
        Math: Math,
    };
}

async function generateRelances() {
    const stats = { processed: 0, errors: 0, erreurs: [] };
    info(
        "Etape 2: Debut de la generation des relances avec Nunjucks",
        "generate-relances",
        "generateRelances",
    );

    try {
        const Relance = Parse.Object.extend("Relance");
        const q = new Parse.Query(Relance);
        q.equalTo("statut", "En attente de generation");
        q.limit(9999);
        q.include(["sequence", "contact"]);
        const relances = await q.find({ useMasterKey: true });
        info(
            `Etape 2: ${relances.length} relances en attente de generation`,
            "generate-relances",
            "generateRelances",
        );

        for (const relance of relances) {
            try {
                const sequence = relance.get("sequence");
                const impayesIds = relance.get("impayes") || [];
                const contact = relance.get("contact");
                const emailIndex = relance.get("email_index");

                if (!sequence) {
                    warn(
                        `Relance ${relance.id}: pas de sequence associee`,
                        "generate-relances",
                        "generateRelances",
                    );
                    stats.erreurs.push({
                        relanceId: relance.id,
                        erreur: "pas de sequence associee",
                    });
                    continue;
                }

                const hQuery = new Parse.Query("Relance");
                hQuery.equalTo("contact", contact);
                hQuery.containedIn("impayes", impayesIds);
                hQuery.exists("dateEnvoi");
                hQuery.equalTo("statut", "Envoyee");
                const history = await hQuery.find({ useMasterKey: true });

                const Impaye = Parse.Object.extend("Impaye");
                const iQuery = new Parse.Query(Impaye);
                iQuery.containedIn("objectId", impayesIds);
                const impayeDetails = await iQuery.find({ useMasterKey: true });

                const Seq = Parse.Object.extend("Sequence");
                const sQuery = new Parse.Query(Seq);
                sQuery.equalTo("objectId", sequence.id);
                sQuery.equalTo("type", "relances");
                const fullSeq = await sQuery.first({ useMasterKey: true });

                if (!fullSeq) {
                    warn(
                        `Relance ${relance.id}: sequence non trouvee`,
                        "generate-relances",
                        "generateRelances",
                    );
                    stats.erreurs.push({
                        relanceId: relance.id,
                        erreur: "sequence non trouvee",
                    });
                    continue;
                }

                const scenarios = fullSeq?.get("emails") || [];
                const matchingScenario = scenarios.find((s) => {
                    const sObj = toJSONForTemplate(s);
                    return sObj.email_index === emailIndex;
                });

                if (!matchingScenario) {
                    warn(
                        `Relance ${relance.id}: pas de scenario pour email_index=${emailIndex}`,
                        "generate-relances",
                        "generateRelances",
                    );
                    stats.erreurs.push({
                        relanceId: relance.id,
                        erreur: "pas de scenario correspondant",
                    });
                    continue;
                }

                const msObj = toJSONForTemplate(matchingScenario);
                const activeScenario = msObj.scenarios?.find((s) => s.active);

                if (!activeScenario) {
                    warn(
                        `Relance ${relance.id}: pas de scenario actif`,
                        "generate-relances",
                        "generateRelances",
                    );
                    stats.erreurs.push({
                        relanceId: relance.id,
                        erreur: "pas de scenario actif",
                    });
                    continue;
                }

                info(
                    `Etape 2: Generation pour ${relance.id}...`,
                    "generate-relances",
                    "generateRelances",
                );
                const context = prepareNunjucksContext(
                    activeScenario,
                    impayeDetails,
                    history,
                    relance,
                );

                const objTpl =
                    activeScenario.objet ||
                    msObj.objet ||
                    "Relance - Facture impayee";
                const bodyTpl =
                    activeScenario.corps ||
                    msObj.corps ||
                    "Veuillez regulariser.";

                // Vérifier les variables manquantes ou vides avant rendu
                checkMissingVariables(objTpl, context, relance.id);
                checkMissingVariables(bodyTpl, context, relance.id);

                const objRes = await renderTemplateSafe(objTpl, context);
                const bodyRes = await renderTemplateSafe(bodyTpl, context);

                const objet = objRes.success ? objRes.result : objTpl;
                const corps = bodyRes.success ? bodyRes.result : bodyTpl;

                if (!objRes.success) {
                    error(
                        `ERREUR OBJET pour ${relance.id}: ${objRes.error}`,
                        "generate-relances",
                        "generateRelances",
                    );
                }
                if (!bodyRes.success) {
                    error(
                        `ERREUR CORPS pour ${relance.id}: ${bodyRes.error}`,
                        "generate-relances",
                        "generateRelances",
                    );
                }

                relance.set("objet", objet);
                relance.set("corps", corps);
                relance.set("statut", "genere");
                relance.set("generation_method", "nunjucks");
                await relance.save(null, { useMasterKey: true });

                info(
                    `Etape 2: ${relance.id} genere avec succes`,
                    "generate-relances",
                    "generateRelances",
                );
                stats.processed++;
            } catch (err) {
                error(
                    `Erreur pour ${relance.id}: ${err.message}`,
                    "generate-relances",
                    "generateRelances",
                );
                stats.errors++;
                stats.erreur.push({
                    relanceId: relance.id,
                    erreur: err.message,
                });
            }
        }

        info(`Etape 2: ${stats.processed} traites | ${stats.errors} erreurs`);
        const parseStats = await getRelancesStats();
        info(
            `Parse check: ${parseStats.totalRelances} en attente | ${parseStats.pretPourEnvoi} generes`,
        );
        return { stats };
    } catch (err) {
        error(`Erreur Etape 2: ${err.message}`);
        throw err;
    }
}

module.exports = generateRelances;
