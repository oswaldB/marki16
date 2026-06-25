const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

// Configuration
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || "https://ollama.com/api";
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
const OLLAMA_MODEL = "mistral-large-3:675b-cloud";
const USE_OLLAMA = true;
const FRONTEND_URL = process.env.FRONTEND_URL || "https://adti.markidiags.com";
const PROMPT_FILE =
    "/home/ubuntu/prod/adti/configuration/prompts/relance-email-prompt.txt";

// Logger utilitaire
function log(level, contactId, emailIndex, message) {
    const timestamp = new Date().toISOString();
    const prefix = `[${level.toUpperCase()}][${contactId || ""}][${emailIndex !== undefined ? emailIndex : ""}]`;
    const fullMessage = `[GENERATE-RELANCES][${timestamp}]${prefix} ${message}`;
    console.log(fullMessage);

    // Création du dossier de logs si nécessaire
    const logsDir = path.join(__dirname, "logs");
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }

    // Écriture dans le fichier de log
    const logFile = path.join(
        logsDir,
        `${new Date().toISOString().split("T")[0]}.log`,
    );
    fs.appendFileSync(logFile, fullMessage + "\n");
}

// Parser la réponse YAML du LLM
function parseLLMResponse(content) {
    // Nettoyer les caractères de contrôle Windows et normaliser
    let cleaned = content
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/\t/g, "    ");

    // Log pour debug
    console.log(
        "[YAML-PARSE] Contenu brut reçu (200 premiers chars):",
        cleaned.substring(0, 200),
    );

    // Essayer plusieurs patterns d'extraction
    let yamlContent = null;

    // Pattern 1: Bloc entre --- et ---
    const docMatch = cleaned.match(/---\n([\s\S]*?)\n---/);
    if (docMatch) {
        yamlContent = docMatch[1].trim();
    }

    // Pattern 2: Bloc markdown yaml
    if (!yamlContent) {
        const mdMatch = cleaned.match(/```yaml\n([\s\S]*?)```/);
        if (mdMatch) {
            yamlContent = mdMatch[1].trim();
        }
    }

    // Pattern 3: Début direct avec objet: ou corps:
    if (!yamlContent) {
        const directMatch = cleaned.match(/^(objet:[\s\S]*)/m);
        if (directMatch) {
            yamlContent = directMatch[1].trim();
        }
    }

    if (!yamlContent) {
        throw new Error(
            "Format YAML non trouvé dans la réponse. Contenu reçu: " +
                cleaned.substring(0, 500),
        );
    }

    console.log(
        "[YAML-PARSE] Contenu YAML extrait:",
        yamlContent.substring(0, 200),
    );

    // Parser le YAML avec options permissives
    let parsed;
    try {
        parsed = yaml.load(yamlContent, {
            schema: yaml.DEFAULT_SCHEMA,
            json: true,
        });
    } catch (yamlError) {
        console.error("[YAML-PARSE] Erreur parsing YAML:", yamlError.message);
        console.error("[YAML-PARSE] Contenu problématique:", yamlContent);
        throw new Error(`Erreur parsing YAML: ${yamlError.message}`);
    }

    // Vérifier la structure attendue
    if (!parsed || typeof parsed !== "object") {
        throw new Error("La réponse parsée n'est pas un objet valide");
    }

    if (!parsed.objet || !parsed.corps) {
        throw new Error(
            `La réponse doit contenir les champs 'objet' et 'corps'. Reçu: ${JSON.stringify(Object.keys(parsed || {}))}`,
        );
    }

    return {
        objet: String(parsed.objet),
        corps: String(parsed.corps),
    };
}

// Appel API Ollama
async function callOllama(prompt, contactId, emailIndex) {
    const startTime = Date.now();

    try {
        log(
            "INFO",
            contactId,
            emailIndex,
            `Démarrage appel Ollama - Modèle: ${OLLAMA_MODEL}`,
        );
        log(
            "INFO",
            contactId,
            emailIndex,
            `Taille du prompt: ${Buffer.byteLength(prompt, "utf8")} octets`,
        );
        log("DEBUG", contactId, emailIndex, `PROMPT COMPLET:\n${prompt}`);

        const response = await fetch(`${OLLAMA_API_URL}/generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(OLLAMA_API_KEY && {
                    Authorization: `Bearer ${OLLAMA_API_KEY}`,
                }),
            },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt: prompt,
                stream: false,
            }),
            timeout: 120000, // 2 minutes timeout
        });

        const duration = Date.now() - startTime;

        if (!response.ok) {
            const errorText = await response.text();
            log(
                "ERROR",
                contactId,
                emailIndex,
                `Erreur HTTP ${response.status}: ${errorText}`,
            );
            throw new Error(
                `Erreur Ollama HTTP ${response.status}: ${errorText}`,
            );
        }

        const data = await response.json();
        const content =
            data.response || data.output || data.generated_text || "";

        log(
            "INFO",
            contactId,
            emailIndex,
            `Appel Ollama terminé - Durée: ${duration}ms - Taille réponse: ${Buffer.byteLength(content, "utf8")} octets`,
        );
        log(
            "DEBUG",
            contactId,
            emailIndex,
            `Aperçu réponse: ${content.substring(0, 200)}...`,
        );

        return content;
    } catch (error) {
        const duration = Date.now() - startTime;
        log(
            "ERROR",
            contactId,
            emailIndex,
            `Échec appel Ollama après ${duration}ms: ${error.message}`,
        );
        throw error;
    }
}

// Extraction complète des données d'un impayé
function extractImpayeData(impaye) {
    return {
        // Identifiants
        id: impaye.id,
        nfacture: impaye.get("nfacture"),
        reference: impaye.get("reference"),
        ref_piece: impaye.get("ref_piece"),
        numero_dossier: impaye.get("numero_dossier"),
        id_dossier: impaye.get("id_dossier"),

        // Dates
        date_piece: impaye.get("date_piece"),
        date_echeance: impaye.get("date_echeance"),

        // Montants
        total_ht: impaye.get("total_ht"),
        total_ttc: impaye.get("total_ttc"),
        montant_total: impaye.get("montant_total"),
        reste_a_payer: impaye.get("reste_a_payer"),

        // Statut
        facture_soldee: impaye.get("facture_soldee"),

        // Commentaire
        commentaire_piece: impaye.get("commentaire_piece"),

        // Payeur (informations dénormalisées)
        payeur_nom: impaye.get("payeur_nom"),
        payeur_prenom: impaye.get("payeur_prenom"),
        payeur_email: impaye.get("payeur_email"),
        payeur_telephone: impaye.get("payeur_telephone"),
        payeur_civilite: impaye.get("payeur_civilite"),
        payeur_type: impaye.get("payeur_type"),

        // Bien immobilier
        adresse_bien: impaye.get("adresse_bien"),
        ville: impaye.get("ville"),
        code_postal: impaye.get("code_postal"),

        // Document
        url_pdf: impaye.get("url_pdf"),

        // Apporteur
        apporteur_nom: impaye.get("apporteur_nom"),
        apporteur_prenom: impaye.get("apporteur_prenom"),
        apporteur_email: impaye.get("apporteur_email"),
        apporteur_telephone: impaye.get("apporteur_telephone"),
        apporteur_civilite: impaye.get("apporteur_civilite"),
        apporteur_societe: impaye.get("apporteur_societe"),

        // Propriétaire
        proprietaire_nom: impaye.get("proprietaire_nom"),
        proprietaire_prenom: impaye.get("proprietaire_prenom"),
        proprietaire_email: impaye.get("proprietaire_email"),
        proprietaire_telephone: impaye.get("proprietaire_telephone"),
        proprietaire_civilite: impaye.get("proprietaire_civilite"),

        // Donneur d'ordre
        donneur_ordre_nom: impaye.get("donneur_ordre_nom"),
        donneur_ordre_prenom: impaye.get("donneur_ordre_prenom"),
        donneur_ordre_email: impaye.get("donneur_ordre_email"),
        donneur_ordre_telephone: impaye.get("donneur_ordre_telephone"),
        donneur_ordre_civilite: impaye.get("donneur_ordre_civilite"),
    };
}

// Workflow principal
Parse.Cloud.define("generateRelances", async (request) => {
    const startTime = Date.now();
    log("INFO", null, null, "=== DÉMARRAGE WORKFLOW GENERATE-RELANCES ===");

    let stats = {
        impayesTrouves: 0,
        impayesFiltres: 0,
        groupesCrees: 0,
        relancesCreees: 0,
        relancesIgnorees: 0,
        erreurs: 0,
    };

    try {
        // ========== ÉTAPE 1 : Récupération des impayés avec séquence ==========
        log(
            "INFO",
            null,
            null,
            "Étape 1: Récupération des impayés avec séquence...",
        );

        const Impaye = Parse.Object.extend("Impaye");
        const impayeQuery = new Parse.Query(Impaye);
        impayeQuery.equalTo("facture_soldee", false);
        impayeQuery.greaterThan("reste_a_payer", 0);
        impayeQuery.exists("sequence");
        impayeQuery.include(["sequence", "contact_relance", "payeur"]);
        impayeQuery.limit(999999);

        const impayesAvecSequence = await impayeQuery.find({
            useMasterKey: true,
        });
        stats.impayesTrouves = impayesAvecSequence.length;
        log(
            "INFO",
            null,
            null,
            `${stats.impayesTrouves} impayés trouvés avec une séquence`,
        );

        // ========== ÉTAPE 2 : Filtrage des impayés sans relance, séquences de type relance et exclusion des contacts blacklistés ==========
        log(
            "INFO",
            null,
            null,
            "Étape 2: Filtrage des impayés (séquences relances, contacts blacklistés, relances existantes)...",
        );

        // Filtre 1 : Ne garder que les impayés dont la séquence est de type "relances"
        const impayesAvecSequenceRelance = impayesAvecSequence.filter(
            (impaye) => {
                const sequence = impaye.get("sequence");
                return sequence && sequence.get("type") === "relances";
            },
        );

        log(
            "INFO",
            null,
            null,
            `${impayesAvecSequenceRelance.length} impayés avec séquence de type 'relances'`,
        );

        // Filtre 1.5 : Exclure les contacts blacklistés
        const impayesSansContactsBlacklistes =
            impayesAvecSequenceRelance.filter((impaye) => {
                let contact = impaye.get("contact_relance");
                if (!contact) {
                    contact = impaye.get("payeur");
                }
                // Si aucun contact trouvé, on conserve l'impayé (sera filtré plus tard)
                // Sinon, on exclut si le contact est blacklisté
                return !contact || contact.get("isBlacklisted") !== true;
            });

        const blacklistedCount =
            impayesAvecSequenceRelance.length -
            impayesSansContactsBlacklistes.length;
        log(
            "INFO",
            null,
            null,
            `${blacklistedCount} impayés exclus (contacts blacklistés)`,
        );

        // Filtre 2 : Récupérer les impayés déjà associés à une relance envoyée
        const Relance = Parse.Object.extend("Relance");
        const relanceQuery = new Parse.Query(Relance);
        relanceQuery.limit(999999);
        relanceQuery.equalTo("manuelle", false);
        relanceQuery.exists("dateEnvoi");

        const relances = await relanceQuery.find({ useMasterKey: true });

        const impayesAvecRelanceIds = new Set();
        for (const relance of relances) {
            const impayesArray = relance.get("impayes");
            if (impayesArray && Array.isArray(impayesArray)) {
                for (const impaye of impayesArray) {
                    impayesAvecRelanceIds.add(impaye.id || impaye.objectId);
                }
            }
        }

        log(
            "INFO",
            null,
            null,
            `${impayesAvecRelanceIds.size} impayés déjà associés à une relance envoyée`,
        );

        // Filtre final : Exclure les impayés déjà ayant une relance
        const impayesSansRelance = impayesSansContactsBlacklistes.filter(
            (impaye) => !impayesAvecRelanceIds.has(impaye.id),
        );

        stats.impayesFiltres = impayesSansRelance.length;
        log(
            "INFO",
            null,
            null,
            `${stats.impayesFiltres} impayés sans relance à traiter`,
        );

        // ========== ÉTAPE 3 : Regroupement des impayés par contact ==========
        log(
            "INFO",
            null,
            null,
            "Étape 3: Regroupement par contact et séquence...",
        );

        const groupedByContactSequence = new Map();

        for (const impaye of impayesSansRelance) {
            // Utiliser contact_relance si disponible, sinon utiliser payeur
            let contact = impaye.get("contact_relance");
            if (!contact) {
                contact = impaye.get("payeur");
            }

            const sequence = impaye.get("sequence");

            if (!contact || !sequence) continue;

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

        stats.groupesCrees = groupedByContactSequence.size;
        log(
            "INFO",
            null,
            null,
            `${stats.groupesCrees} groupes (contact + séquence) créés`,
        );

        // ========== ÉTAPE 4 : Création des relances ==========
        log("INFO", null, null, "Étape 4: Création des relances...");

        // Charger le template de prompt
        let promptTemplate;
        try {
            promptTemplate = fs.readFileSync(PROMPT_FILE, "utf-8");
            log("INFO", null, null, `Prompt chargé depuis ${PROMPT_FILE}`);
        } catch (err) {
            log(
                "WARN",
                null,
                null,
                `Fichier de prompt non trouvé (${PROMPT_FILE}), utilisation du prompt par défaut`,
            );
            promptTemplate = `Tu es un assistant expert en communication client pour une agence immobilière.
Génère un email de relance de facture impayée.

TEMPLATE OBJET: {{objetTemplate}}
TEMPLATE CORPS: {{corpsTemplate}}

DONNÉES DU CONTACT:
{{contactJson}}

FACTURES IMPAYÉES:
{{impayesJson}}

HISTORIQUE DES RELANCES:
{{historyJson}}

INDEX EMAIL: {{emailIndex}}
SCÉNARIO: {{scenarioType}} (single = 1 facture, multiple = 2+ factures)

Génère une réponse au format YAML:
\`\`\`yaml
objet: "L'objet de l'email"
corps: |
  <p>Le contenu HTML de l'email</p>
\`\`\``;
        }

        const relancesToSave = [];
        const Sequence = Parse.Object.extend("Sequence");

        for (const [key, group] of groupedByContactSequence) {
            const { contact, sequence, impayes } = group;

            // Récupérer la séquence complète avec les emails
            const fullSequenceQuery = new Parse.Query(Sequence);
            fullSequenceQuery.equalTo("objectId", sequence.id);
            const fullSequence = await fullSequenceQuery.first({
                useMasterKey: true,
            });

            if (!fullSequence) {
                log(
                    "WARN",
                    contact.id,
                    null,
                    `Séquence ${sequence.id} non trouvée, ignorée`,
                );
                continue;
            }

            const emails = fullSequence.get("emails") || [];
            const validationObligatoire =
                fullSequence.get("validation_obligatoire") || false;

            // Détermination automatique du scénario selon le nombre d'impayés
            const nombreImpayes = impayes.length;
            const scenarioType = nombreImpayes === 1 ? "single" : "multiple";

            log(
                "INFO",
                contact.id,
                null,
                `Traitement groupe: ${impayes.length} impayés, scénario: ${scenarioType}`,
            );

            // Pour chaque email de la séquence
            for (const emailConfig of emails) {
                const emailIndex = emailConfig.email_index;

                // Rechercher le scénario correspondant dans la configuration
                const scenarios = emailConfig.scenarios || [];
                const activeScenario = scenarios.find(
                    (s) => s.format === scenarioType && s.active,
                );

                if (!activeScenario) {
                    log(
                        "INFO",
                        contact.id,
                        emailIndex,
                        `Aucun scénario actif pour le format ${scenarioType}, ignoré`,
                    );
                    continue;
                }

                // Vérifier si relance existe déjà
                const existingRelanceQuery = new Parse.Query(Relance);
                existingRelanceQuery.equalTo("contact", contact);
                existingRelanceQuery.equalTo("sequence", sequence);
                existingRelanceQuery.equalTo("email_index", emailIndex);
                existingRelanceQuery.containedIn(
                    "impayes",
                    impayes.map((i) => i.id),
                );
                existingRelanceQuery.equalTo("manuelle", false);
                existingRelanceQuery.exists("dateEnvoi");

                const existingRelance = await existingRelanceQuery.first({
                    useMasterKey: true,
                });
                if (existingRelance) {
                    log(
                        "INFO",
                        contact.id,
                        emailIndex,
                        `Relance déjà envoyée, ignorée`,
                    );
                    stats.relancesIgnorees++;
                    continue;
                }

                // Récupérer l'historique des relances pour ce contact et cette séquence
                const historyQuery = new Parse.Query(Relance);
                historyQuery.equalTo("contact", contact);
                historyQuery.equalTo("sequence", sequence);
                historyQuery.exists("dateEnvoi");
                historyQuery.descending("dateEnvoi");
                historyQuery.limit(10);
                const history = await historyQuery.find({ useMasterKey: true });

                const historyData = history.map((r) => ({
                    dateEnvoi: r.get("dateEnvoi"),
                    emailIndex: r.get("email_index"),
                    objet: r.get("objet"),
                    statut: r.get("statut"),
                }));

                // Calcul de la date d'envoi
                let dateEcheance = null;
                for (const impaye of impayes) {
                    const impayeDateEcheance = impaye.get("date_echeance");
                    if (impayeDateEcheance) {
                        if (
                            !dateEcheance ||
                            impayeDateEcheance < dateEcheance
                        ) {
                            dateEcheance = impayeDateEcheance;
                        }
                    }
                }

                if (!dateEcheance) dateEcheance = new Date();
                const maintenant = new Date();
                if (dateEcheance < maintenant) dateEcheance = maintenant;

                let delai = emailConfig.delai || 0;
                if (!delai && fullSequence.get("delai"))
                    delai = fullSequence.get("delai");

                const dateEnvoi = new Date(dateEcheance);
                dateEnvoi.setDate(dateEnvoi.getDate() + (delai || 0));

                // Préparer les données pour le prompt - TOUS LES CHAMPS
                const impayesData = impayes.map(extractImpayeData);

                const contactData = {
                    id: contact.id,
                    nom: contact.get("nom"),
                    prenom: contact.get("prenom"),
                    email: contact.get("email"),
                    civilite: contact.get("civilite"),
                };

                const objetTemplate =
                    activeScenario.objet || emailConfig.objet || "";
                const corpsTemplate =
                    activeScenario.corps || emailConfig.corps || "";

                // Générer le contenu avec Ollama
                let objetFinal = objetTemplate;
                let corpsFinal = corpsTemplate;

                if (USE_OLLAMA) {
                    let llmResponse = null;
                    try {
                        const prompt = promptTemplate
                            .replace(/{{objetTemplate}}/g, objetTemplate)
                            .replace(/{{corpsTemplate}}/g, corpsTemplate)
                            .replace(
                                /{{impayesJson}}/g,
                                JSON.stringify(impayesData),
                            )
                            .replace(
                                /{{historyJson}}/g,
                                JSON.stringify(historyData),
                            )
                            .replace(/{{emailIndex}}/g, emailIndex)
                            .replace(
                                /{{contactJson}}/g,
                                JSON.stringify(contactData),
                            )
                            .replace(/{{scenarioType}}/g, scenarioType);

                        llmResponse = await callOllama(
                            prompt,
                            contact.id,
                            emailIndex,
                        );
                        const parsed = parseLLMResponse(llmResponse);

                        objetFinal = parsed.objet;
                        corpsFinal = parsed.corps;

                        log(
                            "INFO",
                            contact.id,
                            emailIndex,
                            `Contenu généré par Ollama avec succès`,
                        );
                    } catch (ollamaError) {
                        log(
                            "ERROR",
                            contact.id,
                            emailIndex,
                            `Erreur Ollama: ${ollamaError.message}`,
                        );
                        if (llmResponse) {
                            log(
                                "DEBUG",
                                contact.id,
                                emailIndex,
                                `Réponse brute reçue: ${llmResponse.substring(0, 500)}`,
                            );
                        }
                        log(
                            "INFO",
                            contact.id,
                            emailIndex,
                            `Utilisation des templates par défaut comme fallback`,
                        );
                        // Les templates sont déjà dans objetFinal/corpsFinal
                    }
                }

                // ========== ÉTAPE 6 : Remplacement des variables ==========
                // Remplacer [[lien_pdf]] par l'URL de redirection PDF
                if (impayes.length > 0) {
                    const lienPdf = `${FRONTEND_URL}/redirect-pdf/${impayes[0].id}`;
                    objetFinal = objetFinal.split("[[lien_pdf]]").join(lienPdf);
                    corpsFinal = corpsFinal.split("[[lien_pdf]]").join(lienPdf);
                }

                // Remplacer [[lien_espace]] par l'URL de redirection espace client
                const lienEspace = `${FRONTEND_URL}/redirect-espace/${contact.id}`;
                objetFinal = objetFinal
                    .split("[[lien_espace]]")
                    .join(lienEspace);
                corpsFinal = corpsFinal
                    .split("[[lien_espace]]")
                    .join(lienEspace);

                // ========== Étape 7 : Création de la relance ==========
                const relance = new Relance();

                // smtpProfil depuis sequence.emails[].scenarios[].smtp
                let smtpId = activeScenario.smtp;
                let smtpProfileObj = null;
                if (smtpId) {
                    const SmtpProfile = Parse.Object.extend("SmtpProfile");
                    smtpProfileObj = SmtpProfile.createWithoutData(smtpId);
                }

                relance.set("contact", contact);
                relance.set("sequence", sequence);
                relance.set("email_index", emailIndex);
                relance.set(
                    "impayes",
                    impayes.map((i) => i),
                );
                relance.set("scenario", scenarioType);
                relance.set("valide", !validationObligatoire);
                relance.set("manuelle", false);
                if (smtpProfileObj) {
                    relance.set("smtpProfil", smtpProfileObj);
                }
                relance.set("dateEnvoi", dateEnvoi);
                relance.set("objet", objetFinal);
                relance.set("corps", corpsFinal);
                relance.set("statut", "pret pour envoi");

                await relance.save(null, { useMasterKey: true });
                stats.relancesCreees++;

                log(
                    "INFO",
                    contact.id,
                    emailIndex,
                    `Relance créée avec succès (ID: ${relance.id})`,
                );
            }
        }

        const duration = Date.now() - startTime;
        log("INFO", null, null, "=== WORKFLOW TERMINÉ ===");
        log("INFO", null, null, `Durée totale: ${duration}ms`);
        log("INFO", null, null, `Résumé: ${JSON.stringify(stats)}`);

        return {
            success: true,
            duration: duration,
            stats: stats,
        };
    } catch (error) {
        const duration = Date.now() - startTime;
        log(
            "ERROR",
            null,
            null,
            `=== WORKFLOW EN ÉCHEC après ${duration}ms: ${error.message}`,
        );
        log("ERROR", null, null, error.stack);

        return {
            success: false,
            error: error.message,
            stack: error.stack,
            duration: duration,
            stats: stats,
        };
    }
});
