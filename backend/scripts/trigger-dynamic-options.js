#!/usr/bin/env node
// Script pour déclencher manuellement la mise à jour des options dynamiques
// À exécuter une fois pour initialiser les données

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const updateDynamicOptions = require('../cloud/jobs/updateDynamicOptions');

async function main() {
  console.log('🚀 Déclenchement manuel de updateDynamicOptions...\n');
  
  try {
    const result = await updateDynamicOptions();
    console.log('✅ Succès ! Options dynamiques mises à jour');
    console.log('Résultat:', result);
    
    console.log('\n📊 Vous pouvez maintenant vérifier dans Parse Dashboard :');
    console.log('1. Allez dans la table "OptionsDynamiques"');
    console.log('2. Vous devriez voir des entrées pour :');
    console.log('   - statut_impaye');
    console.log('   - statut_relance');
    console.log('   - statut_dossier');
    console.log('   - payeur_type');
    console.log('\n⏰ Le cron prendra le relais à HH:03 pour les mises à jour futures.');
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des options dynamiques:', error);
    process.exit(1);
  }
}

main();