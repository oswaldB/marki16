#!/usr/bin/env node
// Script pour déclencher manuellement l'optimisation des relances
// À exécuter pour tester le job avant de le mettre en production

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Initialiser Parse pour le script standalone
const Parse = require('parse/node');
Parse.initialize(
  process.env.PARSE_APP_ID || 'marki15-app',
  process.env.PARSE_JAVASCRIPT_KEY || '',
  process.env.PARSE_MASTER_KEY || 'e2f4e4e89056af61dd95a71226fa0e51917313e09b68aca8bf434e5eb9bd8aa9'
);
Parse.serverURL = process.env.PARSE_SERVER_URL || 'http://localhost:1555/parse';
Parse.Cloud.useMasterKey();

const optimizeRelances = require('../cloud/jobs/optimizeRelances');

async function main() {
  console.log('🚀 Déclenchement manuel de optimizeRelances...\n');
  
  try {
    const result = await optimizeRelances();
    console.log('✅ Succès ! Optimisation des relances terminée');
    console.log('Résultat:', result);
    
    console.log('\n📊 Statistiques :');
    console.log(`- Contacts traités: ${result.contactsProcessed}`);
    console.log(`- Relances consolidées: ${result.relancesConsolidated}`);
    console.log(`- Relances optimisées: ${result.relancesOptimized}`);
    console.log(`- Erreurs: ${result.errors}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'optimisation des relances:', error);
    process.exit(1);
  }
}

main();
