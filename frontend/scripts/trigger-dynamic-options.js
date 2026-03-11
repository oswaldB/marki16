#!/usr/bin/env node
// Script pour déclencher manuellement la Cloud Function updateDynamicOptions
// Nécessite d'être exécuté depuis le frontend avec les bonnes variables d'environnement

const fetch = require('node-fetch');

async function main() {
  const PARSE_APP_ID = process.env.PARSE_APP_ID || 'marki15-app-id';
  const PARSE_SERVER_URL = process.env.PARSE_SERVER_URL || 'http://localhost:1555/parse';
  const PARSE_MASTER_KEY = process.env.PARSE_MASTER_KEY || 'marki15-master-key';

  console.log('🚀 Déclenchement de la Cloud Function updateDynamicOptions...\n');
  console.log(`Server: ${PARSE_SERVER_URL}`);

  try {
    const response = await fetch(`${PARSE_SERVER_URL}/functions/updateDynamicOptions`, {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': PARSE_APP_ID,
        'X-Parse-Master-Key': PARSE_MASTER_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Succès ! Réponse:', result);
    
    console.log('\n📊 Vous pouvez maintenant vérifier dans Parse Dashboard :');
    console.log('1. Allez dans la table "OptionsDynamiques"');
    console.log('2. Vous devriez voir des entrées pour :');
    console.log('   - statut_impaye');
    console.log('   - statut_relance');
    console.log('   - statut_dossier');
    console.log('   - payeur_type');
    console.log('\n⏰ Le cron prendra le relais à HH:03 pour les mises à jour futures.');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

main();