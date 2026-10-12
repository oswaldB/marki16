export async function execute(context, params) {
  try {
    // ── Impayés ───────────────────────────────────────────────
    const q = new Parse.Query('Impaye');
    q.equalTo('facture_soldee', false);
    q.greaterThan('reste_a_payer', 0);
    q.include('sequence');
    q.include('payeur');
    q.include('apporteur');
    q.include('contact_relance');
    q.descending('date_echeance');
    q.limit(1000);
    const impayesRaw = await q.find();

    const impayes = impayesRaw.map((i) => {
      const seq = i.get('sequence');
      const seqObj = seq && typeof seq.get === 'function' ? seq : null;
      const payeur = i.get('payeur');
      const apporteur = i.get('apporteur');
      const contactRelance = i.get('contact_relance');

      function contactFrom(ptr) {
        if (!ptr || typeof ptr.get !== 'function') return null;
        return {
          id: ptr.id,
          nom: ptr.get('nom') || '',
          prenom: ptr.get('prenom') || '',
          email: (ptr.get('email') || '').trim(),
          type: ptr.get('type') || '',
          isBlacklisted: ptr.get('isBlacklisted') === true,
        };
      }

      const de = i.get('date_echeance');
      const retard = de ? Math.max(0, Math.floor((Date.now() - new Date(de).getTime()) / 86_400_000)) : 0;

      return {
        id: i.id,
        nfacture: i.get('nfacture') || '—',
        reste_a_payer: i.get('reste_a_payer'),
        date_echeance: de,
        retard,
        adresse_bien: i.get('adresse_bien') || '',
        statut_dossier: i.get('statut_dossier') || '',
        isBlacklisted: i.get('isBlacklisted') === true,
        payeur: contactFrom(payeur),
        apporteur: contactFrom(apporteur),
        contactRelance: contactFrom(contactRelance),
        sequenceId: seqObj ? seqObj.id : null,
        sequenceNom: seqObj ? seqObj.get('nom') : null,
      };
    });

    // ── Séquences ───────────────────────────────────────────────
    const seqQuery = new Parse.Query('Sequence');
    seqQuery.ascending('nom');
    seqQuery.limit(200);
    const sequencesRaw = await seqQuery.find();
    const sequences = sequencesRaw.map((s) => ({ id: s.id, nom: s.get('nom') }));

    // ── Profils SMTP ────────────────────────────────────────────
    const smtpQuery = new Parse.Query('SmtpProfile');
    smtpQuery.ascending('nom');
    smtpQuery.limit(100);
    const smtpRaw = await smtpQuery.find();
    const smtpProfiles = smtpRaw.map((p) => ({
      id: p.id,
      label: p.get('nom') || p.get('email_from') || p.get('username') || p.id,
    }));

    // ── File des suivis manuels (à traiter par défaut) ──────────
    const fileQuery = new Parse.Query('Suivi');
    fileQuery.equalTo('manuelle', true);
    fileQuery.containedIn('statut', ['brouillon', 'pret pour envoi', "Erreur d'envoi"]);
    fileQuery.include('contact');
    fileQuery.include('impayes');
    fileQuery.include('smtpProfil');
    fileQuery.descending('createdAt');
    fileQuery.limit(200);
    const fileRaw = await fileQuery.find();

    const file = fileRaw.map((s) => {
      const contact = s.get('contact');
      const impayesSuivi = s.get('impayes') || [];
      return {
        _parse: s,
        id: s.id,
        statut: s.get('statut') || '',
        objet: s.get('objet') || '',
        corps: s.get('corps') || '',
        cc: s.get('cc') || '',
        dateEnvoi: s.get('dateEnvoi'),
        lastError: s.get('lastError') || '',
        email: contact ? contact.get('email') || '' : '',
        contactNom: contact
          ? `${contact.get('prenom') || ''} ${contact.get('nom') || ''}`.trim()
          : '',
        impayes: impayesSuivi.map((i) => ({
          id: i.id,
          nfacture: i.get('nfacture') || '—',
          reste_a_payer: i.get('reste_a_payer') ?? null,
        })),
      };
    });

    return {
      success: true,
      data: {
        impayes,
        sequences,
        smtpProfiles,
        file,
      },
    };
  } catch (error) {
    console.error('init.js error:', error);
    return { success: false, error: error.message };
  }
}
