export async function execute(context, params) {
  try {
    const query = new Parse.Query('Impaye');
    query.limit(1000);
    query.include('sequence');
    query.descending('date_piece');
    query.equalTo('facture_soldee', false);

    const results = await query.find();

    const today = new Date();
    const calcRetard = (datePiece) => {
      if (!datePiece) return 0;
      const d = datePiece instanceof Date ? datePiece : new Date(datePiece);
      return Math.floor((today - d) / 86400000);
    };

    const impayes = results.map((r) => {
      const seq = r.get('sequence');
      return {
        objectId: r.id,
        nfacture: r.get('nfacture') || '—',
        numero_dossier: r.get('numero_dossier') || '—',
        adresse_bien:
          [r.get('adresse_bien'), r.get('code_postal'), r.get('ville')]
            .filter(Boolean)
            .join(', ') || '—',
        payeur_nom: r.get('payeur_nom') || '—',
        apporteur_nom: r.get('apporteur_nom') || null,
        retard: calcRetard(r.get('date_echeance')),
        reste_a_payer: r.get('reste_a_payer'),
        total_ht: r.get('total_ht'),
        total_ttc: r.get('total_ttc'),
        date_piece: r.get('date_piece'),
        date_debut_mission: r.get('date_debut_mission'),
        reference: r.get('reference'),
        reference_externe: r.get('reference_externe'),
        statut_dossier: r.get('statut_dossier'),
        commentaire_piece: r.get('commentaire_piece'),
        numero_lot: r.get('numero_lot'),
        etage: r.get('etage'),
        porte: r.get('porte'),
        statut: r.get('statut'),
        url_pdf: r.get('url_pdf'),
        sequenceNom: seq ? seq.get('nom') : null,
        sequenceId: seq ? seq.id : null,
      };
    });

    const seqQuery = new Parse.Query('Sequence');
    seqQuery.limit(200);
    const seqResults = await seqQuery.find();
    const sequences = seqResults.map((s) => ({
      id: s.id,
      nom: s.get('nom'),
      description: s.get('description'),
      publiee: s.get('publiee'),
    }));

    return { success: true, data: { impayes, sequences } };
  } catch (error) {
    console.error('Erreur load-all impayes:', error);
    return { success: false, error: error.message };
  }
}
