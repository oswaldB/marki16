// backend/cloud/main.js

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MOIS_FR = [
  'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre',
];

/**
 * Construit l'URL FTP du PDF selon le format :
 * /ADN/Reporting/Gco/Piece/{year}/{month_fr}/{ref_clean}/standard/{ref_piece} (GCO PI FA).pdf
 *
 * - month_fr  : mois en français minuscules sans accents
 * - ref_clean : ref_piece avec espaces remplacés par _
 * - Le nom de fichier conserve les espaces d'origine
 */
function buildUrlPdf(refPiece, datePiece) {
  if (!refPiece || !datePiece) return null;
  const d = new Date(datePiece);
  if (isNaN(d.getTime())) return null;
  const year  = d.getFullYear();
  const month = MOIS_FR[d.getMonth()];
  const refClean = String(refPiece).replace(/\s+/g, '_');
  return `/ADN/Reporting/Gco/Piece/${year}/${month}/${refClean}/standard/${refPiece} (GCO PI FA).pdf`;
}

// ─────────────────────────────────────────────────────────────────────────────

Parse.Cloud.define('hello', () => {
  return 'Hello from Parse Cloud Code!';
});

Parse.Cloud.beforeSave('TestObject', (request) => {
  console.log('Before save triggered');
});

// ─── importImpayes ────────────────────────────────────────────────────────────
// Params : { impayes: Array<ImportedImpaye> }
// Retourne un résumé { imported, contactsCreated, contactsUpdated, noSequence, noEmail, errors }
Parse.Cloud.define('importImpayes', async (request) => {
  const { impayes } = request.params;
  if (!Array.isArray(impayes) || impayes.length === 0) {
    throw new Error('Aucune donnée à importer');
  }

  const Contact = Parse.Object.extend('Contact');
  const Impaye = Parse.Object.extend('Impaye');

  const stats = {
    imported: 0,
    contactsCreated: 0,
    contactsUpdated: 0,
    noSequence: 0,
    noEmail: 0,
    errors: [],
  };

  for (const data of impayes) {
    try {
      // ── Contact payeur ──────────────────────────────────────────────────────
      let contact = null;
      if (data.payeur_nom) {
        const q = new Parse.Query(Contact);
        q.equalTo('nom', data.payeur_nom);
        q.equalTo('source', 'upload');
        contact = await q.first({ useMasterKey: true });

        if (!contact) {
          contact = new Contact();
          contact.set('source', 'upload');
          stats.contactsCreated++;
        } else {
          stats.contactsUpdated++;
        }

        contact.set('nom', data.payeur_nom);
        if (data.payeur_email)     contact.set('email', data.payeur_email);
        if (data.payeur_telephone) contact.set('telephone', data.payeur_telephone);
        if (data.payeur_type)      contact.set('type', data.payeur_type);
        await contact.save(null, { useMasterKey: true });

        if (!data.payeur_email) stats.noEmail++;
      }

      // ── Impayé ──────────────────────────────────────────────────────────────
      const impaye = new Impaye();
      impaye.set('nfacture',          data.nfacture || null);
      impaye.set('ndossier',          data.ndossier || null);
      impaye.set('ref_piece',         data.ref_piece || null);
      impaye.set('adresse_bien',      data.adresse || null);
      impaye.set('numero_lot',        data.lot || null);
      impaye.set('etage',             data.etage || null);
      impaye.set('porte',             data.porte || null);
      impaye.set('total_ht',          typeof data.montant_ht === 'number' ? data.montant_ht : null);
      impaye.set('total_ttc',         typeof data.montant_ttc === 'number' ? data.montant_ttc : null);
      impaye.set('reste_a_payer',     typeof data.reste_a_payer === 'number' ? data.reste_a_payer : (data.montant_ttc || null));
      impaye.set('date_piece',        data.date_piece ? new Date(data.date_piece) : null);
      impaye.set('date_debut_mission',data.date_intervention ? new Date(data.date_intervention) : null);
      impaye.set('statut',            'impaye');
      impaye.set('employe_intervention', data.employe || null);
      impaye.set('commentaire_piece', data.commentaire || null);
      impaye.set('source',            'upload');
      impaye.set('pdf_filename',      data.pdf_filename || null);
      // URL FTP construite selon le format du README
      impaye.set('url_pdf', buildUrlPdf(data.ref_piece, data.date_piece));
      if (contact) impaye.set('payeur', contact);

      await impaye.save(null, { useMasterKey: true });
      stats.imported++;
      stats.noSequence++; // pas encore de logique séquence automatique
    } catch (err) {
      stats.errors.push({ file: data.pdf_filename, error: err.message });
    }
  }

  return stats;
});
