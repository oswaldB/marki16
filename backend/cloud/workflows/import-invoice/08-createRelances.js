// backend/cloud/workflows/import-invoice/08-createRelances.js
// Étape 8 : Crée les relances à partir des impayés avec séquence
// Input: { sansRelance, avecRelance, state }
// Output: { stats, state }

const fs = require("fs");
const path = require("path");

const { info, warn, error, debug } = require("../../utils/logger");

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

const STATE_FILE = path.join(__dirname, "state", "sync-state.json");

/**
 * Calcule la date d'envoi prévue à partir du délai du scénario
 */
function getDateEnvoiPrevue(scenario) {
    // scenario peut être un Parse.Object ou un objet JSON
    const scenarioObj = scenario.toJSON ? scenario.toJSON() : scenario;
    const delai =
        (scenarioObj.delai !== undefined
            ? scenarioObj.delai
            : scenario.get("delai")) || 0;
    const date = new Date();
    date.setDate(date.getDate() + delai);
    return date;
}

/**
 * Étape 8 : Crée les relances à partir des impayés avec séquence
 * @param {Object} param0 - { sansRelance: [], avecRelance: [], state }
 * @returns {Promise<Object>} { stats, state }
 */
async function createRelances({ sansRelance, avecRelance, state }) {
    const stats = {
        relancesCreated: 0,
        relancesUpdated: 0,
        skipped: 0,
        erreurs: [],
    };

    info(
        "Étape 8: Début de la création des relances",
        "import-invoice",
        "createRelances",
        {
            sansRelanceCount: sansRelance.length,
            avecRelanceCount: avecRelance.length,
        },
    );

    try {
        debug(
            "Étape 8.1: Récupération des séquences publiées",
            "import-invoice",
            "createRelances",
        );
        const Sequence = Parse.Object.extend("Sequence");
        const sequenceQuery = new Parse.Query(Sequence);
        sequenceQuery.equalTo("publiee", true);
        const sequences = await sequenceQuery.find({ useMasterKey: true });

        info(
            `Trouvé ${sequences.length} séquences publiées`,
            "import-invoice",
            "createRelances",
            { count: sequences.length },
        );

        // Traiter TOUS les impayés concernés (avec ou sans relance)
        debug(
            "Étape 8.2: Traitement de TOUS les impayés concernés",
            "import-invoice",
            "createRelances",
            { count: sansRelance.length + avecRelance.length },
        );

        // Combiner sansRelance et avecRelance pour traiter tous les impayés
        const allImpayes = [...sansRelance, ...avecRelance];
        const impayesBySequence = {};
        for (const impaye of allImpayes) {
            const seq = impaye.get("sequence");
            if (!seq) continue;
            if (!impayesBySequence[seq.id]) {
                impayesBySequence[seq.id] = [];
            }
            impayesBySequence[seq.id].push(impaye);
        }

        info(
            `Impayés groupés par séquence: ${Object.keys(impayesBySequence).length} séquences`,
            "import-invoice",
            "createRelances",
            {
                sequenceCount: Object.keys(impayesBySequence).length,
                totalImpayes: allImpayes.length,
            },
        );

        for (const sequence of sequences) {
            const sequenceId = sequence.id;
            const sequenceJson = sequence.toJSON ? sequence.toJSON() : sequence;
            const emails = sequenceJson.emails || [];
            const validationObligatoire =
                sequence.get("validation_obligatoire") || false;

            const sequenceImpayes = impayesBySequence[sequenceId] || [];

            if (sequenceImpayes.length === 0) {
                info(
                    `⏭️ Aucune impayé à traiter pour séquence ${sequenceId}`,
                    "import-invoice",
                    "createRelances",
                    { sequenceId },
                );
                continue;
            }

            debug(
                `Traitement séquence: ${sequenceId} - ${sequenceJson.nom} (${sequenceImpayes.length} impayés, ${emails.length} emails)`,
                "import-invoice",
                "createRelances",
            );

            debug(
                "Étape 8.3: Filtrage des impayés valides",
                "import-invoice",
                "createRelances",
                { sequenceId },
            );
            const validImpayes = sequenceImpayes.filter((impaye) => {
                const contact = impaye.get("contact_relance");
                if (!contact) return false;
                const email = contact.get("email");
                const isBlacklisted = contact.get("isBlacklisted") || false;
                return email && email.trim() !== "" && !isBlacklisted;
            });

            info(
                `✓ ${validImpayes.length} impayés valides après filtrage pour séquence ${sequenceId}`,
                "import-invoice",
                "createRelances",
                {
                    count: validImpayes.length,
                    sequenceId,
                },
            );

            debug(
                "Étape 8.4: Regroupement des impayés par payeur",
                "import-invoice",
                "createRelances",
                { sequenceId },
            );
            const impayesByPayeur = {};

            for (const impaye of validImpayes) {
                const contact = impaye.get("contact_relance");
                if (!contact) continue;
                const payeurId = contact.id;
                if (!impayesByPayeur[payeurId]) {
                    impayesByPayeur[payeurId] = {
                        payeur: contact,
                        impayes: [],
                    };
                }
                impayesByPayeur[payeurId].impayes.push(impaye);
            }

            info(
                `👥 ${Object.keys(impayesByPayeur).length} payeurs uniques identifiés pour séquence ${sequenceId}`,
                "import-invoice",
                "createRelances",
                {
                    payeursCount: Object.keys(impayesByPayeur).length,
                    sequenceId,
                },
            );

            // Itérer sur TOUS les emails de la séquence pour créer 1 relance par email
            debug(
                `Étape 8.5: Traitement par email de la séquence (${emails.length} emails)`,
                "import-invoice",
                "createRelances",
            );
            for (const emailConfig of emails) {
                // Convertir emailConfig en JSON si nécessaire
                const emailConfigJson = emailConfig.toJSON
                    ? emailConfig.toJSON()
                    : emailConfig;
                const scenarios = emailConfigJson.scenarios || [];

                if (scenarios.length === 0) continue;

                // Filtrer les scénarios valides
                const validScenarios = scenarios.filter((s) => {
                    const sObj = s.toJSON ? s.toJSON() : s;
                    return (
                        (sObj.format || s.get("format")) === "single" ||
                        (sObj.format || s.get("format")) === "multiple"
                    );
                });
                if (validScenarios.length === 0) continue;

                for (const scenario of validScenarios) {
                    // Normaliser le scénario (peut être Parse.Object ou JSON)
                    const sObj = scenario.toJSON ? scenario.toJSON() : scenario;
                    const scenarioFormat =
                        sObj.format || scenario.get("format");
                    const emailIndex =
                        sObj.email_index !== undefined
                            ? sObj.email_index
                            : scenario.get("email_index");
                    const delai =
                        (sObj.delai !== undefined
                            ? sObj.delai
                            : scenario.get("delai")) || 0;

                    // Regrouper les payeurs par format pour ce scénario
                    const payeursForFormat = {};
                    for (const [payeurId, group] of Object.entries(
                        impayesByPayeur,
                    )) {
                        const groupImpayes = group.impayes;
                        const actualFormat =
                            groupImpayes.length > 1 ? "multiple" : "single";
                        if (actualFormat !== scenarioFormat) continue;
                        payeursForFormat[payeurId] = group;
                    }

                    if (Object.keys(payeursForFormat).length === 0) {
                        info(
                            `⏭️ Aucun payeur pour scénario format=${scenarioFormat}, skip`,
                            "import-invoice",
                            "createRelances",
                            { sequenceId, scenarioFormat },
                        );
                        continue;
                    }

                    debug(
                        `Traitement ${Object.keys(payeursForFormat).length} payeurs pour email (scenario: ${scenarioFormat}, delai: ${delai}, email_index: ${emailIndex})`,
                        "import-invoice",
                        "createRelances",
                    );

                    for (const [payeurId, group] of Object.entries(
                        payeursForFormat,
                    )) {
                        const { payeur, impayes: groupImpayes } = group;
                        const impayeIds = groupImpayes.map((i) => i.id);

                        debug(
                            `Groupe payeur ${payeurId}: ${groupImpayes.length} impayés, email_index=${emailIndex}`,
                            "import-invoice",
                            "createRelances",
                        );

                        // Vérification des relances existantes pour ce payeur ET ce email_index
                        const Relance = Parse.Object.extend("Relance");
                        const existingRelanceQuery = new Parse.Query(Relance);
                        existingRelanceQuery.equalTo("contact", payeur);
                        existingRelanceQuery.equalTo(
                            "email_index",
                            emailIndex || 0,
                        );
                        existingRelanceQuery.doesNotExist("dateEnvoi");
                        const existingRelances =
                            await existingRelanceQuery.find({
                                useMasterKey: true,
                            });

                        // Vérifier seulement les impayés de la relance pour CE email_index
                        const existingImpayeIdsSet = new Set();
                        if (existingRelances.length > 0) {
                            (existingRelances[0].get("impayes") || []).forEach(
                                (id) => existingImpayeIdsSet.add(id),
                            );
                        }

                        const impayesToAdd = impayeIds.filter(
                            (id) => !existingImpayeIdsSet.has(id),
                        );

                        if (impayesToAdd.length === 0) {
                            info(
                                `⏭️ Tous les impayés existent déjà pour payeur ${payeurId} email_index=${emailIndex}, skip`,
                                "import-invoice",
                                "createRelances",
                                {
                                    payeurId,
                                    email_index: emailIndex,
                                    existingImpayes:
                                        existingRelances.length > 0
                                            ? existingRelances[0].get("impayes")
                                            : [],
                                    newImpayes: impayeIds,
                                },
                            );
                            stats.skipped++;
                            continue;
                        }

                        if (existingRelances.length > 0) {
                            const existingRelance = existingRelances[0];

                            // Skip si relance est manuelle ou déjà validée
                            if (
                                existingRelance.get("manuel") ||
                                existingRelance.get("valide")
                            ) {
                                info(
                                    `⏭️ Relance ${existingRelance.id} est manuelle ou validée, skip update`,
                                    "import-invoice",
                                    "createRelances",
                                    {
                                        relanceId: existingRelance.id,
                                        manuel: existingRelance.get("manuel"),
                                        valide: existingRelance.get("valide"),
                                    },
                                );
                                stats.skipped++;
                                continue;
                            }

                            const currentImpayeIds =
                                existingRelance.get("impayes") || [];

                            debug(
                                `Mise à jour de la relance ${existingRelance.id}`,
                                "import-invoice",
                                "createRelances",
                                {
                                    relanceId: existingRelance.id,
                                    impayesToAdd: impayesToAdd.length,
                                },
                            );
                            existingRelance.set("impayes", [
                                ...currentImpayeIds,
                                ...impayesToAdd,
                            ]);
                            existingRelance.set("scenario", scenarioFormat);
                            existingRelance.set("email_index", emailIndex || 0);
                            existingRelance.set(
                                "date_envoi_prevue",
                                getDateEnvoiPrevue(scenario),
                            );
                            existingRelance.set(
                                "valide",
                                !validationObligatoire,
                            );

                            if (!existingRelance.get("sequence"))
                                existingRelance.set("sequence", sequence);
                            if (!existingRelance.get("objet"))
                                existingRelance.set(
                                    "objet",
                                    "Généré au moment de l'envoi",
                                );
                            if (!existingRelance.get("corps"))
                                existingRelance.set(
                                    "corps",
                                    "Générer au moment de l'envoi",
                                );
                            if (!existingRelance.get("statut"))
                                existingRelance.set(
                                    "statut",
                                    "En attente de génération",
                                );

                            await existingRelance.save(null, {
                                useMasterKey: true,
                            });
                            info(
                                `✅ Relance ${existingRelance.id} mise à jour pour email_index=${emailIndex}`,
                                "import-invoice",
                                "createRelances",
                                {
                                    relanceId: existingRelance.id,
                                    email_index: emailIndex,
                                },
                            );
                            stats.relancesUpdated++;
                        } else {
                            const newRelance = new Relance();
                            newRelance.set("impayes", impayeIds);
                            newRelance.set("contact", payeur);
                            newRelance.set("sequence", sequence);
                            newRelance.set("scenario", scenarioFormat);
                            newRelance.set("email_index", emailIndex || 0);
                            newRelance.set(
                                "date_envoi_prevue",
                                getDateEnvoiPrevue(scenario),
                            );
                            newRelance.set(
                                "objet",
                                "Généré au moment de l'envoi",
                            );
                            newRelance.set(
                                "corps",
                                "Générer au moment de l'envoi",
                            );
                            newRelance.set(
                                "statut",
                                "En attente de génération",
                            );
                            newRelance.set("valide", !validationObligatoire);

                            if (scenario.get && scenario.get("smtp")) {
                                const SmtpProfile =
                                    Parse.Object.extend("SmtpProfile");
                                const smtpQuery = new Parse.Query(SmtpProfile);
                                const smtpProfile = await smtpQuery.get(
                                    scenario.get("smtp"),
                                    { useMasterKey: true },
                                );
                                newRelance.set("smtpProfil", smtpProfile);
                            }

                            await newRelance.save(null, { useMasterKey: true });
                            info(
                                `✅ Nouvelle relance créée: ${newRelance.id} pour email_index=${emailIndex}`,
                                "import-invoice",
                                "createRelances",
                                {
                                    relanceId: newRelance.id,
                                    email_index: emailIndex,
                                },
                            );
                            stats.relancesCreated++;
                        }
                    }
                }
            }
        }

        info(
            `Étape 8 terminée: ${stats.relancesCreated} créées, ${stats.relancesUpdated} mises à jour, ${stats.skipped} ignorées`,
            "import-invoice",
            "createRelances",
            {
                created: stats.relancesCreated,
                updated: stats.relancesUpdated,
                skipped: stats.skipped,
            },
        );

        const newState = {
            ...state,
            currentStep: "09-generateRelances",
            steps: {
                ...state.steps,
                "08-createRelances": {
                    status: "completed",
                    relances_created: stats.relancesCreated,
                    relances_updated: stats.relancesUpdated,
                    skipped: stats.skipped,
                    erreurs: stats.erreurs.length,
                    completedAt: new Date().toISOString(),
                },
            },
            updatedAt: new Date().toISOString(),
        };

        fs.writeFileSync(STATE_FILE, JSON.stringify(newState, null, 2));

        return {
            stats,
            state: newState,
        };
    } catch (err) {
        error(
            `Erreur Étape 8: ${err.message}`,
            "import-invoice",
            "createRelances",
            { error: err.message, stack: err.stack?.substring(0, 500) },
        );
        throw err;
    }
}

module.exports = createRelances;
