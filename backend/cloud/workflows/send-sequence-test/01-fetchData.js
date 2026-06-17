// backend/cloud/workflows/send-sequence-test/01-fetchData.js
// Étape 1 : Récupération des données depuis Parse
// Retourne : { sequence, payeur, impayes: [] }

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
 * Convertit un objet Parse en objet JavaScript simple
 */
function convertToSimpleObject(obj) {
    if (!obj) return null;
    if (typeof obj.toJSON === "function") {
        return obj.toJSON();
    }
    if (typeof obj.get === "function") {
        const result = {};
        const attributes = obj.attributes || {};
        for (const key of Object.keys(attributes)) {
            const value = attributes[key];
            if (value && typeof value.get === "function") {
                result[key] = convertToSimpleObject(value);
            } else if (Array.isArray(value)) {
                result[key] = value.map(convertToSimpleObject);
            } else {
                result[key] = value;
            }
        }
        return result;
    }
    return obj;
}

/**
 * Étape 1 : Récupère les données nécessaires depuis Parse
 * @param {Object} params - Paramètres d'entrée
 * @param {string} params.sequenceId - ID de la séquence
 * @param {string} params.testEmail - Email de test
 * @param {string} params.payeurId - ID du payeur
 * @returns {Promise<Object>} { sequence, payeur, impayes }
 */
async function fetchData(params) {
    const { sequenceId, testEmail, payeurId } = params;

    info(
        `[01-fetchData] Début récupération données: sequenceId=${sequenceId}, payeurId=${payeurId}`,
        "send-sequence-test",
        "fetchData",
    );

    // Validation
    if (!sequenceId || !testEmail || !payeurId) {
        throw new Error(
            "[01-fetchData] Paramètres manquants: sequenceId, testEmail et payeurId sont requis",
        );
    }

    try {
        // Récupérer la séquence
        info(
            `[01-fetchData] Récupération de la séquence ${sequenceId}...`,
            "send-sequence-test",
            "fetchData",
        );
        const Sequence = Parse.Object.extend("Sequence");
        const sequenceQuery = new Parse.Query(Sequence);
        const sequence = await sequenceQuery.get(sequenceId, {
            useMasterKey: true,
        });
        info(
            `[01-fetchData] ✅ Séquence récupérée: ${sequence.get("nom") || sequence.id}`,
            "send-sequence-test",
            "fetchData",
        );

        // Récupérer le payeur
        info(
            `[01-fetchData] Récupération du payeur ${payeurId}...`,
            "send-sequence-test",
            "fetchData",
        );
        const Contact = Parse.Object.extend("Contact");
        const payeurQuery = new Parse.Query(Contact);
        const payeur = await payeurQuery.get(payeurId, {
            useMasterKey: true,
        });
        info(
            `[01-fetchData] ✅ Payeur récupéré: ${payeur.get("nom") || payeur.id}`,
            "send-sequence-test",
            "fetchData",
        );

        // Récupérer les impayés non soldés pour ce payeur
        info(
            `[01-fetchData] Récupération des impayés pour le payeur...`,
            "send-sequence-test",
            "fetchData",
        );
        const Impaye = Parse.Object.extend("Impaye");
        const impayeQuery = new Parse.Query(Impaye);
        impayeQuery.equalTo("payeur", payeur);
        impayeQuery.equalTo("facture_soldee", false);
        impayeQuery.limit(100);

        const impayes = await impayeQuery.find({ useMasterKey: true });

        // Si aucun impayé non soldé, essayer avec tous les impayés
        if (impayes.length === 0) {
            warn(
                `[01-fetchData] ⚠️ Aucun impayé non soldé trouvé pour ${payeur.get("nom")}, tentative avec tous les impayés...`,
                "send-sequence-test",
                "fetchData",
            );
            const allImpayeQuery = new Parse.Query(Impaye);
            allImpayeQuery.equalTo("payeur", payeur);
            allImpayeQuery.limit(100);
            const allImpayes = await allImpayeQuery.find({ useMasterKey: true });

            if (allImpayes.length === 0) {
                throw new Error(
                    `[01-fetchData] Aucun impayé trouvé pour le payeur ${payeur.get("nom")}`,
                );
            }

            info(
                `[01-fetchData] ✅ ${allImpayes.length} impayé(s) trouvés (tous statuts)`,
                "send-sequence-test",
                "fetchData",
            );
            return {
                sequence: convertToSimpleObject(sequence),
                payeur: convertToSimpleObject(payeur),
                impayes: allImpayes.map(convertToSimpleObject),
            };
        }

        info(
            `[01-fetchData] ✅ ${impayes.length} impayé(s) non soldé(s) récupérés`,
            "send-sequence-test",
            "fetchData",
        );

        return {
            sequence: convertToSimpleObject(sequence),
            payeur: convertToSimpleObject(payeur),
            impayes: impayes.map(convertToSimpleObject),
        };
    } catch (err) {
        error(
            `[01-fetchData] ❌ Erreur: ${err.message}`,
            "send-sequence-test",
            "fetchData",
        );
        throw err;
    }
}

module.exports = fetchData;
