// backend/cloud/workflows/generate-relances/00-createRelances.js
// Étape 0 : Identifie les impayés qui ont des séquences mais pas de relances et les crée
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
 * Étape 0 : Crée les relances pour les impayés qui ont des séquences mais pas de relances
 * @returns {Promise<Object>} { stats }
 */
async function createRelances() {
    const stats = {
        processed: 0,
        created: 0,
        errors: 0,
        erreurs: [],
    };

    info(
        "Étape 0: Début de la création des relances pour les impayés sans relance",
        "generate-relances",
        "createRelances",
    );

    try {
        // 1. Trouver tous les impayés non soldés avec reste à payer > 0 et avec une séquence
        const Impaye = Parse.Object.extend("Impaye");
        const Relance = Parse.Object.extend("Relance");
        const Sequence = Parse.Object.extend("Sequence");

        const impayeQuery = new Parse.Query(Impaye);
        impayeQuery.equalTo("facture_soldee", false);
        impayeQuery.greaterThan("reste_a_payer", 0);
        impayeQuery.exists("sequence");
        impayeQuery.include(["sequence", "contact_relance"]);
        impayeQuery.limit(999999);

        const impayesAvecSequence = await impayeQuery.find({
            useMasterKey: true,
        });

        info(
            `Étape 0: ${impayesAvecSequence.length} impayés avec séquence trouvés`,
            "generate-relances",
            "createRelances",
        );

        // 2. Trouver tous les impayés qui ont déjà une relance
        const relanceQuery = new Parse.Query(Relance);
        relanceQuery.limit(999999);
        const relances = await relanceQuery.find({ useMasterKey: true });

        // 3. Extraire les IDs des impayés avec relance
        const impayesAvecRelanceIds = new Set();
        for (const relance of relances) {
            const impaye = relance.get("impaye");
            if (impaye) {
                impayesAvecRelanceIds.add(impaye.id);
            }
            // Vérifier aussi le tableau impayes
            const impayesArray = relance.get("impayes");
            if (impayesArray && Array.isArray(impayesArray)) {
                for (const impayeId of impayesArray) {
                    impayesAvecRelanceIds.add(impayeId);
                }
            }
        }

        info(
            `Étape 0: ${impayesAvecRelanceIds.size} impayés ont déjà une relance`,
            "generate-relances",
            "createRelances",
        );

        // 4. Filtrer les impayés sans relance
        const impayesSansRelance = impayesAvecSequence.filter(
            (impaye) => !impayesAvecRelanceIds.has(impaye.id),
        );

        info(
            `Étape 0: ${impayesSansRelance.length} impayés sans relance à traiter`,
            "generate-relances",
            "createRelances",
        );

        // 5. Regrouper les impayés par contact et séquence
        const groupedByContactSequence = new Map();
        for (const impaye of impayesSansRelance) {
            const contact = impaye.get("contact_relance");
            const sequence = impaye.get("sequence");

            if (!contact || !sequence) {
                warn(
                    `Impayé ${impaye.id}: pas de contact ou séquence valide, ignoré`,
                    "generate-relances",
                    "createRelances",
                );
                stats.erreurs.push({
                    impayeId: impaye.id,
                    erreur: "pas de contact ou séquence valide",
                });
                continue;
            }

            const key = `${contact.id}_${sequence.id}`;
            if (!groupedByContactSequence.has(key)) {
                groupedByContactSequence.set(key, {
                    contact,
                    sequence,
                    impayes: [],
                });
            }
            groupedByContactSequence.get(key).impayes.push(impaye);
        }

        info(
            `Étape 0: ${groupedByContactSequence.size} groupes contact/séquence à traiter`,
            "generate-relances",
            "createRelances",
        );

        // 6. Pour chaque groupe, créer une relance pour chaque email_index de la séquence
        for (const [key, group] of groupedByContactSequence) {
            try {
                const { contact, sequence, impayes } = group;

                // Récupérer la séquence complète avec smtpProfil inclus
                const fullSequence = await new Parse.Query(Sequence)
                    .include("smtpProfil")
                    .get(sequence.id, { useMasterKey: true });

                const emails = fullSequence.get("emails") || [];

                if (emails.length === 0) {
                    warn(
                        `Groupe ${key}: la séquence n'a pas d'emails configurés, ignoré`,
                        "generate-relances",
                        "createRelances",
                    );
                    stats.erreurs.push({
                        groupKey: key,
                        erreur: "séquence sans emails configurés",
                    });
                    continue;
                }

                // Créer une relance pour chaque email_index
                for (const emailConfig of emails) {
                    const emailIndex = emailConfig.email_index;

                    // Vérifier si une relance existe déjà pour ce groupe et cet email_index
                    const existingRelanceQuery = new Parse.Query(Relance);
                    existingRelanceQuery.equalTo("contact", contact);
                    existingRelanceQuery.equalTo("sequence", sequence);
                    existingRelanceQuery.equalTo("email_index", emailIndex);
                    existingRelanceQuery.containedIn("impayes", impayes.map((i) => i.id));
                    const existingRelances = await existingRelanceQuery.find({
                        useMasterKey: true,
                    });

                    if (existingRelances.length > 0) {
                        info(
                            `Groupe ${key}, email_index ${emailIndex}: relance existante trouvée, ignoré`,
                            "generate-relances",
                            "createRelances",
                        );
                        continue;
                    }

                    // Créer une nouvelle relance
                    const relance = new Relance();

                    // Peupler tous les champs de la classe Relance
                    relance.set("contact", contact);
                    relance.set("sequence", sequence);
                    relance.set("email_index", emailIndex);
                    
                    // impayes: array avec tous les impayés concernés
                    relance.set("impayes", impayes.map((i) => i));
                    
                    // statut
                    relance.set("statut", "En attente de génération");

                    // Champs objet et corps à "Génération en cours"
                    relance.set("objet", "Génération en cours");
                    relance.set("corps", "Génération en cours");

                    // valide: dépend de sequence.validation_obligatoire
                    const validationObligatoire = fullSequence.get("validation_obligatoire") || false;
                    relance.set("valide", !validationObligatoire);

                    // manuelle: toujours false
                    relance.set("manuelle", false);

                    // smtpProfil: pointer vers le profil SMTP du scénario actif
                    // On cherche le scénario actif correspondant au format (single/multiple)
                    const scenarioType = impayes.length === 1 ? "single" : "multiple";
                    const activeScenario = emailConfig.scenarios?.find(
                        (s) => s.format === scenarioType && s.active
                    );
                    
                    // Récupérer le smtp depuis le scénario actif
                    let smtpId = null;
                    if (activeScenario && activeScenario.smtp) {
                        smtpId = activeScenario.smtp;
                    }
                    
                    // Si pas trouvé dans le scénario, essayer au niveau de l'email
                    if (!smtpId && emailConfig.smtp) {
                        smtpId = emailConfig.smtp;
                    }
                    
                    // Si on a un ID de profil SMTP, créer le pointer
                    if (smtpId) {
                        const SmtpProfile = Parse.Object.extend("SmtpProfile");
                        const smtpProfileObj = SmtpProfile.createWithoutData(smtpId);
                        relance.set("smtpProfil", smtpProfileObj);
                    }

                    // scenario: single ou multiple selon le nombre d'impayés
                    relance.set("scenario", scenarioType);

                    // dateEnvoi: calculée à partir de la date d'échéance + délai
                    // Si plusieurs impayés, on prend la date d'échéance la plus ancienne
                    let dateEcheance = null;
                    for (const impaye of impayes) {
                        const impayeDateEcheance = impaye.get("dateEcheance");
                        if (impayeDateEcheance) {
                            if (!dateEcheance || impayeDateEcheance < dateEcheance) {
                                dateEcheance = impayeDateEcheance;
                            }
                        }
                    }

                    // Si pas de date d'échéance trouvée, utiliser aujourd'hui
                    if (!dateEcheance) {
                        dateEcheance = new Date();
                    }

                    // Si la date d'échéance est dépassée, utiliser maintenant
                    const maintenant = new Date();
                    if (dateEcheance < maintenant) {
                        dateEcheance = maintenant;
                    }

                    // Récupérer le délai depuis la séquence ou l'emailConfig
                    let delai = emailConfig.delai || 0;
                    if (!delai && fullSequence.get("delai")) {
                        delai = fullSequence.get("delai");
                    }

                    // Calculer dateEnvoi = dateEcheance + delai (en jours)
                    const dateEnvoi = new Date(dateEcheance);
                    dateEnvoi.setDate(dateEnvoi.getDate() + (delai || 0));
                    relance.set("dateEnvoi", dateEnvoi);

                    // Autres champs par défaut
                    relance.set("envoye_par", null);
                    relance.set("envoye_le", null);
                    relance.set("erreur_message", null);
                    relance.set("erreur_count", 0);

                    // Sauvegarder la relance
                    await relance.save(null, { useMasterKey: true });

                    stats.created++;
                    info(
                        `Relance créée: ${relance.id} pour contact ${contact.id}, séquence ${sequence.id}, email_index ${emailIndex}, scenario=${scenarioType}, dateEnvoi=${dateEnvoi.toISOString()}, valide=${!validationObligatoire}`,
                        "generate-relances",
                        "createRelances",
                    );
                }

                stats.processed += impayes.length;
            } catch (err) {
                error(
                    `Erreur pour groupe ${key}: ${err.message}`,
                    "generate-relances",
                    "createRelances",
                );
                stats.errors++;
                stats.erreurs.push({
                    groupKey: key,
                    erreur: err.message,
                    stack: err.stack?.substring(0, 500),
                });
            }
        }

        info(
            `Étape 0: ${stats.processed} impayés traités | ${stats.created} relances créées | ${stats.errors} erreurs`,
            "generate-relances",
            "createRelances",
        );

        return { stats };
    } catch (err) {
        error(
            `Erreur Étape 0: ${err.message}`,
            "generate-relances",
            "createRelances",
        );
        throw err;
    }
}

module.exports = createRelances;
