console.log('init.js loaded');

function parseImpaye(obj) {
  const rc = obj.get('relanceContact');
  const er = obj.get('email_relance');
  return {
    objectId: obj.id,
    createdAt: obj.createdAt,
    nfacture: obj.get('nfacture'),
    ref_piece: obj.get('ref_piece'),
    date_piece: obj.get('date_piece'),
    total_ht: obj.get('total_ht'),
    total_ttc: obj.get('total_ttc'),
    reste_a_payer: obj.get('reste_a_payer'),
    commentaire_piece: obj.get('commentaire_piece'),
    statut: obj.get('statut'),
    isBlacklisted: obj.get('isBlacklisted') === true,
    blacklistedAt: obj.get('blacklistedAt'),
    blacklistMotifType: obj.get('blacklistMotifType'),
    blacklistMotif: obj.get('blacklistMotif'),
    adresse_bien: obj.get('adresse_bien'),
    code_postal: obj.get('code_postal'),
    ville: obj.get('ville'),
    entree: obj.get('entree'),
    escalier: obj.get('escalier'),
    etage: obj.get('etage'),
    porte: obj.get('porte'),
    numero_lot: obj.get('numero_lot'),
    numero_dossier: obj.get('numero_dossier'),
    reference: obj.get('reference'),
    reference_externe: obj.get('reference_externe'),
    statut_dossier: obj.get('statut_dossier'),
    date_debut_mission: obj.get('date_debut_mission'),
    employe_intervention: obj.get('employe_intervention'),
    payeur_nom: obj.get('payeur_nom'),
    payeur_email: obj.get('payeur_email'),
    payeur_telephone: obj.get('payeur_telephone'),
    payeur_type: obj.get('payeur_type'),
    payeur_type_personne: obj.get('payeur_type_personne'),
    payeur_contact_nom: obj.get('payeur_contact_nom'),
    payeur_contact_email: obj.get('payeur_contact_email'),
    apporteur_nom: obj.get('apporteur_nom'),
    apporteur_email: obj.get('apporteur_email'),
    apporteur_telephone: obj.get('apporteur_telephone'),
    apporteur_contact_nom: obj.get('apporteur_contact_nom'),
    apporteur_contact_email: obj.get('apporteur_contact_email'),
    proprietaire_nom: obj.get('proprietaire_nom'),
    proprietaire_email: obj.get('proprietaire_email'),
    proprietaire_telephone: obj.get('proprietaire_telephone'),
    proprietaire_type_personne: obj.get('proprietaire_type_personne'),
    proprietaire_contact_nom: obj.get('proprietaire_contact_nom'),
    proprietaire_contact_email: obj.get('proprietaire_contact_email'),
    locataire_entrant_nom: obj.get('locataire_entrant_nom'),
    locataire_entrant_email: obj.get('locataire_entrant_email'),
    locataire_entrant_telephone: obj.get('locataire_entrant_telephone'),
    locataire_sortant_nom: obj.get('locataire_sortant_nom'),
    locataire_sortant_email: obj.get('locataire_sortant_email'),
    locataire_sortant_telephone: obj.get('locataire_sortant_telephone'),
    acquereur_nom: obj.get('acquereur_nom'),
    acquereur_email: obj.get('acquereur_email'),
    acquereur_telephone: obj.get('acquereur_telephone'),
    donneur_ordre_nom: obj.get('donneur_ordre_nom'),
    donneur_ordre_email: obj.get('donneur_ordre_email'),
    donneur_ordre_telephone: obj.get('donneur_ordre_telephone'),
    notaire_nom: obj.get('notaire_nom'),
    notaire_email: obj.get('notaire_email'),
    notaire_telephone: obj.get('notaire_telephone'),
    syndic_nom: obj.get('syndic_nom'),
    syndic_email: obj.get('syndic_email'),
    syndic_telephone: obj.get('syndic_telephone'),
    relanceContact: rc ? { id: rc.id, nom: rc.get('nom'), prenom: rc.get('prenom'), email: rc.get('email') } : null,
    email_relance: er ? { id: er.id, nom: er.get('nom'), prenom: er.get('prenom'), email: er.get('email') } : null,
  };
}

export async function execute(context, params) {
  const impayelId = new URLSearchParams(window.location.search).get('id');
  if (!impayelId) {
    return { success: false, error: 'ID manquant dans l\'URL' };
  }

  try {
    const q = new Parse.Query('Impaye');
    q.include('sequence');
    q.include('relanceContact');
    q.include('email_relance');
    const obj = await q.get(impayelId);

    const impaye = parseImpaye(obj);

    const sequenceObj = obj.get('sequence');
    const sequenceActive = sequenceObj ? { id: sequenceObj.id, nom: sequenceObj.get('nom') } : null;

    // Relances
    const rq = new Parse.Query('Relance');
    rq.equalTo('impaye', obj);
    rq.ascending('dateEnvoi');
    rq.limit(200);
    const relancesResults = await rq.find();
    const relances = relancesResults.map(r => ({
      _parse: r,
      objectId: r.id,
      dateEnvoi: r.get('dateEnvoi'),
      objet: r.get('objet') || '(sans objet)',
      corps: r.get('corps') || '',
      statut: r.get('statut') || 'pending',
      manuelle: r.get('manuel') || false,
      to: r.get('to') || '',
    }));

    // Séquences
    const sq = new Parse.Query('Sequence');
    sq.limit(200);
    const sequences = await sq.find();

    return {
      success: true,
      data: { impaye, sequenceActive, relances, sequences, impayelId }
    };
  } catch (err) {
    console.error('init error:', err);
    return { success: false, error: err.message || 'Erreur de chargement' };
  }
}
