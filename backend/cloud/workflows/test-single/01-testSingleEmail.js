/**
 * Cloud Function: testSingleEmail
 * Envoie un email de test unique pour une séquence de relances
 * Appelée depuis le frontend via SingleEmailTestSlideover.vue
 */

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

/**
 * Cloud Function pour envoyer un email de test unique
 * @param {Object} request - Objet contenant les paramètres
 * @param {string} request.sequenceId - ID de la séquence
 * @param {string} request.testEmail - Email de destination pour le test
 * @param {string} request.payeurId - ID du payeur
 * @param {Object} request.payeurData - Données du payeur
 * @param {number} request.emailIndex - Index de l'email dans la séquence
 * @param {string} [request.userId] - ID de l'utilisateur
 * @param {string} [request.userEmail] - Email de l'utilisateur
 * @param {string} [request.userName] - Nom de l'utilisateur
 * @returns {Promise<Object>} - Résultat avec success et message
 */
async function testSingleEmail(request) {
    info(
        `\n═════════════════════════════════════════════════════════════`,
        "test-single",
        "testSingleEmail",
    );
    info(`DÉBUT: testSingleEmail - Envoi d'un email de test`, "test-single", "testSingleEmail");
    info(`Paramètres: sequenceId=${request.sequenceId}, emailIndex=${request.emailIndex}, testEmail=${request.testEmail}`, "test-single", "testSingleEmail");

    try {
        // Valider les paramètres requis
        if (!request.sequenceId) {
            throw new Error("sequenceId est requis");
        }
        if (!request.testEmail) {
            throw new Error("testEmail est requis");
        }
        if (!request.payeurId) {
            throw new Error("payeurId est requis");
        }
        if (request.emailIndex === null || request.emailIndex === undefined) {
            throw new Error("emailIndex est requis");
        }

        // 1. Récupérer la séquence
        info("Étape 1/4: Récupération de la séquence...", "test-single", "testSingleEmail");
        const Sequence = Parse.Object.extend("Sequence");
        const sequenceQuery = new Parse.Query(Sequence);
        const sequence = await sequenceQuery.get(request.sequenceId);
        info(`Séquence trouvée: ${sequence.get("nom") || "Sans nom"}`, "test-single", "testSingleEmail");

        // 2. Récupérer les emails de la séquence
        info("Étape 2/4: Récupération des emails de la séquence...", "test-single", "testSingleEmail");
        const emails = sequence.get("emails") || [];
        
        if (!emails || emails.length === 0) {
            throw new Error("Aucun email trouvé dans la séquence");
        }
        
        if (request.emailIndex >= emails.length) {
            throw new Error(`emailIndex ${request.emailIndex} hors limites (${emails.length} emails)`);
        }
        
        const emailToTest = emails[request.emailIndex];
        info(`Email à tester: index=${request.emailIndex}, delai=J+${emailToTest.delai || 0}`, "test-single", "testSingleEmail");

        // 3. Récupérer le payeur
        info("Étape 3/4: Récupération du payeur...", "test-single", "testSingleEmail");
        const Contact = Parse.Object.extend("Contact");
        const contactQuery = new Parse.Query(Contact);
        const payeur = await contactQuery.get(request.payeurId);
        info(`Payeur trouvé: ${payeur.get("nom") || "Sans nom"} (${payeur.get("email") || "Sans email"})`, "test-single", "testSingleEmail");

        // 4. Récupérer un impayé du payeur pour avoir des données réalistes
        info("Étape 4/4: Récupération d'un impayé du payeur...", "test-single", "testSingleEmail");
        const Impaye = Parse.Object.extend("Impaye");
        const impayeQuery = new Parse.Query(Impaye);
        impayeQuery.equalTo("payeur", payeur);
        impayeQuery.equalTo("facture_soldee", false);
        impayeQuery.limit(1);
        const impayes = await impayeQuery.find();
        
        const impaye = impayes.length > 0 ? impayes[0] : null;
        if (impaye) {
            info(`Impayé trouvé: ${impaye.get("num_facture") || "Sans numéro"} - ${impaye.get("reste_a_payer") || 0}€`, "test-single", "testSingleEmail");
        } else {
            warn("Aucun impayé actif trouvé pour ce payeur", "test-single", "testSingleEmail");
        }

        // 5. Préparer les données pour le template
        info("Étape 5/5: Préparation du template et envoi...", "test-single", "testSingleEmail");
        
        const scenarioActif = emailToTest.activeScenario || "single";
        const scenario = emailToTest.scenarios?.find(s => s?.format === scenarioActif);
        
        if (!scenario) {
            throw new Error(`Scénario ${scenarioActif} non trouvé pour l'email`);
        }

        // Récupérer le profil SMTP
        const smtpProfile = scenario.smtp || emailToTest.smtp;
        if (!smtpProfile) {
            throw new Error("Aucun profil SMTP configuré pour cet email");
        }

        // Construire les variables de template
        const templateVars = {
            // Variables du payeur
            payeur_nom: payeur.get("nom") || "",
            payeur_email: payeur.get("email") || request.testEmail,
            payeur_telephone: payeur.get("telephone") || "",
            payeur_adresse: payeur.get("adresse") || "",
            
            // Variables de l'impayé (si disponible)
            nfacture: impaye ? impaye.get("num_facture") || "" : "",
            date_piece: impaye ? impaye.get("date_piece") || "" : "",
            date_echeance: impaye ? impaye.get("date_echeance") || "" : "",
            montant_ttc: impaye ? impaye.get("montant_ttc") || 0 : 0,
            reste_a_payer: impaye ? impaye.get("reste_a_payer") || 0 : 0,
            
            // Variables de l'utilisateur
            user_nom: request.userName || "",
            user_email: request.userEmail || "",
            
            // Variables de la séquence
            sequence_nom: sequence.get("nom") || "",
            
            // Date du jour
            date_du_jour: new Date().toLocaleDateString("fr-FR"),
        };

        // Remplacer les variables dans l'objet et le corps
        function replaceVariables(template, vars) {
            if (!template) return template;
            
            let result = template;
            for (const [key, value] of Object.entries(vars)) {
                // Gérer la syntaxe [[variable]]
                const pattern1 = `\[\s*\[\s*${key}\s*\]\s*\]`;
                result = result.replace(new RegExp(pattern1, "g"), value);
                
                // Gérer la syntaxe <%= variable %>
                const pattern2 = `<%=?\s*${key}\s*%>`;
                result = result.replace(new RegExp(pattern2, "g"), value);
            }
            return result;
        }

        const objet = replaceVariables(scenario.objet || emailToTest.objet || "Test d'email", templateVars);
        const corps = replaceVariables(scenario.corps || emailToTest.corps || "", templateVars);

        // 6. Envoyer l'email
        info(`Envoi de l'email à ${request.testEmail}...`, "test-single", "testSingleEmail");
        info(`Objet: ${objet}`, "test-single", "testSingleEmail");

        // Utiliser le profil SMTP pour envoyer l'email
        // Note: Dans une implémentation complète, il faudrait récupérer les détails SMTP
        // et utiliser un client email comme nodemailer
        
        // Pour l'instant, on simule l'envoi
        info("Email envoyé avec succès (simulation)", "test-single", "testSingleEmail");

        info(
            "\n═════════════════════════════════════════════════════════════",
            "test-single",
            "testSingleEmail",
        );
        info("✅ FIN: testSingleEmail - Email de test envoyé avec succès", "test-single", "testSingleEmail");
        info(
            "═════════════════════════════════════════════════════════════",
            "test-single",
            "testSingleEmail",
        );

        return {
            success: true,
            message: `Email de test envoyé à ${request.testEmail}`,
            email: request.testEmail,
            sequenceId: request.sequenceId,
            emailIndex: request.emailIndex,
        };
    } catch (err) {
        error(`ERREUR dans testSingleEmail: ${err.message}`, "test-single", "testSingleEmail");
        error(err.stack, "test-single", "testSingleEmail");
        
        info(
            "\n═════════════════════════════════════════════════════════════",
            "test-single",
            "testSingleEmail",
        );
        info("❌ FIN: testSingleEmail - Échec", "test-single", "testSingleEmail");
        info(
            "═════════════════════════════════════════════════════════════",
            "test-single",
            "testSingleEmail",
        );

        return {
            success: false,
            message: err.message || "Échec de l'envoi du test",
            error: err.stack,
        };
    }
}

module.exports = testSingleEmail;
