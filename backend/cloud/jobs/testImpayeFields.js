// Script de test pour vérifier les champs solde et solde_le

const { Pool } = require('pg');

// Charger les variables d'environnement
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

// Initialiser Parse
let Parse;
if (typeof Parse === 'undefined') {
  Parse = require('parse/node');
  Parse.initialize(
    process.env.PARSE_APP_ID || 'marki15-app-id',
    process.env.PARSE_JAVASCRIPT_KEY || ''
  );
  Parse.serverURL = process.env.PARSE_SERVER_URL || 'http://127.0.0.1:1555/parse';
  Parse.masterKey = process.env.PARSE_MASTER_KEY || 'marki15-master-key';
}

async function testImpayeFields() {
  try {
    console.log('Test des champs solde et solde_le...');

    // Créer un objet Impaye de test
    const Impaye = Parse.Object.extend('Impaye');
    const impaye = new Impaye();
    
    // Définir les champs
    impaye.set('facture_soldee', true);
    impaye.set('solde', true);
    impaye.set('solde_le', new Date());
    impaye.set('externe_id', 999999); // ID de test
    impaye.set('nfacture', 999999);
    
    // Sauvegarder
    await impaye.save(null, { useMasterKey: true });
    
    console.log('✓ Objet Impaye créé avec succès avec les champs:');
    console.log('  - facture_soldee:', impaye.get('facture_soldee'));
    console.log('  - solde:', impaye.get('solde'));
    console.log('  - solde_le:', impaye.get('solde_le'));
    
    // Supprimer l'objet de test
    await impaye.destroy({ useMasterKey: true });
    console.log('✓ Objet de test supprimé');
    
    console.log('✓ Test terminé avec succès - les champs sont fonctionnels');
    
  } catch (err) {
    console.error('Erreur:', err.message);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  testImpayeFields().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = testImpayeFields;