/**
 * Cloud Function: testSingleEmail
 * Fonction principale qui orchestrer les 3 noeuds du workflow test-single.
 * 
 * @note: Ce fichier est conservé pour la rétrocompatibilité avec le frontend.
 *        Il appelle les nouveaux noeuds (01-validateAndFetch, 02-templateProcessing, 03-sendEmail).
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

// Importer les 3 noeuds
const validateAndFetch = require("./01-validateAndFetch");
const templateProcessing = require("./02-templateProcessing");
const sendEmail = require("./03-sendEmail");

/**
 * Cloud Function pour envoyer un email de test unique.
 * Orchestre les 3 noeuds:
 *  1. validateAndFetch: Validation + récupération de la séquence.
 *  2. templateProcessing: Traitement du template (2 passes).
 *  3. sendEmail: Envoi de l'email via Nodemailer.
 * 
 * @param {Object} request - Objet contenant les paramètres.
 * @param {string} request.sequenceId - ID de la séquence.
 * @param {string} request.testEmail - Email de destination pour le test.
 * @param {string} request.payeurId - ID du payeur.
 * @param {Object} request.payeurData - Données du payeur (nom, email, impayesCount, impayesAmount).
 * @param {number} request.emailIndex - Index de l'email dans la séquence.
 * @param {string} [request.userId] - ID de l'utilisateur.
 * @param {string} [request.userEmail] - Email de l'utilisateur.
 * @param {string} [request.userName] - Nom de l'utilisateur.
 * @returns {Promise<Object>} - Résultat avec success, message, preview, etc.
 */
async function testSingleEmail(request) {
    info(
        "\n═════════════════════════════════════════════════════════════",
        "test-single",
        "testSingleEmail",
    );
    info(`DÉBUT: testSingleEmail - Orchestration des noeuds`, "test-single", "testSingleEmail");
    info(
        `Paramètres: sequenceId=${request.sequenceId}, emailIndex=${request.emailIndex}, testEmail=${request.testEmail}`,
        "test-single",
        "testSingleEmail",
    );

    try {
        // ============================================
        // NOEUD 1: Validation et récupération des données
        // ============================================
        info("\n--- NOEUD 1: Validation et récupération ---", "test-single", "testSingleEmail");
        const node1Data = await validateAndFetch(request);
        
        // ============================================
        // NOEUD 2: Traitement du template (2 passes)
        // ============================================
        info("\n--- NOEUD 2: Traitement du template ---", "test-single", "testSingleEmail");
        const node2Data = await templateProcessing(node1Data);
        
        // ============================================
        // NOEUD 3: Envoi de l'email
        // ============================================
        info("\n--- NOEUD 3: Envoi de l'email ---", "test-single", "testSingleEmail");
        const result = await sendEmail(node2Data);
        
        // ============================================
        // SUCCÈS
        // ============================================
        info(
            "\n═════════════════════════════════════════════════════════════",
            "test-single",
            "testSingleEmail",
        );
        info("✅ FIN: testSingleEmail - Email de test envoyé avec succès", "test-single", "testSingleEmail");
        info(
            "═════════════════════════════════════════════════════════════",
            "test-single",
            "testSingleEmail",
        );

        return result;
    } catch (err) {
        // ============================================
        // ERREUR
        // ============================================
        error(`ERREUR dans testSingleEmail: ${err.message}`, "test-single", "testSingleEmail");
        error(err.stack, "test-single", "testSingleEmail");

        info(
            "\n═════════════════════════════════════════════════════════════",
            "test-single",
            "testSingleEmail",
        );
        info("❌ FIN: testSingleEmail - Échec", "test-single", "testSingleEmail");
        info(
            "═════════════════════════════════════════════════════════════",
            "test-single",
            "testSingleEmail",
        );

        return {
            success: false,
            message: err.message || "Échec de l'envoi du test",
            error: err.message,
            timestamp: new Date().toISOString(),
        };
    }
}

module.exports = testSingleEmail;
