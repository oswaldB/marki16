// backend/cloud/workflows/generate-relances/02-generateRelances.js
// Étape 2 : Génère les relances en attente
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

// Configuration Ollama
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || "https://ollama.com/api";
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "mistral";
const USE_OLLAMA = process.env.USE_OLLAMA !== "false" && !!OLLAMA_API_KEY;

/**
 * Vérification Parse - compte les relances en attente
 */
async function getRelancesStats() {
    try {
        const Relance = Parse.Object.extend("Relance");
        const query = new Parse.Query(Relance);
        query.equalTo("statut", "En attente de génération");
        const results = await query.find({ useMasterKey: true });

        return {
            totalRelances: results.length,
            pretPourEnvoi: 0,
            enAttente: results.length,
        };
    } catch (err) {
        error(
            `Erreur vérification Parse: ${err.message}`,
            "generate-relances",
            "generateRelances",
        );
        return { totalRelances: 0, pretPourEnvoi: 0, enAttente: 0 };
    }
}

/**
 * Vérifie si un texte contient des variables non remplacées ([[ ]])
 */
function hasUnreplacedVariables(text) {
    if (!text) return false;
    // Vérifie la présence de [[ sans ]] ou ]] sans [[
    const openBrackets = (text.match(/\[\[/g) || []).length;
    const closeBrackets = (text.match(/\]\]/g) || []).length;
    return openBrackets > 0 || closeBrackets > 0;
}

/**
 * Construit le prompt pour l'LLM
 */
const buildPrompt = (scenario, impayes, history, relance) => {
    const impayesJson = JSON.stringify(impayes.map((i) => i.toJSON()));
    const historyJson = JSON.stringify(history.map((h) => h.toJSON()));

    return `Tu es un redacteur de relances d'impayés par email. Ta mission consiste à générer l'objet et le corps de l'email à partir d'un template, des informations des impayes et de l'historique.

Tu ne fais que remplacer les variables.
Tu ne changes pas les textes.

Quelques règles importantes:
+ Si tu vois du markdown tu le convertis en html surtout pour les liens.
+ Pour le payeur_nom si celui-ci n'est pas une personne alors tu mets vide. Par exemple Bonjour INDIVISION toto doit devenir Bonjour,
+ Pas de virgule avec un espace avant
+ Si tu mets un tableau alors il faut un border sur tous les td.
+ Si la date d'échéance est arrivée avant alors il faut accorder les temps en fonction.
+ Si l'email dit que l'on applique les taux de pénalités alors il faut rajouter 40€ au montant TTC.
+ LES BOUCLES [[loop ...]] DOIVENT ETRE TRAITEES AVEC TOUTES LES DONNEES DES IMPAYES. NE PAS OUBLIER AUCUN IMPAYE DANS LES BOUCLES. TOUS les impayés de la liste doivent apparaître dans le tableau généré.

---
Voici les informations :
+ la trame d'email:
  objet: ${scenario.objet || ""}
  corps: ${scenario.corps || ""}
+ les informations sur les impayés: ${impayesJson}
+ l'historique: ${historyJson}
+ informations supplémentaires:
  email_index: ${relance.get("email_index")}
  contact: ${JSON.stringify(relance.get("contact")?.toJSON())}

Génère un objet JSON avec exactement ces champs: {"objet": "...", "corps": "..."}`;
};

/**
 * Corrige orthographiquement un texte via l'API Ollama
 */
async function correctOrthographe(text) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
        const response = await fetch(`${OLLAMA_API_URL}/generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${OLLAMA_API_KEY}`,
            },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt: `Tu es un correcteur orthographique et grammatical strict.
Corrige UNIQUEMENT les fautes d'orthographe et de grammaire dans le texte suivant, sans modifier le sens, le style, la structure ou le contenu.
Ne change pas les noms propres, les adresses, les montants, les dates ou toute information spécifique.
Ne réécris pas, corrige uniquement.

Texte à corriger: ${text}

Retourne UNIQUEMENT le texte corrigé, sans commentaire ni explication.`,
                stream: false,
                format: "text",
                options: {
                    temperature: 0.1,
                    top_p: 0.9,
                    num_predict: 4096,
                },
            }),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}: ${await response.text()}`,
            );
        }

        const data = await response.json();
        const rawResponse = data.response || data.choices?.[0]?.text || "";

        // Nettoyer la réponse (enlever les éventuels artifacts de markdown)
        let cleaned = rawResponse.trim();

        // Si la réponse commence par des quotes ou des tirets, les enlever
        if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
            cleaned = cleaned.slice(1, -1);
        }
        if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
            cleaned = cleaned.slice(1, -1);
        }
        if (cleaned.startsWith("`") && cleaned.endsWith("`")) {
            cleaned = cleaned.slice(1, -1);
        }

        return cleaned;
    } catch (err) {
        clearTimeout(timeoutId);
        throw err;
    }
}

/**
 * Génère le contenu de l'email via l'API Ollama
 */
async function generateEmailContent(prompt) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    try {
        const response = await fetch(`${OLLAMA_API_URL}/generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${OLLAMA_API_KEY}`,
            },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt: prompt,
                stream: false,
                format: "json",
                options: {
                    temperature: 0.1,
                    top_p: 0.9,
                    num_predict: 4096,
                },
            }),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}: ${await response.text()}`,
            );
        }

        const data = await response.json();
        const rawResponse = data.response || data.choices?.[0]?.text || "";

        // Extraire et parser le JSON
        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : rawResponse;
        const jsonResponse = JSON.parse(jsonStr);

        if (jsonResponse.objet && jsonResponse.corps) {
            return { objet: jsonResponse.objet, corps: jsonResponse.corps };
        }

        // Fallback si réponse incomplète
        return {
            objet: jsonResponse.objet || "Relance d'impayé",
            corps:
                jsonResponse.corps ||
                jsonResponse.body ||
                "<p>Contenu à compléter</p>",
        };
    } catch (err) {
        clearTimeout(timeoutId);
        throw err;
    }
}

/**
 * Étape 2 : Génère les relances en attente
 * @returns {Promise<Object>} { stats }
 */
async function generateRelances() {
    const stats = {
        processed: 0,
        errors: 0,
        erreurs: [],
    };

    info(
        "Étape 2: Début de la génération des relances",
        "generate-relances",
        "generateRelances",
    );

    try {
        // 1. Récupérer les Relances en attente
        const Relance = Parse.Object.extend("Relance");
        const query = new Parse.Query(Relance);
        query.equalTo("statut", "En attente de génération");
        query.limit(9999);
        query.include(["sequence", "contact"]);

        const relances = await query.find({ useMasterKey: true });
        info(
            `Étape 2: ${relances.length} relances en attente de génération`,
            "generate-relances",
            "generateRelances",
        );

        // 2. Pour chaque relance
        for (const relance of relances) {
            try {
                const sequence = relance.get("sequence");
                const impayesIds = relance.get("impayes") || [];
                const contact = relance.get("contact");
                const emailIndex = relance.get("email_index");

                if (!sequence) {
                    warn(
                        `Relance ${relance.id}: pas de séquence associée, skip`,
                        "generate-relances",
                        "generateRelances",
                    );
                    stats.erreurs.push({
                        relanceId: relance.id,
                        erreur: "pas de séquence associée",
                    });
                    continue;
                }

                // 3. Récupérer l'historique des relances pour ce contact et ces impayés
                const historyQuery = new Parse.Query("Relance");
                historyQuery.equalTo("contact", contact);
                historyQuery.containedIn("impayes", impayesIds);
                historyQuery.exists("dateEnvoi");
                historyQuery.equalTo("statut", "Envoyée");
                const history = await historyQuery.find({ useMasterKey: true });
                info(
                    `Étape 2: Historique récupéré: ${history.length} relances pour ${relance.id}`,
                    "generate-relances",
                    "generateRelances",
                );

                // 4. Récupérer les détails des impayés
                const Impaye = Parse.Object.extend("Impaye");
                const impayeQuery = new Parse.Query(Impaye);
                impayeQuery.containedIn("objectId", impayesIds);
                const impayeDetails = await impayeQuery.find({
                    useMasterKey: true,
                });
                info(
                    `Étape 2: Détails des impayés récupérés: ${impayeDetails.length} pour ${relance.id}`,
                    "generate-relances",
                    "generateRelances",
                );

                // 5. Filtrer les scénarios par email_index
                const Sequence = Parse.Object.extend("Sequence");
                const sequenceQuery = new Parse.Query(Sequence);
                sequenceQuery.equalTo("objectId", sequence.id);
                sequenceQuery.equalTo("type", "relances");
                const fullSequence = await sequenceQuery.first({
                    useMasterKey: true,
                });

                // Vérifier que la séquence est de type "relances"
                if (!fullSequence) {
                    warn(
                        `Relance ${relance.id}: séquence ${sequence.id} non trouvée ou n'est pas de type "relances", skip`,
                        "generate-relances",
                        "generateRelances",
                    );
                    stats.erreurs.push({
                        relanceId: relance.id,
                        erreur: "séquence non trouvée ou type invalide",
                    });
                    continue;
                }

                const scenarios = fullSequence?.get("emails") || [];
                const matchingScenario = scenarios.find(
                    (s) => s.email_index === emailIndex,
                );
                info(
                    `**************************************** matchingScenario: ${JSON.stringify(matchingScenario?.toJSON ? matchingScenario.toJSON() : matchingScenario)}`,
                    "generate-relances",
                    "generateRelances",
                );
                if (!matchingScenario) {
                    warn(
                        `Relance ${relance.id}: pas de scénario correspondant à email_index ${emailIndex}, skip`,
                        "generate-relances",
                        "generateRelances",
                    );
                    stats.erreurs.push({
                        relanceId: relance.id,
                        erreur: "pas de scénario correspondant",
                    });
                    continue;
                }

                // Trouver le scénario actif dans le tableau scenarios
                const activeScenario = matchingScenario.scenarios?.find(
                    (s) => s.active,
                );
                if (!activeScenario) {
                    warn(
                        `Relance ${relance.id}: pas de scénario ACTIF trouvé, skip`,
                        "generate-relances",
                        "generateRelances",
                    );
                    stats.erreurs.push({
                        relanceId: relance.id,
                        erreur: "pas de scénario actif",
                    });
                    continue;
                }

                // 6. Générer le contenu avec LLM ou template
                info(
                    `Étape 2: Génération du contenu pour ${relance.id}...`,
                    "generate-relances",
                    "generateRelances",
                );

                let objet, corps;
                let generationAttempts = 0;
                const MAX_GENERATION_ATTEMPTS = 5;
                let hasVariables = true;

                while (
                    hasVariables &&
                    generationAttempts < MAX_GENERATION_ATTEMPTS
                ) {
                    generationAttempts++;

                    if (generationAttempts > 1) {
                        info(
                            `Étape 2: Régénération pour ${relance.id} (tentative ${generationAttempts}/${MAX_GENERATION_ATTEMPTS}) - variables non remplacées détectées`,
                            "generate-relances",
                            "generateRelances",
                        );
                    }

                    if (USE_OLLAMA) {
                        let retries = 0;
                        const MAX_RETRIES = 30;
                        let success = false;

                        while (!success && retries < MAX_RETRIES) {
                            try {
                                const prompt = buildPrompt(
                                    activeScenario,
                                    impayeDetails,
                                    history,
                                    relance,
                                );
                                const result =
                                    await generateEmailContent(prompt);
                                objet = result.objet;
                                corps = result.corps;
                                info(
                                    `Étape 2: Contenu généré par LLM pour ${relance.id} (attempt ${retries + 1})`,
                                    "generate-relances",
                                    "generateRelances",
                                );
                                success = true;
                            } catch (llmError) {
                                retries++;
                                warn(
                                    `LLM tentative ${retries}/${MAX_RETRIES} pour ${relance.id}: ${llmError.message}`,
                                    "generate-relances",
                                    "generateRelances",
                                );
                                if (retries < MAX_RETRIES) {
                                    await new Promise((resolve) =>
                                        setTimeout(resolve, 1000),
                                    );
                                } else {
                                    throw llmError;
                                }
                            }
                        }
                    } else {
                        objet =
                            activeScenario.objet || "Relance - Facture impayée";
                        corps =
                            activeScenario.corps ||
                            "Veuillez régulariser votre situation.";
                    }

                    // Vérifier s'il reste des variables non remplacées
                    hasVariables =
                        hasUnreplacedVariables(objet) ||
                        hasUnreplacedVariables(corps);

                    if (
                        hasVariables &&
                        generationAttempts >= MAX_GENERATION_ATTEMPTS
                    ) {
                        warn(
                            `Étape 2: Relance ${relance.id} a encore des variables non remplacées après ${MAX_GENERATION_ATTEMPTS} tentatives`,
                            "generate-relances",
                            "generateRelances",
                        );
                    }
                }

                info(
                    `Étape 2: Contenu généré pour ${relance.id} | objet: ${objet?.length || 0} chars | corps: ${corps?.length || 0} chars`,
                    "generate-relances",
                    "generateRelances",
                );

                // 6.5. Correction orthographique si USE_OLLAMA est activé et pas de variables restantes
                if (USE_OLLAMA && !hasVariables) {
                    try {
                        info(
                            `Étape 2: Correction orthographique pour ${relance.id}...`,
                            "generate-relances",
                            "generateRelances",
                        );

                        const objetCorrige = await correctOrthographe(objet);
                        const corpsCorrige = await correctOrthographe(corps);

                        objet = objetCorrige;
                        corps = corpsCorrige;

                        info(
                            `Étape 2: Correction orthographique terminée pour ${relance.id}`,
                            "generate-relances",
                            "generateRelances",
                        );
                    } catch (orthoError) {
                        warn(
                            `Étape 2: Échec de la correction orthographique pour ${relance.id}: ${orthoError.message}`,
                            "generate-relances",
                            "generateRelances",
                        );
                        // On continue sans la correction, le contenu généré reste valide
                    }
                }

                // 7. Mettre à jour la relance
                relance.set("objet", objet);
                relance.set("corps", corps);
                relance.set("statut", "pret pour envoi");
                await relance.save(null, { useMasterKey: true });

                info(
                    `Étape 2: Relance ${relance.id} traitée avec succès`,
                    "generate-relances",
                    "generateRelances",
                );
                stats.processed++;
            } catch (err) {
                error(
                    `Erreur lors du traitement de la relance ${relance.id}: ${err.message}`,
                    "generate-relances",
                    "generateRelances",
                    {
                        relanceId: relance.id,
                        error: err.message,
                        stack: err.stack?.substring(0, 500),
                    },
                );
                stats.errors++;
                stats.erreurs.push({
                    relanceId: relance.id,
                    erreur: err.message,
                });
            }
        }

        info(
            `Étape 2: ${stats.processed} réussis | ${stats.errors} erreurs`,
            "generate-relances",
            "generateRelances",
        );

        // Vérification Parse finale
        const parseStats = await getRelancesStats();
        info(
            `Parse check - Étape 2: ${parseStats.totalRelances} relances en attente | ${parseStats.pretPourEnvoi} prêtes pour envoi`,
            "generate-relances",
            "generateRelances",
        );

        return { stats };
    } catch (err) {
        error(
            `Erreur Étape 2: ${err.message}`,
            "generate-relances",
            "generateRelances",
            { error: err.message, stack: err.stack?.substring(0, 500) },
        );
        throw err;
    }
}

module.exports = generateRelances;
