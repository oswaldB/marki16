// backend/cloud/workflows/test-single/01b-replaceVariables.js
// Étape 1b : Prétraitement - Remplace les variables [[...]] dans les templates
// Input: { sequence, payeur, impayes, emailIndex }
// Output: { sequence, payeur, impayes, emailIndex }

const { info, warn, error } = require("../../utils/logger");

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
 * Convertit un objet Parse en objet simple
 */
function toSimpleObject(parseObj) {
    if (!parseObj || !parseObj.toJSON) return parseObj;
    return parseObj.toJSON();
}

/**
 * Récupère la valeur d'un chemin dans un objet (ex: "payeur.nom" ou "impaye.montant_total")
 */
function getValueByPath(data, path) {
    if (!path || !data) return undefined;
    
    // Gérer les paths simples sans points
    if (!path.includes('.')) {
        if (typeof data === 'object' && data !== null) {
            if (path in data) {
                return data[path];
            }
            if (typeof data.get === 'function') {
                return data.get(path);
            }
        }
        return undefined;
    }
    
    const parts = path.split('.');
    let current = data;
    
    for (const part of parts) {
        if (current === null || current === undefined) return undefined;
        
        if (typeof current === 'object') {
            if (part in current) {
                current = current[part];
            } else if (typeof current.get === 'function') {
                current = current.get(part);
            } else {
                return undefined;
            }
        } else {
            return undefined;
        }
    }
    
    return current;
}

/**
 * Formate une date au format DD/MM/YYYY
 */
function formatDate(date) {
    if (!date) return "";
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return date;
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    } catch (e) {
        return date;
    }
}

/**
 * Remplace les variables avec filtres comme [[date_echeance, "DD/MM/YYYY"]]
 */
function replaceVariableWithFilter(varName, data) {
    // Vérifier s'il y a un filtre (contient une virgule)
    const commaIndex = varName.indexOf(',');
    if (commaIndex === -1) {
        // Variable simple
        return getValueByPath(data, varName.trim());
    }
    
    // Variable avec filtre
    const varPath = varName.substring(0, commaIndex).trim();
    const filterArg = varName.substring(commaIndex + 1).trim();
    
    const value = getValueByPath(data, varPath);
    if (value === undefined || value === null) return undefined;
    
    // Appliquer le filtre
    if (filterArg === '"DD/MM/YYYY"' || filterArg === '"DD/MM/YYYY"' || filterArg.includes('date')) {
        return formatDate(value);
    }
    
    // Autres filtres non gérés - retourner la valeur brute
    return value;
}

/**
 * Remplace toutes les variables [[...]] dans un texte avec les valeurs de data
 * Utilise un remplacement littéral SANS regex
 */
function replaceAllVariables(template, data) {
    if (!template || typeof template !== 'string') return template;
    
    let result = template;
    let startIndex = 0;
    let replacementCount = 0;
    
    while (true) {
        const openBracket = result.indexOf('[[', startIndex);
        if (openBracket === -1) break;
        
        const closeBracket = result.indexOf(']]', openBracket + 2);
        if (closeBracket === -1) break;
        
        // Extraire le nom de la variable (sans les crochets)
        const varName = result.substring(openBracket + 2, closeBracket).trim();
        
        // Ignorer les boucles [[loop ...]] et [[endloop]]
        if (varName.startsWith('loop ') || varName === 'endloop') {
            startIndex = closeBracket + 2;
            continue;
        }
        
        // Chercher la valeur dans data
        let value = replaceVariableWithFilter(varName, data);
        
        // Remplacer littéralement
        if (value !== undefined && value !== null) {
            const replacement = String(value);
            result = result.substring(0, openBracket) + replacement + result.substring(closeBracket + 2);
            startIndex = openBracket + replacement.length;
            replacementCount++;
        } else {
            startIndex = closeBracket + 2;
        }
    }
    
    if (replacementCount > 0) {
        info(
            `Remplacement de ${replacementCount} variables dans le template`,
            "test-single",
            "replaceVariables",
        );
    }
    
    return result;
}

/**
 * Étape 1b : Prétraitement - Remplace les variables [[...]] dans les templates de la sequence
 * @param {Object} params - { sequence, payeur, impaye, emailIndex }
 * @returns {Promise<Object>} - { sequence, payeur, impaye, emailIndex } avec templates pré-remplis
 */
async function replaceVariables(params) {
    info(
        "\n═════════════════════════════════════════════════════════════",
        "test-single",
        "replaceVariables",
    );
    info(
        "🏷️  ÉTAPE 1b/3: Remplacement des variables [[...]] dans les templates",
        "test-single",
        "replaceVariables",
        { step: 1.5 },
    );
    
    const { sequence, payeur, impaye, emailIndex } = params;
    
    if (!sequence || !sequence.emails) {
        warn(
            "Pas de sequence valide pour le remplacement des variables",
            "test-single",
            "replaceVariables",
        );
        return params;
    }
    
    // Convertir en objets simples
    const sequenceObj = toSimpleObject(sequence);
    const payeurObj = toSimpleObject(payeur);
    const impayeObj = toSimpleObject(impaye);
    
    // Trouver l'email correspondant à emailIndex
    const emailConfig = sequenceObj.emails.find(e => e.email_index === emailIndex);
    if (!emailConfig || !emailConfig.scenarios) {
        warn(
            `Pas de configuration email trouvée pour email_index=${emailIndex}`,
            "test-single",
            "replaceVariables",
        );
        return params;
    }
    
    // Préparer les données pour le template
    const templateData = {
        ...payeurObj,
        payeur: payeurObj,
        payeur_nom: payeurObj?.nom || "",
        payeur_prenom: payeurObj?.prenom || "",
        payeur_civilite: payeurObj?.civilite || "",
        payeur_email: payeurObj?.email || "",
        payeur_telephone: payeurObj?.telephone || "",
        payeur_adresse: payeurObj?.adresse || "",
        payeur_type: payeurObj?.type_personne || "",
        societe: payeurObj?.societe || payeurObj?.nom || "",
        impaye: impayeObj || {},
        impayes: impayeObj ? [impayeObj] : [],
        nfacture: impayeObj?.nfacture || "",
        montant_total: impayeObj?.montant_total || "",
        reste_a_payer: impayeObj?.reste_a_payer || "",
        date_echeance: impayeObj?.date_echeance || "",
        date_piece: impayeObj?.date_piece || "",
        adresse_bien: impayeObj?.adresse_bien || "",
        code_postal: impayeObj?.code_postal || "",
        ville: impayeObj?.ville || "",
        numero_dossier: impayeObj?.numero_dossier || "",
        ref_piece: impayeObj?.ref_piece || "",
        nfactures_liste: impayeObj ? [impayeObj] : [],
        ndossier_liste: impayeObj?.numero_dossier ? [impayeObj.numero_dossier] : [],
        lien_espace: process.env.LIEN_ESPACE || "",
        email_index: emailIndex,
        sequence: sequenceObj,
        aujourdhui: formatDate(new Date()),
        // Ajouter des helpers
        formatDate: (date) => formatDate(date),
    };
    
    // Remplacer les variables dans chaque scénario de l'email
    let modified = false;
    for (const scenario of emailConfig.scenarios) {
        const scenarioObj = toSimpleObject(scenario);
        if (!scenarioObj || (!scenarioObj.objet && !scenarioObj.corps)) continue;
        
        const newObjet = replaceAllVariables(scenarioObj.objet || "", templateData);
        const newCorps = replaceAllVariables(scenarioObj.corps || "", templateData);
        
        if (newObjet !== scenarioObj.objet || newCorps !== scenarioObj.corps) {
            scenario.objet = newObjet;
            scenario.corps = newCorps;
            modified = true;
        }
    }
    
    info(
        modified 
            ? `✅ ÉTAPE 1b TERMINÉE: Variables remplacées dans les templates`
            : `✅ ÉTAPE 1b TERMINÉE: Aucune variable à remplacer`,
        "test-single",
        "replaceVariables",
        { step: 1.5, modified },
    );
    info(
        "═════════════════════════════════════════════════════════════",
        "test-single",
        "replaceVariables",
    );
    
    return { ...params, sequence: sequenceObj };
}

module.exports = replaceVariables;
