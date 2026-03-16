// backend/cloud/jobs/assignSequencesAutomatically.js
// Ce job attribue automatiquement des séquences aux impayés sans séquence
// qui correspondent aux règles d'attribution automatique des séquences actives.

const { appliquerReglesAttributionAutomatique } = require('../main.js');

module.exports = async function assignSequencesAutomatically() {
  const Impaye = Parse.Object.extend('Impaye');
  
  // Trouver tous les impayés sans séquence
  const q = new Parse.Query(Impaye);
  q.doesNotExist('sequence');
  q.equalTo('statut', 'impaye'); // Seulement les impayés actifs
  q.limit(1000); // Limiter pour éviter les timeouts
  
  const impayesSansSequence = await q.find({ useMasterKey: true });
  
  const stats = {
    totalProcessed: impayesSansSequence.length,
    sequencesAssigned: 0,
    noEmail: 0,
    errors: []
  };
  
  for (const impaye of impayesSansSequence) {
    try {
      const sequenceAssignee = await appliquerReglesAttributionAutomatique(impaye);
      if (sequenceAssignee) {
        stats.sequencesAssigned++;
      } else {
        stats.noEmail++;
      }
    } catch (err) {
      stats.errors.push({
        impayeId: impaye.id,
        refPiece: impaye.get('ref_piece'),
        error: err.message
      });
    }
  }
  
  return {
    success: true,
    message: 'Attribution automatique des séquences terminée',
    stats
  };
};
