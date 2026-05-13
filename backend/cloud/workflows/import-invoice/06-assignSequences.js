// backend/cloud/workflows/import-invoice/06-assignSequences.js
// Étape 6 : Attribue automatiquement des séquences aux impayés selon les règles définies
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

const {
    appliquerReglesAttributionAutomatique,
} = require("../../workflows/appliquer-regles-attribution/01-appliquerReglesAttributionAutomatique");

/**
 * Étape 6 : Attribue automatiquement des séquences aux impayés
 * @returns {Promise<Object>} { stats }
 */
async function assignSequences() {
    const stats = {
        impayesTraites: 0,
        sequencesAttribuees: 0,
        erreurs: [],
    };

    info(
        "Étape 6: Début de l'attribution des séquences",
        "import-invoice",
        "assignSequences",
    );

    try {
        // 1. Récupérer tous les impayés sans séquence attribuée, non soldés
        const Impaye = Parse.Object.extend("Impaye");
        const query = new Parse.Query(Impaye);
        query.doesNotExist("sequence");
        query.equalTo("facture_soldee", false);
        query.greaterThan("reste_a_payer", 0);
        query.include("contact_relance");
        query.limit(999999);

        const impayes = await query.find({ useMasterKey: true });
        info(
            `Étape 6: ${impayes.length} impayés à traiter (sans séquence)`,
            "import-invoice",
            "assignSequences",
            { count: impayes.length },
        );

        // 2. Traiter chaque impayé
        for (const impaye of impayes) {
            try {
                stats.impayesTraites++;

                // 3. Appliquer les règles d'attribution automatique
                const sequence =
                    await appliquerReglesAttributionAutomatique(impaye);

                if (sequence) {
                    stats.sequencesAttribuees++;
                    info(
                        `Étape 6: Séquence attribuée: ${sequence.id}`,
                        "import-invoice",
                        "assignSequences",
                        { sequenceId: sequence.id },
                    );

                    // 4. Sauvegarder l'impayé avec la séquence attribuée
                    impaye.set("sequence", sequence);
                    await impaye.save(null, { useMasterKey: true });
                    info(
                        `Étape 6: Séquence sauvegardée pour ${impaye.id}`,
                        "import-invoice",
                        "assignSequences",
                        { impayeId: impaye.id },
                    );
                } else {
                    warn(
                        `Étape 6: Aucune séquence applicable pour ${impaye.id} (${impaye.get("nfacture")})`,
                        "import-invoice",
                        "assignSequences",
                        {
                            impayeId: impaye.id,
                            nfacture: impaye.get("nfacture"),
                        },
                    );
                    stats.erreurs.push({
                        impayeId: impaye.id,
                        nfacture: impaye.get("nfacture"),
                        erreur: "Aucune séquence applicable",
                    });
                }
            } catch (err) {
                error(
                    `Erreur impayé ${impaye.id}: ${err.message}`,
                    "import-invoice",
                    "assignSequences",
                    {
                        impayeId: impaye.id,
                        error: err.message,
                        stack: err.stack?.substring(0, 500),
                    },
                );
                stats.erreurs.push({
                    impayeId: impaye.id,
                    nfacture: impaye.get("nfacture"),
                    erreur: err.message,
                    stack: err.stack && err.stack.substring(0, 500),
                });
            }
        }

        info(
            `Étape 6: ${stats.impayesTraites} traités | ${stats.sequencesAttribuees} séquences attribuées | ${stats.erreurs.length} erreurs`,
            "import-invoice",
            "assignSequences",
        );

        return {
            stats,
        };
    } catch (err) {
        error(
            `Erreur Étape 6: ${err.message}`,
            "import-invoice",
            "assignSequences",
            { error: err.message, stack: err.stack?.substring(0, 500) },
        );
        throw err;
    }
}

module.exports = assignSequences;
