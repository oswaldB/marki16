// backend/cloud/workflows/import-invoice/01-syncImpayes-bis2.js
// Version simplifiée : Récupère UNIQUEMENT les pièces avec nfacture > 44332 et valide = 1
// Pour test et diagnostic

// Charger les variables d'environnement depuis .env
require('dotenv').config({ path: '/home/ubuntu/prod/adti/.env' });

const Database = require('better-sqlite3');
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

// Requête : Pièces > 44332
const QUERY_PIECES = `
  SELECT
    p.idpiece,
    p.nfacture,
    p.datepiece,
    p.valide,
    p.dateecheance,
    p.totalhtnet,
    p.totalttcnet,
    p.resteapayer,
    p.facturesoldee,
    p.commentaire as commentaire_piece,
    p.refpiece,
    pm.idmetier as dossier_id
  FROM _GCO__GcoPiece p
  LEFT JOIN _GCO__GcoPieceMetier pm ON p.idpiece = pm.idpiece
  WHERE p.nfacture IS NOT NULL
    AND p.nfacture > 44332
    AND p.valide = 1
`;

async function syncImpayesBis2({ trigger = 'manual' } = {}) {
  const startedAt = new Date();
  info(`[TEST] Début syncImpayesBis2 (trigger: ${trigger})`);

  // Chemin DB
  const dbPath = process.env.NODE_ENV === 'test' && process.env.TEST_DB_PATH
    ? process.env.TEST_DB_PATH
    : '/home/arthur/adti/sync.db';

  debug(`[TEST] Chemin DB: ${dbPath}`);

  // Ouverture DB
  const db = new Database(dbPath);
  info(`[TEST] Connexion DB SQLite réussie`);

  try {
    // Exécution requête
    info(`[TEST] Exécution requête pièces...`);
    const piecesRows = db.prepare(QUERY_PIECES).all();
    info(`[TEST] Pièces récupérées: ${piecesRows.length}`);

    // --- DIAGNOSTIC sur nfactures UNIQUES ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Extraire les nfactures uniques
    const uniqueNfactures = [...new Set(piecesRows.map(p => p.nfacture))];
    const uniquePiecesMap = {};
    piecesRows.forEach(p => {
      if (!uniquePiecesMap[p.nfacture]) {
        uniquePiecesMap[p.nfacture] = p;
      }
    });
    const uniquePieces = Object.values(uniquePiecesMap);

    const totalUnique = uniqueNfactures.length;

    const uniqueWithEcheanceTodayOrBefore = uniquePieces.filter(p => 
      p.dateecheance && new Date(p.dateecheance) <= today
    ).length;

    const uniqueWithResteAPayerStrictlyPositive = uniquePieces.filter(p => 
      p.resteapayer > 0
    ).length;

    const uniqueWithBothCriteria = uniquePieces.filter(p => 
      p.dateecheance && new Date(p.dateecheance) <= today && p.resteapayer > 0
    ).length;

    const uniqueWithDossier = uniquePieces.filter(p => p.dossier_id != null).length;
    const uniqueWithoutDossier = uniquePieces.filter(p => p.dossier_id == null).length;

    info(`[TEST] DIAGNOSTIC (nfactures UNIQUES) :`);
    info(`[TEST]   - Total nfactures uniques: ${totalUnique}`);
    info(`[TEST]   - nfactures avec dateecheance <= aujourd'hui: ${uniqueWithEcheanceTodayOrBefore}`);
    info(`[TEST]   - nfactures avec resteapayer > 0: ${uniqueWithResteAPayerStrictlyPositive}`);
    info(`[TEST]   - nfactures avec dateecheance <= aujourd'hui ET resteapayer > 0: ${uniqueWithBothCriteria}`);
    info(`[TEST]   - nfactures avec dossier: ${uniqueWithDossier}`);
    info(`[TEST]   - nfactures SANS dossier: ${uniqueWithoutDossier}`);
    
    // Afficher le nombre de doublons
    const duplicateCount = piecesRows.length - totalUnique;
    if (duplicateCount > 0) {
      warn(`[TEST] ATTENTION: ${duplicateCount} doublons de nfacture détectés !`, 'import-invoice', 'syncImpayesBis2');
    }

    // Afficher quelques exemples
    if (piecesRows.length > 0) {
      debug(`[TEST] Exemple pièce 1: nfacture=${piecesRows[0].nfacture}, dateecheance=${piecesRows[0].dateecheance}, resteapayer=${piecesRows[0].resteapayer}, dossier_id=${piecesRows[0].dossier_id}`);
      if (piecesRows.length > 1) {
        debug(`[TEST] Exemple pièce 2: nfacture=${piecesRows[1].nfacture}, dateecheance=${piecesRows[1].dateecheance}, resteapayer=${piecesRows[1].resteapayer}, dossier_id=${piecesRows[1].dossier_id}`);
      }
    }

    info(`[TEST] Fin syncImpayesBis2 - ${piecesRows.length} lignes, ${totalUnique} nfactures UNIQUES`);
    return { count: totalUnique, uniqueCount: totalUnique, totalRows: piecesRows.length, pieces: uniquePieces };

  } catch (err) {
    error(`[TEST] Erreur: ${err.message}`, 'import-invoice', 'syncImpayesBis2', { error: err.message, stack: err.stack?.substring(0, 500) });
    throw err;
  } finally {
    db.close();
  }
}

module.exports = syncImpayesBis2;

// Exécution directe si appelé en CLI
if (require.main === module) {
  syncImpayesBis2({ trigger: 'manual' })
    .then((result) => {
      info(`[TEST CLI] Résultat: ${result.totalRows} lignes, ${result.uniqueCount} nfactures UNIQUES`, 'import-invoice', 'syncImpayesBis2');
      process.exit(0);
    })
    .catch((error) => {
      error(`[TEST CLI] Erreur: ${error.message}`, 'import-invoice', 'syncImpayesBis2');
      process.exit(1);
    });
}
