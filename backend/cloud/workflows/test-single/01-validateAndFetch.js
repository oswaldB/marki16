/**
 * Node 1: Validate and Fetch Data
 * Noeud responsable de la validation des paramètres et de la récupération de la séquence.
 * 
 * @note: Ce noeud ne fait PAS de requêtes pour Contact ou Impaye.
 *        Il utilise uniquement payeurData (préchargé par le frontend).
 */

require("dotenv").config({ path: "/home/ubuntu/prod/adti/.env" });

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
 * Valide les paramètres requis pour le workflow testSingleEmail.
 * @param {Object} request - Objet contenant les paramètres.
 * @throws {Error} - Si un paramètre requis est manquant.
 */
function validateRequest(request) {
    info("Validation des paramètres...", "test-single", "01-validateAndFetch");
    
    if (!request.sequenceId) {
        throw new Error("sequenceId est requis");
    }
    if (!request.testEmail) {
        throw new Error("testEmail est requis");
    }
    if (!request.payeurId) {
        throw new Error("payeurId est requis");
    }
    if (request.emailIndex === null || request.emailIndex === undefined) {
        throw new Error("emailIndex est requis");
    }
    if (!request.payeurData) {
        throw new Error("payeurData est requis");
    }
    
    info("✅ Tous les paramètres requis sont présents", "test-single", "01-validateAndFetch");
}

/**
 * Récupère la séquence et l'email à tester.
 * @param {string} sequenceId - ID de la séquence.
 * @param {number} emailIndex - Index de l'email dans la séquence.
 * @returns {Promise<{sequence: Object, emailToTest: Object}>} - Séquence et email.
 * @throws {Error} - Si la séquence ou l'email n'est pas trouvé.
 */
async function fetchSequenceAndEmail(sequenceId, emailIndex) {
    info(`Récupération de la séquence ${sequenceId}...`, "test-single", "01-validateAndFetch");
    
    const Sequence = Parse.Object.extend("Sequence");
    const sequenceQuery = new Parse.Query(Sequence);
    const sequence = await sequenceQuery.get(sequenceId);
    
    if (!sequence) {
        throw new Error("Séquence introuvable");
    }
    
    info(`Séquence trouvée: ${sequence.get("nom") || "Sans nom"}`, "test-single", "01-validateAndFetch");

    // Récupérer les emails de la séquence
    const emails = sequence.get("emails") || [];
    
    if (!emails || emails.length === 0) {
        throw new Error("Aucun email trouvé dans la séquence");
    }
    
    if (emailIndex >= emails.length) {
        throw new Error(`emailIndex ${emailIndex} hors limites (${emails.length} emails)`);
    }
    
    const emailToTest = emails[emailIndex];
    info(
        `Email à tester: index=${emailIndex}, délai=J+${emailToTest.delai || 0}`,
        "test-single",
        "01-validateAndFetch",
    );
    
    return { sequence, emailToTest };
}

/**
 * Noeud 1: Valide la requête et récupère les données nécessaires.
 * @param {Object} request - Objet contenant les paramètres.
 * @returns {Promise<Object>} - Données validées et récupérées.
 */
async function validateAndFetch(request) {
    info(
        "\n═════════════════════════════════════════════════════════════",
        "test-single",
        "01-validateAndFetch",
    );
    info("DÉBUT: Noeud 1 - Validation et récupération des données", "test-single", "01-validateAndFetch");
    
    try {
        // Étape 1: Validation des paramètres
        validateRequest(request);
        
        // Étape 2: Récupération de la séquence et de l'email
        const { sequence, emailToTest } = await fetchSequenceAndEmail(
            request.sequenceId,
            request.emailIndex,
        );
        
        // Étape 3: Utilisation de payeurData (préchargé par le frontend)
        info(
            `Utilisation de payeurData: ${request.payeurData.nom} (${request.payeurData.email})`,
            "test-single",
            "01-validateAndFetch",
        );
        
        info(
            "✅ Noeud 1 terminé: Données validées et récupérées",
            "test-single",
            "01-validateAndFetch",
        );
        
        // Retourner les données pour le noeud suivant
        return {
            request,
            sequence,
            emailToTest,
            payeurData: request.payeurData,
        };
    } catch (err) {
        error(`ERREUR dans Noeud 1: ${err.message}`, "test-single", "01-validateAndFetch");
        throw err; // Relancer l'erreur pour le noeud appelant
    }
}

module.exports = validateAndFetch;
