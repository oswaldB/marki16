// Workflow: Attribue une séquence spécifique aux impayés correspondants
// Fonction cloud pour attribuer une séquence selon des règles

const fs = require('fs');
const path = require('path');
const { appliquerReglesAttributionAutomatique } = require("../../workflows/appliquer-regles-attribution/01-appliquerReglesAttributionAutomatique");

// Helper pour écriture dans le fichier de log
function writeLog(message, workflowName = 'assign-sequence') {
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
 * Fonction cloud pour attribuer une séquence spécifique aux impayés qui correspondent à ses règles
 * @param {Object} request - Requête Parse Cloud
 * @param {Object} request.params - Paramètres de la requête
 * @param {string} request.params.sequenceId - ID de la séquence à attribuer
 * @returns {Promise<Object>} Résultat de l'attribution
 */
async function assignSpecificSequence(request) {
  const startedAt = new Date();
  const { sequenceId } = request.params;
  
  if (!sequenceId) {
    throw new Error("sequenceId est requis");
  }
  
  console.log(`[assign-sequence/01] Début attribution séquence ${sequenceId}`);
  
  // 1. Récupérer la séquence
  const Sequence = Parse.Object.extend('Sequence');
  const sequenceQuery = new Parse.Query(Sequence);
  sequenceQuery.equalTo('objectId', sequenceId);
  
  const sequence = await sequenceQuery.first({ useMasterKey: true });
  
  if (!sequence) {
    throw new Error(`Séquence ${sequenceId} non trouvée`);
  }
  
  console.log(`[assign-sequence/01] Séquence trouvée: ${sequence.id}`);
  
  // 2. Récupérer tous les impayés sans séquence attribuée
  const Impaye = Parse.Object.extend("Impaye");
  const query = new Parse.Query(Impaye);
  query.doesNotExist("sequence");
  query.equalTo("facture_soldee", false);
  query.greaterThan("reste_a_payer", 0);
  query.limit(999999);
  
  const impayes = await query.find({ useMasterKey: true });
  console.log(`[assign-sequence/01] ${impayes.length} impayés à évaluer`);
  
  let assignedCount = 0;
  const assignedImpayeIds = [];
  
  // 3. Appliquer les règles de la séquence à chaque impayé
  for (const impaye of impayes) {
    try {
      console.log(`[assign-sequence/01] Évaluation impayé ${impaye.id}`);
      
      // Sauvegarder temporairement les règles originales de la séquence
      const originalGroupesRegles = sequence.get('groupes_regles') || [];
      const originalAttributionAutomatique = sequence.get('attribution_automatique');
      
      // Activer temporairement l'attribution automatique pour cette séquence
      sequence.set('attribution_automatique', true);
      sequence.set('groupes_regles', originalGroupesRegles);
      
      // Appliquer les règles d'attribution
      const result = await appliquerReglesAttributionAutomatique(impaye);
      
      // Restaurer les valeurs originales
      sequence.set('attribution_automatique', originalAttributionAutomatique);
      sequence.set('groupes_regles', originalGroupesRegles);
      
      if (result) {
        assignedCount++;
        assignedImpayeIds.push(impaye.id);
        console.log(`[assign-sequence/01] Séquence attribuée à ${impaye.id}`);
      }
    } catch (error) {
      console.error(`[assign-sequence/01] Erreur impayé ${impaye.id}:`, error.message);
      // Continuer avec les autres impayés
    }
  }
  
  console.log(`[assign-sequence/01] Terminé - ${assignedCount} impayés attribués`);

  // Persistance du log dans le fichier
  const finishedAt = new Date();
  writeLog(`SUCCESS: ${assignedCount}/${impayes.length} impayés attribués à la séquence ${sequenceId} (${finishedAt - startedAt}ms)`);
  
  return {
    assigned: assignedCount,
    totalEvaluated: impayes.length,
    sequenceId: sequence.id,
    assignedImpayeIds: assignedImpayeIds
  };
}

module.exports = assignSpecificSequence;
