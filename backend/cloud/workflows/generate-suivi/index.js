const Parse = require("parse/node");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

// Configuration Ollama
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || "https://ollama.com/api";
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
const OLLAMA_MODEL = "mistral-large-3:675b-cloud";
const USE_OLLAMA = true;

// Configuration Frontend URL
const FRONTEND_URL = process.env.FRONTEND_URL || "https://adti.markidiags.com";

// Configuration des logs
const LOG_DIR = path.join(__dirname, "logs");
const LOG_FILE = path.join(LOG_DIR, `generate-suivis-${new Date().toISOString().split("T")[0]}.log`);

// Fichier de prompt
const PROMPT_FILE = path.join(process.cwd(), "..", "..", "configuration/prompts/suivi-email-prompt.txt");

/**
 * Écrit un message dans le fichier de log
 * @param {string} level - Niveau de log (INFO, ERROR, WARN)
 * @param {string} contactId - ID du contact (optionnel)
 * @param {number} emailIndex - Index de l'email (optionnel)
 * @param {string} message - Message à logger
 */
function log(level, contactId, emailIndex, message) {
    const timestamp = new Date().toISOString();
    const prefix = contactId && emailIndex !== undefined
        ? `[${level}][${contactId}][${emailIndex}]`
        : `[GENERATE-SUIVIS][${level}]`;
    const logLine = `${timestamp} ${prefix} ${message}\n`;
    
    console.log(logLine.trim());
    
    try {
        if (!fs.existsSync(LOG_DIR)) {
            fs.mkdirSync(LOG_DIR, { recursive: true });
        }
        fs.appendFileSync(LOG_FILE, logLine);
    } catch (err) {
        console.error("Erreur d'écriture des logs:", err.message);
    }
}

/**
 * Vérifie si la fréquence correspond à aujourd'hui
 * @param {string} frequence - La fréquence (quotidien, hebdomadaire, lundi, 1, 15, etc.)
 * @returns {boolean} - True si la fréquence correspond à aujourd'hui
 */
function isFrequencyValid(frequence) {
    if (!frequence) return false;
    
    const aujourdhui = new Date();
    const jourDuMois = aujourdhui.getDate();
    const jourSemaine = aujourdhui.getDay(); // 0=dimanche, 1=lundi...
    
    const JOURS_SEMAINE = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
    
    // Quotidien
    if (frequence === "quotidien") return true;
    
    // Hebdomadaire = tous les lundis
    if (frequence === "hebdomadaire") {
        return jourSemaine === 1; // Lundi
    }
    
    // Jour du mois (ex: "1", "15", "28")
    if (/^\d+$/.test(frequence)) {
        return jourDuMois === parseInt(frequence);
    }
    
    // Jour de la semaine (ex: "lundi", "mardi")
    const jourCible = frequence.toLowerCase();
    if (JOURS_SEMAINE.includes(jourCible)) {
        return JOURS_SEMAINE[jourSemaine] === jourCible;
    }
    
    return false;
}

/**
 * Parse la réponse YAML du LLM
 * @param {string} content - Contenu de la réponse
 * @returns {Object} - Objet avec objet et corps
 */
function parseLLMResponse(content) {
    // Extraire le bloc YAML de la réponse
    const yamlMatch = content.match(/---\n([\s\S]*?)\n---/) || 
                      content.match(/```yaml\n([\s\S]*?)```/) ||
                      (content.match(/^(objet:|corps:)/m) ? [null, content] : null);
    
    if (!yamlMatch) {
        throw new Error("Format YAML non trouvé dans la réponse");
    }
    
    const yamlContent = yamlMatch[1] || content;
    
    // Parser le YAML en objet JavaScript
    const parsed = yaml.load(yamlContent);
    
    // Vérifier la structure attendue
    if (!parsed.objet || !parsed.corps) {
        throw new Error("La réponse doit contenir les champs 'objet' et 'corps'");
    }
    
    return {
        objet: parsed.objet,
        corps: parsed.corps
    };
}

/**
 * Appelle l'API Ollama pour générer le contenu de l'email
 * @param {string} prompt - Le prompt complet
 * @param {string} contactId - ID du contact pour les logs
 * @param {number} emailIndex - Index de l'email pour les logs
 * @returns {Promise<Object>} - Objet avec objet et corps
 */
async function callOllama(prompt, contactId, emailIndex) {
    const startTime = Date.now();
    
    log("INFO", contactId, emailIndex, `Début appel Ollama - Modèle: ${OLLAMA_MODEL}`);
    log("INFO", contactId, emailIndex, `Taille du prompt: ${prompt.length} caractères`);
    
    try {
        const response = await fetch(`${OLLAMA_API_URL}/generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(OLLAMA_API_KEY && { "Authorization": `Bearer ${OLLAMA_API_KEY}` })
            },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt: prompt,
                stream: false,
                temperature: 0.1
            })
        });
        
        const duration = Date.now() - startTime;
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
        
        const data = await response.json();
        const content = data.response || data.text || data.content || data.message?.content;
        
        if (!content) {
            throw new Error("Réponse Ollama vide ou format inattendu");
        }
        
        log("INFO", contactId, emailIndex, `Appel Ollama réussi - Durée: ${duration}ms - Status: ${response.status}`);
        log("INFO", contactId, emailIndex, `Taille de la réponse: ${content.length} caractères`);
        
        // Aperçu des résultats (200 premiers caractères)
        const preview = content.substring(0, 200).replace(/\n/g, "\\n");
        log("INFO", contactId, emailIndex, `Aperçu réponse: ${preview}...`);
        
        return parseLLMResponse(content);
        
    } catch (error) {
        const duration = Date.now() - startTime;
        log("ERROR", contactId, emailIndex, `Échec appel Ollama après ${duration}ms: ${error.message}`);
        throw error;
    }
}

/**
 * Récupère l'historique des suivis pour un contact
 * @param {Parse.Object} contact - Le contact
 * @param {Array} impayes - Les impayés concernés
 * @returns {Promise<Array>} - Historique des suivis
 */
async function getHistory(contact, impayes) {
    const Suivi = Parse.Object.extend("Suivi");
    const suiviQuery = new Parse.Query(Suivi);
    suiviQuery.equalTo("contact", contact);
    suiviQuery.exists("dateEnvoi");
    suiviQuery.descending("dateEnvoi");
    suiviQuery.limit(10);
    
    const suivis = await suiviQuery.find({ useMasterKey: true });
    
    return suivis.map(s => ({
        statut: s.get("statut"),
        dateEnvoi: s.get("dateEnvoi"),
        objet: s.get("objet"),
        scenario: s.get("scenario"),
        email_index: s.get("email_index"),
        frequence: s.get("frequence")
    }));
}

/**
 * Remplace les placeholders dans le contenu
 * @param {string} objet - Objet de l'email
 * @param {string} corps - Corps de l'email
 * @param {Parse.Object} contact - Le contact
 * @param {Array} impayes - Les impayés
 * @returns {Object} - Objet et corps modifiés
 */
function replacePlaceholders(objet, corps, contact, impayes) {
    let objetFinal = objet;
    let corpsFinal = corps;
    
    // Remplacer [[lien_pdf]] par l'URL de redirection PDF
    if (impayes.length > 0) {
        const lienPdf = `${FRONTEND_URL}/redirect-pdf/${impayes[0].id}`;
        objetFinal = objetFinal.split("[[lien_pdf]]").join(lienPdf);
        corpsFinal = corpsFinal.split("[[lien_pdf]]").join(lienPdf);
    }
    
    // Remplacer [[lien_espace]] par l'URL de redirection espace client
    const lienEspace = `${FRONTEND_URL}/redirect-espace/${contact.id}`;
    objetFinal = objetFinal.split("[[lien_espace]]").join(lienEspace);
    corpsFinal = corpsFinal.split("[[lien_espace]]").join(lienEspace);
    
    return { objet: objetFinal, corps: corpsFinal };
}

/**
 * Fonction principale du workflow
 */
async function generateSuivis() {
    log("INFO", null, null, "=== Démarrage du workflow de génération des suivis ===");
    
    try {
        // Étape 1 : Récupération des séquences de type "suivi" publiées
        log("INFO", null, null, "Étape 1: Récupération des séquences de suivi publiées...");
        
        const Sequence = Parse.Object.extend("Sequence");
        const sequenceQuery = new Parse.Query(Sequence);
        sequenceQuery.equalTo("publiee", true);
        sequenceQuery.equalTo("type", "suivi");
        sequenceQuery.limit(999999);
        
        const sequences = await sequenceQuery.find({ useMasterKey: true });
        log("INFO", null, null, `${sequences.length} séquences de suivi publiées trouvées`);
        
        // Étape 2 : Filtrer les séquences avec fréquence valide pour aujourd'hui
        log("INFO", null, null, "Étape 2: Filtrage des séquences avec fréquence valide pour aujourd'hui...");
        
        const sequencesAvecFrequenceValide = [];
        for (const sequence of sequences) {
            const emails = sequence.get("emails") || [];
            for (const email of emails) {
                if (isFrequencyValid(email.frequence)) {
                    sequencesAvecFrequenceValide.push({ sequence, email });
                    break; // Au moins un email avec fréquence valide
                }
            }
        }
        
        log("INFO", null, null, `${sequencesAvecFrequenceValide.length} séquences avec fréquence valide pour aujourd'hui`);
        
        if (sequencesAvecFrequenceValide.length === 0) {
            log("INFO", null, null, "Aucune séquence à traiter aujourd'hui");
            return {
                success: true,
                suivisCrees: 0,
                suivisIgnores: 0,
                erreurs: 0,
                message: "Aucune fréquence ne correspond à aujourd'hui"
            };
        }
        
        // Charger le template de prompt
        let promptTemplate;
        try {
            promptTemplate = fs.readFileSync(PROMPT_FILE, "utf-8");
        } catch (err) {
            log("ERROR", null, null, `Impossible de charger le fichier de prompt: ${err.message}`);
            throw err;
        }
        
        let suivisCrees = 0;
        let suivisIgnores = 0;
        let erreurs = 0;
        
        // Traiter chaque séquence avec fréquence valide
        for (const { sequence, email } of sequencesAvecFrequenceValide) {
            try {
                const emailIndex = email.email_index;
                const frequence = email.frequence;
                const scenarios = email.scenarios || [];
                
                // Vérifier si la fréquence correspond à aujourd'hui
                if (!isFrequencyValid(frequence)) {
                    log("INFO", null, emailIndex, `Fréquence "${frequence}" ne correspond pas à aujourd'hui, ignoré`);
                    continue;
                }
                
                log("INFO", null, emailIndex, `Traitement séquence "${sequence.get("nom")}" - fréquence: ${frequence}`);
                
                // Récupérer les paramètres de la séquence
                const validationObligatoire = sequence.get("validation_obligatoire") || false;
                
                // Étape 3 : Récupération des impayés non soldés pour cette séquence
                const Impaye = Parse.Object.extend("Impaye");
                const impayeQuery = new Parse.Query(Impaye);
                impayeQuery.equalTo("facture_soldee", false);
                impayeQuery.greaterThan("reste_a_payer", 0);
                impayeQuery.equalTo("sequence", sequence);
                impayeQuery.include(["sequence", "contact_relance", "payeur"]);
                impayeQuery.limit(999999);
                
                const impayes = await impayeQuery.find({ useMasterKey: true });
                
                if (impayes.length === 0) {
                    log("INFO", null, emailIndex, "Aucun impayé trouvé pour cette séquence");
                    continue;
                }
                
                log("INFO", null, emailIndex, `${impayes.length} impayés trouvés pour cette séquence`);
                
                // Étape 4 : Regroupement des impayés par contact
                const groupedByContact = new Map();
                
                for (const impaye of impayes) {
                    let contact = impaye.get("contact_relance") || impaye.get("payeur");
                    if (!contact) continue;
                    
                    // Filtrer les contacts blacklistés ou sans email
                    const contactEmail = contact.get("email");
                    const isBlacklisted = contact.get("isBlacklisted") || false;
                    if (!contactEmail || contactEmail.trim() === "" || isBlacklisted) continue;
                    
                    const key = contact.id;
                    if (!groupedByContact.has(key)) {
                        groupedByContact.set(key, { contact, impayes: [] });
                    }
                    groupedByContact.get(key).impayes.push(impaye);
                }
                
                log("INFO", null, emailIndex, `${groupedByContact.size} groupes de contacts à traiter`);
                
                // Traiter chaque groupe de contact
                for (const [contactId, { contact, impayes: contactImpayes }] of groupedByContact) {
                    try {
                        // Récupérer l'historique des suivis pour ce contact
                        const history = await getHistory(contact, contactImpayes);
                        
                        // Traiter chaque scénario actif
                        for (const scenarioActif of scenarios) {
                            if (!scenarioActif.active) continue;
                            
                            const scenarioType = scenarioActif.format; // "single" ou "multiple"
                            
                            // Vérifier si un suivi existe déjà pour ce contact/séquence/email_index aujourd'hui
                            const Suivi = Parse.Object.extend("Suivi");
                            const existingSuiviQuery = new Parse.Query(Suivi);
                            existingSuiviQuery.equalTo("contact", contact);
                            existingSuiviQuery.equalTo("sequence", sequence);
                            existingSuiviQuery.equalTo("email_index", emailIndex);
                            existingSuiviQuery.equalTo("manuelle", false);
                            
                            // Vérifier si un suivi a déjà été créé aujourd'hui
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const tomorrow = new Date(today);
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            existingSuiviQuery.greaterThanOrEqualTo("dateEnvoi", today);
                            existingSuiviQuery.lessThan("dateEnvoi", tomorrow);
                            
                            const existingSuivi = await existingSuiviQuery.first({ useMasterKey: true });
                            if (existingSuivi) {
                                log("INFO", contactId, emailIndex, "Suivi existant trouvé pour aujourd'hui, ignoré");
                                suivisIgnores++;
                                continue;
                            }
                            
                            // Préparer les données pour le prompt
                            const impayesData = contactImpayes.map(i => ({
                                id: i.id,
                                nfacture: i.get("nfacture"),
                                reference: i.get("reference"),
                                date_piece: i.get("date_piece"),
                                date_echeance: i.get("date_echeance"),
                                total_ht: i.get("total_ht"),
                                total_ttc: i.get("total_ttc"),
                                montant_total: i.get("montant_total"),
                                reste_a_payer: i.get("reste_a_payer"),
                                adresse_bien: i.get("adresse_bien"),
                                ville: i.get("ville"),
                                code_postal: i.get("code_postal")
                            }));
                            
                            const contactData = {
                                id: contact.id,
                                nom: contact.get("nom"),
                                prenom: contact.get("prenom"),
                                email: contact.get("email"),
                                civilite: contact.get("civilite"),
                                type_personne: contact.get("type_personne")
                            };
                            
                            const objetTemplate = scenarioActif.objet || email.objet || "";
                            const corpsTemplate = scenarioActif.corps || email.corps || "";
                            
                            const prompt = promptTemplate
                                .replace(/{{objetTemplate}}/g, objetTemplate)
                                .replace(/{{corpsTemplate}}/g, corpsTemplate)
                                .replace(/{{impayesJson}}/g, JSON.stringify(impayesData))
                                .replace(/{{historyJson}}/g, JSON.stringify(history))
                                .replace(/{{emailIndex}}/g, String(emailIndex))
                                .replace(/{{contactJson}}/g, JSON.stringify(contactData))
                                .replace(/{{scenarioType}}/g, scenarioType);
                            
                            // Appeler Ollama pour générer le contenu
                            let generatedContent;
                            try {
                                if (USE_OLLAMA) {
                                    generatedContent = await callOllama(prompt, contactId, emailIndex);
                                } else {
                                    // Mode fallback sans Ollama
                                    generatedContent = {
                                        objet: objetTemplate,
                                        corps: corpsTemplate
                                    };
                                }
                            } catch (ollamaError) {
                                log("ERROR", contactId, emailIndex, `Erreur Ollama: ${ollamaError.message}`);
                                // Utiliser les templates en cas d'erreur
                                generatedContent = {
                                    objet: objetTemplate,
                                    corps: corpsTemplate
                                };
                            }
                            
                            // Remplacer les placeholders
                            const { objet: objetFinal, corps: corpsFinal } = replacePlaceholders(
                                generatedContent.objet,
                                generatedContent.corps,
                                contact,
                                contactImpayes
                            );
                            
                            // Préparer le smtpProfil
                            let smtpProfileObj = null;
                            if (scenarioActif.smtp) {
                                const SmtpProfile = Parse.Object.extend("SmtpProfile");
                                smtpProfileObj = SmtpProfile.createWithoutData(scenarioActif.smtp);
                            } else if (email.smtp) {
                                const SmtpProfile = Parse.Object.extend("SmtpProfile");
                                smtpProfileObj = SmtpProfile.createWithoutData(email.smtp);
                            }
                            
                            // Créer le suivi
                            const suivi = new Suivi();
                            suivi.set("contact", contact);
                            suivi.set("sequence", sequence);
                            suivi.set("email_index", emailIndex);
                            suivi.set("impayes", contactImpayes);
                            suivi.set("scenario", scenarioType);
                            suivi.set("frequence", frequence);
                            suivi.set("valide", !validationObligatoire);
                            suivi.set("manuelle", false);
                            suivi.set("statut", "pret pour envoi");
                            suivi.set("objet", objetFinal);
                            suivi.set("corps", corpsFinal);
                            suivi.set("dateEnvoi", new Date());
                            suivi.set("erreur_count", 0);
                            
                            if (smtpProfileObj) {
                                suivi.set("smtpProfil", smtpProfileObj);
                            }
                            
                            // Récupérer les adresses CC
                            if (email.cc) {
                                suivi.set("cc", email.cc);
                            }
                            
                            await suivi.save(null, { useMasterKey: true });
                            
                            suivisCrees++;
                            log("INFO", contactId, emailIndex, `Suivi créé avec succès - scénario: ${scenarioType}`);
                        }
                    } catch (groupError) {
                        log("ERROR", contactId, emailIndex, `Erreur traitement contact: ${groupError.message}`);
                        erreurs++;
                    }
                }
            } catch (sequenceError) {
                log("ERROR", null, null, `Erreur traitement séquence ${sequence?.id}: ${sequenceError.message}`);
                erreurs++;
            }
        }
        
        log("INFO", null, null, "=== Workflow terminé ===");
        log("INFO", null, null, `Résumé: ${suivisCrees} suivis créés, ${suivisIgnores} ignorés, ${erreurs} erreurs`);
        
        return {
            success: true,
            suivisCrees,
            suivisIgnores,
            erreurs
        };
        
    } catch (error) {
        log("ERROR", null, null, `Erreur fatale du workflow: ${error.message}`);
        throw error;
    }
}

// Export pour Parse Cloud Code
module.exports = { generateSuivis };

// Si exécuté directement (local/test)
if (require.main === module) {
    // Initialiser Parse
    const appId = process.env.PARSE_APP_ID || "adti-marki";
    const serverURL = process.env.PARSE_SERVER_URL || "https://dev.markidiags.com/api/parse";
    const masterKey = process.env.PARSE_MASTER_KEY;
    
    Parse.initialize(appId, null, masterKey);
    Parse.serverURL = serverURL;
    
    generateSuivis()
        .then(result => {
            console.log("Résultat:", JSON.stringify(result, null, 2));
            process.exit(0);
        })
        .catch(error => {
            console.error("Erreur:", error);
            process.exit(1);
        });
}
