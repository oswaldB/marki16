// backend/cloud/workflows/generate-relances/01-replaceVariables.js
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
        { path: "contact.nom", getValue: (d) => d.contact?.get?.("nom") || d.contact?.nom },
        { path: "contact.prenom", getValue: (d) => d.contact?.get?.("prenom") || d.contact?.prenom },
        { path: "contact.email", getValue: (d) => d.contact?.get?.("email") || d.contact?.email },
        { path: "contact.telephone", getValue: (d) => d.contact?.get?.("telephone") || d.contact?.telephone },
        { path: "contact.adresse", getValue: (d) => d.contact?.get?.("adresse") || d.contact?.adresse },
        { path: "contact.ville", getValue: (d) => d.contact?.get?.("ville") || d.contact?.ville },
        { path: "contact.codePostal", getValue: (d) => d.contact?.get?.("codePostal") || d.contact?.codePostal },
        { path: "contact.payeur_nom", getValue: (d) => d.contact?.get?.("payeur_nom") || d.contact?.payeur_nom },
        
        // Variables de relance
        { path: "relance.email_index", getValue: (d) => d.relance?.get?.("email_index") || d.relance?.email_index },
        { path: "relance.objet", getValue: (d) => d.relance?.get?.("objet") || d.relance?.objet },
        { path: "relance.corps", getValue: (d) => d.relance?.get?.("corps") || d.relance?.corps },
        { path: "relance.statut", getValue: (d) => d.relance?.get?.("statut") || d.relance?.statut },
        
        // Variables de séquence
        { path: "sequence.nom", getValue: (d) => d.sequence?.get?.("nom") || d.sequence?.nom },
        { path: "sequence.type", getValue: (d) => d.sequence?.get?.("type") || d.sequence?.type },
        
        // Variables d'impayés (pour boucle, on gère séparément)
        { path: "impayes.count", getValue: (d) => d.impayes?.length },
        { path: "impayes.totalMontant", getValue: (d) => d.impayes?.reduce((sum, i) => sum + (i.get?.("montant") || i.montant || 0), 0) },
        
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
    // On va remplacer les boucles par un placeholder pour le LLM
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
                { path: "impaye.numero", getValue: (d) => d.impaye?.get?.("numero") || d.impaye?.numero },
                { path: "impaye.dossier", getValue: (d) => d.impaye?.get?.("dossier") || d.impaye?.dossier },
                { path: "impaye.montant", getValue: (d) => d.impaye?.get?.("montant") || d.impaye?.montant },
                { path: "impaye.dateEcheance", getValue: (d) => {
                    const date = d.impaye?.get?.("dateEcheance") || d.impaye?.dateEcheance;
                    if (date instanceof Date) {
                        const day = String(date.getDate()).padStart(2, "0");
                        const month = String(date.getMonth() + 1).padStart(2, "0");
                        const year = date.getFullYear();
                        return `${day}/${month}/${year}`;
                    }
                    return date;
                }},
                { path: "impaye.statut", getValue: (d) => d.impaye?.get?.("statut") || d.impaye?.statut },
                { path: "impaye.libelle", getValue: (d) => d.impaye?.get?.("libelle") || d.impaye?.libelle },
                { path: "current.numero", getValue: (d) => d.current?.get?.("numero") || d.current?.numero },
                { path: "current.dossier", getValue: (d) => d.current?.get?.("dossier") || d.current?.dossier },
                { path: "current.montant", getValue: (d) => d.current?.get?.("montant") || d.current?.montant },
                { path: "current.dateEcheance", getValue: (d) => {
                    const date = d.current?.get?.("dateEcheance") || d.current?.dateEcheance;
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
 * Traite une relance pour remplacer ses variables
 * @param {Object} relance - Objet Relance Parse
 * @param {Object} context - Contexte supplémentaire (sequence, impayes, etc.)
 * @returns {Promise<Object>} { objet, corps, hasChanges }
 */
async function processRelance(relance, context) {
    const scenario = context.scenario;
    const impayes = context.impayes || [];
    
    if (!scenario) {
        return { objet: null, corps: null, hasChanges: false };
    }
    
    let objet = scenario.objet || "";
    let corps = scenario.corps || "";
    
    // Données disponibles pour le remplacement
    const data = {
        relance: relance,
        contact: relance.get("contact"),
        sequence: context.sequence,
        impayes: impayes,
        scenario: scenario,
    };
    
    // Remplacer les variables dans l'objet
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
 * Étape 1 : Remplace les variables connues dans les relances en attente
 * @returns {Promise<Object>} { stats }
 */
async function replaceVariables() {
    const stats = {
        processed: 0,
        updated: 0,
        errors: 0,
        erreurs: [],
    };
    
    info(
        "Étape 1: Début du remplacement des variables",
        "generate-relances",
        "replaceVariables",
    );
    
    try {
        const Relance = Parse.Object.extend("Relance");
        const query = new Parse.Query(Relance);
        query.equalTo("statut", "En attente de génération");
        query.limit(9999);
        query.include(["sequence", "contact", "impayes"]);
        
        const relances = await query.find({ useMasterKey: true });
        info(
            `Étape 1: ${relances.length} relances en attente de traitement`,
            "generate-relances",
            "replaceVariables",
        );
        
        for (const relance of relances) {
            try {
                const sequence = relance.get("sequence");
                const impayesIds = relance.get("impayes") || [];
                const emailIndex = relance.get("email_index");
                
                if (!sequence) {
                    warn(
                        `Relance ${relance.id}: pas de séquence associée, skip`,
                        "generate-relances",
                        "replaceVariables",
                    );
                    stats.erreurs.push({
                        relanceId: relance.id,
                        erreur: "pas de séquence associée",
                    });
                    continue;
                }
                
                // Récupérer les détails des impayés
                const Impaye = Parse.Object.extend("Impaye");
                const impayeQuery = new Parse.Query(Impaye);
                impayeQuery.containedIn("objectId", impayesIds);
                const impayeDetails = await impayeQuery.find({ useMasterKey: true });
                
                // Récupérer la séquence complète
                const Sequence = Parse.Object.extend("Sequence");
                const sequenceQuery = new Parse.Query(Sequence);
                sequenceQuery.equalTo("objectId", sequence.id);
                sequenceQuery.equalTo("type", "relances");
                const fullSequence = await sequenceQuery.first({ useMasterKey: true });
                
                if (!fullSequence) {
                    warn(
                        `Relance ${relance.id}: séquence non trouvée, skip`,
                        "generate-relances",
                        "replaceVariables",
                    );
                    stats.erreurs.push({
                        relanceId: relance.id,
                        erreur: "séquence non trouvée",
                    });
                    continue;
                }
                
                const scenarios = fullSequence?.get("emails") || [];
                const matchingScenario = scenarios.find((s) => s.email_index === emailIndex);
                
                if (!matchingScenario) {
                    warn(
                        `Relance ${relance.id}: pas de scénario correspondant, skip`,
                        "generate-relances",
                        "replaceVariables",
                    );
                    stats.erreurs.push({
                        relanceId: relance.id,
                        erreur: "pas de scénario correspondant",
                    });
                    continue;
                }
                
                const activeScenario = matchingScenario.scenarios?.find((s) => s.active);
                if (!activeScenario) {
                    warn(
                        `Relance ${relance.id}: pas de scénario actif, skip`,
                        "generate-relances",
                        "replaceVariables",
                    );
                    stats.erreurs.push({
                        relanceId: relance.id,
                        erreur: "pas de scénario actif",
                    });
                    continue;
                }
                
                // Traiter la relance
                const context = {
                    sequence: fullSequence,
                    scenario: activeScenario,
                    impayes: impayeDetails,
                };
                
                const { objet, corps, hasChanges } = await processRelance(relance, context);
                
                if (hasChanges) {
                    // Mettre à jour la relance avec les variables remplacées
                    relance.set("objet", objet);
                    relance.set("corps", corps);
                    await relance.save(null, { useMasterKey: true });
                    stats.updated++;
                    
                    info(
                        `Relance ${relance.id}: variables remplacées (objet: ${objet.substring(0, 50)}...)`,
                        "generate-relances",
                        "replaceVariables",
                    );
                } else {
                    info(
                        `Relance ${relance.id}: aucune variable à remplacer`,
                        "generate-relances",
                        "replaceVariables",
                    );
                }
                
                stats.processed++;
                
            } catch (err) {
                error(
                    `Erreur pour relance ${relance.id}: ${err.message}`,
                    "generate-relances",
                    "replaceVariables",
                );
                stats.errors++;
                stats.erreurs.push({ relanceId: relance.id, erreur: err.message });
            }
        }
        
        info(
            `Étape 1: ${stats.processed} traités | ${stats.updated} mis à jour | ${stats.errors} erreurs`,
            "generate-relances",
            "replaceVariables",
        );
        
        return { stats };
        
    } catch (err) {
        error(
            `Erreur Étape 1: ${err.message}`,
            "generate-relances",
            "replaceVariables",
        );
        throw err;
    }
}

module.exports = replaceVariables;
