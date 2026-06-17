// backend/cloud/workflows/generate-suivi/02-generateSuivis.js
// Étape 2 : Génère les suivis en attente
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

// Configuration Ollama - OBLIGATOIRE
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || "https://ollama.com/api";
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "mistral";
const MAX_RETRIES = 3; // Retry jusqu'à succès

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
 * Construit le prompt pour l'LLM
 */
const buildPrompt = (scenario, impayes, history, suivi) => {
    const impayesJson = JSON.stringify(
        impayes.map((i) => (i.toJSON ? i.toJSON() : i)),
    );
    const historyJson = JSON.stringify(
        history.map((h) => (h.toJSON ? h.toJSON() : h)),
    );
    const suiviJson = suivi.toJSON
        ? JSON.stringify(suivi.toJSON())
        : JSON.stringify(suivi);

    return `Tu es un redacteur de emails de suivi d'impayés. Ta mission consiste à générer l'objet et le corps de l'email à partir du template fourni, des informations des impayés et de l'historique.

Tu ne fais que remplacer les variables entre double crochets [[variable]].
Tu ne changes PAS les textes existants.
Tu ne modifie PAS la structure du template.

Quelques règles importantes:
+ Si tu vois du markdown, convertis-le en HTML (surtout pour les liens et tableaux).
+ Pour le payeur_nom, si celui-ci n'est pas une personne (ex: "INDIVISION toto"), laisse le champ vide. Exemple: "Bonjour INDIVISION toto" doit devenir "Bonjour,"
+ Pas de virgule avec un espace avant (ex: "Bonjour, " → "Bonjour,")
+ Si un tableau est présent, ajoute un border sur tous les td: <td style="border: 1px solid #ddd;">
+ Si la date d'échéance est passée, accorde les temps en fonction (ex: "est dû" → "était dû")
+ Remplace [[aujourdhui, date("DD/MM/YYYY")]] par la date du jour au format JJ/MM/AAAA
+ LES BOUCLES [[loop ...]] DOIVENT ETRE TRAITEES AVEC TOUTES LES DONNEES DES IMPAYES. NE PAS OUBLIER AUCUN IMPAYE DANS LES BOUCLES. TOUS les impayés de la liste doivent apparaître dans le tableau généré.

--- Informations ---
+ Template objet: ${scenario.objet || ""}
+ Template corps: ${scenario.corps || ""}
+ Informations impayés: ${impayesJson}
+ Historique: ${historyJson}
+ Suivi: ${suiviJson}

Génère UNIQUEMENT un objet JSON avec exactement ces champs: {"objet": "...", "corps": "..."}`;
};

/**
 * Génère le contenu via Ollama avec retry obligatoire
 */
async function generateContentWithRetry(prompt, retries = 0) {
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
                temperature: 0.1,
            }),
        });

        if (!response.ok) {
            throw new Error(
                `Ollama API error: ${response.status} ${response.statusText}`,
            );
        }

        const data = await response.json();

        if (!data.response) {
            throw new Error("No response from Ollama API");
        }

        // Parser le JSON de la réponse
        const content = data.response.trim();

        // Essayer de parser directement
        try {
            const parsed = JSON.parse(content);
            if (parsed.objet && parsed.corps) {
                return parsed;
            }
        } catch (e) {
            // Pas du JSON, essayer d'extraire
        }

        // Si pas de JSON valide, essayer d'extraire
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.objet && parsed.corps) {
                    return parsed;
                }
            } catch (e) {
                throw new Error(
                    `Failed to parse Ollama response as JSON: ${e.message}`,
                );
            }
        }

        throw new Error(
            "Ollama response does not contain valid JSON with objet and corps",
        );
    } catch (err) {
        if (retries < MAX_RETRIES) {
            warn(
                `LLM échoué (attempt ${retries + 1}/${MAX_RETRIES}), retry... Error: ${err.message}`,
                "generate-suivi",
                "generateSuivis",
                { attempt: retries + 1, error: err.message },
            );
            return generateContentWithRetry(prompt, retries + 1);
        }
        throw new Error(
            `LLM échoué après ${MAX_RETRIES} tentatives: ${err.message}`,
        );
    }
}

/**
 * Récupère l'historique des actions pour un suivi (relances + suivis précédents)
 */
async function getHistoryForSuivi(suivi) {
    const Relance = Parse.Object.extend("Relance");
    const Suivi = Parse.Object.extend("Suivi");

    const impaye = suivi.get("impaye");
    if (!impaye) {
        return [];
    }

    try {
        // Récupérer les relances pour cet impayé
        const relanceQuery = new Parse.Query(Relance);
        relanceQuery.equalTo("impaye", impaye);
        relanceQuery.exist("dateEnvoi");
        relanceQuery.descending("dateEnvoi");
        relanceQuery.limit(10);
        const relances = await relanceQuery.find({ useMasterKey: true });

        // Récupérer les suivis précédents pour cet impayé
        const suiviQuery = new Parse.Query(Suivi);
        suiviQuery.equalTo("impaye", impaye);
        suiviQuery.exist("dateEnvoi");
        suiviQuery.descending("dateEnvoi");
        suiviQuery.limit(10);
        const suivis = await suiviQuery.find({ useMasterKey: true });

        return [...relances, ...suivis].sort((a, b) => {
            const dateA = getValue(a, "dateEnvoi") || new Date(0);
            const dateB = getValue(b, "dateEnvoi") || new Date(0);
            return dateB - dateA;
        });
    } catch (err) {
        warn(
            `Impossible de récupérer l'historique pour suivi ${suivi.id}: ${err.message}`,
            "generate-suivi",
            "generateSuivis",
        );
        return [];
    }
}

/**
 * Récupère les impayés pour un suivi
 */
async function getImpayesForSuivi(suivi) {
    const impayes = suivi.get("impayes");
    if (impayes && impayes.length > 0) {
        return impayes;
    }

    // Sinon essayer de récupérer depuis impaye
    const impaye = suivi.get("impaye");
    if (impaye) {
        return [impaye];
    }
    return [];
}

/**
 * Vérification Parse - compte les Suivis en attente et prêts
 */
async function getSuivisStats() {
    try {
        const Suivi = Parse.Object.extend("Suivi");

        // En attente de génération
        const enAttenteQuery = new Parse.Query(Suivi);
        enAttenteQuery.equalTo("statut", "En attente de génération");
        const enAttente = await enAttenteQuery.count({ useMasterKey: true });

        // Prêts pour envoi
        const pretQuery = new Parse.Query(Suivi);
        pretQuery.equalTo("statut", "Prêt pour envoi");
        const pret = await pretQuery.count({ useMasterKey: true });

        return {
            totalRelances: enAttente + pret,
            enAttente: enAttente,
            pretPourEnvoi: pret,
        };
    } catch (err) {
        error(
            `Erreur vérification Parse: ${err.message}`,
            "generate-suivi",
            "generateSuivis",
        );
        return { totalRelances: 0, pretPourEnvoi: 0, enAttente: 0 };
    }
}

/**
 * Génère les suivis en attente
 */
async function generateSuivis() {
    const Suivi = Parse.Object.extend("Suivi");

    const stats = {
        total: 0,
        processed: 0,
        errors: [],
        retries: 0,
    };

    info(
        "Étape 2: Début de la génération des suivis",
        "generate-suivi",
        "generateSuivis",
    );

    try {
        // Vérification initiale
        const initialStats = await getSuivisStats();
        stats.total = initialStats.enAttente;

        info(
            `Étape 2: ${initialStats.enAttente} Suivis en attente de génération`,
            "generate-suivi",
            "generateSuivis",
            { enAttente: initialStats.enAttente },
        );

        if (initialStats.enAttente === 0) {
            info(
                "Étape 2: Aucun Suivi en attente, fin de l'étape 2",
                "generate-suivi",
                "generateSuivis",
            );
            return { stats };
        }

        // Récupérer tous les Suivis en attente
        const query = new Parse.Query(Suivi);
        query.equalTo("statut", "En attente de génération");
        query.include(["sequence", "contact", "impaye", "impayes", "scenario"]);
        query.limit(999999);

        const suivis = await query.find({ useMasterKey: true });

        info(
            `Étape 2: Traitement de ${suivis.length} Suivis`,
            "generate-suivi",
            "generateSuivis",
            { count: suivis.length },
        );

        // Traiter chaque Suivi
        for (const suivi of suivis) {
            const suiviId = suivi.id;
            let scenario = suivi.get("scenario");

            // Vérifier si le suivi a déjà des templates pré-remplis (par 01b-replaceVariables)
            const suiviObjet = suivi.get("objet");
            const suiviCorps = suivi.get("corps");
            const isPreFilled = 
                suiviObjet && 
                suiviObjet !== "Généré au moment de l'envoi" &&
                suiviObjet !== "" &&
                suiviCorps && 
                suiviCorps !== "Générer au moment de l'envoi" &&
                suiviCorps !== "";
            
            // Utiliser les templates pré-remplis si disponibles
            if (isPreFilled && scenario) {
                scenario = {
                    ...scenario,
                    objet: suiviObjet,
                    corps: suiviCorps,
                };
            }

            info(
                `Étape 2: Génération du contenu pour Suivi ${suiviId}...`,
                "generate-suivi",
                "generateSuivis",
                { suiviId },
            );

            try {
                // Récupérer les données nécessaires
                const impayes = await getImpayesForSuivi(suivi);
                const history = await getHistoryForSuivi(suivi);

                info(
                    `Étape 2: Suivi ${suiviId} - ${impayes.length} impayés, ${history.length} éléments d'historique`,
                    "generate-suivi",
                    "generateSuivis",
                    {
                        suiviId,
                        impayeCount: impayes.length,
                        historyCount: history.length,
                    },
                );

                // Générer le prompt
                const prompt = buildPrompt(scenario, impayes, history, suivi);

                // Générer le contenu via LLM (OBLIGATOIRE)
                info(
                    `Étape 2: Appel LLM pour Suivi ${suiviId}...`,
                    "generate-suivi",
                    "generateSuivis",
                    { suiviId },
                );

                const { objet, corps } = await generateContentWithRetry(prompt);

                info(
                    `Étape 2: Contenu généré par LLM pour Suivi ${suiviId}`,
                    "generate-suivi",
                    "generateSuivis",
                    { suiviId },
                );

                // Mettre à jour le Suivi
                suivi.set("objet", objet);
                suivi.set("corps", corps);
                suivi.set("statut", "Prêt pour envoi");
                suivi.set("dateEnvoi", new Date());

                await suivi.save(null, { useMasterKey: true });

                stats.processed++;
                info(
                    `Étape 2: Suivi ${suiviId} traité avec succès`,
                    "generate-suivi",
                    "generateSuivis",
                    { suiviId },
                );
            } catch (err) {
                error(
                    `Étape 2: Erreur pour Suivi ${suiviId}: ${err.message}`,
                    "generate-suivi",
                    "generateSuivis",
                    { suiviId, error: err.message },
                );
                stats.errors.push({
                    suiviId,
                    error: err.message,
                });
            }
        }

        info(
            `Étape 2: ${stats.processed} Suivis traités, ${stats.errors.length} erreurs`,
            "generate-suivi",
            "generateSuivis",
            { processed: stats.processed, errors: stats.errors.length },
        );
    } catch (err) {
        error(
            `Erreur dans generateSuivis: ${err.message}`,
            "generate-suivi",
            "generateSuivis",
            { error: err.message, stack: err.stack?.substring(0, 500) },
        );
        stats.errors.push({
            step: "generateSuivis",
            error: err.message,
            stack: err.stack?.substring(0, 500),
        });
    }

    // Vérification Parse finale
    const finalStats = await getSuivisStats();
    info(
        `Parse check - Étape 2: ${finalStats.enAttente} en attente | ${finalStats.pretPourEnvoi} prêts pour envoi`,
        "generate-suivi",
        "generateSuivis",
        {
            enAttente: finalStats.enAttente,
            pretPourEnvoi: finalStats.pretPourEnvoi,
        },
    );

    return { stats };
}

module.exports = generateSuivis;
