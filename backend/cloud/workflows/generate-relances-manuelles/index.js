// backend/cloud/workflows/generate-relances-manuelles/index.js
// Génération MANUELLE de suivis (« relances manuelles ») à partir d'une sélection
// d'impayés/contacts. Mode « template simple » : pas de séquence, pas d'IA.

require("dotenv").config({ path: "/home/ubuntu/prod/adti/.env" });

const Parse = require("parse/node");
const { info, warn, error } = require("../../utils/logger");
const { createActivite } = require("../../utils/activite");

const FRONTEND_URL = process.env.FRONTEND_URL || "https://adti.markidiags.com";

// ─────────────────────────────────────────────────────────────
// Helpers de formatage / template
// ─────────────────────────────────────────────────────────────

function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function formatMontant(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "—";
    return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

function formatDate(value) {
    if (!value) return "—";
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("fr-FR", { dateStyle: "short" });
}

function contactDisplayName(contact) {
    const nom = contact.get("nom") || contact.get("societe") || "";
    const prenom = contact.get("prenom") || "";
    return `${prenom} ${nom}`.trim() || contact.get("email") || "Madame, Monsieur";
}

function contactCivilite(contact) {
    const civ = contact.get("civilite") || "";
    return civ ? `${civ} ` : "";
}

/**
 * Construit l'objet + le corps HTML du suivi manuel (template simple).
 *
 * @param {Parse.Object} contact - Contact destinataire
 * @param {Array<Parse.Object>} impayes - Impayés concernés
 * @param {"payeur"|"apporteur"} role - Rôle du contact
 * @returns {{objet: string, corps: string}}
 */
function buildSuiviTemplate(contact, impayes, role) {
    const nomComplet = `${contactCivilite(contact)}${contactDisplayName(contact)}`;
    const nb = impayes.length;
    const isApporteur = role === "apporteur";

    const total = impayes.reduce(
        (sum, i) => sum + (Number(i.get("reste_a_payer")) || 0),
        0,
    );

    const lignes = impayes
        .map((i) => {
            const nfacture = escapeHtml(i.get("nfacture") || "—");
            const echeance = formatDate(i.get("date_echeance"));
            const rap = formatMontant(i.get("reste_a_payer"));
            const adresse = escapeHtml(i.get("adresse_bien") || "");
            const lien = `${FRONTEND_URL}/redirect-pdf/${i.id}`;
            return `
                <tr>
                    <td style="padding:6px 10px;border-bottom:1px solid #eee;font-family:monospace;">${nfacture}</td>
                    <td style="padding:6px 10px;border-bottom:1px solid #eee;">${echeance}</td>
                    <td style="padding:6px 10px;border-bottom:1px solid #eee;">${adresse || "—"}</td>
                    <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;">${rap}</td>
                    <td style="padding:6px 10px;border-bottom:1px solid #eee;"><a href="${lien}">Voir la facture</a></td>
                </tr>`;
        })
        .join("");

    const objet = isApporteur
        ? nb > 1
            ? "Suivi des dossiers dont vous êtes l'apporteur d'affaires"
            : "Suivi d'un dossier dont vous êtes l'apporteur d'affaires"
        : nb > 1
          ? "Suivi de vos factures en attente de règlement"
          : "Suivi de votre facture en attente de règlement";

    const intro = isApporteur
        ? `Nous revenons vers vous concernant ${nb > 1 ? "les dossiers" : "le dossier"} pour ${nb > 1 ? "lesquels" : "lequel"} vous êtes notre apporteur d'affaires, et pour ${nb > 1 ? "lesquels" : "lequel"} un règlement reste en attente :`
        : `Nous revenons vers vous concernant ${nb > 1 ? "les factures suivantes" : "la facture suivante"} restant à régler :`;

    const corps = `
<p>Bonjour ${escapeHtml(nomComplet)},</p>

<p>${intro}</p>

<table style="border-collapse:collapse;width:100%;max-width:760px;font-size:14px;">
    <thead>
        <tr style="background:#f8fafc;">
            <th style="padding:6px 10px;text-align:left;">Facture</th>
            <th style="padding:6px 10px;text-align:left;">Échéance</th>
            <th style="padding:6px 10px;text-align:left;">Bien</th>
            <th style="padding:6px 10px;text-align:right;">Reste à payer</th>
            <th style="padding:6px 10px;text-align:left;">Lien</th>
        </tr>
    </thead>
    <tbody>
        ${lignes}
    </tbody>
</table>

<p style="margin-top:16px;">
    <strong>Montant total restant dû : ${formatMontant(total)}</strong>
</p>

<p>
    Vous pouvez consulter l'ensemble de vos dossiers depuis votre espace client :
    <a href="${FRONTEND_URL}/redirect-espace/${contact.id}">accéder à mon espace</a>.
</p>

<p>Nous restons à votre disposition pour toute question.</p>

<p>Cordialement,</p>
`.trim();

    return { objet, corps };
}

/**
 * Normalise la sélection reçue du frontend.
 * Accepte : [{ contactId, role, impayeIds }]
 */
function normalizeSelection(selection) {
    if (!Array.isArray(selection)) return [];
    return selection
        .map((g) => ({
            contactId: g && g.contactId ? String(g.contactId) : null,
            role: g && g.role === "apporteur" ? "apporteur" : "payeur",
            impayeIds: Array.isArray(g && g.impayeIds)
                ? g.impayeIds.filter(Boolean).map(String)
                : [],
        }))
        .filter((g) => g.contactId && g.impayeIds.length > 0);
}

/**
 * Fonction principale de génération des relances manuelles.
 *
 * @param {Object} options
 * @param {Array} options.selection - Groupes sélectionnés
 * @param {string} [options.smtpProfilId] - Profil SMTP d'envoi
 * @param {string} [options.trigger] - Origine de l'appel
 */
async function generateRelancesManuelles({ selection, smtpProfilId = null, trigger = "cloud" } = {}) {
    const groupes = normalizeSelection(selection);
    info(
        `=== Démarrage des relances manuelles (trigger: ${trigger}) — ${groupes.length} groupe(s) ===`,
        "generate-relances-manuelles",
        "generateRelancesManuelles",
    );

    const result = {
        suivisCrees: 0,
        erreurs: [],
        suivis: [],
    };

    if (groupes.length === 0) {
        return { success: true, ...result, message: "Aucune sélection" };
    }

    // Résolution du profil SMTP
    const SmtpProfile = Parse.Object.extend("SmtpProfile");
    let smtpProfil = null;
    try {
        if (smtpProfilId) {
            smtpProfil = await new Parse.Query(SmtpProfile).get(smtpProfilId, {
                useMasterKey: true,
            });
        } else {
            smtpProfil = await new Parse.Query(SmtpProfile)
                .ascending("nom")
                .first({ useMasterKey: true });
        }
    } catch (err) {
        warn(
            `Profil SMTP introuvable: ${err.message}`,
            "generate-relances-manuelles",
            "generateRelancesManuelles",
        );
    }

    if (!smtpProfil) {
        throw new Parse.Error(
            Parse.Error.OBJECT_NOT_FOUND,
            "Aucun profil SMTP disponible pour l'envoi.",
        );
    }

    const Contact = Parse.Object.extend("Contact");
    const Impaye = Parse.Object.extend("Impaye");
    const Suivi = Parse.Object.extend("Suivi");

    for (const groupe of groupes) {
        const { contactId, role, impayeIds } = groupe;
        try {
            const contact = await new Parse.Query(Contact).get(contactId, {
                useMasterKey: true,
            });

            const email = (contact.get("email") || "").trim();
            if (!email) {
                result.erreurs.push({
                    contactId,
                    erreur: "Contact sans adresse email",
                });
                continue;
            }

            if (contact.get("isBlacklisted") === true) {
                result.erreurs.push({
                    contactId,
                    erreur: "Contact blacklisté",
                });
                continue;
            }

            const impayes = await new Parse.Query(Impaye)
                .containedIn("objectId", impayeIds)
                .limit(1000)
                .find({ useMasterKey: true });

            const impayesRetenus = impayes.filter((i) => {
                if (i.get("isBlacklisted") === true) return false;
                if (i.get("facture_soldee") === true) return false;
                const rap = Number(i.get("reste_a_payer"));
                return Number.isFinite(rap) ? rap > 0 : true;
            });

            if (impayesRetenus.length === 0) {
                result.erreurs.push({
                    contactId,
                    erreur: "Aucun impayé éligible (soldé, blacklisté ou reste à payer nul)",
                });
                continue;
            }

            const { objet, corps } = buildSuiviTemplate(
                contact,
                impayesRetenus,
                role,
            );

            const suivi = new Suivi();
            suivi.set("contact", contact);
            suivi.set("impayes", impayesRetenus);
            suivi.set("manuelle", true);
            suivi.set("valide", true);
            // Statut « brouillon » : le cron sendSuivis n'envoie QUE les statuts
            // "pret pour envoi". Un brouillon reste sous contrôle humain et n'est
            // envoyé que par le bouton « Envoyer l'email » (ou basculé en
            // "pret pour envoi" lors d'une planification).
            suivi.set("statut", "brouillon");
            suivi.set("objet", objet);
            suivi.set("corps", corps);
            suivi.set("dateEnvoi", new Date());
            suivi.set("scenario", { format: role === "apporteur" ? "broker" : "single", manuel: true });
            suivi.set("smtpProfil", smtpProfil);
            suivi.set("erreur_count", 0);
            suivi.set("trigger", trigger);
            suivi.set("role_contact", role);

            const cc = contact.get("email_cc") || null;
            if (cc) suivi.set("cc", cc);

            await suivi.save(null, { useMasterKey: true });

            result.suivisCrees++;
            result.suivis.push({
                id: suivi.id,
                contactId: contact.id,
                contactNom: contactDisplayName(contact),
                email,
                role,
                objet,
                corps,
                totalRestant: impayesRetenus.reduce(
                    (s, i) => s + (Number(i.get("reste_a_payer")) || 0),
                    0,
                ),
                impayes: impayesRetenus.map((i) => ({
                    id: i.id,
                    nfacture: i.get("nfacture") || "—",
                    reste_a_payer: i.get("reste_a_payer") ?? null,
                })),
            });

            // Trace d'activité
            await createActivite(
                "suivi",
                "generation_manuelle",
                `Suivi manuel généré pour ${contactDisplayName(contact)} (${role}) — ${impayesRetenus.length} facture(s)`,
                impayesRetenus[0],
                {
                    trigger,
                    suivi_id: suivi.id,
                    role_contact: role,
                },
            );

            info(
                `Suivi manuel créé ${suivi.id} pour ${contactDisplayName(contact)} (${impayesRetenus.length} facture(s))`,
                "generate-relances-manuelles",
                "generateRelancesManuelles",
            );
        } catch (err) {
            error(
                `Erreur génération pour contact ${contactId}: ${err.message}`,
                "generate-relances-manuelles",
                "generateRelancesManuelles",
            );
            result.erreurs.push({ contactId, erreur: err.message });
        }
    }

    info(
        `=== Relances manuelles terminées : ${result.suivisCrees} suivi(s), ${result.erreurs.length} erreur(s) ===`,
        "generate-relances-manuelles",
        "generateRelancesManuelles",
    );

    return { success: true, ...result };
}

module.exports = {
    generateRelancesManuelles,
    buildSuiviTemplate,
    supprimerRelanceManuelle,
};

// ─────────────────────────────────────────────────────────────
// Suppression d'une relance manuelle NON envoyée
// ─────────────────────────────────────────────────────────────

/**
 * Supprime une relance manuelle qui n'a pas encore été envoyée.
 * Refuse toute relance déjà envoyée et toute relance non manuelle.
 *
 * @param {Object} options
 * @param {string} options.suiviId - Identifiant du Suivi à supprimer
 * @param {string} [options.trigger] - Origine de l'appel
 */
async function supprimerRelanceManuelle({ suiviId, trigger = "cloud" } = {}) {
    if (!suiviId) {
        throw new Parse.Error(Parse.Error.INVALID_QUERY, "suiviId requis.");
    }

    const Suivi = Parse.Object.extend("Suivi");
    const suivi = await new Parse.Query(Suivi).get(suiviId, {
        useMasterKey: true,
    });

    if (suivi.get("manuelle") !== true) {
        throw new Parse.Error(
            Parse.Error.OPERATION_FORBIDDEN,
            "Seules les relances manuelles peuvent être supprimées depuis cet écran.",
        );
    }

    if (suivi.get("emailSent") === true || suivi.get("statut") === "Envoyée") {
        throw new Parse.Error(
            Parse.Error.OPERATION_FORBIDDEN,
            "Impossible de supprimer une relance déjà envoyée.",
        );
    }

    const objet = suivi.get("objet") || "(sans objet)";
    const contact = suivi.get("contact") || null;
    const impayes = suivi.get("impayes") || [];
    const premierImpaye = Array.isArray(impayes) ? impayes[0] || null : null;

    await suivi.destroy({ useMasterKey: true });

    // Trace d'activité (après suppression réussie)
    await createActivite(
        "suivi",
        "suppression_manuelle",
        `Relance manuelle supprimée — ${objet}`,
        premierImpaye,
        {
            trigger,
            suivi_id: suiviId,
        },
    );

    info(
        `Relance manuelle supprimée ${suiviId}${contact ? ` (contact ${contact.id})` : ""}`,
        "generate-relances-manuelles",
        "supprimerRelanceManuelle",
    );

    return { success: true, suiviId };
}

// ─────────────────────────────────────────────────────────────
// Cloud Function
// ─────────────────────────────────────────────────────────────
if (typeof Parse !== "undefined" && Parse.Cloud && Parse.Cloud.define) {
    Parse.Cloud.define("generateRelancesManuelles", async (request) => {
        const { selection = [], smtpProfilId = null, trigger = "cloud" } =
            request.params || {};

        info(
            `Cloud Function generateRelancesManuelles appelée (trigger: ${trigger})`,
            "generate-relances-manuelles",
            "generateRelancesManuelles",
        );

        try {
            return await generateRelancesManuelles({
                selection,
                smtpProfilId,
                trigger,
            });
        } catch (err) {
            error(
                `Erreur Cloud Function generateRelancesManuelles: ${err.message}`,
                "generate-relances-manuelles",
                "generateRelancesManuelles",
            );
            throw new Parse.Error(
                Parse.Error.SCRIPT_FAILED,
                `Erreur lors de la génération des relances manuelles: ${err.message}`,
            );
        }
    });

    Parse.Cloud.define("supprimerRelanceManuelle", async (request) => {
        const { suiviId = null, trigger = "cloud" } = request.params || {};

        try {
            return await supprimerRelanceManuelle({ suiviId, trigger });
        } catch (err) {
            error(
                `Erreur Cloud Function supprimerRelanceManuelle: ${err.message}`,
                "generate-relances-manuelles",
                "supprimerRelanceManuelle",
            );
            throw err instanceof Parse.Error
                ? err
                : new Parse.Error(Parse.Error.SCRIPT_FAILED, err.message);
        }
    });
}
