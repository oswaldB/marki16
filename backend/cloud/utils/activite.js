// backend/cloud/utils/activite.js
// Helper partagé pour tracer une activité dans Parse.
// Ne fait jamais échouer le flux appelant : retourne null en cas d'erreur.

function resolveParse() {
    if (typeof Parse !== "undefined") return Parse;
    if (global.Parse) return global.Parse;
    return require("parse/node");
}

/**
 * Crée une entrée Activite.
 *
 * @param {string} type - Type d'activité (ex: "suivi")
 * @param {string} operation - Opération effectuée (ex: "generation_manuelle")
 * @param {string} details - Détails lisibles
 * @param {Object|null} impaye - Objet Impaye associé (optionnel)
 * @param {Object} extra - Champs additionnels à poser sur l'activité (optionnel)
 * @returns {Promise<Object|null>} L'entité Activite créée ou null en cas d'échec
 */
async function createActivite(type, operation, details, impaye = null, extra = {}) {
    try {
        const Parse = resolveParse();
        const Activite = Parse.Object.extend("Activite");
        const activite = new Activite();

        activite.set("type", type);
        activite.set("operation", operation);
        activite.set("details", details);
        activite.set("timestamp", new Date());

        if (impaye) {
            activite.set("impaye", impaye);
            activite.set("impaye_id", impaye.id);
            const get = (key) =>
                impaye && typeof impaye.get === "function"
                    ? impaye.get(key)
                    : impaye
                      ? impaye[key]
                      : undefined;
            const nfacture = get("nfacture");
            const payeurNom = get("payeur_nom");
            if (nfacture) activite.set("nfacture", nfacture);
            if (payeurNom) activite.set("payeur_nom", payeurNom);
        }

        for (const [key, value] of Object.entries(extra || {})) {
            if (value !== undefined && value !== null) activite.set(key, value);
        }

        return await activite.save(null, { useMasterKey: true });
    } catch (err) {
        try {
            const { error } = require("./logger");
            error(
                `createActivite échouée: ${err.message}`,
                "activite",
                "createActivite",
                { type, operation },
            );
        } catch (_) {
            // ignore
        }
        return null;
    }
}

module.exports = { createActivite };
