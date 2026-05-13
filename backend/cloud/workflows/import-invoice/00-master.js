// backend/cloud/workflows/import-invoice/00-master.js
// Orchestre le processus d'importation des factures
// Les étapes 8 et 9 (création et génération des relances) ont été extraites
// dans un workflow autonome accessible via Cloud Function "generateRelances"

// Charger les variables d'environnement depuis .env
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

// Charger les scripts d'étape
const fetchPiecesAndDossiers = require("./01-fetchPiecesAndDossiers");
const fetchStatuts = require("./02-fetchStatuts");
const fetchEmployes = require("./03-fetchEmployes");
const fetchInterlocuteurs = require("./04-fetchInterlocuteurs");
const processAndSaveImpayes = require("./05-processAndSaveImpayes");
const assignSequences = require("./06-assignSequences");
const fetchImpayesWithSequence = require("./07-fetchImpayesWithSequence");

/**
 * Orchestrateur principal
 */
async function importInvoicesMaster({ trigger = "cron" } = {}) {
    const startedAt = new Date();
    info(
        `Début du processus (trigger: ${trigger})`,
        "import-invoice",
        "importInvoicesMaster",
        { trigger },
    );

    const stats = {
        errors: [],
        total: {
            startedAt: startedAt.toISOString(),
            finishedAt: null,
            durationMs: 0,
        },
    };

    try {
        // Étape 1: Récupération des pièces et dossiers depuis SQLite
        info(
            "Étape 1/7: Récupération des pièces et dossiers...",
            "import-invoice",
            "importInvoicesMaster",
            { step: 1 },
        );
        let result = await fetchPiecesAndDossiers();
        const { pieces } = result;
        stats.etape1 = { piecesCount: pieces.length };
        info(
            `Étape 1 terminée: ${pieces.length} pièces récupérées`,
            "import-invoice",
            "importInvoicesMaster",
            { step: 1, count: pieces.length },
        );

        // Étape 2: Récupération des statuts
        info(
            "Étape 2/7: Récupération des statuts...",
            "import-invoice",
            "importInvoicesMaster",
            { step: 2 },
        );
        result = await fetchStatuts();
        const { statutsMap } = result;
        stats.etape2 = { statutsCount: Object.keys(statutsMap).length };
        info(
            `Étape 2 terminée: ${Object.keys(statutsMap).length} statuts récupérés`,
            "import-invoice",
            "importInvoicesMaster",
            { step: 2, count: Object.keys(statutsMap).length },
        );

        // Étape 3: Récupération des employés
        info(
            "Étape 3/7: Récupération des employés...",
            "import-invoice",
            "importInvoicesMaster",
            { step: 3 },
        );
        result = await fetchEmployes();
        const { employesMap } = result;
        stats.etape3 = { employesCount: Object.keys(employesMap).length };
        info(
            `Étape 3 terminée: ${Object.keys(employesMap).length} employés récupérés`,
            "import-invoice",
            "importInvoicesMaster",
            { step: 3, count: Object.keys(employesMap).length },
        );

        // Étape 4: Récupération des interlocuteurs
        info(
            "Étape 4/7: Récupération des interlocuteurs...",
            "import-invoice",
            "importInvoicesMaster",
            { step: 4 },
        );
        result = await fetchInterlocuteurs({ pieces });
        const { interlocuteursByDossier } = result;
        stats.etape4 = {
            interlocuteursCount: Object.keys(interlocuteursByDossier).length,
        };
        info(
            `Étape 4 terminée: interlocuteurs pour ${Object.keys(interlocuteursByDossier).length} dossiers`,
            "import-invoice",
            "importInvoicesMaster",
            { step: 4, count: Object.keys(interlocuteursByDossier).length },
        );

        // Étape 5: Traitement et sauvegarde des impayés dans Parse
        info(
            "Étape 5/7: Traitement et sauvegarde des impayés...",
            "import-invoice",
            "importInvoicesMaster",
            { step: 5 },
        );
        result = await processAndSaveImpayes({
            pieces,
            statutsMap,
            employesMap,
            interlocuteursByDossier,
        });
        stats.etape5 = result.stats;
        info(
            `Étape 5 terminée: ${result.stats.impayes_created} créés, ${result.stats.impayes_updated} mis à jour`,
            "import-invoice",
            "importInvoicesMaster",
            {
                step: 5,
                created: result.stats.impayes_created,
                updated: result.stats.impayes_updated,
            },
        );

        // Étape 6: Attribution automatique des séquences
        info(
            "Étape 6/7: Attribution des séquences...",
            "import-invoice",
            "importInvoicesMaster",
            { step: 6 },
        );
        result = await assignSequences();
        stats.etape6 = result.stats;
        info(
            `Étape 6 terminée: ${result.stats.impayesTraites} traités, ${result.stats.sequencesAttribuees} séquences attribuées`,
            "import-invoice",
            "importInvoicesMaster",
            {
                step: 6,
                traites: result.stats.impayesTraites,
                attribuées: result.stats.sequencesAttribuees,
            },
        );

        // Étape 7: Récupération des impayés avec séquence
        info(
            "Étape 7/7: Récupération des impayés avec séquence...",
            "import-invoice",
            "importInvoicesMaster",
            { step: 7 },
        );
        result = await fetchImpayesWithSequence();
        stats.etape7 = result.stats;
        const { sansRelance, avecRelance } = result;
        info(
            `Étape 7 terminée: ${result.stats.sansRelance} sans relance, ${result.stats.avecRelance} avec relance`,
            "import-invoice",
            "importInvoicesMaster",
            {
                step: 7,
                sansRelance: result.stats.sansRelance,
                avecRelance: result.stats.avecRelance,
            },
        );

        // Appel du workflow autonome pour les étapes 8 et 9 (création et génération des relances)
        info(
            "Appel du workflow generate-relances pour les étapes 8 et 9...",
            "import-invoice",
            "importInvoicesMaster",
            {
                step: "generate-relances",
                sansRelanceCount: sansRelance.length,
                avecRelanceCount: avecRelance.length,
            },
        );
        try {
            const generateResult = await Parse.Cloud.run(
                "generateRelances",
                {
                    sansRelanceIds: sansRelance.map((i) => i.id),
                    avecRelance: avecRelance.map((r) => ({
                        impayeId: r.impaye?.id || r.impaye,
                        relanceId: r.relance?.id,
                    })),
                },
                { useMasterKey: true },
            );

            stats.generateRelances = generateResult.stats;
            info(
                `Workflow generate-relances terminé: ${generateResult.stats.etape1?.relancesCreated || 0} relances créées, ${generateResult.stats.etape2?.processed || 0} générées`,
                "import-invoice",
                "importInvoicesMaster",
            );
        } catch (cloudErr) {
            error(
                `Erreur lors de l'appel à generateRelances: ${cloudErr.message}`,
                "import-invoice",
                "importInvoicesMaster",
                {
                    error: cloudErr.message,
                    stack: cloudErr.stack?.substring(0, 500),
                },
            );
            stats.errors.push({
                step: "generateRelances",
                error: cloudErr.message,
                stack: cloudErr.stack?.substring(0, 500),
            });
        }

        info(
            "Processus terminé avec succès",
            "import-invoice",
            "importInvoicesMaster",
            { errorsCount: 0 },
        );
    } catch (err) {
        error(
            `Erreur dans le workflow: ${err.message}`,
            "import-invoice",
            "importInvoicesMaster",
            { error: err.message, stack: err.stack?.substring(0, 500) },
        );
        stats.errors.push({
            step: "importInvoicesMaster",
            error: err.message,
            stack: err.stack?.substring(0, 500),
        });

        warn(
            `Processus terminé avec erreur`,
            "import-invoice",
            "importInvoicesMaster",
            { errorsCount: stats.errors.length },
        );
    }

    const finishedAt = new Date();
    stats.total.finishedAt = finishedAt.toISOString();
    stats.total.durationMs = finishedAt - startedAt;

    info(
        `Durée totale: ${(finishedAt - startedAt) / 1000} secondes`,
        "import-invoice",
        "importInvoicesMaster",
        { durationMs: stats.total.durationMs },
    );

    // Persistance du log d'exécution global dans Parse
    try {
        if (process.env.NODE_ENV !== "test") {
            const log = new Parse.Object("ImportInvoicesMasterLog");
            log.set("startedAt", startedAt);
            log.set("finishedAt", finishedAt);
            log.set("durationMs", finishedAt - startedAt);
            log.set("trigger", trigger);
            log.set("status", stats.errors.length === 0 ? "success" : "error");
            log.set("stats", stats);
            log.set(
                "errors",
                stats.errors.map((e) => JSON.stringify(e)),
            );
            await log.save(null, { useMasterKey: true });
            info(
                "Log Parse sauvegardé avec succès",
                "import-invoice",
                "importInvoicesMaster",
            );
        }
    } catch (logErr) {
        error(
            `Impossible d'écrire le ImportInvoicesMasterLog: ${logErr.message}`,
            "import-invoice",
            "importInvoicesMaster",
            { error: logErr.message, stack: logErr.stack?.substring(0, 500) },
        );
    }

    return { stats };
}

module.exports = importInvoicesMaster;

// Cloud Function pour déclencher l'importation via Parse
Parse.Cloud.define("triggerImportInvoices", async (request) => {
    info(
        "Cloud Function triggerImportInvoices appelée",
        "import-invoice",
        "triggerImportInvoices",
        { user: request.user?.id, master: request.master },
    );

    if (!request.master && !request.user) {
        throw new Error(
            "Non autorisé - cette fonction nécessite un utilisateur authentifié",
        );
    }

    return await importInvoicesMaster({ trigger: "cloud-function" });
});

// Exécution directe si appelé en CLI
if (require.main === module) {
    importInvoicesMaster()
        .then((result) => {
            info(
                "Processus import-invoice terminé",
                "import-invoice",
                "importInvoicesMaster",
                {
                    errors: result.stats.errors.length,
                    durationMs: result.stats.total.durationMs,
                },
            );
            process.exit(result.stats.errors.length > 0 ? 1 : 0);
        })
        .catch((error) => {
            error(
                `Erreur dans import-invoice/master: ${error.message}`,
                "import-invoice",
                "importInvoicesMaster",
                { error: error.message, stack: error.stack?.substring(0, 500) },
            );
            process.exit(1);
        });
}
