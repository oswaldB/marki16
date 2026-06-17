/**
 * Node 2: Template Processing
 * Noeud responsable du traitement du template (remplacement des variables + LLM si nécessaire).
 * 
 * @note: Ce noeud implémente un flux en DEUX PASSES:
 *        1. Première passe: Remplacement de [[variable]] uniquement.
 *        2. Deuxième passe (si nécessaire): Génération via LLM pour les variables restantes.
 */

require("dotenv").config({ path: "/home/ubuntu/prod/adti/.env" });

const { info, warn, error } = require("../../utils/logger");

/**
 * Remplace les variables dans un template (syntaxe [[variable]] UNIQUEMENT).
 * @param {string} template - Template avec variables.
 * @param {Object} vars - Objet de variables à remplacer.
 * @returns {string} - Template avec variables [[variable]] remplacées.
 */
function replaceBracketVariables(template, vars) {
    if (!template) return template;
    
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
        // Remplacer UNIQUEMENT [[variable]] (sans regex)
        const searchString = `[[${key}]]`;
        result = result.split(searchString).join(value || "");
    }
    return result;
}

/**
 * Vérifie s'il reste des variables non remplacées dans un texte.
 * @param {string} text - Texte à vérifier.
 * @returns {boolean} - true si des variables [[...]] sont trouvées.
 */
function hasUnreplacedVariables(text) {
    if (!text) return false;
    
    // Vérifier la présence de [[ (sans regex)
    return text.includes("[[");
}

/**
 * Génère du contenu d'email via LLM (Ollama) si des variables ne sont pas remplacées.
 * @param {Object} context - Contexte pour le LLM (payeur, séquence, utilisateur).
 * @param {string} subject - Objet actuel (avec variables non remplacées).
 * @param {string} body - Corps actuel (avec variables non remplacées).
 * @returns {Promise<{objet: string, corps: string}>} - Contenu généré par le LLM.
 */
async function generateEmailContentWithLLM(context, subject, body) {
    if (process.env.USE_OLLAMA !== "true") {
        throw new Error("USE_OLLAMA n'est pas activé");
    }
    
    info("Appel à Ollama pour générer le contenu...", "test-single", "02-templateProcessing");
    
    try {
        // Construire le prompt avec le contexte
        const prompt = `Génère un email professionnel en français pour une relance de paiement.
        Contexte:
        - Payeur: ${context.payeur_nom} (${context.payeur_email})
        - Nombre d'impayés: ${context.impayesCount}
        - Montant total: ${context.impayesAmount}€
        - Séquence: ${context.sequence_nom}
        - Utilisateur: ${context.user_nom} (${context.user_email})
        - Date: ${context.date_du_jour}
        
        Contenu actuel (avec variables non remplacées):
        Objet: ${subject}
        Corps: ${body}
        
        Génère un email COMPLET en remplaçant TOUTES les variables (y compris [[variable]] et <%= variable %>).
        
        Format attendu:
        Objet: [objet complet de l'email]
        
        Corps:
        [corps complet de l'email]`;
        
        const response = await fetch(`${process.env.OLLAMA_API_URL}/generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OLLAMA_API_KEY}`,
            },
            body: JSON.stringify({
                model: process.env.OLLAMA_MODEL || "mistral",
                prompt: prompt,
                stream: false,
            }),
        });
        
        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        const content = data.response || "";
        
        // Extraire objet et corps (format attendu: "Objet: ...\n\nCorps: ...")
        const parts = content.split("\n\n");
        const objet = parts[0]?.replace("Objet: ", "") || subject;
        const corps = parts.slice(1).join("\n\n") || content;
        
        info("Contenu généré par LLM avec succès", "test-single", "02-templateProcessing");
        
        return { objet, corps };
    } catch (err) {
        error(`Erreur génération LLM: ${err.message}`, "test-single", "02-templateProcessing");
        throw err;
    }
}

/**
 * Corrige l'orthographe via LLM (Ollama) si activé.
 * @param {string} text - Texte à corriger.
 * @returns {Promise<string>} - Texte corrigé.
 */
async function correctOrthographe(text) {
    if (process.env.USE_OLLAMA !== "true") {
        return text;
    }
    
    info("Correction orthographique via Ollama...", "test-single", "02-templateProcessing");
    
    try {
        const prompt = `Corrige les fautes d'orthographe et de grammaire dans le texte suivant (en français) :\n\n${text}`;
        
        const response = await fetch(`${process.env.OLLAMA_API_URL}/generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OLLAMA_API_KEY}`,
            },
            body: JSON.stringify({
                model: process.env.OLLAMA_MODEL || "mistral",
                prompt: prompt,
                stream: false,
            }),
        });
        
        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.response || text;
    } catch (err) {
        warn(`Correction orthographique échouée: ${err.message}`, "test-single", "02-templateProcessing");
        return text;
    }
}

/**
 * Noeud 2: Traite le template (remplacement des variables + LLM si nécessaire).
 * @param {Object} data - Données du noeud précédent (validateAndFetch).
 * @returns {Promise<Object>} - Contenu traité (subject, body).
 */
async function templateProcessing(data) {
    info(
        "\n═════════════════════════════════════════════════════════════",
        "test-single",
        "02-templateProcessing",
    );
    info("DÉBUT: Noeud 2 - Traitement du template", "test-single", "02-templateProcessing");
    
    const { request, sequence, emailToTest, payeurData } = data;
    
    try {
        // Étape 1: Récupérer le scénario actif
        const scenarioActif = emailToTest.activeScenario || "single";
        const scenario = emailToTest.scenarios?.find((s) => s?.format === scenarioActif);
        
        if (!scenario) {
            throw new Error(`Scénario ${scenarioActif} non trouvé pour l'email`);
        }
        
        info(`Scénario actif: ${scenarioActif}`, "test-single", "02-templateProcessing");
        
        // Étape 2: Construire les variables de template
        const templateVars = {
            // Variables du payeur (depuis payeurData)
            payeur_nom: payeurData.nom || "",
            payeur_email: payeurData.email || request.testEmail,
            payeur_telephone: payeurData.telephone || "",
            payeur_adresse: payeurData.adresse || "",
            
            // Variables des impayés (depuis payeurData)
            impayesCount: payeurData.impayesCount || 0,
            impayesAmount: payeurData.impayesAmount || 0,
            
            // Variables de l'utilisateur
            user_nom: request.userName || "",
            user_email: request.userEmail || "",
            
            // Variables de la séquence
            sequence_nom: sequence.get("nom") || "",
            
            // Date du jour
            date_du_jour: new Date().toLocaleDateString("fr-FR"),
        };
        
        info("Variables de template construites", "test-single", "02-templateProcessing");
        
        // Étape 3: PREMIÈRE PASSE - Remplacement de [[variable]] UNIQUEMENT
        info("Première passe: Remplacement de [[variable]]...", "test-single", "02-templateProcessing");
        
        let newSubject = replaceBracketVariables(
            scenario.objet || emailToTest.objet || "Test d'email",
            templateVars,
        );
        let newBody = replaceBracketVariables(
            scenario.corps || emailToTest.corps || "",
            templateVars,
        );
        
        // Étape 4: Vérifier s'il reste des variables [[...]] non remplacées
        const hasUnreplaced = hasUnreplacedVariables(newSubject) || hasUnreplacedVariables(newBody);
        
        if (hasUnreplaced && process.env.USE_OLLAMA === "true") {
            info("Variables [[...]] non remplacées détectées, appel à Ollama...", "test-single", "02-templateProcessing");
            
            // DEUXIÈME PASSE: Génération via LLM
            try {
                const llmResult = await generateEmailContentWithLLM(
                    templateVars,
                    newSubject,
                    newBody,
                );
                newSubject = llmResult.objet;
                newBody = llmResult.corps;
                info("Contenu généré par LLM avec succès", "test-single", "02-templateProcessing");
            } catch (llmError) {
                warn(`Génération LLM échouée: ${llmError.message}`, "test-single", "02-templateProcessing");
                // Continuer avec le contenu de la première passe
            }
        } else if (hasUnreplaced) {
            warn("Variables [[...]] non remplacées détectées mais USE_OLLAMA=false", "test-single", "02-templateProcessing");
        }
        
        // Étape 5: Correction orthographique (si USE_OLLAMA=true)
        if (process.env.USE_OLLAMA === "true") {
            info("Application de la correction orthographique...", "test-single", "02-templateProcessing");
            newSubject = await correctOrthographe(newSubject);
            newBody = await correctOrthographe(newBody);
        }
        
        info("✅ Noeud 2 terminé: Template traité", "test-single", "02-templateProcessing");
        
        // Retourner les données pour le noeud suivant
        return {
            request,
            sequence,
            emailToTest,
            payeurData,
            subject: newSubject,
            body: newBody,
        };
    } catch (err) {
        error(`ERREUR dans Noeud 2: ${err.message}`, "test-single", "02-templateProcessing");
        throw err;
    }
}

module.exports = templateProcessing;
