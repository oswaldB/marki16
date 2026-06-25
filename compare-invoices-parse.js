#!/usr/bin/env node
// Script standalone pour comparer les factures entre SQLite et Parse
// Usage: node compare-invoices-parse.js

const Database = require("better-sqlite3");
require("dotenv").config({ path: "/home/ubuntu/prod/adti/.env" });

// Chercher parse/node depuis le backend
const Parse = require("/home/ubuntu/prod/adti/backend/node_modules/parse/node.js");

// Chemin de la base de données
const DB_PATH = "/home/arthur/adti/sync.db";

// Requête SQL : toutes les factures avec reste à payer > 0 depuis SQLite
const QUERY_SQLITE = `
  SELECT 
    nfacture,
    datepiece,
    dateecheance,
    resteapayer,
    totalttcnet
  FROM _GCO__GcoPiece
  WHERE resteapayer > 0
    AND valide = 1
    AND nfacture IS NOT NULL
  ORDER BY nfacture ASC
`;

// Initialiser Parse
Parse.initialize(
  process.env.PARSE_APP_ID,
  process.env.PARSE_JAVASCRIPT_KEY,
  process.env.PARSE_MASTER_KEY
);
Parse.serverURL = process.env.PARSE_SERVER_URL;
Parse.Cloud.useMasterKey();

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return dateStr.split(' ')[0].split('T')[0];
}

function daysOverdue(dateEcheance) {
  if (!dateEcheance || dateEcheance === 'N/A') return null;
  const echeance = new Date(dateEcheance);
  const today = new Date();
  if (echeance >= today) return null;
  const diffTime = Math.abs(today - echeance);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

async function getImpayesFromParse() {
  const Impaye = Parse.Object.extend("Impaye");
  const query = new Parse.Query(Impaye);
  query.limit(10000);
  query.select("nfacture", "date_echeance", "total_ttc", "reste_a_payer", "date_piece");
  query.greaterThan("reste_a_payer", 0);
  query.ascending("nfacture");
  
  const results = await query.find({ useMasterKey: true });
  
  const impayes = {};
  results.forEach(obj => {
    const nfacture = obj.get("nfacture");
    if (nfacture) {
      const dateEcheance = obj.get("date_echeance");
      impayes[String(nfacture)] = {
        numero: String(nfacture),
        dateEcheance: dateEcheance ? dateEcheance.toISOString() : null,
        dateFacture: obj.get("date_piece") ? obj.get("date_piece").toISOString() : null,
        montantTTC: parseFloat(obj.get("total_ttc") || 0),
        resteAPayer: parseFloat(obj.get("reste_a_payer") || 0)
      };
    }
  });
  
  return impayes;
}

function getImpayesFromSQLite() {
  const db = new Database(DB_PATH, { readonly: true });
  
  const rows = db.prepare(QUERY_SQLITE).all();
  
  const impayes = {};
  rows.forEach(row => {
    const numero = String(row.nfacture);
    impayes[numero] = {
      numero: numero,
      dateFacture: formatDate(row.datepiece),
      dateEcheance: formatDate(row.dateecheance),
      totalTTC: parseFloat(row.totalttcnet || 0),
      resteAPayer: parseFloat(row.resteapayer || 0)
    };
  });
  
  db.close();
  return impayes;
}

async function main() {
  console.log("═══════════════════════════════════════════════════════════════════════");
  console.log("🔍  COMPARAISON : SQLite (sync.db) vs Parse (Impaye)");
  console.log("═══════════════════════════════════════════════════════════════════════");
  console.log(`🗄️   SQLite: ${DB_PATH}`);
  console.log(`🌐  Parse: ${process.env.PARSE_SERVER_URL}`);
  console.log(`📱  App ID: ${process.env.PARSE_APP_ID}\n`);

  try {
    // Récupérer les données des deux sources
    console.log("⏳ Récupération des données depuis SQLite...");
    const sqliteData = getImpayesFromSQLite();
    console.log(`✅ ${Object.keys(sqliteData).length} factures dans SQLite\n`);
    
    console.log("⏳ Récupération des données depuis Parse...");
    const parseData = await getImpayesFromParse();
    console.log(`✅ ${Object.keys(parseData).length} factures dans Parse\n`);
    
    // Comparer les données
    const sqliteFactures = new Set(Object.keys(sqliteData));
    const parseFactures = new Set(Object.keys(parseData));
    
    // Factures dans SQLite mais pas dans Parse
    const onlyInSQLite = [...sqliteFactures].filter(f => !parseFactures.has(f));
    
    // Factures dans Parse mais pas dans SQLite
    const onlyInParse = [...parseFactures].filter(f => !sqliteFactures.has(f));
    
    // Factures communes
    const commonFactures = [...sqliteFactures].filter(f => parseFactures.has(f));
    
    // Différences de montant sur les factures communes
    const montantDiffs = [];
    commonFactures.forEach(numero => {
      const sqlite = sqliteData[numero];
      const parse = parseData[numero];
      
      const diffReste = Math.abs(sqlite.resteAPayer - parse.resteAPayer);
      const diffTTC = Math.abs(sqlite.totalTTC - parse.montantTTC);
      
      if (diffReste > 0.01 || diffTTC > 0.01) {
        montantDiffs.push({
          numero,
          sqlite: { reste: sqlite.resteAPayer, ttc: sqlite.totalTTC },
          parse: { reste: parse.resteAPayer, ttc: parse.montantTTC },
          diff: { reste: diffReste.toFixed(2), ttc: diffTTC.toFixed(2) }
        });
      }
    });
    
    // Analyser les factures en retard (échéance dépassée)
    const today = new Date();
    
    const sqliteEnRetard = Object.values(sqliteData).filter(f => {
      if (!f.dateEcheance || f.dateEcheance === 'N/A') return false;
      const echeance = new Date(f.dateEcheance);
      return echeance < today;
    });
    
    const parseEnRetard = Object.values(parseData).filter(f => {
      if (!f.dateEcheance) return false;
      const echeance = new Date(f.dateEcheance);
      return echeance < today;
    });
    
    // ============================================================
    // SYNTHÈSE GÉNÉRALE
    // ============================================================
    console.log("┌─────────────────────────────────────────────────────────────────────┐");
    console.log("│ 📊 SYNTHÈSE GÉNÉRALE                                                │");
    console.log("└─────────────────────────────────────────────────────────────────────┘\n");
    
    const totalSQLite = Object.values(sqliteData).reduce((sum, f) => sum + f.resteAPayer, 0);
    const totalParse = Object.values(parseData).reduce((sum, f) => sum + f.resteAPayer, 0);
    const totalSQLiteRetard = sqliteEnRetard.reduce((sum, f) => sum + f.resteAPayer, 0);
    const totalParseRetard = parseEnRetard.reduce((sum, f) => sum + f.resteAPayer, 0);
    
    console.log(`  Source           │  Factures  │  Montant total  │  En retard  │  Montant retard`);
    console.log(`  ─────────────────┼────────────┼─────────────────┼─────────────┼───────────────`);
    console.log(`  SQLite (sync.db) │   ${String(Object.keys(sqliteData).length).padStart(4)}   │  ${totalSQLite.toFixed(2).padStart(12)} € │    ${String(sqliteEnRetard.length).padStart(4)}     │  ${totalSQLiteRetard.toFixed(2).padStart(12)} €`);
    console.log(`  Parse (Impaye)   │   ${String(Object.keys(parseData).length).padStart(4)}   │  ${totalParse.toFixed(2).padStart(12)} € │    ${String(parseEnRetard.length).padStart(4)}     │  ${totalParseRetard.toFixed(2).padStart(12)} €`);
    console.log(`  ─────────────────┼────────────┼─────────────────┼─────────────┼───────────────`);
    console.log(`  Différence       │   ${String(Object.keys(sqliteData).length - Object.keys(parseData).length).padStart(4)}   │  ${(totalSQLite - totalParse).toFixed(2).padStart(12)} € │    ${String(sqliteEnRetard.length - parseEnRetard.length).padStart(4)}     │  ${(totalSQLiteRetard - totalParseRetard).toFixed(2).padStart(12)} €\n`);
    
    // ============================================================
    // TABLEAU 1 : Factures dans SQLite mais pas dans Parse
    // ============================================================
    if (onlyInSQLite.length > 0) {
      console.log("┌─────────────────────────────────────────────────────────────────────┐");
      console.log(`│ ⚠️  TABLEAU 1 : Factures dans SQLite MAIS PAS dans Parse           │`);
      console.log(`│     (${onlyInSQLite.length} factures manquantes dans Parse)                              │`);
      console.log("└─────────────────────────────────────────────────────────────────────┘\n");
      
      const totalMissing = onlyInSQLite.reduce((sum, num) => sum + sqliteData[num].resteAPayer, 0);
      console.log(`🔢 Nombre: ${onlyInSQLite.length} factures`);
      console.log(`💰 Montant total: ${totalMissing.toFixed(2)} €\n`);
      
      console.log("─".repeat(70));
      console.log(`${"N° Facture".padEnd(12)} ${"Date Facture".padEnd(14)} ${"Date Échéance".padEnd(14)} ${"Reste à payer"}`);
      console.log("─".repeat(70));
      
      onlyInSQLite
        .sort((a, b) => sqliteData[b].resteAPayer - sqliteData[a].resteAPayer)
        .forEach(numero => {
          const f = sqliteData[numero];
          console.log(`${f.numero.padEnd(12)} ${f.dateFacture.padEnd(14)} ${f.dateEcheance.padEnd(14)} ${f.resteAPayer.toFixed(2).padStart(12)} €`);
        });
      
      console.log("─".repeat(70));
      console.log(`Total: ${onlyInSQLite.length} factures | ${totalMissing.toFixed(2)} €\n`);
    } else {
      console.log("✅ Toutes les factures SQLite sont présentes dans Parse\n");
    }
    
    // ============================================================
    // TABLEAU 2 : Factures dans Parse mais pas dans SQLite
    // ============================================================
    if (onlyInParse.length > 0) {
      console.log("┌─────────────────────────────────────────────────────────────────────┐");
      console.log(`│ ⚠️  TABLEAU 2 : Factures dans Parse MAIS PAS dans SQLite           │`);
      console.log(`│     (${onlyInParse.length} factures orphelines dans Parse)                              │`);
      console.log("└─────────────────────────────────────────────────────────────────────┘\n");
      
      const totalOrphan = onlyInParse.reduce((sum, num) => sum + parseData[num].resteAPayer, 0);
      console.log(`🔢 Nombre: ${onlyInParse.length} factures`);
      console.log(`💰 Montant total: ${totalOrphan.toFixed(2)} €\n`);
      
      console.log("─".repeat(60));
      console.log(`${"N° Facture".padEnd(12)} ${"Date Échéance".padEnd(14)} ${"Reste à payer"}`);
      console.log("─".repeat(60));
      
      onlyInParse
        .sort((a, b) => parseData[b].resteAPayer - parseData[a].resteAPayer)
        .forEach(numero => {
          const f = parseData[numero];
          const dateEch = f.dateEcheance ? f.dateEcheance.split('T')[0] : 'N/A';
          console.log(`${f.numero.padEnd(12)} ${dateEch.padEnd(14)} ${f.resteAPayer.toFixed(2).padStart(12)} €`);
        });
      
      console.log("─".repeat(60));
      console.log(`Total: ${onlyInParse.length} factures | ${totalOrphan.toFixed(2)} €\n`);
    } else {
      console.log("✅ Toutes les factures Parse sont présentes dans SQLite\n");
    }
    
    // ============================================================
    // TABLEAU 3 : Impayés ACTIFS (en retard) - SQLite
    // ============================================================
    if (sqliteEnRetard.length > 0) {
      console.log("┌─────────────────────────────────────────────────────────────────────┐");
      console.log(`│ ⚠️  TABLEAU 3 : IMPAYÉS ACTIFS (en retard) - SQLITE                │`);
      console.log(`│     Échéance dépassée, reste à payer > 0                           │`);
      console.log(`│     ${sqliteEnRetard.length} factures | ${totalSQLiteRetard.toFixed(2)} €`);
      console.log("└─────────────────────────────────────────────────────────────────────┘\n");
      
      // Trier par jours de retard (desc)
      sqliteEnRetard.sort((a, b) => {
        const daysA = daysOverdue(a.dateEcheance) || 0;
        const daysB = daysOverdue(b.dateEcheance) || 0;
        return daysB - daysA;
      });
      
      console.log("─".repeat(85));
      console.log(`${"N° Facture".padEnd(12)} ${"Date Facture".padEnd(14)} ${"Date Échéance".padEnd(14)} ${"Jours retard".padEnd(14)} ${"Reste à payer"}`);
      console.log("─".repeat(85));
      
      sqliteEnRetard.forEach(f => {
        const jours = daysOverdue(f.dateEcheance);
        console.log(`${f.numero.padEnd(12)} ${f.dateFacture.padEnd(14)} ${f.dateEcheance.padEnd(14)} ${String(jours).padStart(6)} jours  ${f.resteAPayer.toFixed(2).padStart(10)} €`);
      });
      
      console.log("─".repeat(85));
      console.log(`Total: ${sqliteEnRetard.length} factures | ${totalSQLiteRetard.toFixed(2)} €\n`);
    }
    
    // ============================================================
    // TABLEAU 4 : Impayés ACTIFS (en retard) - Parse
    // ============================================================
    if (parseEnRetard.length > 0) {
      console.log("┌─────────────────────────────────────────────────────────────────────┐");
      console.log(`│ ⚠️  TABLEAU 4 : IMPAYÉS ACTIFS (en retard) - PARSE                 │`);
      console.log(`│     Échéance dépassée, reste à payer > 0                           │`);
      console.log(`│     ${parseEnRetard.length} factures | ${totalParseRetard.toFixed(2)} €`);
      console.log("└─────────────────────────────────────────────────────────────────────┘\n");
      
      // Trier par jours de retard (desc)
      parseEnRetard.sort((a, b) => {
        const daysA = daysOverdue(a.dateEcheance) || 0;
        const daysB = daysOverdue(b.dateEcheance) || 0;
        return daysB - daysA;
      });
      
      console.log("─".repeat(85));
      console.log(`${"N° Facture".padEnd(12)} ${"Date Facture".padEnd(14)} ${"Date Échéance".padEnd(14)} ${"Jours retard".padEnd(14)} ${"Reste à payer"}`);
      console.log("─".repeat(85));
      
      parseEnRetard.forEach(f => {
        const jours = daysOverdue(f.dateEcheance);
        const dateFacture = f.dateFacture ? f.dateFacture.split('T')[0] : 'N/A';
        const dateEcheance = f.dateEcheance ? f.dateEcheance.split('T')[0] : 'N/A';
        console.log(`${f.numero.padEnd(12)} ${dateFacture.padEnd(14)} ${dateEcheance.padEnd(14)} ${String(jours).padStart(6)} jours  ${f.resteAPayer.toFixed(2).padStart(10)} €`);
      });
      
      console.log("─".repeat(85));
      console.log(`Total: ${parseEnRetard.length} factures | ${totalParseRetard.toFixed(2)} €\n`);
    }
    
    // ============================================================
    // TABLEAU 5 : Différences de montant
    // ============================================================
    if (montantDiffs.length > 0) {
      console.log("┌─────────────────────────────────────────────────────────────────────┐");
      console.log(`│ ⚠️  TABLEAU 5 : Différences de montant sur factures communes       │`);
      console.log(`│     (${montantDiffs.length} factures avec écarts)                    │`);
      console.log("└─────────────────────────────────────────────────────────────────────┘\n");
      
      console.log("─".repeat(100));
      console.log(`${"N° Facture".padEnd(12)} │ ${"Reste SQLite".padEnd(14)} │ ${"Reste Parse".padEnd(14)} │ ${"Diff".padEnd(10)} │ ${"TTC SQLite".padEnd(12)} │ ${"TTC Parse"}`);
      console.log("─".repeat(100));
      
      montantDiffs.forEach(diff => {
        console.log(
          `${diff.numero.padEnd(12)} │ ` +
          `${String(diff.sqlite.reste.toFixed(2)).padStart(12)} € │ ` +
          `${String(diff.parse.reste.toFixed(2)).padStart(12)} € │ ` +
          `${String(diff.diff.reste).padStart(8)} € │ ` +
          `${String(diff.sqlite.ttc.toFixed(2)).padStart(10)} € │ ` +
          `${String(diff.parse.ttc.toFixed(2)).padStart(10)} €`
        );
      });
      
      console.log("─".repeat(100));
      console.log();
    } else {
      console.log("✅ Aucune différence de montant sur les factures communes\n");
    }
    
    // ============================================================
    // SYNTHÈSE IMPAYÉS ACTIFS
    // ============================================================
    console.log("═══════════════════════════════════════════════════════════════════════");
    console.log("│ 📊 SYNTHÈSE DES IMPAYÉS ACTIFS (Échéance dépassée)                  │");
    console.log("═══════════════════════════════════════════════════════════════════════");
    console.log(`│ Source           │  Factures  │  Montant total  │  % du total    │`);
    console.log(`│ ─────────────────┼────────────┼─────────────────┼────────────────│`);
    const pctSQLite = totalSQLite > 0 ? ((totalSQLiteRetard / totalSQLite) * 100).toFixed(1) : 0;
    const pctParse = totalParse > 0 ? ((totalParseRetard / totalParse) * 100).toFixed(1) : 0;
    console.log(`│ SQLite (sync.db) │   ${String(sqliteEnRetard.length).padStart(4)}   │  ${totalSQLiteRetard.toFixed(2).padStart(12)} € │     ${String(pctSQLite).padStart(5)} %     │`);
    console.log(`│ Parse (Impaye)   │   ${String(parseEnRetard.length).padStart(4)}   │  ${totalParseRetard.toFixed(2).padStart(12)} € │     ${String(pctParse).padStart(5)} %     │`);
    console.log(`│ ─────────────────┼────────────┼─────────────────┼────────────────│`);
    console.log(`│ Différence       │   ${String(sqliteEnRetard.length - parseEnRetard.length).padStart(4)}   │  ${(totalSQLiteRetard - totalParseRetard).toFixed(2).padStart(12)} € │                │`);
    console.log("═══════════════════════════════════════════════════════════════════════\n");
    
    // ============================================================
    // CONCLUSION
    // ============================================================
    console.log("═══════════════════════════════════════════════════════════════════════");
    console.log("│ 📋 CONCLUSION GÉNÉRALE                                             │");
    console.log("═══════════════════════════════════════════════════════════════════════");
    
    if (onlyInSQLite.length === 0 && onlyInParse.length === 0 && montantDiffs.length === 0) {
      console.log("│ ✅ PARFAIT ! Les deux bases sont synchronisées.                     │");
    } else {
      if (onlyInSQLite.length > 0) {
        console.log(`│ ⚠️  ${String(onlyInSQLite.length).padStart(4)} factures à importer de SQLite vers Parse`);
      }
      if (onlyInParse.length > 0) {
        console.log(`│ ⚠️  ${String(onlyInParse.length).padStart(4)} factures à vérifier/supprimer dans Parse`);
      }
      if (montantDiffs.length > 0) {
        console.log(`│ ⚠️  ${String(montantDiffs.length).padStart(4)} factures avec montants différents à mettre à jour`);
      }
    }
    console.log("═══════════════════════════════════════════════════════════════════════");
    
  } catch (err) {
    console.error("\n❌ Erreur:", err.message);
    console.error("Stack:", err.stack);
    process.exit(1);
  }
}

main();
