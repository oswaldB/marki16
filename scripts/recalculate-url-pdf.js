#!/usr/bin/env node
// scripts/recalculate-url-pdf.js
// Script standalone pour recalculer url_pdf de TOUS les impayés avec datecre depuis sync.db
// Utilise l'API REST de Parse pour éviter les dépendances npm

const https = require("https");
const http = require("http");
const Database = require("better-sqlite3");
const path = require("path");
const querystring = require("querystring");

// ============================================================================
// CONFIGURATION
// ============================================================================

require("dotenv").config({ path: path.join(__dirname, "../backend/.env") });

// Parse REST API
const PARSE_APP_ID = process.env.PARSE_APP_ID || "adti-marki";
const PARSE_MASTER_KEY =
    process.env.PARSE_MASTER_KEY ||
    "e2f4e4e89056af61dd95a71226fa0e51917313e09b68aca8bf434e5eb9bd8aa9";

// Permet de surcharger l'URL via argument CLI : --server-url=http://localhost:1557/api/parse
let PARSE_SERVER_URL =
    process.env.PARSE_SERVER_URL || "https://dev.markidiags.com/api/parse";
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--server-url" && args[i + 1] && !args[i + 1].startsWith("-")) {
        PARSE_SERVER_URL = args[i + 1];
        i++;
    } else if (arg.startsWith("--server-url=")) {
        PARSE_SERVER_URL = arg.split("=")[1];
    }
}

// SQLite DB
const DB_PATH = process.env.SYNC_DB_PATH || "/home/arthur/adti/sync.db";

// Batch settings
const BATCH_SIZE = 100;

// Mode dry-run (test sans sauvegarde)
const DRY_RUN =
    process.argv.includes("--dry-run") || process.argv.includes("-n");

// ============================================================================
// UTILITAIRES PARSE REST API
// ============================================================================

function getParseUrl(endpoint) {
    const url = new URL(endpoint, PARSE_SERVER_URL);
    return url.href;
}

function getHeaders() {
    return {
        "X-Parse-Application-Id": PARSE_APP_ID,
        "X-Parse-Master-Key": PARSE_MASTER_KEY,
        "Content-Type": "application/json",
    };
}

// Requête générique vers Parse
function parseRequest(method, endpoint, body = null) {
    return new Promise((resolve, reject) => {
        const url = getParseUrl(endpoint);
        const isHttps = url.startsWith("https://");
        const client = isHttps ? https : http;

        const options = {
            method: method,
            headers: getHeaders(),
        };

        let req = client.request(url, options, (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        resolve(data);
                    }
                } else {
                    try {
                        const errorData = JSON.parse(data);
                        reject(
                            new Error(
                                `Parse API error ${res.statusCode}: ${errorData.error || data}`,
                            ),
                        );
                    } catch (e) {
                        reject(
                            new Error(
                                `Parse API error ${res.statusCode}: ${data}`,
                            ),
                        );
                    }
                }
            });
        });

        req.on("error", (err) => reject(err));

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

// Récupérer tous les impayés (avec pagination)
async function fetchAllImpayes(limit = BATCH_SIZE, skip = 0) {
    const query = {
        limit: limit,
        skip: skip,
        where: JSON.stringify({ nfacture: { $exists: true } }),
        order: "nfacture",
    };

    const endpoint = `/classes/Impaye?${querystring.stringify(query)}`;
    const result = await parseRequest("GET", endpoint);
    return result.results || [];
}

// Mettre à jour un impayé
async function updateImpaye(objectId, updates) {
    const endpoint = `/classes/Impaye/${objectId}`;
    return await parseRequest("PUT", endpoint, updates);
}

// Compter les impayés
async function countImpayes() {
    const endpoint = `/classes/Impaye/count?where=${encodeURIComponent(JSON.stringify({ nfacture: { $exists: true } }))}`;
    const result = await parseRequest("GET", endpoint);
    return result.count || 0;
}

// ============================================================================
// UTILITAIRES METIER
// ============================================================================

const MOIS_FR = [
    "janvier",
    "fevrier",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "aout",
    "septembre",
    "octobre",
    "novembre",
    "decembre",
];

function buildUrlPdf(refPiece, dateCre) {
    if (!refPiece || !dateCre) return null;
    let d = new Date(dateCre);
    if (isNaN(d.getTime())) return null;
    let year = d.getFullYear();
    let month = MOIS_FR[d.getMonth()];
    let refClean = String(refPiece).replace(/\s+/g, "_");
    return `/ADN/Reporting/Gco/Piece/${year}/${month}/${refClean}/standard/${refPiece} (GCO PI FA).pdf`;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
    console.log("=== Début du recalcul url_pdf ===");
    console.log(`Mode: ${DRY_RUN ? "DRY-RUN (test sans sauvegarde)" : "REEL"}`);
    console.log(`DB SQLite: ${DB_PATH}`);
    console.log(`Parse Server: ${PARSE_SERVER_URL}`);

    // Vérifier la connexion à la DB SQLite
    let db;
    try {
        db = new Database(DB_PATH);
        db.prepare("SELECT 1").get();
        console.log("✓ Connexion SQLite OK");
    } catch (err) {
        console.error("✗ Échec connexion SQLite:", err.message);
        process.exit(1);
    }

    // Préparer la requête pour récupérer datecre depuis sync.db
    const stmtDateCre = db.prepare(`
        SELECT datecre FROM _GCO__GcoPiece
        WHERE nfacture = ? AND datecre IS NOT NULL
        LIMIT 1
    `);

    // Compter le nombre total d'impayés
    let totalCount;
    try {
        totalCount = await countImpayes();
        console.log(`Total impayés à traiter: ${totalCount}`);
    } catch (err) {
        console.error("✗ Échec connexion Parse API:", err.message);
        db.close();
        process.exit(1);
    }

    // Stats
    let stats = {
        total: 0,
        updated: 0,
        skipped: 0,
        errors: 0,
        notFoundInDb: 0,
    };

    // Traiter par batches
    let skip = 0;
    let hasMore = true;

    while (hasMore) {
        let impayes;
        try {
            impayes = await fetchAllImpayes(BATCH_SIZE, skip);
        } catch (err) {
            stats.errors++;
            console.error(`[ERROR] Batch ${skip}: ${err.message}`);
            hasMore = false;
            continue;
        }

        if (impayes.length === 0) {
            hasMore = false;
            break;
        }

        console.log(
            `\nTraitement batch: ${skip + 1}-${skip + impayes.length} / ${totalCount}`,
        );

        // Traiter chaque impayé
        for (const impaye of impayes) {
            stats.total++;

            const nfacture = impaye.nfacture;
            const refPiece = impaye.ref_piece;
            const oldUrlPdf = impaye.url_pdf;
            const objectId = impaye.objectId;

            if (!nfacture) {
                console.log(`  [SKIP] nfacture manquant pour ${objectId}`);
                stats.skipped++;
                continue;
            }

            // Chercher datecre dans sync.db
            let dateCre = null;
            try {
                const row = stmtDateCre.get(nfacture);
                if (row) {
                    dateCre = row.datecre;
                }
            } catch (err) {
                console.log(
                    `  [WARN] nfacture=${nfacture} non trouvé dans sync.db: ${err.message}`,
                );
                stats.notFoundInDb++;
                continue;
            }

            if (!dateCre) {
                console.log(`  [WARN] datecre NULL pour nfacture=${nfacture}`);
                stats.notFoundInDb++;
                continue;
            }

            // Recalculer url_pdf
            const newUrlPdf = buildUrlPdf(refPiece, dateCre);

            if (newUrlPdf === oldUrlPdf) {
                stats.skipped++;
                continue;
            }

            // Mettre à jour
            if (DRY_RUN) {
                stats.updated++;
                console.log(
                    `  [DRY-RUN] nfacture=${nfacture} → url_pdf serait: ${newUrlPdf}`,
                );
            } else {
                try {
                    await updateImpaye(objectId, { url_pdf: newUrlPdf });
                    stats.updated++;
                    console.log(
                        `  [OK] nfacture=${nfacture} → url_pdf mis à jour`,
                    );
                } catch (err) {
                    stats.errors++;
                    console.error(
                        `  [ERROR] Échec mise à jour ${objectId}: ${err.message}`,
                    );
                }
            }
        }

        skip += BATCH_SIZE;

        // Pause pour éviter de saturer
        if (hasMore) {
            await new Promise((resolve) => setTimeout(resolve, 200));
        }
    }

    // Fermer la DB
    db.close();

    // Afficher les stats
    console.log("\n=== STATISTIQUES ===");
    console.log(`Total traités: ${stats.total}`);
    console.log(`Mis à jour: ${stats.updated}`);
    console.log(`Inchangés: ${stats.skipped}`);
    console.log(`Non trouvés dans sync.db: ${stats.notFoundInDb}`);
    console.log(`Erreurs: ${stats.errors}`);
    console.log("\n=== Terminé ===");
}

// Lancer
main().catch((err) => {
    console.error("FATAL ERROR:", err);
    process.exit(1);
});
