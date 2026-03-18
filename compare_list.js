#!/usr/bin/env node
// Étude comparative : liste officielle MD vs base Parse (classe Impaye)
// Vérifie la présence et le reste_a_payer
// Note: ref_piece en base = ligne complète "FA260313 50607"

const fs = require('fs');
const https = require('https');

const APP_ID = 'marki15-app';
const MASTER_KEY = 'e2f4e4e89056af61dd95a71226fa0e51917313e09b68aca8bf434e5eb9bd8aa9';

// Parse la liste MD - chaque ligne est la ref_piece complète
function parseMdList() {
  const content = fs.readFileSync('./officallist.md', 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  return lines.map(line => {
    const parts = line.split(/\s+/);
    return {
      ref_piece: line,          // La ligne entière = ref_piece en base
      nfacture: parseInt(parts[1], 10)
    };
  }).filter(e => !isNaN(e.nfacture));
}

// Requête Parse
function parseQuery(where, fields = '') {
  return new Promise((resolve, reject) => {
    const query = JSON.stringify(where);
    const fieldParam = fields ? `&keys=${fields}` : '';
    const path = `/parse/classes/Impaye?where=${encodeURIComponent(query)}&limit=1000${fieldParam}`;

    const options = {
      hostname: 'dev.api.markidiags.com',
      port: 8444,
      path,
      method: 'GET',
      headers: {
        'X-Parse-Application-Id': APP_ID,
        'X-Parse-Master-Key': MASTER_KEY,
        'Content-Type': 'application/json'
      },
      rejectUnauthorized: false
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function fetchByNfactures(nfactures) {
  const where = { nfacture: { $in: nfactures } };
  const result = await parseQuery(where, 'ref_piece,nfacture,reste_a_payer,facture_soldee,statut');
  return result.results || [];
}

async function main() {
  console.log('=== ÉTUDE COMPARATIVE : Liste officielle vs Base Parse ===\n');

  const list = parseMdList();
  console.log(`📋 Liste officielle : ${list.length} entrées\n`);

  // Batch requests
  const batchSize = 100;
  const allDbRecords = [];

  for (let i = 0; i < list.length; i += batchSize) {
    const batch = list.slice(i, i + batchSize);
    const nfactures = batch.map(e => e.nfacture);
    process.stdout.write(`Requête batch ${Math.floor(i/batchSize)+1}/${Math.ceil(list.length/batchSize)}...`);
    try {
      const records = await fetchByNfactures(nfactures);
      allDbRecords.push(...records);
      console.log(` ${records.length} trouvés`);
    } catch (err) {
      console.log(` ERREUR: ${err.message}`);
    }
  }

  // Index par nfacture
  const dbByNfacture = {};
  for (const rec of allDbRecords) {
    dbByNfacture[rec.nfacture] = rec;
  }

  const found = [];
  const notFound = [];
  const refMismatch = [];

  for (const item of list) {
    const dbRec = dbByNfacture[item.nfacture];
    if (!dbRec) {
      notFound.push(item);
    } else {
      const entry = { ...item, db: dbRec };
      found.push(entry);
      // Comparer ref_piece (liste = ligne complète, base = ref_piece field)
      if (dbRec.ref_piece !== item.ref_piece) {
        refMismatch.push(entry);
      }
    }
  }

  // ===== RAPPORT =====
  console.log('\n' + '='.repeat(70));
  console.log(`\n✅ PRÉSENTS EN BASE          : ${found.length}/${list.length}`);
  console.log(`❌ ABSENTS DE LA BASE        : ${notFound.length}/${list.length}`);
  console.log(`⚠️  INCOHÉRENCE ref_piece     : ${refMismatch.length}`);

  // Absents
  if (notFound.length > 0) {
    console.log('\n--- ❌ ABSENTS DE LA BASE ---');
    for (const item of notFound) {
      console.log(`  ${item.ref_piece}`);
    }
  }

  // Incohérences ref_piece
  if (refMismatch.length > 0) {
    console.log('\n--- ⚠️  INCOHÉRENCES ref_piece ---');
    for (const item of refMismatch) {
      console.log(`  nfacture ${item.nfacture}`);
      console.log(`    liste : "${item.ref_piece}"`);
      console.log(`    base  : "${item.db.ref_piece}"`);
    }
  }

  // Tableau détaillé
  console.log('\n--- 📊 DÉTAIL RESTE À PAYER ---');
  const hdr = `${'nfacture'.padEnd(10)} ${'ref_piece'.padEnd(22)} ${'reste_à_payer'.padEnd(14)} ${'soldée'.padEnd(8)} statut`;
  console.log(hdr);
  console.log('-'.repeat(hdr.length));

  for (const item of found) {
    const rap = item.db.reste_a_payer != null ? item.db.reste_a_payer.toFixed(2) + ' €' : 'N/A';
    const soldee = item.db.facture_soldee ? '✓ OUI' : '✗ NON';
    const statut = item.db.statut || '-';
    const refOk = item.db.ref_piece === item.ref_piece ? '' : ' [ref≠]';
    console.log(
      `${String(item.nfacture).padEnd(10)} ${(item.db.ref_piece || '-').padEnd(22)} ${rap.padEnd(14)} ${soldee.padEnd(8)} ${statut}${refOk}`
    );
  }

  // Résumé financier
  const totalRAP = found.reduce((sum, i) => sum + (i.db.reste_a_payer || 0), 0);
  const soldees = found.filter(i => i.db.facture_soldee).length;
  const rapZero = found.filter(i => i.db.reste_a_payer === 0).length;
  const rapPos = found.filter(i => (i.db.reste_a_payer || 0) > 0).length;

  console.log('\n' + '='.repeat(70));
  console.log('\n💰 RÉSUMÉ FINANCIER');
  console.log(`   Total reste_a_payer  : ${totalRAP.toFixed(2)} €`);
  console.log(`   Factures soldées     : ${soldees}/${found.length}`);
  console.log(`   RAP = 0              : ${rapZero}`);
  console.log(`   RAP > 0              : ${rapPos}`);
  console.log(`   Absentes en base     : ${notFound.length}`);

  // Export CSV
  const csvLines = ['nfacture,ref_piece_liste,ref_piece_base,reste_a_payer,facture_soldee,statut,present_en_base'];
  for (const item of list) {
    const db = dbByNfacture[item.nfacture];
    if (db) {
      csvLines.push([
        item.nfacture,
        `"${item.ref_piece}"`,
        `"${db.ref_piece || ''}"`,
        db.reste_a_payer != null ? db.reste_a_payer : '',
        db.facture_soldee ? 'OUI' : 'NON',
        db.statut || '',
        'OUI'
      ].join(','));
    } else {
      csvLines.push([item.nfacture, `"${item.ref_piece}"`, '', '', '', '', 'NON'].join(','));
    }
  }
  fs.writeFileSync('./compare_result.csv', csvLines.join('\n'));
  console.log('\n📁 Résultat exporté → compare_result.csv');
}

main().catch(err => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});
