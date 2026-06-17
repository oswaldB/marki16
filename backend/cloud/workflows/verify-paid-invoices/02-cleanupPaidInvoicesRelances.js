// backend/cloud/workflows/verify-paid-invoices/02-cleanupPaidInvoicesRelances.js
// Nettoie les relances pour les factures nouvellement marquées comme payées

// Charger les variables d'environnement si ce n'est pas déjà fait
if (!process.env.PARSE_APP_ID) {
    require("dotenv").config({ path: "/home/ubuntu/prod/adti/.env" });
}

const { info, warn, error } = require("../../utils/logger");

// Initialiser Parse si ce n'est pas déjà fait
let Parse;
if (typeof Parse === "undefined") {
    Parse = require("parse/node");
    Parse.initialize(
        process.env.PARSE_APP_ID || "marki15-app-id",
        process.env.PARSE_JAVASCRIPT_KEY || "",
    );
    Parse.serverURL = process.env.PARSE_SERVER_URL || "http://127.0.0.1:1555/parse";
    Parse.masterKey = process.env.PARSE_MASTER_KEY || "marki15-master-key";
    Parse.Cloud.useMasterKey();
    global.Parse = Parse;
}

/**
 * Nettoie les relances pour les factures nouvellement payées
 * @param {Object} options - Options de configuration
 * @param {string[]} options.invoiceNumbers - Liste des numéros de factures à nettoyer (optionnel)
 * @param {Date} options.sinceDate - Date à partir de laquelle chercher les factures payées (optionnel)
 * @returns {Promise<Object>} Statistiques { deleted, updated, skipped, errors }
 */
async function cleanupPaidInvoicesRelances({ 
    invoiceNumbers = [], 
    sinceDate = null,
    trigger = "cron" 
} = {}) {
    const startedAt = new Date();
    const stats = {
        deleted: 0,
        updated: 0,
        skipped: 0,
        errors: [],
        processedInvoices: [],
    };

    info(
        `[cleanupPaidInvoicesRelances] Début du nettoyage des relances (trigger: ${trigger})`,
        "verify-paid-invoices",
        "cleanupPaidInvoicesRelances",
    );

    try {
        // Si on a une liste de numéros de factures, on les utilise directement
        if (invoiceNumbers.length > 0) {
            info(
                `[cleanupPaidInvoicesRelances] Nettoyage pour ${invoiceNumbers.length} factures spécifiques`,
                "verify-paid-invoices",
                "cleanupPaidInvoicesRelances",
            );
            return await cleanupRelancesForInvoices(invoiceNumbers, stats);
        }

        // Sinon, on cherche les factures marquées comme payées récemment
        const since = sinceDate || new Date(Date.now() - 24 * 60 * 60 * 1000); // Par défaut, les 24 dernières heures
        
        const Impaye = Parse.Object.extend("Impaye");
        const query = new Parse.Query(Impaye);
        query.equalTo("facture_soldee", true);
        query.equalTo("solde", true);
        query.exists("solde_le");
        query.greaterThanOrEqualTo("solde_le", since);
        query.limit(10000);

        const paidInvoices = await query.find({ useMasterKey: true });
        
        info(
            `[cleanupPaidInvoicesRelances] Trouvé ${paidInvoices.length} factures payées depuis ${since.toISOString()}`,
            "verify-paid-invoices",
            "cleanupPaidInvoicesRelances",
        );

        const invoiceIds = paidInvoices.map(i => i.get("externe_id") || i.id).filter(id => id);
        
        if (invoiceIds.length === 0) {
            info(
                `[cleanupPaidInvoicesRelances] Aucune facture payée à nettoyer`,
                "verify-paid-invoices",
                "cleanupPaidInvoicesRelances",
            );
            return stats;
        }

        return await cleanupRelancesForInvoices(invoiceIds, stats);
    } catch (err) {
        error(
            `[cleanupPaidInvoicesRelances] Erreur: ${err.message}`,
            "verify-paid-invoices",
            "cleanupPaidInvoicesRelances",
        );
        stats.errors.push({
            error: err.message,
            stack: err.stack?.substring(0, 500),
        });
        return stats;
    }
}

/**
 * Nettoie les relances pour une liste de numéros de factures
 * @param {string[]} invoiceNumbers - Liste des numéros de factures
 * @param {Object} stats - Objet de statistiques à mettre à jour
 * @returns {Promise<Object>} Statistiques mises à jour
 */
async function cleanupRelancesForInvoices(invoiceNumbers, stats) {
    const Relance = Parse.Object.extend("Relance");
    
    // Chercher toutes les relances actives pour ces factures
    const query = new Parse.Query(Relance);
    query.containedIn("impayes", invoiceNumbers);
    query.containedIn("statut", [
        "En attente de génération",
        "pret pour envoi",
        "En attente",
        "À envoyer"
    ]);
    query.limit(10000);
    query.include(["impayes", "contact"]);

    const relances = await query.find({ useMasterKey: true });
    
    info(
        `[cleanupPaidInvoicesRelances] Trouvé ${relances.length} relances à nettoyer pour ${invoiceNumbers.length} factures`,
        "verify-paid-invoices",
        "cleanupPaidInvoicesRelances",
    );

    for (const relance of relances) {
        try {
            const relanceInvoiceNumbers = relance.get("impayes") || [];
            const hasPaidInvoice = invoiceNumbers.some(inv => 
                relanceInvoiceNumbers.includes(inv)
            );

            if (!hasPaidInvoice) {
                stats.skipped++;
                continue;
            }

            // Vérifier si TOUTES les factures de cette relance sont payées
            const allInvoicesPaid = relanceInvoiceNumbers.every(invNum => 
                invoiceNumbers.includes(invNum)
            );

            if (allInvoicesPaid) {
                // Si toutes les factures sont payées, on peut supprimer la relance
                await relance.destroy({ useMasterKey: true });
                stats.deleted++;
                info(
                    `[cleanupPaidInvoicesRelances] Relance ${relance.id} supprimée (toutes les factures payées)`,
                    "verify-paid-invoices",
                    "cleanupPaidInvoicesRelances",
                );
                
                // Créer une activité pour le nettoyage
                try {
                    const activite = new Parse.Object("Activite");
                    activite.set("type", "nettoyage");
                    activite.set("operation", "relance_deleted");
                    activite.set("relance_id", relance.id);
                    activite.set("nfactures", relanceInvoiceNumbers.join(", "));
                    activite.set("trigger", stats.trigger || "cron");
                    activite.set("timestamp", new Date());
                    activite.set("description", `Relance supprimée car toutes les factures sont payées: ${relanceInvoiceNumbers.join(", ")}`);
                    await activite.save(null, { useMasterKey: true });
                } catch (logErr) {
                    warn(
                        `[cleanupPaidInvoicesRelances] Erreur création activité pour relance ${relance.id}: ${logErr.message}`,
                        "verify-paid-invoices",
                        "cleanupPaidInvoicesRelances",
                    );
                }
            } else {
                // Si seulement certaines factures sont payées, on met à jour la relance
                // en retirant les factures payées de la liste
                const updatedImpayes = relanceInvoiceNumbers.filter(invNum => 
                    !invoiceNumbers.includes(invNum)
                );

                if (updatedImpayes.length === 0) {
                    // Plus de factures, on supprime
                    await relance.destroy({ useMasterKey: true });
                    stats.deleted++;
                    info(
                        `[cleanupPaidInvoicesRelances] Relance ${relance.id} supprimée (plus de factures impayées)`,
                        "verify-paid-invoices",
                        "cleanupPaidInvoicesRelances",
                    );
                } else {
                    // On met à jour la relance avec la nouvelle liste de factures
                    relance.set("impayes", updatedImpayes);
                    relance.set("statut", "À mettre à jour");
                    await relance.save(null, { useMasterKey: true });
                    stats.updated++;
                    info(
                        `[cleanupPaidInvoicesRelances] Relance ${relance.id} mise à jour (factures restantes: ${updatedImpayes.length})`,
                        "verify-paid-invoices",
                        "cleanupPaidInvoicesRelances",
                    );

                    // Créer une activité pour la mise à jour
                    try {
                        const activite = new Parse.Object("Activite");
                        activite.set("type", "nettoyage");
                        activite.set("operation", "relance_updated");
                        activite.set("relance_id", relance.id);
                        activite.set("nfactures_retirées", invoiceNumbers.filter(inv => relanceInvoiceNumbers.includes(inv)).join(", "));
                        activite.set("nfactures_restantes", updatedImpayes.join(", "));
                        activite.set("trigger", stats.trigger || "cron");
                        activite.set("timestamp", new Date());
                        activite.set("description", `Relance mise à jour: factures payées retirées`);
                        await activite.save(null, { useMasterKey: true });
                    } catch (logErr) {
                        warn(
                            `[cleanupPaidInvoicesRelances] Erreur création activité pour relance ${relance.id}: ${logErr.message}`,
                            "verify-paid-invoices",
                            "cleanupPaidInvoicesRelances",
                        );
                    }
                }
            }

            stats.processedInvoices.push(...relanceInvoiceNumbers);
        } catch (err) {
            error(
                `[cleanupPaidInvoicesRelances] Erreur pour relance ${relance.id}: ${err.message}`,
                "verify-paid-invoices",
                "cleanupPaidInvoicesRelances",
            );
            stats.errors.push({
                relanceId: relance.id,
                error: err.message,
            });
        }
    }

    return stats;
}

module.exports = cleanupPaidInvoicesRelances;
