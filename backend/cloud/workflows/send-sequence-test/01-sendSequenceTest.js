/**
 * Envoie des emails de test pour une séquence
 * Workflow: 01-sendSequenceTest
 */

const fs = require('fs');
const path = require('path');

// Importer le générateur Ollama pour le peuplement des variables
const { generator } = require('../../relances/services/relanceGenerator');

// Helper pour écriture dans le fichier de log
function writeLog(message, workflowName = 'send-sequence-test') {
  const logDir = path.join(__dirname, 'logs');
  const logFile = path.join(logDir, `${workflowName}.log`);
  
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;
  
  try {
    fs.appendFileSync(logFile, logLine, 'utf8');
  } catch (err) {
    console.error('[logger] Impossible d\'écrire dans le fichier de log:', err.message);
  }
}

/**
 * Convertit un objet Parse en objet simple pour Ollama
 */
function convertToSimpleObject(parseObj) {
  if (!parseObj || !parseObj.get) return parseObj;
  
  const result = {};
  const attributes = parseObj.attributes || parseObj;
  
  for (const key of Object.keys(attributes)) {
    const value = attributes[key];
    if (value && typeof value === 'object' && value.get) {
      result[key] = convertToSimpleObject(value);
    } else if (value instanceof Date) {
      result[key] = value.toISOString();
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Prépare les données d'impayé pour Ollama
 */
function prepareImpayeData(impaye, payeur) {
  const impayeData = convertToSimpleObject(impaye);
  const payeurData = convertToSimpleObject(payeur);
  
  // Fusionner les données payeur dans impaye pour compatibilité avec le générateur
  return {
    ...impayeData,
    payeur_nom: payeurData.nom || impayeData.payeur_nom || '',
    payeur_email: payeurData.email || impayeData.payeur_email || '',
    payeur_telephone: payeurData.telephone || impayeData.payeur_telephone || '',
    payeur_type: payeurData.type_personne || impayeData.payeur_type || '',
    payeur_adresse: payeurData.adresse || impayeData.payeur_adresse || '',
    societe: payeurData.societe || payeurData.nom || '',
    // Conserver les données existantes de l'impayé
    nfacture: impayeData.nfacture || '',
    ref_piece: impayeData.ref_piece || '',
    date_piece: impayeData.date_piece || '',
    date_echeance: impayeData.date_echeance || '',
    reste_a_payer: impayeData.reste_a_payer || impayeData.montant_total || 0,
    montant_total: impayeData.montant_total || impayeData.reste_a_payer || 0,
    adresse_bien: impayeData.adresse_bien || '',
    code_postal: impayeData.code_postal || '',
    ville: impayeData.ville || '',
    numero_dossier: impayeData.numero_dossier || '',
    // Ajouter les infos du payeur depuis payeurData
    contact_relance: {
      nom: payeurData.nom || '',
      email: payeurData.email || '',
      telephone: payeurData.telephone || ''
    }
  };
}

/**
 * Prépare les données pour un impayé multiple (consolidé)
 */
function prepareMultipleImpayeData(impayesArray, payeur) {
  if (impayesArray.length === 1) {
    return prepareImpayeData(impayesArray[0], payeur);
  }
  
  // Pour plusieurs impayés, créer un objet consolidé
  const primary = impayesArray[0];
  const primaryData = convertToSimpleObject(primary);
  const payeurData = convertToSimpleObject(payeur);
  
  // Calculer les totaux
  const totalResteAPayer = impayesArray.reduce((sum, i) => {
    const data = convertToSimpleObject(i);
    return sum + (parseFloat(data.reste_a_payer) || parseFloat(data.montant_total) || 0);
  }, 0);
  
  const totalMontant = impayesArray.reduce((sum, i) => {
    const data = convertToSimpleObject(i);
    return sum + (parseFloat(data.montant_total) || 0);
  }, 0);
  
  // Liste des numéros de facture
  const nfactures = impayesArray.map(i => convertToSimpleObject(i).nfacture).filter(Boolean).join(', ');
  const ndossiers = impayesArray.map(i => convertToSimpleObject(i).numero_dossier).filter(Boolean).join(', ');
  
  return {
    ...primaryData,
    payeur_nom: payeurData.nom || primaryData.payeur_nom || '',
    payeur_email: payeurData.email || primaryData.payeur_email || '',
    payeur_telephone: payeurData.telephone || primaryData.payeur_telephone || '',
    payeur_type: payeurData.type_personne || primaryData.payeur_type || '',
    payeur_adresse: payeurData.adresse || primaryData.payeur_adresse || '',
    societe: payeurData.societe || payeurData.nom || '',
    // Données consolidées pour multiple
    nfacture: nfactures,
    ref_piece: impayesArray.map(i => convertToSimpleObject(i).ref_piece).filter(Boolean).join(', '),
    reste_a_payer: totalResteAPayer,
    montant_total: totalMontant,
    // Ajouter la liste complète pour le contexte
    nfactures_liste: impayesArray.map(i => convertToSimpleObject(i)),
    multiple: true,
    count_impayes: impayesArray.length,
    contact_relance: {
      nom: payeurData.nom || '',
      email: payeurData.email || '',
      telephone: payeurData.telephone || ''
    }
  };
}

/**
 * Envoie les emails de test avec Ollama (remplacement de variables)
 */
async function envoyerEmailsDeTest(emails, impayes, payeur, testEmail, payeurData, startedAt) {
  const impayesArray = Array.isArray(impayes) ? impayes : [impayes];
  const isMultiple = impayesArray.length > 1;
  
  let emailsSent = 0;
  
  for (const email of emails) {
    if (!email.scenarios || !Array.isArray(email.scenarios)) {
      console.warn(`Pas de scénarios valides pour cet email`);
      continue;
    }
    
    // Utiliser le scénario actif de l'email, ou déterminer automatiquement
    const scenarioActif = email.activeScenario || (isMultiple ? "multiple" : "single");
    console.log(`Scénario utilisé: ${scenarioActif} (${impayesArray.length} impayé(s)), email.activeScenario=${email.activeScenario}`);
    
    const scenario = email.scenarios.find(s => s.format === scenarioActif);
    
    if (!scenario) {
      console.warn(`Scénario ${scenarioActif} non trouvé pour l'email, essayons de trouver un scénario actif...`);
      // Essayer de trouver un scénario actif parmi tous les scénarios
      const activeScenario = email.scenarios.find(s => s.active !== false);
      if (activeScenario) {
        console.log(`  -> Utilisation du premier scénario actif: ${activeScenario.format}`);
        
        try {
          // Préparer les données de l'impayé
          const impayeData = isMultiple 
            ? prepareMultipleImpayeData(impayesArray, payeur) 
            : prepareImpayeData(impayesArray[0], payeur);
          
          // Générer l'email via Ollama avec remplacement de variables
          console.log(`[Ollama] Remplacement de variables pour scénario ${activeScenario.format}...`);
          const template = {
            objet: activeScenario.objet || activeScenario.object || '',
            corps: activeScenario.corps || activeScenario.body || ''
          };
          
          const generated = await generator.generateFromTemplate(
            template,
            impayeData,
            [] // Pas d'historique pour le test
          );
          
          const objet = generated.object;
          const corps = generated.body;
          console.log(`Objet généré: ${objet.substring(0, 80)}...`);
          
          const smtpId = activeScenario.smtp || email.smtp;
          
          try {
            if (smtpId) {
              await Parse.Cloud.run("sendEmailViaSmtp", {
                smtpId: smtpId,
                to: testEmail,
                subject: objet,
                html: corps,
                text: corps.replace(/<[^>]*>/g, "")
              });
            } else {
              await Parse.Cloud.run("sendEmail", {
                to: testEmail,
                subject: objet,
                html: corps,
                text: corps.replace(/<[^>]*>/g, "")
              });
            }
            emailsSent++;
            console.log(`✅ Email envoyé via ${smtpId ? 'SMTP' : 'défaut'}`);
          } catch (emailError) {
            console.error(`❌ Erreur envoi email ${smtpId ? 'via SMTP ' + smtpId : 'par défaut'}:`, emailError.message);
          }
        } catch (genError) {
          console.error(`❌ Erreur génération Ollama:`, genError.message);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      console.warn(`Aucun scénario valide trouvé pour l'email`);
      continue;
    }
    
    try {
      // Préparer les données de l'impayé
      const impayeData = isMultiple 
        ? prepareMultipleImpayeData(impayesArray, payeur) 
        : prepareImpayeData(impayesArray[0], payeur);
      
      // Générer l'email via Ollama avec remplacement de variables
      console.log(`[Ollama] Remplacement de variables pour scénario ${scenario.format}...`);
      const template = {
        objet: scenario.objet || scenario.object || '',
        corps: scenario.corps || scenario.body || ''
      };
      
      const generated = await generator.generateFromTemplate(
        template,
        impayeData,
        [] // Pas d'historique pour le test
      );
      
      const objet = generated.object;
      const corps = generated.body;
      console.log(`Objet généré: ${objet.substring(0, 80)}...`);
      
      const smtpId = scenario.smtp || email.smtp;
      
      try {
        if (smtpId) {
          await Parse.Cloud.run("sendEmailViaSmtp", {
            smtpId: smtpId,
            to: testEmail,
            subject: objet,
            html: corps,
            text: corps.replace(/<[^>]*>/g, "")
          });
        } else {
          await Parse.Cloud.run("sendEmail", {
            to: testEmail,
            subject: objet,
            html: corps,
            text: corps.replace(/<[^>]*>/g, "")
          });
        }
        emailsSent++;
        console.log(`✅ Email envoyé via ${smtpId ? 'SMTP' : 'défaut'}`);
      } catch (emailError) {
        console.error(`❌ Erreur envoi email ${smtpId ? 'via SMTP ' + smtpId : 'par défaut'}:`, emailError.message);
      }
    } catch (genError) {
      console.error(`❌ Erreur génération Ollama:`, genError.message);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  const result = {
    success: true,
    sentEmails: emailsSent,
    totalEmails: emails.length,
    message: `${emailsSent} emails de test envoyés à ${testEmail}`,
    impayesCount: isMultiple ? impayes.length : 1,
    usingMultipleFormat: isMultiple
  };

  // Persistance du log dans le fichier
  const finishedAt = new Date();
  writeLog(`SUCCESS: ${emailsSent}/${emails.length} emails envoyés à ${testEmail} (${finishedAt - startedAt}ms)`);

  return result;
}

/**
 * Fonction principale pour envoyer des emails de test
 * @param {Object} request - Requête Parse Cloud
 * @returns {Promise<Object>} Résultat
 */
async function sendSequenceTest(request) {
  const startedAt = new Date();
  const { sequenceId, testEmail, payeurId, payeurData } = request.params;
  
  // Validation
  if (!sequenceId || !testEmail || !payeurId) {
    throw new Error("Paramètres manquants: sequenceId, testEmail et payeurId sont requis");
  }
  
  // Récupérer la séquence
  const Sequence = Parse.Object.extend("Sequence");
  const query = new Parse.Query(Sequence);
  const sequence = await query.get(sequenceId);
  
  // Récupérer les emails de la séquence
  let emails = request.params.emails;
  if (!emails || emails.length === 0) {
    emails = sequence.get("emails") || [];
  }
  
  if (emails.length === 0) {
    throw new Error("La séquence ne contient aucun email");
  }
  
  // Récupérer le payeur
  const Contact = Parse.Object.extend("Contact");
  const payeurQuery = new Parse.Query(Contact);
  const payeur = await payeurQuery.get(payeurId);
  
  // Récupérer les impayés non soldés pour ce payeur
  const Impaye = Parse.Object.extend("Impaye");
  const impayeQuery = new Parse.Query(Impaye);
  impayeQuery.equalTo("payeur", payeur);
  impayeQuery.equalTo("facture_soldee", false);
  impayeQuery.limit(100);
  
  const impayes = await impayeQuery.find({ useMasterKey: true });
  
  // Si aucun impayé non soldé, essayer avec tous les impayés
  if (impayes.length === 0) {
    console.log(`⚠ Aucun impayé non soldé trouvé pour ${payeur.get('nom')}`);
    
    const allImpayeQuery = new Parse.Query(Impaye);
    allImpayeQuery.equalTo("payeur", payeur);
    allImpayeQuery.limit(100);
    const allImpayes = await allImpayeQuery.find({ useMasterKey: true });
    
    if (allImpayes.length === 0) {
      throw new Error(`Aucun impayé trouvé pour le payeur ${payeur.get('nom')}`);
    }
    
    console.log(`✓ Utilisation de ${allImpayes.length} impayé(s) pour le test`);
    return envoyerEmailsDeTest(emails, allImpayes, payeur, testEmail, payeurData, startedAt);
  }
  
  console.log(`✓ ${impayes.length} impayé(s) non soldé(s) trouvé(s) pour le test`);
  const impayesToUse = impayes.length === 1 ? [impayes[0]] : impayes;
  return envoyerEmailsDeTest(emails, impayesToUse, payeur, testEmail, payeurData, startedAt);
}

module.exports = sendSequenceTest;
