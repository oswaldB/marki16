// backend/cloud/workflows/get-recalcitrants/index.js
// Cloud Function pour récupérer les contacts récalcitrants
// Un récalcitrant = contact dont tous les impayés sont non soldés
// ET qui a reçu toute la séquence d'emails pour chaque groupe (contact, séquence, nfacture)
// Les impayés suspendus (blacklistés) et les contacts suspendus sont exclus du calcul.

const Parse = require("parse/node");

/**
 * Extrait l'ID d'un Parse Object ou d'un Pointer JSON, même non résolu
 */
function safeId(obj) {
    if (!obj) return null;
    if (typeof obj.id === "string") return obj.id;
    if (typeof obj.objectId === "string") return obj.objectId;
    return null;
}

/**
 * Récupère les contacts récalcitrants
 */
async function getRecalcitrants() {
    const PAGE_SIZE = 10000;

    // ═══════════════════════════════════════════════════════════
    // ÉTAPE 1 : Récupérer tous les impayés non soldés
    // ═══════════════════════════════════════════════════════════
    const Impaye = Parse.Object.extend("Impaye");
    const impayeQuery = new Parse.Query(Impaye);
    impayeQuery.equalTo("facture_soldee", false);
    impayeQuery.greaterThan("reste_a_payer", 0);
    // Un impayé suspendu (blacklisté) n'est pas récalcitrant : ses relances
    // sont volontairement stoppées, on l'exclut donc entièrement du calcul.
    impayeQuery.notEqualTo("isBlacklisted", true);
    impayeQuery.include("contact_relance");
    impayeQuery.include("payeur");
    impayeQuery.include("sequence");
    impayeQuery.limit(PAGE_SIZE);

    const impayes = await impayeQuery.find({ useMasterKey: true });

    if (impayes.length === 0) {
        return { recalcitrants: [], total: 0 };
    }

    // Map contactId -> { contact, impayes: [] }
    const contactMap = new Map();

    for (const impaye of impayes) {
        const contact = impaye.get("contact_relance") || impaye.get("payeur");
        if (!contact) continue;

        // Un contact suspendu (blacklisté) n'est pas récalcitrant.
        if (contact.get("isBlacklisted") === true) continue;

        if (!contactMap.has(contact.id)) {
            contactMap.set(contact.id, { contact, impayes: [] });
        }
        contactMap.get(contact.id).impayes.push(impaye);
    }

    if (contactMap.size === 0) {
        return { recalcitrants: [], total: 0 };
    }

    // ═══════════════════════════════════════════════════════════
    // ÉTAPE 2 : Exclure les contacts qui ont des impayés SOLDÉS
    // ═══════════════════════════════════════════════════════════
    const contactIds = Array.from(contactMap.keys());
    const Contact = Parse.Object.extend("Contact");

    const soldesChecks = await Promise.all(
        contactIds.map(async (contactId) => {
            const contactPtr = Contact.createWithoutData(contactId);

            const qRel = new Parse.Query(Impaye)
                .equalTo("contact_relance", contactPtr)
                .equalTo("facture_soldee", true);
            const qPay = new Parse.Query(Impaye)
                .equalTo("payeur", contactPtr)
                .equalTo("facture_soldee", true);
            const qOr = Parse.Query.or(qRel, qPay);
            qOr.limit(1);

            const results = await qOr.find({ useMasterKey: true });
            return { contactId, hasSoldes: results.length > 0 };
        })
    );

    for (const { contactId, hasSoldes } of soldesChecks) {
        if (hasSoldes) {
            contactMap.delete(contactId);
        }
    }

    if (contactMap.size === 0) {
        return { recalcitrants: [], total: 0 };
    }

    // ═══════════════════════════════════════════════════════════
    // ÉTAPE 3 : Récupérer toutes les relances des contacts candidats
    // ═══════════════════════════════════════════════════════════
    const Relance = Parse.Object.extend("Relance");
    const relanceQuery = new Parse.Query(Relance);

    const contactPtrs = Array.from(contactMap.values()).map(({ contact }) => contact);
    relanceQuery.containedIn("contact", contactPtrs);
    relanceQuery.include("sequence");
    relanceQuery.include("impayes");
    relanceQuery.limit(10000);

    const allRelances = await relanceQuery.find({ useMasterKey: true });

    // Grouper les relances par contactId
    const relancesByContact = new Map();
    for (const relance of allRelances) {
        const c = relance.get("contact");
        if (!c) continue;
        if (!relancesByContact.has(c.id)) {
            relancesByContact.set(c.id, []);
        }
        relancesByContact.get(c.id).push(relance);
    }

    // ═══════════════════════════════════════════════════════════
    // ÉTAPE 4 : Pour chaque contact, vérifier si toutes les
    // relances de tous ses groupes ont été envoyées
    // ═══════════════════════════════════════════════════════════
    const recalcitrants = [];

    for (const [contactId, data] of contactMap) {
        const { contact, impayes: cImpayes } = data;
        const relances = relancesByContact.get(contactId) || [];

        // Grouper les impayés par (sequenceId, nfacture)
        const groupes = new Map();
        for (const impaye of cImpayes) {
            const seq = impaye.get("sequence");
            const nfacture = impaye.get("nfacture");
            if (!seq || !nfacture) continue;

            const key = `${seq.id}__${nfacture}`;
            if (!groupes.has(key)) {
                groupes.set(key, {
                    sequence: seq,
                    nfacture,
                    impayeIds: new Set(),
                });
            }
            groupes.get(key).impayeIds.add(impaye.id);
        }

        if (groupes.size === 0) continue;

        let isRecalcitrant = true;
        const sequencesInfo = [];

        for (const [key, groupe] of groupes) {
            const { sequence, nfacture, impayeIds } = groupe;
            const emails = sequence.get("emails") || [];
            const totalEmails = emails.length;

            if (totalEmails === 0) {
                isRecalcitrant = false;
                break;
            }

            // Dernier email défini dans la séquence (index max)
            const indexes = emails
                .map((e) => Number(e && e.email_index))
                .filter((n) => Number.isFinite(n));
            const dernierEmailIndex = indexes.length
                ? Math.max(...indexes)
                : null;

            // Relances pour ce groupe (même séquence et partageant au moins un impayé)
            const relancesGroupe = relances.filter((r) => {
                const relSequenceId = safeId(r.get("sequence"));
                if (relSequenceId !== sequence.id) return false;
                const rImpayes = r.get("impayes") || [];
                const rImpayeIds = new Set(
                    rImpayes.map((ri) => safeId(ri))
                );
                return [...impayeIds].some((id) => rImpayeIds.has(id));
            });

            const relancesEnvoyees = relancesGroupe.filter(
                (r) => r.get("statut") === "Envoyée"
            );
            const envoyees = relancesEnvoyees.length;
            const dernierIndexEnvoye = relancesEnvoyees.reduce((max, r) => {
                const idx = Number(r.get("email_index"));
                return Number.isFinite(idx) ? Math.max(max, idx) : max;
            }, 0);

            // La séquence est considérée comme épuisée dès que le DERNIER email
            // de la séquence a été envoyé. On ne compare pas le NOMBRE de relances
            // au nombre d'emails : l'email_index est une progression, et un contact
            // entré en cours de séquence peut ne pas avoir les premiers index
            // (ex. email de rappel avant échéance ajouté après coup).
            const sequenceEpuisee =
                dernierEmailIndex !== null
                    ? dernierIndexEnvoye >= dernierEmailIndex
                    : envoyees >= totalEmails;

            if (!sequenceEpuisee) {
                isRecalcitrant = false;
                break;
            }

            sequencesInfo.push({
                sequenceId: sequence.id,
                sequenceNom: sequence.get("nom") || "—",
                nfacture,
                totalEmails,
                envoyees,
                dernierEmailIndex,
                dernierIndexEnvoye,
            });
        }

        if (isRecalcitrant) {
            // Dernière relance envoyée
            const relancesEnvoyees = relances.filter(
                (r) => r.get("statut") === "Envoyée"
            );
            const derniereRelance = relancesEnvoyees.sort((a, b) => {
                const da = new Date(
                    a.get("envoye_le") || a.get("dateEnvoi") || 0
                );
                const db = new Date(
                    b.get("envoye_le") || b.get("dateEnvoi") || 0
                );
                return db - da;
            })[0];

            const uniqueSequences = new Map();
            for (const impaye of cImpayes) {
                const seq = impaye.get("sequence");
                if (seq) {
                    uniqueSequences.set(seq.id, seq.get("nom") || "—");
                }
            }

            recalcitrants.push({
                contact: {
                    id: contact.id,
                    nom: contact.get("nom") || "",
                    prenom: contact.get("prenom") || "",
                    email: contact.get("email") || "",
                    telephone: contact.get("telephone") || "",
                },
                impayes: cImpayes.map((i) => ({
                    id: i.id,
                    nfacture: i.get("nfacture") || "—",
                    reference: i.get("reference") || "",
                    date_piece: i.get("date_piece"),
                    date_echeance: i.get("date_echeance"),
                    reste_a_payer: i.get("reste_a_payer") || 0,
                    total_ttc: i.get("total_ttc") || 0,
                    adresse_bien: i.get("adresse_bien") || "",
                    numero_dossier: i.get("numero_dossier") || "",
                    sequenceId: i.get("sequence")?.id,
                    sequenceNom: i.get("sequence")?.get("nom") || "—",
                    url_pdf: i.get("url_pdf") || null,
                })),
                totalResteAPayer: cImpayes.reduce(
                    (s, i) => s + (i.get("reste_a_payer") || 0),
                    0
                ),
                nombreImpayes: cImpayes.length,
                sequences: Array.from(uniqueSequences.entries()).map(
                    ([id, nom]) => ({ id, nom })
                ),
                derniereRelanceDate: derniereRelance
                    ? derniereRelance.get("envoye_le") ||
                      derniereRelance.get("dateEnvoi")
                    : null,
                groupes: sequencesInfo,
            });
        }
    }

    return { recalcitrants, total: recalcitrants.length };
}

// ═══════════════════════════════════════════════════════════════
// Enregistrer la Cloud Function
// ═══════════════════════════════════════════════════════════════
try {
    Parse.Cloud.define("getRecalcitrants", async (request) => {
        if (!request.user) {
            throw new Error("Authentification requise");
        }
        return await getRecalcitrants();
    });
    console.log("✅ Cloud Function getRecalcitrants enregistrée");
} catch (err) {
    console.error(
        "Cloud Function getRecalcitrants non enregistrée:",
        err.message
    );
}

module.exports = { getRecalcitrants };
