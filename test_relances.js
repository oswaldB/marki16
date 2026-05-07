// Script de test pour diagnostiquer le problème de génération des relances
const path = require('path');

// Charger les variables d'environnement
require('dotenv').config({ path: '/home/ubuntu/prod/adti/.env' });

// Initialiser Parse
const Parse = require('parse/node');
Parse.initialize(
  process.env.PARSE_APP_ID,
  process.env.PARSE_JAVASCRIPT_KEY,
  process.env.PARSE_MASTER_KEY
);
Parse.serverURL = process.env.PARSE_SERVER_URL;
Parse.Cloud.useMasterKey();
global.Parse = Parse;

async function diagnostiquerProblemeRelances() {
  console.log('=== Début du diagnostic des relances ===\n');

  // Étape 1: Vérifier la configuration Ollama
  console.log('1. Configuration Ollama:');
  console.log('   USE_OLLAMA:', process.env.USE_OLLAMA !== 'false' ? 'ACTIVÉ' : 'DÉSACTIVÉ');
  console.log('   OLLAMA_API_URL:', process.env.OLLAMA_API_URL);
  console.log('   OLLAMA_MODEL:', process.env.OLLAMA_MODEL);

  // Étape 2: Tester la connexion à Ollama
  try {
    const { createClient } = require('./backend/cloud/relances/services/ollamaClient');
    const client = createClient();
    const connected = await client.checkConnection();
    console.log('   Connexion Ollama:', connected ? '✅ SUCCESS' : '❌ FAILED');
  } catch (err) {
    console.log('   Connexion Ollama: ❌ FAILED -', err.message);
  }

  // Étape 3: Vérifier les impayés avec séquence
  console.log('\n2. Vérification des impayés avec séquence:');
  const fetchImpayesWithSequence = require('./backend/cloud/relances/jobs/import-invoices/03-fetchImpayesWithSequence');
  const result = await fetchImpayesWithSequence();
  
  console.log('   Total impayés non soldés:', result.stats.total);
  console.log('   Avec séquence valide:', result.stats.avecSequenceValide);
  console.log('   Sans relance:', result.stats.sansRelance);
  console.log('   Avec relance:', result.stats.avecRelance);

  if (result.stats.sansRelance === 0) {
    console.log('\n⚠️  PROBLÈME IDENTIFIÉ: Aucun impayé sans relance trouvé');
    console.log('   Cela signifie que:');
    console.log('   - Soit tous les impayés ont déjà des relances');
    console.log('   - Soit les impayés n\'ont pas de séquence attribuée');
    console.log('   - Soit il n\'y a pas d\'impayés non soldés');
  }

  // Étape 4: Vérifier les séquences disponibles
  console.log('\n3. Vérification des séquences disponibles:');
  const Sequence = Parse.Object.extend('Sequence');
  const sequenceQuery = new Parse.Query(Sequence);
  const sequences = await sequenceQuery.find({ useMasterKey: true });
  console.log('   Nombre de séquences:', sequences.length);
  
  if (sequences.length > 0) {
    console.log('   Séquences disponibles:');
    sequences.forEach((seq, index) => {
      console.log(`     ${index + 1}. ${seq.get('nom')} (ID: ${seq.id})`);
    });
  }

  // Étape 5: Vérifier les impayés sans séquence
  console.log('\n4. Vérification des impayés sans séquence:');
  const Impaye = Parse.Object.extend('Impaye');
  const impayeQuery = new Parse.Query(Impaye);
  impayeQuery.equalTo('facture_soldee', false);
  impayeQuery.greaterThan('reste_a_payer', 0);
  impayeQuery.doesNotExist('sequence');
  const impayesSansSequence = await impayeQuery.find({ useMasterKey: true });
  console.log('   Impayés sans séquence:', impayesSansSequence.length);

  // Étape 6: Tester la génération avec un impayé d'exemple (si disponible)
  if (result.stats.sansRelance > 0) {
    console.log('\n5. Test de génération avec un impayé d\'exemple:');
    try {
      const impayeTest = result.sansRelance[0];
      const { RelanceGenerator } = require('./backend/cloud/relances/services/relanceGenerator');
      const generator = new RelanceGenerator();
      
      // Récupérer la séquence
      const sequence = impayeTest.get('sequence');
      const sequenceData = sequence.attributes || {};
      const emails = sequenceData.emails || [];
      
      if (emails.length === 0) {
        console.log('   ❌ La séquence n\'a pas d\'emails configurés');
      } else {
        const emailTemplate = emails[0];
        const scenario = 'single'; // Supposons un seul impayé
        const scenarioMatch = emailTemplate.scenarios.find(s => s.format === scenario);
        
        if (!scenarioMatch) {
          console.log('   ❌ Aucun scénario "single" trouvé dans le template');
        } else {
          console.log('   ✅ Génération de relance avec Ollama...');
          const relancesPassee = []; // Pas de relances précédentes pour ce test
          
          const result = await generator.generateRelance(
            impayeTest,
            relancesPassee,
            {
              object: emailTemplate.objet,
              body: emailTemplate.corps,
              ton: sequence.get('ton'),
              style: sequence.get('style')
            },
            { dryRun: false }
          );
          
          console.log('   ✅ Relance générée avec succès:');
          console.log('     - Objet:', result.object);
          console.log('     - Destinataire:', result.destinataire);
          console.log('     - Longueur du corps:', result.body.length, 'caractères');
        }
      }
    } catch (err) {
      console.log('   ❌ Erreur lors de la génération:', err.message);
      console.log('   Détails:', err.stack);
    }
  }

  console.log('\n=== Fin du diagnostic ===');
}

diagnostiquerProblemeRelances()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Erreur fatale:', err);
    process.exit(1);
  });