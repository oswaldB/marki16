// backend/cloud/workflows/generate-suivi/01-createSuivis.js
// Étape 1 : Crée les suivis à partir des impayés avec séquence de type "suivi"
// Vérifie la fréquence avant création
// Input: { } - récupère automatiquement depuis Parse
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
 * Calcule la date d'envoi prévue à partir du délai
 * @param {number} delai - Nombre de jours à ajouter
 * @returns {Date} Date avec le délai ajouté
 */
function calculateDateEnvoiPrevue(delai) {
    const date = new Date();
    date.setDate(date.getDate() + (delai || 0));
    return date;
}

/**
 * Vérifie si aujourd'hui correspond à la fréquence
 * @param {string} frequence - Valeur du champ frequence
 * @returns {boolean}
 */
function isFrequencyValid(frequence) {
    const aujourdhui = new Date();
    const jourDuMois = aujourdhui.getDate();
    const jourSemaine = aujourdhui.getDay(); // 0=dimanche, 1=lundi...

    const JOURS_SEMAINE = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

    // Quotidien
    if (frequence === "quotidien") return true;

    // Jour du mois (ex: "1", "15")
    if (/^\d+$/.test(frequence)) {
        return jourDuMois == parseInt(frequence);
    }

    // Jour de la semaine (ex: "lundi", "mardi", ...) ou "hebdomadaire" = lundi
    let jourCible = frequence;
    if (frequence === "hebdomadaire") {
        jourCible = "lundi";
    }
    return JOURS_SEMAINE[jourSemaine] === jourCible;
}

/**
 * Récupère automatiquement toutes les données depuis Parse
 */
async function createSuivis() {
    const Suivi = Parse.Object.extend("Suivi");
    const Impaye = Parse.Object.extend("Impaye");
    const Sequence = Parse.Object.extend("Sequence");

    const stats = {
        totalSequences: 0,
        sequencesWithValidFrequency: 0,
        emailsProcessed: 0,
        emailsWithValidFrequency: 0,
        scenariosProcessed: 0,
        activeScenarios: 0,
        impayesEligibles: 0,
        suivisCreated: 0,
        suivisUpdated: 0,
        skipped: 0,
        errors: [],
    };

    info(
        "Étape 1: Début de la création des suivis",
        "generate-suivi",
        "createSuivis",
    );

    try {
        // 1. Récupérer toutes les séquences de type "suivi" publiées
        const sequenceQuery = new Parse.Query(Sequence);
        sequenceQuery.equalTo("publiee", true);
        sequenceQuery.equalTo("type", "suivi");
        sequenceQuery.limit(999999);

        const sequences = await sequenceQuery.find({ useMasterKey: true });
        stats.totalSequences = sequences.length;

        info(
            `Étape 1: ${sequences.length} séquences de type "suivi" publiées trouvées`,
            "generate-suivi",
            "createSuivis",
            { sequenceCount: sequences.length },
        );

        // 2. Traiter chaque séquence
        for (const sequence of sequences) {
            const sequenceId = sequence.id;
            const sequenceJson = sequence.toJSON ? sequence.toJSON() : sequence;
            const emails = sequenceJson.emails || [];

            info(
                `Étape 1: Traitement séquence ${sequenceId} | ${emails.length} emails`,
                "generate-suivi",
                "createSuivis",
                { sequenceId, emailCount: emails.length },
            );

            stats.emailsProcessed += emails.length;

            // 3. Traiter chaque email de la séquence
            for (const emailConfig of emails) {
                const emailObj = emailConfig.toJSON ? emailConfig.toJSON() : emailConfig;
                const frequence = emailObj.frequence;
                const emailIndex = emailObj.email_index !== undefined ? Number(emailObj.email_index) : 0;
                const scenarios = emailObj.scenarios || [];

                // Vérifier si la fréquence est valide pour aujourd'hui
                if (!isFrequencyValid(frequence)) {
                    info(
                        `Étape 1: Séquence ${sequenceId}, email_index=${emailIndex} - fréquence "${frequence}" non valide aujourd'hui, skip`,
                        "generate-suivi",
                        "createSuivis",
                        { sequenceId, emailIndex, frequence },
                    );
                    continue;
                }

                stats.sequencesWithValidFrequency++;
                stats.emailsWithValidFrequency++;

                info(
                    `Étape 1: Séquence ${sequenceId}, email_index=${emailIndex} - fréquence "${frequence}" VALIDE`,
                    "generate-suivi",
                    "createSuivis",
                    { sequenceId, emailIndex, frequence },
                );

                stats.scenariosProcessed += scenarios.length;

                // 4. Traiter chaque scénario ACTIF
                for (const scenario of scenarios) {
                    const sObj = scenario.toJSON ? scenario.toJSON() : scenario;

                    if (!sObj.active) {
                        info(
                            `Étape 1: Séquence ${sequenceId}, email_index=${emailIndex} - scénario inactif, skip`,
                            "generate-suivi",
                            "createSuivis",
                            { sequenceId, emailIndex, scenarioFormat: sObj.format },
                        );
                        continue;
                    }

                    stats.activeScenarios++;
                    const scenarioFormat = sObj.format || "single";
                    const delai = sObj.delai !== undefined ? Number(sObj.delai) : 0;

                    info(
                        `Étape 1: Traitement séquence ${sequenceId}, email_index=${emailIndex}, scénario=${scenarioFormat}, délai=${delai} jours`,
                        "generate-suivi",
                        "createSuivis",
                        { sequenceId, emailIndex, scenarioFormat, delai },
                    );

                    // 5. Récupérer les impayés non soldés avec cette séquence
                    const impayeQuery = new Parse.Query(Impaye);
                    impayeQuery.equalTo("facture_soldee", false);
                    impayeQuery.greaterThan("reste_a_payer", 0);
                    impayeQuery.equalTo("sequence", sequence);
                    impayeQuery.include(["sequence", "contact_relance"]);
                    impayeQuery.limit(999999);

                    const impayes = await impayeQuery.find({ useMasterKey: true });
                    stats.impayesEligibles += impayes.length;

                    info(
                        `Étape 1: ${impayes.length} impayés non soldés trouvés pour séquence ${sequenceId}`,
                        "generate-suivi",
                        "createSuivis",
                        { sequenceId, impayeCount: impayes.length },
                    );

                    // 6. Filtrer les impayés valides (contact avec email, non blacklisté)
                    const validImpayes = impayes.filter((impaye) => {
                        const contact = getValue(impaye, "contact_relance");
                        if (!contact) return false;
                        const email = getValue(contact, "email");
                        const isBlacklisted = getValue(contact, "isBlacklisted") || false;
                        return email && email.trim() !== "" && !isBlacklisted;
                    });

                    info(
                        `Étape 1: ${validImpayes.length} impayés valides après filtrage pour séquence ${sequenceId}`,
                        "generate-suivi",
                        "createSuivis",
                        { sequenceId, validCount: validImpayes.length },
                    );

                    // 7. Regrouper par payeur pour adapter le format
                    const impayesByPayeur = {};
                    for (const impaye of validImpayes) {
                        const contact = getValue(impaye, "contact_relance");
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

                    // 8. Créer un Suivi par (payeur, email_index, scénario) en respectant le format
                    for (const [payeurId, group] of Object.entries(impayesByPayeur)) {
                        const groupImpayes = group.impayes;
                        const actualFormat = groupImpayes.length > 1 ? "multiple" : "single";

                        // Vérifier que le format du scénario correspond
                        if (actualFormat !== scenarioFormat && scenarioFormat !== "both") {
                            info(
                                `Étape 1: Payeur ${payeurId} - format réel=${actualFormat}, scénario=${scenarioFormat} - incompatibilité, skip`,
                                "generate-suivi",
                                "createSuivis",
                                { payeurId, actualFormat, scenarioFormat },
                            );
                            continue;
                        }

                        // 9. Vérifier qu'un Suivi similaire n'existe pas déjà (sans dateEnvoi)
                        const suiviQuery = new Parse.Query(Suivi);
                        suiviQuery.equalTo("impaye", groupImpayes[0]); // Premier impayé du groupe
                        suiviQuery.equalTo("sequence", sequence);
                        suiviQuery.equalTo("email_index", emailIndex);
                        suiviQuery.doesNotExist("dateEnvoi");
                        suiviQuery.limit(1);

                        const existingSuivi = await suiviQuery.first({ useMasterKey: true });

                        const dateEnvoiPrevue = calculateDateEnvoiPrevue(delai);

                        if (existingSuivi) {
                            // Mise à jour
                            existingSuivi.set("scenario", sObj);
                            existingSuivi.set("dateEnvoiPrevue", dateEnvoiPrevue);
                            existingSuivi.set("statut", "En attente de génération");
                            await existingSuivi.save(null, { useMasterKey: true });
                            stats.suivisUpdated++;
                            info(
                                `Étape 1: Suivi EXISTANT mis à jour pour payeur ${payeurId} | email_index=${emailIndex}`,
                                "generate-suivi",
                                "createSuivis",
                                { payeurId, emailIndex, scenarioFormat },
                            );
                        } else {
                            // Création
                            const newSuivi = new Suivi();
                            newSuivi.set("impaye", groupImpayes[0]); // ou tous les impayés ?
                            newSuivi.set("impayes", groupImpayes); // Stocker tous les impayés du groupe
                            newSuivi.set("sequence", sequence);
                            newSuivi.set("email_index", emailIndex);
                            newSuivi.set("scenario", sObj);
                            newSuivi.set("format", actualFormat);
                            newSuivi.set("contact", group.payeur);
                            newSuivi.set("dateEnvoiPrevue", dateEnvoiPrevue);
                            newSuivi.set("statut", "En attente de génération");
                            await newSuivi.save(null, { useMasterKey: true });
                            stats.suivisCreated++;
                            info(
                                `Étape 1: Suivi CRÉÉ pour payeur ${payeurId} | email_index=${emailIndex} | format=${actualFormat}`,
                                "generate-suivi",
                                "createSuivis",
                                { payeurId, emailIndex, scenarioFormat, suiviId: newSuivi.id },
                            );
                        }
                    }
                }
            }
        }

        info(
            `Étape 1: ${stats.suivisCreated} créés, ${stats.suivisUpdated} mis à jour, ${stats.skipped} ignorés`,
            "generate-suivi",
            "createSuivis",
            {
                created: stats.suivisCreated,
                updated: stats.suivisUpdated,
                skipped: stats.skipped,
            },
        );

    } catch (err) {
        error(
            `Erreur dans createSuivis: ${err.message}`,
            "generate-suivi",
            "createSuivis",
            { error: err.message, stack: err.stack?.substring(0, 500) },
        );
        stats.errors.push({
            step: "createSuivis",
            error: err.message,
            stack: err.stack?.substring(0, 500),
        });
    }

    // Vérification Parse finale
    await verifyParseSuivis();

    return { stats };
}

/**
 * Vérification Parse - compte les Suivis en attente
 */
async function verifyParseSuivis() {
    try {
        const Suivi = Parse.Object.extend("Suivi");
        const query = new Parse.Query(Suivi);
        query.equalTo("statut", "En attente de génération");
        const results = await query.find({ useMasterKey: true });

        info(
            `Parse check - Étape 1: ${results.length} Suivis en attente de génération`,
            "generate-suivi",
            "createSuivis",
            { count: results.length },
        );
        return { enAttente: results.length };
    } catch (err) {
        error(
            `Erreur vérification Parse: ${err.message}`,
            "generate-suivi",
            "createSuivis",
        );
        return { enAttente: 0 };
    }
}

module.exports = createSuivis;
