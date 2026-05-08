/**
 * Noeud 05: Générer les relances en attente
 * Basé sur cloud/jobs/generateRelances.js
 * 
 * Ce script:
 * 1. Récupère les Relance avec statut "En attente de génération"
 * 2. Charge les Sequence (scénarios), Impaye et l'historique
 * 3. Génère objet/corps de l'email
 * 4. Met à jour la Relance avec le résultat
 */

// Charger les variables d'environnement depuis .env
require('dotenv').config({ path: '/home/ubuntu/prod/adti/.env' });

// Initialiser le logger
const { info, warn, error, debug } = require('../../utils/logger');

// Initialiser Parse
if (typeof Parse === 'undefined') {
  const Parse = require('parse/node');
  Parse.initialize(
    process.env.PARSE_APP_ID,
    process.env.PARSE_JAVASCRIPT_KEY,
    process.env.PARSE_MASTER_KEY
  );
  Parse.serverURL = process.env.PARSE_SERVER_URL;
  Parse.Cloud.useMasterKey();
  global.Parse = Parse;
}

// ============================================
// Configuration Ollama (intégrée au nœud)
// ============================================
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'https://ollama.com/api';
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'mistral';
const USE_OLLAMA = process.env.USE_OLLAMA !== 'false' && !!OLLAMA_API_KEY;

/**
 * Construit le prompt pour l'LLM
 */
const buildPrompt = (scenario, impayes, history, relance) => {
  const impayesJson = JSON.stringify(impayes.map(i => i.toJSON()));
  const historyJson = JSON.stringify(history.map(h => h.toJSON()));
  
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

---
Voici les informations :
+ la trame d'email:
  objet: ${scenario.objet || ''}
  corps: ${scenario.corps || ''}
+ les informations sur les impayés: ${impayesJson}
+ l'historique: ${historyJson}
+ informations supplémentaires:
  email_index: ${relance.get('email_index')}
  contact: ${JSON.stringify(relance.get('contact')?.toJSON())}

Génère un objet JSON avec exactement ces champs: {"objet": "...", "corps": "..."}`;
};

/**
 * Génère le contenu de l'email via l'API Ollama
 */
async function generateEmailContent(prompt) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);
  
  try {
    const response = await fetch(`${OLLAMA_API_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OLLAMA_API_KEY}`,
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        format: 'json',
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
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    const data = await response.json();
    const rawResponse = data.response || data.choices?.[0]?.text || '';
    
    // Extraire et parser le JSON
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : rawResponse;
    const jsonResponse = JSON.parse(jsonStr);
    
    if (jsonResponse.objet && jsonResponse.corps) {
      return { objet: jsonResponse.objet, corps: jsonResponse.corps };
    }
    
    // Fallback si réponse incomplète
    return {
      objet: jsonResponse.objet || 'Relance d\'impayé',
      corps: jsonResponse.corps || jsonResponse.body || '<p>Contenu à compléter</p>'
    };
    
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}


/**
 * Génère les relances en attente
 */
const generatePendingRelances = async (limit) => {
  info('Début de la génération des relances', 'import-invoice', 'generatePendingRelances', { limit });
  debug('Initialisation du workflow', 'import-invoice', 'generatePendingRelances');
  
  try {
    debug('Étape 1: Récupération des relances en attente', 'import-invoice', 'generatePendingRelances');
    // 1. Récupérer les Relances en attente
    const Relance = Parse.Object.extend('Relance');
    const query = new Parse.Query(Relance);
    query.equalTo('statut', 'En attente de génération');
    query.limit(limit || 9999);
    query.include(['sequence', 'contact']);
    
    const relances = await query.find({ useMasterKey: true });
    info(`✅ Trouvé ${relances.length} relances en attente de génération`, 'import-invoice', 'generatePendingRelances', { count: relances.length });
    
    // 2. Pour chaque relance
    debug('Étape 2: Traitement de chaque relance', 'import-invoice', 'generatePendingRelances');
    let processedCount = 0;
    let errorCount = 0;
    
    for (const relance of relances) {
      try {
        debug(`Traitement de la relance: ${relance.id}`, 'import-invoice', 'generatePendingRelances', { relanceId: relance.id });
        
        const sequence = relance.get('sequence');
        const impayesIds = relance.get('impayes') || [];
        const contact = relance.get('contact');
        const emailIndex = relance.get('email_index');
        
        if (!sequence) {
          warn(`⚠️ Relance ${relance.id}: pas de séquence associée, skip`, 'import-invoice', 'generatePendingRelances', { relanceId: relance.id });
          continue;
        }
        
        debug('Étape 3: Récupération de l\'historique', 'import-invoice', 'generatePendingRelances', { relanceId: relance.id });
        // 3. Récupérer l'historique des relances pour ce contact et ces impayés
        const historyQuery = new Parse.Query('Relance');
        historyQuery.equalTo('contact', contact);
        historyQuery.containedIn('impayes', impayesIds);
        historyQuery.exists('dateEnvoi');
        historyQuery.equalTo('statut', 'Envoyée');
        const history = await historyQuery.find({ useMasterKey: true });
        info(`Historique récupéré: ${history.length} relances`, 'import-invoice', 'generatePendingRelances', { relanceId: relance.id, historyCount: history.length });
        
        debug('Étape 4: Récupération des détails des impayés', 'import-invoice', 'generatePendingRelances', { relanceId: relance.id });
        // 4. Récupérer les détails des impayés
        const Impaye = Parse.Object.extend('Impaye');
        const impayeQuery = new Parse.Query(Impaye);
        impayeQuery.containedIn('objectId', impayesIds);
        const impayeDetails = await impayeQuery.find({ useMasterKey: true });
        info(`Détails des impayés récupérés: ${impayeDetails.length}`, 'import-invoice', 'generatePendingRelances', { relanceId: relance.id, impayesCount: impayeDetails.length });
        
        debug('Étape 5: Filtrage des scénarios par email_index', 'import-invoice', 'generatePendingRelances', { relanceId: relance.id });
        // 5. Filtrer les scénarios par email_index
        const Sequence = Parse.Object.extend('Sequence');
        const sequenceQuery = new Parse.Query(Sequence);
        sequenceQuery.equalTo('objectId', sequence.id);
        const fullSequence = await sequenceQuery.first({ useMasterKey: true });
        
        const scenarios = fullSequence?.get('emails') || [];
        const matchingScenario = scenarios.find(s => s.email_index === emailIndex);
        
        if (!matchingScenario) {
          warn(`⚠️ Relance ${relance.id}: pas de scénario correspondant à email_index ${emailIndex}, skip`, 'import-invoice', 'generatePendingRelances', { relanceId: relance.id, emailIndex });
          continue;
        }
        
        debug('Étape 6: Génération du contenu avec LLM ou template', 'import-invoice', 'generatePendingRelances', { relanceId: relance.id });
        // 6. Générer le contenu avec LLM ou template
        info(`Génération du contenu pour ${relance.id}...`, 'import-invoice', 'generatePendingRelances', { relanceId: relance.id });
        
        let objet, corps;
        
        if (USE_OLLAMA) {
          try {
            debug('Utilisation de LLM pour la génération', 'import-invoice', 'generatePendingRelances', { relanceId: relance.id });
            const prompt = buildPrompt(matchingScenario, impayeDetails, history, relance);
            const result = await generateEmailContent(prompt);
            objet = result.objet;
            corps = result.corps;
            info('Contenu généré par LLM', 'import-invoice', 'generatePendingRelances', { relanceId: relance.id, objetLength: objet?.length, corpsLength: corps?.length });
          } catch (llmError) {
            warn(`LLM indisponible pour ${relance.id}, fallback sur template: ${llmError.message}`, 'import-invoice', 'generatePendingRelances', { relanceId: relance.id, error: llmError.message });
            objet = matchingScenario.objet || 'Relance - Facture impayée';
            corps = matchingScenario.corps || 'Veuillez régulariser votre situation.';
          }
        } else {
          debug('Utilisation du template simple', 'import-invoice', 'generatePendingRelances', { relanceId: relance.id });
          objet = matchingScenario.objet || 'Relance - Facture impayée';
          corps = matchingScenario.corps || 'Veuillez régulariser votre situation.';
        }
        
        info(`Contenu généré pour ${relance.id}`, 'import-invoice', 'generatePendingRelances', { relanceId: relance.id, objetLength: objet?.length, corpsLength: corps?.length });
        
        debug('Étape 7: Mise à jour de la relance', 'import-invoice', 'generatePendingRelances', { relanceId: relance.id });
        // 7. Mettre à jour la relance
        relance.set('objet', objet);
        relance.set('corps', corps);
        relance.set('statut', 'pret pour envoi');
        await relance.save(null, { useMasterKey: true });
        
        info(`✅ Relance ${relance.id} traitée avec succès`, 'import-invoice', 'generatePendingRelances', { relanceId: relance.id });
        processedCount++;
        
      } catch (error) {
        error(`❌ Erreur lors du traitement de la relance ${relance.id}: ${error.message}`, 'import-invoice', 'generatePendingRelances', { relanceId: relance.id, error: error.message, stack: error.stack?.substring(0, 500) });
        errorCount++;
      }
    }
    
    info(`Traitement terminé: ${processedCount} réussis, ${errorCount} erreurs`, 'import-invoice', 'generatePendingRelances', { 
      processed: processedCount, 
      errors: errorCount 
    });
    return { success: true, processed: processedCount, errors: errorCount };
    
  } catch (error) {
    error(`Erreur fatale: ${error.message}`, 'import-invoice', 'generatePendingRelances', { error: error.message, stack: error.stack?.substring(0, 500) });
    throw error;
  }
};

module.exports = generatePendingRelances;

// Exécution directe si appelé en CLI
if (require.main === module) {
  generatePendingRelances()
    .then(result => {
      info('Génération des relances terminée', 'import-invoice', 'generatePendingRelances', { result });
      debug('Exit code: ' + (result.errors > 0 ? 1 : 0), 'import-invoice', 'generatePendingRelances');
      process.exit(result.errors > 0 ? 1 : 0);
    })
    .catch(error => {
      error(`Erreur: ${error.message}`, 'import-invoice', 'generatePendingRelances', { error: error.message, stack: error.stack?.substring(0, 500) });
      process.exit(1);
    });
}
