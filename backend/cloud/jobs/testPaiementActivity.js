// Script de test pour vérifier la création d'activité de paiement

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

async function testPaiementActivity() {
  try {
    console.log('Test de création d\'activité de paiement...');

    // Créer une activité de paiement de test
    const activite = new Parse.Object('Activite');
    activite.set('type', 'paiement');
    activite.set('operation', 'payment_received');
    activite.set('nfacture', 123456);
    activite.set('montant', 100.50);
    activite.set('date_paiement', new Date());
    activite.set('trigger', 'test');
    activite.set('timestamp', new Date());
    activite.set('description', 'Paiement reçu pour la facture 123456');
    
    // Sauvegarder
    await activite.save(null, { useMasterKey: true });
    
    console.log('✓ Activité de paiement créée avec succès:');
    console.log('  - ID:', activite.id);
    console.log('  - Type:', activite.get('type'));
    console.log('  - Operation:', activite.get('operation'));
    console.log('  - Facture:', activite.get('nfacture'));
    console.log('  - Montant:', activite.get('montant'));
    console.log('  - Date paiement:', activite.get('date_paiement'));
    console.log('  - Description:', activite.get('description'));
    
    // Supprimer l'activité de test
    await activite.destroy({ useMasterKey: true });
    console.log('✓ Activité de test supprimée');
    
    console.log('✓ Test terminé avec succès - les activités de paiement sont fonctionnelles');
    
  } catch (err) {
    console.error('Erreur:', err.message);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  testPaiementActivity().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = testPaiementActivity;