// backend/cloud/workflows/generate-suivi/01b-replaceVariables.js
// Étape 1b : Prétraitement - Remplace les variables [[...]] dans les templates des suivis
// Input: { }
// Output: { stats }

const { info, warn, error } = require("../../utils/logger");

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
 * Helper pour accéder aux propriétés d'un objet Parse ou JSON
 */
function getValue(obj, key) {
    if (!obj) return undefined;
    if (typeof obj.get === "function") {
        return obj.get(key);
    }
    return obj[key];
}

/**
 * Convertit un objet Parse en objet simple
 */
function toSimpleObject(parseObj) {
    if (!parseObj || !parseObj.toJSON) return parseObj;
    return parseObj.toJSON();
}

/**
 * Récupère la valeur d'un chemin dans un objet (ex: "payeur.nom" ou "impaye.montant_total")
 */
function getValueByPath(data, path) {
    if (!path || !data) return undefined;
    
    // Gérer les paths simples sans points
    if (!path.includes('.')) {
        if (typeof data === 'object' && data !== null) {
            if (path in data) {
                return data[path];
            }
            if (typeof data.get === 'function') {
                return data.get(path);
            }
        }
        return undefined;
    }
    
    const parts = path.split('.');
    let current = data;
    
    for (const part of parts) {
        if (current === null || current === undefined) return undefined;
        
        if (typeof current === 'object') {
            if (part in current) {
                current = current[part];
            } else if (typeof current.get === 'function') {
                current = current.get(part);
            } else {
                return undefined;
            }
        } else {
            return undefined;
        }
    }
    
    return current;
}

/**
 * Remplace toutes les variables [[...]] dans un texte avec les valeurs de data
 * Utilise un remplacement littéral SANS regex
 */
function replaceAllVariables(template, data) {
    if (!template || typeof template !== 'string') return template;
    
    let result = template;
    let startIndex = 0;
    let replacementCount = 0;
    
    while (true) {
        const openBracket = result.indexOf('[[', startIndex);
        if (openBracket === -1) break;
        
        const closeBracket = result.indexOf(']]', openBracket + 2);
        if (closeBracket === -1) break;
        
        // Extraire le nom de la variable (sans les crochets)
        const varName = result.substring(openBracket + 2, closeBracket).trim();
        
        // Ignorer les boucles [[loop ...]] et [[endloop]]
        if (varName.startsWith('loop ') || varName === 'endloop') {
            startIndex = closeBracket + 2;
            continue;
        }
        
        // Chercher la valeur dans data
        const value = getValueByPath(data, varName);
        
        // Remplacer littéralement
        if (value !== undefined && value !== null) {
            const replacement = String(value);
            result = result.substring(0, openBracket) + replacement + result.substring(closeBracket + 2);
            startIndex = openBracket + replacement.length;
            replacementCount++;
        } else {
            startIndex = closeBracket + 2;
        }
    }
    
    if (replacementCount > 0) {
        info(
            `Remplacement de ${replacementCount} variables dans le template`,
            "generate-suivi",
            "replaceVariables",
        );
    }
    
    return result;
}

/**
 * Récupère les informations nécessaires pour un suivi
 */
async function getSuiviData(suivi) {
    const Suivi = Parse.Object.extend("Suivi");
    const Impaye = Parse.Object.extend("Impaye");
    
    // Convertir en objet simple
    const suiviObj = toSimpleObject(suivi);
    const contact = getValue(suivi, "contact");
    const sequence = getValue(suivi, "sequence");
    const emailIndex = getValue(suivi, "email_index");
    const scenarioFormat = getValue(suivi, "scenario");
    const impayeIds = getValue(suivi, "impayes") || [];
    
    // Récupérer les impayés
    const impayeQuery = new Parse.Query(Impaye);
    impayeQuery.containedIn("objectId", impayeIds);
    impayeQuery.limit(1000);
    const impayes = await impayeQuery.find({ useMasterKey: true });
    
    // Récupérer le scenario depuis la sequence
    let scenario = null;
    if (sequence && sequence.emails && Array.isArray(sequence.emails)) {
        const email = sequence.emails.find(e => {
            const eObj = toSimpleObject(e);
            return eObj.email_index === emailIndex;
        });
        if (email && email.scenarios && Array.isArray(email.scenarios)) {
            scenario = email.scenarios.find(s => {
                const sFormat = (s.toJSON ? toSimpleObject(s) : s).format;
                return sFormat === scenarioFormat;
            });
        }
    }
    
    // Si pas trouvé, essayer une autre approche
    if (!scenario && sequence && sequence.emails) {
        for (const email of sequence.emails) {
            const emailObj = toSimpleObject(email);
            if (emailObj.email_index === emailIndex && emailObj.scenarios) {
                for (const s of emailObj.scenarios) {
                    const sObj = toSimpleObject(s);
                    if (sObj.format === scenarioFormat) {
                        scenario = s;
                        break;
                    }
                }
            }
        }
    }
    
    // Convertir le scenario en objet simple
    let scenarioObj = scenario ? toSimpleObject(scenario) : null;
    
    // Si pas de scenario trouvé, créer un objet vide
    if (!scenarioObj) {
        scenarioObj = { objet: "", corps: "" };
    }
    
    // Récupérer l'historique des suivis pour ce contact
    const historyQuery = new Parse.Query(Suivi);
    historyQuery.equalTo("contact", contact);
    historyQuery.exists("dateEnvoi");
    historyQuery.descending("createdAt");
    historyQuery.limit(10);
    const history = await historyQuery.find({ useMasterKey: true });
    
    return {
        suivi: suiviObj,
        contact: toSimpleObject(contact),
        sequence: toSimpleObject(sequence),
        emailIndex,
        scenario: scenarioObj,
        impayes: impayes.map(i => toSimpleObject(i)),
        history: history.map(h => toSimpleObject(h)),
    };
}

/**
 * Étape 1b : Prétraitement des suivis - Remplace les variables [[...]]
 */
async function replaceVariables() {
    const stats = {
        processed: 0,
        replaced: 0,
        errors: [],
    };
    
    info(
        "\n═════════════════════════════════════════════════════════════",
        "generate-suivi",
        "replaceVariables",
    );
    info(
        "📝 ÉTAPE 1b: Prétraitement - Remplacement des variables [[...]]",
        "generate-suivi",
        "replaceVariables",
        { step: 1.5 },
    );
    
    try {
        const Suivi = Parse.Object.extend("Suivi");
        
        // Récupérer tous les suivis en attente de génération
        const query = new Parse.Query(Suivi);
        query.equalTo("statut", "En attente de génération");
        query.limit(999999);
        query.include(["contact", "sequence", "contact_relance"]);
        
        const suivis = await query.find({ useMasterKey: true });
        
        info(
            `Suivis en attente de génération: ${suivis.length}`,
            "generate-suivi",
            "replaceVariables",
            { count: suivis.length },
        );
        
        stats.processed = suivis.length;
        
        // Traiter chaque suivi
        for (const suivi of suivis) {
            try {
                const data = await getSuiviData(suivi);
                
                // Si on a un scenario avec objet et corps
                if (data.scenario && (data.scenario.objet || data.scenario.corps)) {
                    // Préparer les données pour le template
                    const templateData = {
                        ...data.contact,
                        payeur: data.contact,
                        payeur_nom: data.contact?.nom || "",
                        payeur_prenom: data.contact?.prenom || "",
                        payeur_civilite: data.contact?.civilite || "",
                        payeur_email: data.contact?.email || "",
                        payeur_telephone: data.contact?.telephone || "",
                        payeur_adresse: data.contact?.adresse || "",
                        payeur_type: data.contact?.type_personne || "",
                        societe: data.contact?.societe || data.contact?.nom || "",
                        impaye: data.impayes[0] || {},
                        impayes: data.impayes,
                        nfacture: data.impayes[0]?.nfacture || "",
                        montant_total: data.impayes[0]?.montant_total || "",
                        reste_a_payer: data.impayes[0]?.reste_a_payer || "",
                        date_echeance: data.impayes[0]?.date_echeance || "",
                        adresse_bien: data.impayes[0]?.adresse_bien || "",
                        code_postal: data.impayes[0]?.code_postal || "",
                        ville: data.impayes[0]?.ville || "",
                        numero_dossier: data.impayes[0]?.numero_dossier || "",
                        lien_espace: process.env.LIEN_ESPACE || "",
                        email_index: data.emailIndex,
                        sequence: data.sequence,
                        history: data.history,
                        aujourdhui: new Date().toLocaleDateString('fr-FR'),
                    };
                    
                    // Remplacer les variables dans objet et corps
                    const newObjet = replaceAllVariables(data.scenario.objet || "", templateData);
                    const newCorps = replaceAllVariables(data.scenario.corps || "", templateData);
                    
                    // Mettre à jour le suivi avec les templates pré-remplis
                    suivi.set("objet", newObjet);
                    suivi.set("corps", newCorps);
                    
                    await suivi.save(null, { useMasterKey: true });
                    
                    stats.replaced += (newObjet !== data.scenario.objet || newCorps !== data.scenario.corps) ? 1 : 0;
                    
                    info(
                        `Suivi ${suivi.id} - Variables remplacées dans template`,
                        "generate-suivi",
                        "replaceVariables",
                        { suiviId: suivi.id },
                    );
                } else {
                    warn(
                        `Suivi ${suivi.id} - Pas de scenario trouvé`,
                        "generate-suivi",
                        "replaceVariables",
                        { suiviId: suivi.id },
                    );
                }
            } catch (err) {
                error(
                    `Erreur lors du traitement du suivi ${suivi.id}: ${err.message}`,
                    "generate-suivi",
                    "replaceVariables",
                    { suiviId: suivi.id, error: err.message },
                );
                stats.errors.push({
                    suiviId: suivi.id,
                    error: err.message,
                });
            }
        }
        
        info(
            `✅ ÉTAPE 1b TERMINÉE: ${stats.processed} traitées, ${stats.replaced} modifiées, ${stats.errors.length} erreurs`,
            "generate-suivi",
            "replaceVariables",
            {
                processed: stats.processed,
                replaced: stats.replaced,
                errors: stats.errors.length,
            },
        );
        info(
            "═════════════════════════════════════════════════════════════",
            "generate-suivi",
            "replaceVariables",
        );
        
        return { stats };
    } catch (err) {
        error(
            `❌ ERREUR DANS ÉTAPE 1b: ${err.message}`,
            "generate-suivi",
            "replaceVariables",
            { error: err.message, stack: err.stack?.substring(0, 500) },
        );
        stats.errors.push({
            error: err.message,
            stack: err.stack?.substring(0, 500),
        });
        return { stats };
    }
}

module.exports = replaceVariables;
