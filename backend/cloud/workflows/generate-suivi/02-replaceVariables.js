// backend/cloud/workflows/generate-suivi/01-replaceVariables.js
// Étape 1 : Remplace les variables [[var]] par les valeurs connues avant génération LLM
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
 * Remplace une variable spécifique dans un texte
 * @param {string} text - Texte à traiter
 * @param {string} variableName - Nom de la variable (ex: "contact.nom")
 * @param {*} value - Valeur à insérer
 * @returns {string} Texte avec la variable remplacée
 */
function replaceVariable(text, variableName, value) {
    if (!text || typeof text !== "string") return text;
    if (value === undefined || value === null) return text;
    
    const variableKey = `[[${variableName}]]`;
    const stringValue = String(value);
    
    // Remplacement simple sans regex
    let result = text;
    let index = result.indexOf(variableKey);
    
    while (index !== -1) {
        result = result.substring(0, index) + stringValue + result.substring(index + variableKey.length);
        index = result.indexOf(variableKey, index + stringValue.length);
    }
    
    return result;
}

/**
 * Remplace toutes les variables connues dans un template
 * @param {string} template - Template avec variables [[var]]
 * @param {Object} data - Objet contenant les données disponibles
 * @returns {string} Template avec variables remplacées
 */
function replaceAllVariables(template, data) {
    if (!template || typeof template !== "string") return template;
    
    let result = template;
    
    // Liste des variables à remplacer avec leurs chemins possibles
    const variableMappings = [
        // Variables de contact
        { path: "contact.nom", getValue: (d) => getValue(d.contact, "nom") },
        { path: "contact.prenom", getValue: (d) => getValue(d.contact, "prenom") },
        { path: "contact.email", getValue: (d) => getValue(d.contact, "email") },
        { path: "contact.telephone", getValue: (d) => getValue(d.contact, "telephone") },
        { path: "contact.adresse", getValue: (d) => getValue(d.contact, "adresse") },
        { path: "contact.ville", getValue: (d) => getValue(d.contact, "ville") },
        { path: "contact.codePostal", getValue: (d) => getValue(d.contact, "codePostal") },
        { path: "contact.payeur_nom", getValue: (d) => getValue(d.contact, "payeur_nom") },
        
        // Variables de suivi
        { path: "suivi.objet", getValue: (d) => getValue(d.suivi, "objet") },
        { path: "suivi.corps", getValue: (d) => getValue(d.suivi, "corps") },
        { path: "suivi.statut", getValue: (d) => getValue(d.suivi, "statut") },
        { path: "suivi.email_index", getValue: (d) => getValue(d.suivi, "email_index") },
        
        // Variables de séquence
        { path: "sequence.nom", getValue: (d) => getValue(d.sequence, "nom") },
        { path: "sequence.type", getValue: (d) => getValue(d.sequence, "type") },
        
        // Variables d'impayés
        { path: "impayes.count", getValue: (d) => d.impayes?.length },
        { path: "impayes.totalMontant", getValue: (d) => d.impayes?.reduce((sum, i) => sum + (getValue(i, "montant") || 0), 0) },
        
        // Variables de date
        { path: "aujourdhui", getValue: () => new Date().toLocaleDateString("fr-FR") },
        { path: "aujourdhui, date(\"DD/MM/YYYY\")", getValue: () => {
            const date = new Date();
            const day = String(date.getDate()).padStart(2, "0");
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        }},
    ];
    
    // Appliquer tous les remplacements
    for (const mapping of variableMappings) {
        const value = mapping.getValue(data);
        if (value !== undefined && value !== null) {
            result = replaceVariable(result, mapping.path, value);
        }
    }
    
    // Remplacement spécial pour les boucles [[loop ...]]
    result = replaceLoopVariables(result, data);
    
    return result;
}

/**
 * Remplace les variables de boucle [[loop ...]]
 * @param {string} template - Template avec boucles
 * @param {Object} data - Données incluant impayes
 * @returns {string} Template avec boucles traitées
 */
function replaceLoopVariables(template, data) {
    if (!template || typeof template !== "string") return template;
    
    const impayes = data.impayes || [];
    if (impayes.length === 0) return template;
    
    let result = template;
    
    // Trouver les boucles [[loop impayes]]...[[/loop]]
    const loopStart = "[[loop impayes]]";
    const loopEnd = "[[/loop]]";
    
    let startIndex = result.indexOf(loopStart);
    while (startIndex !== -1) {
        const endIndex = result.indexOf(loopEnd, startIndex);
        
        if (endIndex === -1) break;
        
        const loopContent = result.substring(
            startIndex + loopStart.length,
            endIndex
        );
        
        // Générer le contenu pour chaque impayé
        let loopResult = "";
        for (const impaye of impayes) {
            const impayeData = {
                ...data,
                impaye: impaye,
                current: impaye,
            };
            
            // Remplacer les variables dans le contenu de la boucle
            let itemContent = loopContent;
            
            // Variables d'impayé
            const impayeMappings = [
                { path: "impaye.numero", getValue: (d) => getValue(d.impaye, "numero") },
                { path: "impaye.dossier", getValue: (d) => getValue(d.impaye, "dossier") },
                { path: "impaye.montant", getValue: (d) => getValue(d.impaye, "montant") },
                { path: "impaye.dateEcheance", getValue: (d) => {
                    const date = getValue(d.impaye, "dateEcheance");
                    if (date instanceof Date) {
                        const day = String(date.getDate()).padStart(2, "0");
                        const month = String(date.getMonth() + 1).padStart(2, "0");
                        const year = date.getFullYear();
                        return `${day}/${month}/${year}`;
                    }
                    return date;
                }},
                { path: "impaye.statut", getValue: (d) => getValue(d.impaye, "statut") },
                { path: "impaye.libelle", getValue: (d) => getValue(d.impaye, "libelle") },
                { path: "current.numero", getValue: (d) => getValue(d.current, "numero") },
                { path: "current.dossier", getValue: (d) => getValue(d.current, "dossier") },
                { path: "current.montant", getValue: (d) => getValue(d.current, "montant") },
                { path: "current.dateEcheance", getValue: (d) => {
                    const date = getValue(d.current, "dateEcheance");
                    if (date instanceof Date) {
                        const day = String(date.getDate()).padStart(2, "0");
                        const month = String(date.getMonth() + 1).padStart(2, "0");
                        const year = date.getFullYear();
                        return `${day}/${month}/${year}`;
                    }
                    return date;
                }},
            ];
            
            for (const mapping of impayeMappings) {
                const value = mapping.getValue(impayeData);
                if (value !== undefined && value !== null) {
                    itemContent = replaceVariable(itemContent, mapping.path, value);
                }
            }
            
            // Ajouter le contenu traité au résultat de la boucle
            if (loopResult) loopResult += "\n";
            loopResult += itemContent;
        }
        
        // Remplacer la boucle complète par le résultat
        result = (
            result.substring(0, startIndex) +
            loopResult +
            result.substring(endIndex + loopEnd.length)
        );
        
        // Continuer la recherche
        startIndex = result.indexOf(loopStart, startIndex + loopResult.length);
    }
    
    return result;
}

/**
 * Récupère les impayés pour un suivi
 */
async function getImpayesForSuivi(suivi) {
    const impayes = suivi.get("impayes");
    if (impayes && impayes.length > 0) {
        return impayes;
    }
    
    // Sinon essayer de récupérer depuis impaye
    const impaye = suivi.get("impaye");
    if (impaye) {
        return [impaye];
    }
    return [];
}

/**
 * Traite un suivi pour remplacer ses variables
 * @param {Object} suivi - Objet Suivi Parse
 * @param {Object} scenario - Scénario à utiliser
 * @returns {Promise<Object>} { objet, corps, hasChanges }
 */
async function processSuivi(suivi, scenario) {
    if (!scenario) {
        return { objet: null, corps: null, hasChanges: false };
    }
    
    let objet = scenario.objet || "";
    let corps = scenario.corps || "";
    
    // Récupérer les impayés
    const impayes = await getImpayesForSuivi(suivi);
    
    // Données disponibles pour le remplacement
    const data = {
        suivi: suivi,
        contact: suivi.get("contact"),
        sequence: suivi.get("sequence"),
        impayes: impayes,
        scenario: scenario,
    };
    
    // Remplacer les variables dans l'objet et le corps
    const newObjet = replaceAllVariables(objet, data);
    const newCorps = replaceAllVariables(corps, data);
    
    const hasChanges = newObjet !== objet || newCorps !== corps;
    
    return {
        objet: newObjet,
        corps: newCorps,
        hasChanges: hasChanges,
    };
}

/**
 * Vérifie si un texte contient encore des variables non remplacées
 */
function hasUnreplacedVariables(text) {
    if (!text || typeof text !== "string") return false;
    
    // Vérifier la présence de [[ sans ]] ou ]] sans [[
    let hasOpen = false;
    let hasClose = false;
    
    for (let i = 0; i < text.length - 1; i++) {
        if (text[i] === '[' && text[i + 1] === '[') {
            hasOpen = true;
            break;
        }
    }
    
    for (let i = 0; i < text.length - 1; i++) {
        if (text[i] === ']' && text[i + 1] === ']') {
            hasClose = true;
            break;
        }
    }
    
    return hasOpen || hasClose;
}

/**
 * Étape 1 : Remplace les variables connues dans les suivis en attente
 * @returns {Promise<Object>} { stats }
 */
async function replaceVariables() {
    const Suivi = Parse.Object.extend("Suivi");
    
    const stats = {
        total: 0,
        processed: 0,
        updated: 0,
        errors: [],
    };
    
    info(
        "Étape 1: Début du remplacement des variables",
        "generate-suivi",
        "replaceVariables",
    );
    
    try {
        // Récupérer tous les Suivis en attente
        const query = new Parse.Query(Suivi);
        query.equalTo("statut", "En attente de génération");
        query.include(["sequence", "contact", "impaye", "impayes", "scenario"]);
        query.limit(999999);
        
        const suivis = await query.find({ useMasterKey: true });
        
        info(
            `Étape 1: ${suivis.length} Suivis en attente de traitement`,
            "generate-suivi",
            "replaceVariables",
        );
        
        stats.total = suivis.length;
        
        if (suivis.length === 0) {
            info(
                "Étape 1: Aucun Suivi en attente, fin de l'étape 1",
                "generate-suivi",
                "replaceVariables",
            );
            return { stats };
        }
        
        // Traiter chaque Suivi
        for (const suivi of suivis) {
            const suiviId = suivi.id;
            const scenario = suivi.get("scenario");
            
            info(
                `Étape 1: Traitement des variables pour Suivi ${suiviId}...`,
                "generate-suivi",
                "replaceVariables",
                { suiviId },
            );
            
            try {
                if (!scenario) {
                    warn(
                        `Suivi ${suiviId}: pas de scénario associé, skip`,
                        "generate-suivi",
                        "replaceVariables",
                    );
                    stats.errors.push({
                        suiviId,
                        error: "pas de scénario associé",
                    });
                    continue;
                }
                
                const { objet, corps, hasChanges } = await processSuivi(suivi, scenario);
                
                if (hasChanges) {
                    // Mettre à jour le Suivi avec les variables remplacées
                    suivi.set("objet", objet);
                    suivi.set("corps", corps);
                    await suivi.save(null, { useMasterKey: true });
                    stats.updated++;
                    
                    info(
                        `Suivi ${suiviId}: variables remplacées`,
                        "generate-suivi",
                        "replaceVariables",
                        { suiviId },
                    );
                } else {
                    info(
                        `Suivi ${suiviId}: aucune variable à remplacer`,
                        "generate-suivi",
                        "replaceVariables",
                        { suiviId },
                    );
                }
                
                stats.processed++;
                
            } catch (err) {
                error(
                    `Étape 1: Erreur pour Suivi ${suiviId}: ${err.message}`,
                    "generate-suivi",
                    "replaceVariables",
                    { suiviId, error: err.message },
                );
                stats.errors.push({
                    suiviId,
                    error: err.message,
                });
            }
        }
        
        info(
            `Étape 1: ${stats.processed} traités | ${stats.updated} mis à jour | ${stats.errors.length} erreurs`,
            "generate-suivi",
            "replaceVariables",
            { processed: stats.processed, updated: stats.updated, errors: stats.errors.length },
        );
        
        return { stats };
        
    } catch (err) {
        error(
            `Erreur dans replaceVariables: ${err.message}`,
            "generate-suivi",
            "replaceVariables",
            { error: err.message, stack: err.stack?.substring(0, 500) },
        );
        stats.errors.push({
            step: "replaceVariables",
            error: err.message,
            stack: err.stack?.substring(0, 500),
        });
        return { stats };
    }
}

module.exports = replaceVariables;
