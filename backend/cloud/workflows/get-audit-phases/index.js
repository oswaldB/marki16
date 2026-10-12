// backend/cloud/workflows/get-audit-phases/index.js
// Cloud Function d'audit du recouvrement — PÉRIMÈTRE « RELANCES ».
//
// Objectif : situer tous les impayés actifs (non soldés, reste > 0) dans
// l'entonnoir des RELANCES :
//
//   Impayés en attente → Avec email → En séquence de relances
//     → En attente de relance → Relance 1 → Relance 2 → … → Récalcitrant
//
// Seules les séquences de type "relances" sont dans le périmètre : les
// impayés affectés à une séquence de type "suivi" relèvent d'un autre
// processus (classe Suivi) et sont comptés à part, hors entonnoir.
//
// La phase d'un impayé est déterminée par le plus haut `email_index` d'une
// relance au statut "Envoyée" qui lui est rattachée :
//   - 0                          → en_attente
//   - k (1 ≤ k < dernier index)   → relance_k
//   - ≥ dernier index séquence    → recalcitrant (séquence épuisée, impayé)

const Parse = require("parse/node");

const TYPE_SEQUENCE_RELANCE = "relances";

/**
 * Extrait l'ID d'un Parse Object ou d'un Pointer JSON, même non résolu.
 */
function safeId(obj) {
    if (!obj) return null;
    if (typeof obj.id === "string") return obj.id;
    if (typeof obj.objectId === "string") return obj.objectId;
    return null;
}

/**
 * Pagination générique : récupère l'intégralité d'une requête Parse.
 */
async function findAll(query, pageSize = 1000) {
    const out = [];
    let skip = 0;
    for (;;) {
        query.limit(pageSize);
        query.skip(skip);
        const page = await query.find({ useMasterKey: true });
        out.push(...page);
        if (page.length < pageSize) break;
        skip += pageSize;
    }
    return out;
}

/**
 * Dernier `email_index` défini dans une séquence.
 */
function maxSequenceIndex(sequence) {
    const emails = sequence.get("emails") || [];
    const indexes = emails
        .map((e) => Number(e && e.email_index))
        .filter((n) => Number.isFinite(n));
    if (indexes.length) return Math.max(...indexes);
    return emails.length || 0;
}

function emailValide(email) {
    if (typeof email !== "string") return false;
    const trimmed = email.trim();
    const atIndex = trimmed.indexOf("@");
    return atIndex > 0 && atIndex < trimmed.length - 1;
}

/**
 * Contact réellement relancé pour un impayé.
 * Même règle que generate-relances : contact_relance s'il est joignable,
 * sinon le payeur s'il l'est, sinon contact_relance / payeur.
 */
function contactRelanceDe(impaye) {
    const contactRelance = impaye.get("contact_relance");
    const payeur = impaye.get("payeur");
    if (contactRelance && emailValide(contactRelance.get("email"))) {
        return contactRelance;
    }
    if (payeur && emailValide(payeur.get("email"))) {
        return payeur;
    }
    return contactRelance || payeur || null;
}

/**
 * L'impayé est-il joignable par email (contact de relance résolu) ?
 */
function estJoignable(impaye) {
    const contact = contactRelanceDe(impaye);
    return !!(contact && emailValide(contact.get("email")));
}

function makeBucket(key, label, index) {
    return { key, label, index, count: 0, montant: 0 };
}

async function getAuditPhases() {
    // ═══════════════════════════════════════════════════════════
    // ÉTAPE 1 : Relances → progression max par impayé
    // ═══════════════════════════════════════════════════════════
    const Relance = Parse.Object.extend("Relance");
    const relances = await findAll(
        new Parse.Query(Relance).select(
            "statut",
            "email_index",
            "impayes",
            "manuelle",
        ),
    );

    // impayéId -> plus haut email_index envoyé
    const sentMaxByImpaye = new Map();
    // impayés ayant au moins une relance non envoyée (en attente d'envoi)
    const pendingImpayes = new Set();
    let relancesEnvoyees = 0;

    for (const relance of relances) {
        const statut = relance.get("statut");
        const index = Number(relance.get("email_index")) || 0;
        const impayeIds = (relance.get("impayes") || [])
            .map(safeId)
            .filter(Boolean);

        if (statut === "Envoyée") {
            relancesEnvoyees++;
            for (const id of impayeIds) {
                sentMaxByImpaye.set(
                    id,
                    Math.max(sentMaxByImpaye.get(id) || 0, index),
                );
            }
        } else {
            for (const id of impayeIds) pendingImpayes.add(id);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // ÉTAPE 2 : Impayés actifs (non soldés) + séquence + contact
    // ═══════════════════════════════════════════════════════════
    const Impaye = Parse.Object.extend("Impaye");
    const actifs = await findAll(
        new Parse.Query(Impaye)
            .equalTo("facture_soldee", false)
            .greaterThan("reste_a_payer", 0)
            .select(
                "reste_a_payer",
                "sequence",
                "nfacture",
                "contact_relance",
                "payeur",
            )
            .include("sequence")
            .include("contact_relance")
            .include("payeur"),
    );

    const totalImpayes = await new Parse.Query(Impaye).count({
        useMasterKey: true,
    });
    const totalSoldes = await new Parse.Query(Impaye)
        .equalTo("facture_soldee", true)
        .count({ useMasterKey: true });

    // ═══════════════════════════════════════════════════════════
    // ÉTAPE 3 : Phase de chaque impayé du périmètre relances
    // ═══════════════════════════════════════════════════════════
    // Le dernier index atteignable ne dépend que des séquences du périmètre.
    let globalMaxIndex = 0;
    for (const impaye of actifs) {
        const sequence = impaye.get("sequence");
        if (sequence && sequence.get("type") === TYPE_SEQUENCE_RELANCE) {
            globalMaxIndex = Math.max(
                globalMaxIndex,
                maxSequenceIndex(sequence),
            );
        }
    }

    const buckets = new Map();
    const getBucket = (key, label, index) => {
        if (!buckets.has(key)) buckets.set(key, makeBucket(key, label, index));
        return buckets.get(key);
    };

    const bySequence = new Map();

    // ── Étapes d'entrée de l'entonnoir ──
    let montantActif = 0;
    let nbAvecEmail = 0;
    let montantAvecEmail = 0;
    let nbDansSequenceRelance = 0;
    let montantDansSequenceRelance = 0;
    let nbSequenceRelanceSansEmail = 0;
    let nbHorsPerimetreSuivi = 0;
    let montantHorsPerimetreSuivi = 0;

    // niveau de progression dans la séquence (0 = en attente, k = relance k,
    // maxIndex = séquence épuisée) — sert aux cumuls de l'entonnoir
    const niveaux = new Map(); // impayéId -> { niveau, montant }

    for (const impaye of actifs) {
        const sequence = impaye.get("sequence");
        const montant = impaye.get("reste_a_payer") || 0;
        const sent = sentMaxByImpaye.get(impaye.id) || 0;

        montantActif += montant;
        if (estJoignable(impaye)) {
            nbAvecEmail++;
            montantAvecEmail += montant;
        }

        // ── Hors périmètre : séquence de suivi ──
        if (sequence && sequence.get("type") !== TYPE_SEQUENCE_RELANCE) {
            nbHorsPerimetreSuivi++;
            montantHorsPerimetreSuivi += montant;
            continue;
        }

        // ── Hors périmètre : pas de séquence ──
        if (!sequence) {
            const bucket = getBucket("sans_sequence", "Sans séquence", -1);
            bucket.count++;
            bucket.montant += montant;
            continue;
        }

        // ── Périmètre relances ──
        nbDansSequenceRelance++;
        montantDansSequenceRelance += montant;
        if (!estJoignable(impaye)) nbSequenceRelanceSansEmail++;

        const maxIndex = maxSequenceIndex(sequence);
        let key;
        let label;
        let index;
        let niveau;

        if (sent === 0) {
            key = "en_attente";
            label = "En attente de relance";
            index = 0;
            niveau = 0;
        } else if (maxIndex > 0 && sent >= maxIndex) {
            key = "recalcitrant";
            label = "Récalcitrant";
            index = maxIndex;
            niveau = maxIndex;
        } else {
            key = `relance_${sent}`;
            label = `Relance ${sent}`;
            index = sent;
            niveau = sent;
        }
        niveaux.set(impaye.id, { niveau, montant });

        const bucket = getBucket(key, label, index);
        bucket.count++;
        bucket.montant += montant;

        const seqId = sequence.id;
        if (!bySequence.has(seqId)) {
            bySequence.set(seqId, {
                id: seqId,
                nom: sequence.get("nom") || "—",
                maxIndex,
                actifs: 0,
                montant: 0,
                recalcitrant: 0,
                enAttente: 0,
                phases: new Map(),
            });
        }
        const seqStats = bySequence.get(seqId);
        seqStats.actifs++;
        seqStats.montant += montant;
        if (key === "recalcitrant") seqStats.recalcitrant++;
        if (key === "en_attente") seqStats.enAttente++;
        if (!seqStats.phases.has(key)) {
            seqStats.phases.set(key, makeBucket(key, label, index));
        }
        const seqBucket = seqStats.phases.get(key);
        seqBucket.count++;
        seqBucket.montant += montant;
    }

    // ═══════════════════════════════════════════════════════════
    // ÉTAPE 4 : Cumuls « ont atteint au moins le niveau k »
    // ═══════════════════════════════════════════════════════════
    const atLeast = new Map(); // k -> { count, montant }
    for (let k = globalMaxIndex; k >= 1; k--) {
        const prev = atLeast.get(k + 1) || { count: 0, montant: 0 };
        let count = prev.count;
        let montant = prev.montant;
        for (const { niveau, montant: m } of niveaux.values()) {
            if (niveau === k) {
                count++;
                montant += m;
            }
        }
        atLeast.set(k, { count, montant });
    }

    // ═══════════════════════════════════════════════════════════
    // ÉTAPE 5 : Ordre des phases (exclusives)
    //   en_attente → relance_1 … relance_{max-1} → recalcitrant
    // ═══════════════════════════════════════════════════════════
    const phases = [];
    phases.push(
        buckets.get("en_attente") ||
            makeBucket("en_attente", "En attente de relance", 0),
    );
    for (let k = 1; k < globalMaxIndex; k++) {
        phases.push(
            buckets.get(`relance_${k}`) ||
                makeBucket(`relance_${k}`, `Relance ${k}`, k),
        );
    }
    phases.push(
        buckets.get("recalcitrant") ||
            makeBucket("recalcitrant", "Récalcitrant", globalMaxIndex),
    );

    const perimetre = phases.reduce((s, p) => s + p.count, 0);
    const sansSequence =
        buckets.get("sans_sequence") ||
        makeBucket("sans_sequence", "Sans séquence", -1);

    for (const phase of phases) {
        if (phase.key === "recalcitrant" || phase.key === "en_attente") {
            phase.cumulatif = phase.count;
        } else {
            const al = atLeast.get(phase.index);
            phase.cumulatif = al ? al.count : 0;
        }
        phase.pct = perimetre > 0 ? (phase.count / perimetre) * 100 : 0;
        phase.pctCumulatif =
            perimetre > 0 ? (phase.cumulatif / perimetre) * 100 : 0;
    }

    // ═══════════════════════════════════════════════════════════
    // ÉTAPE 6 : Entonnoir complet (étapes d'entrée + phases)
    // ═══════════════════════════════════════════════════════════
    const funnel = [];
    const pushStage = (
        key,
        label,
        sousTitre,
        count,
        montant,
        exclusif = null,
        exclusifMontant = null,
    ) => {
        funnel.push({
            key,
            label,
            sousTitre: sousTitre || null,
            count,
            montant,
            exclusif,
            exclusifMontant,
            pct: actifs.length > 0 ? (count / actifs.length) * 100 : 0,
        });
    };

    pushStage(
        "actifs",
        "Impayés en attente",
        `${totalSoldes} impayés déjà soldés exclus`,
        actifs.length,
        montantActif,
    );
    pushStage(
        "avec_email",
        "Avec email",
        "contact de relance joignable",
        nbAvecEmail,
        montantAvecEmail,
    );
    pushStage(
        "dans_sequence",
        "Dans une séquence de relances",
        `périmètre de l'audit · ${nbHorsPerimetreSuivi} en séquence de suivi et ${sansSequence.count} sans séquence exclus`,
        nbDansSequenceRelance,
        montantDansSequenceRelance,
    );

    for (const phase of phases) {
        if (phase.key === "en_attente") {
            pushStage(
                phase.key,
                phase.label,
                "aucune relance envoyée",
                phase.count,
                phase.montant,
            );
        } else if (phase.key === "recalcitrant") {
            pushStage(
                phase.key,
                phase.label,
                "séquence épuisée, toujours impayé",
                phase.count,
                phase.montant,
                phase.count,
                phase.montant,
            );
        } else {
            const al = atLeast.get(phase.index) || { count: 0, montant: 0 };
            pushStage(
                phase.key,
                phase.label,
                `au moins ${phase.index} relance(s) envoyée(s)`,
                al.count,
                al.montant,
                phase.count,
                phase.montant,
            );
        }
    }

    // ═══════════════════════════════════════════════════════════
    // ÉTAPE 7 : Détail par séquence (périmètre relances)
    // ═══════════════════════════════════════════════════════════
    const sequences = Array.from(bySequence.values())
        .sort((a, b) => b.actifs - a.actifs)
        .map((s) => {
            const seqPhases = [];
            seqPhases.push(
                s.phases.get("en_attente") ||
                    makeBucket("en_attente", "En attente de relance", 0),
            );
            for (let k = 1; k < s.maxIndex; k++) {
                seqPhases.push(
                    s.phases.get(`relance_${k}`) ||
                        makeBucket(`relance_${k}`, `Relance ${k}`, k),
                );
            }
            seqPhases.push(
                s.phases.get("recalcitrant") ||
                    makeBucket("recalcitrant", "Récalcitrant", s.maxIndex),
            );
            return {
                id: s.id,
                nom: s.nom,
                maxIndex: s.maxIndex,
                actifs: s.actifs,
                montant: s.montant,
                recalcitrant: s.recalcitrant,
                enAttente: s.enAttente,
                phases: seqPhases.map((p) => ({
                    key: p.key,
                    label: p.label,
                    count: p.count,
                    montant: p.montant,
                    pct: s.actifs > 0 ? (p.count / s.actifs) * 100 : 0,
                })),
            };
        });

    return {
        genereLe: new Date().toISOString(),
        maxIndex: globalMaxIndex,
        totaux: {
            impayesTotal: totalImpayes,
            actifs: actifs.length,
            avecEmail: nbAvecEmail,
            // périmètre de l'audit : séquences de type "relances"
            dansSequenceRelance: nbDansSequenceRelance,
            perimetre,
            sequenceSansEmail: nbSequenceRelanceSansEmail,
            // hors périmètre
            dansSequenceSuivi: nbHorsPerimetreSuivi,
            sansSequence: sansSequence.count,
            soldes: totalSoldes,
            montantActif,
            montantAvecEmail,
            montantDansSequenceRelance,
            montantDansSequenceSuivi: montantHorsPerimetreSuivi,
            montantSansSequence: sansSequence.montant,
        },
        relances: {
            total: relances.length,
            envoyees: relancesEnvoyees,
            enAttente: relances.length - relancesEnvoyees,
            impayesEnAttenteEnvoi: pendingImpayes.size,
        },
        funnel,
        phases: phases.map((p) => ({
            key: p.key,
            label: p.label,
            index: p.index,
            count: p.count,
            montant: p.montant,
            cumulatif: p.cumulatif,
            pct: p.pct,
            pctCumulatif: p.pctCumulatif,
        })),
        sansSequence: {
            count: sansSequence.count,
            montant: sansSequence.montant,
        },
        horsPerimetre: {
            suivi: nbHorsPerimetreSuivi,
            montantSuivi: montantHorsPerimetreSuivi,
            sansSequence: sansSequence.count,
            montantSansSequence: sansSequence.montant,
        },
        sequences,
    };
}

// ═══════════════════════════════════════════════════════════════
// Enregistrer la Cloud Function
// ═══════════════════════════════════════════════════════════════
try {
    Parse.Cloud.define("getAuditPhases", async (request) => {
        if (!request.user) {
            throw new Error("Authentification requise");
        }
        return await getAuditPhases();
    });
    console.log("✅ Cloud Function getAuditPhases enregistrée");
} catch (err) {
    console.error(
        "Cloud Function getAuditPhases non enregistrée:",
        err.message,
    );
}

module.exports = { getAuditPhases };
