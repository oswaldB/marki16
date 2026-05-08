// Fonction pour appliquer les règles d'attribution automatique des séquences
// Ce fichier contient la logique métier d'attribution des séquences aux impayés

const fs = require('fs');
const path = require('path');

// Helper pour écriture dans le fichier de log
function writeLog(message, workflowName = 'appliquer-regles-attribution') {
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

async function appliquerReglesAttributionAutomatique(impaye, { logActivity = true } = {}) {
  if (typeof Parse === 'undefined') {
    throw new Error('Parse SDK not initialized');
  }

  const startedAt = new Date();
  console.log(`[appliquerReglesAttributionAutomatique] Traitement impayé ${impaye.id}`);
  
  // 1. Vérifier si l'impayé a déjà une séquence
  if (impaye.get('sequence')) {
    console.log(`[appliquerReglesAttributionAutomatique] Impayé ${impaye.id} a déjà une séquence`);
    
    if (logActivity) {
      writeLog(`INFO: Impayé ${impaye.id} skipped - already has sequence`, 'appliquer-regles-attribution');
    }
    return null;
  }

  // 2. Récupérer les séquences avec attribution automatique activée
  const Sequence = Parse.Object.extend('Sequence');
  const sequenceQuery = new Parse.Query(Sequence);
  sequenceQuery.equalTo('attribution_automatique', true);
  sequenceQuery.equalTo('publiee', true); // Seulement les séquences publiées
  
  const sequences = await sequenceQuery.find({ useMasterKey: true });
  
  if (sequences.length === 0) {
    console.log(`[appliquerReglesAttributionAutomatique] Aucune séquence avec attribution automatique trouvée`);
    return null;
  }

  // 3. Parcourir les séquences et leurs groupes de règles
  for (const sequence of sequences) {
    const groupesRegles = sequence.get('groupes_regles') || [];
    
    console.log(`[appliquerReglesAttributionAutomatique] Test séquence ${sequence.id} (${groupesRegles.length} groupes de règles)`);
    
    // 4. Appliquer les groupes de règles
    let tousGroupesValides = true;
    
    for (const groupe of groupesRegles) {
      const logiqueGroupe = groupe.logique || 'ET'; // "ET" ou "OU"
      const regles = groupe.regles || [];
      
      console.log(`[appliquerReglesAttributionAutomatique] Groupe ${logiqueGroupe} avec ${regles.length} règles`);
      
      // 5. Évaluer chaque règle du groupe
      let groupeValide = false;
      
      if (logiqueGroupe === 'ET') {
        groupeValide = true; // Commence à vrai, une règle fausse invalide le groupe
        
        for (const regle of regles) {
          const champ = regle.champ;
          const operateur = regle.operateur || 'egal';
          const valeur = regle.valeur || [];
          
          // Récupérer la valeur de l'impayé
          const valeurImpaye = impaye.get(champ);
          
          console.log(`[appliquerReglesAttributionAutomatique] Règle: ${champ} ${operateur} ${JSON.stringify(valeur)} (valeur impayé: ${valeurImpaye})`);
          
          // Appliquer l'opérateur
          let regleValide = false;
          
          if (operateur === 'egal') {
            regleValide = valeur.includes(valeurImpaye);
          } else if (operateur === 'different') {
            regleValide = !valeur.includes(valeurImpaye);
          } else if (operateur === 'supérieur') {
            regleValide = valeurImpaye > valeur[0];
          } else if (operateur === 'inférieur') {
            regleValide = valeurImpaye < valeur[0];
          }
          
          if (!regleValide) {
            groupeValide = false;
            console.log(`[appliquerReglesAttributionAutomatique] Règle non validée`);
            break; // Sortir de la boucle si une règle du ET est fausse
          }
        }
      } else if (logiqueGroupe === 'OU') {
        groupeValide = false; // Commence à faux, une règle vraie valide le groupe
        
        for (const regle of regles) {
          const champ = regle.champ;
          const operateur = regle.operateur || 'egal';
          const valeur = regle.valeur || [];
          const valeurImpaye = impaye.get(champ);
          
          let regleValide = false;
          
          if (operateur === 'egal') {
            regleValide = valeur.includes(valeurImpaye);
          } else if (operateur === 'different') {
            regleValide = !valeur.includes(valeurImpaye);
          }
          
          if (regleValide) {
            groupeValide = true;
            break; // Sortir de la boucle si une règle du OU est vraie
          }
        }
      }
      
      // 6. Mettre à jour la validation globale
      if (logiqueGroupe === 'ET' && !groupeValide) {
        tousGroupesValides = false;
        break; // Si un groupe ET est invalide, la séquence ne correspond pas
      } else if (logiqueGroupe === 'OU' && groupeValide) {
        tousGroupesValides = true;
        break; // Si un groupe OU est valide, la séquence correspond
      }
    }
    
    // 7. Si tous les groupes sont valides, attribuer la séquence
    if (tousGroupesValides) {
      console.log(`[appliquerReglesAttributionAutomatique] Tous les groupes validés - attribution séquence ${sequence.id}`);
      
      impaye.set('sequence', sequence);
      await impaye.save(null, { useMasterKey: true });
      
      // Log de réussite
      if (logActivity) {
        const finishedAt = new Date();
        writeLog(`SUCCESS: Impayé ${impaye.id} → Séquence ${sequence.id} attribuée (${finishedAt - startedAt}ms)`, 'appliquer-regles-attribution');
      }
      
      return sequence;
    } else {
      console.log(`[appliquerReglesAttributionAutomatique] Séquence ${sequence.id} non applicable`);
    }
  }

  console.log(`[appliquerReglesAttributionAutomatique] Aucune règle ne correspond pour l'impayé ${impaye.id}`);
  
  // Log d'échec
  if (logActivity) {
    const finishedAt = new Date();
    writeLog(`FAILED: Impayé ${impaye.id} - Aucune règle correspondante (${finishedAt - startedAt}ms)`, 'appliquer-regles-attribution');
  }
  
  return null;
}

// Exporter la fonction
module.exports = {
  appliquerReglesAttributionAutomatique
};
