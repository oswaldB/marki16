export async function execute(context, params) {
  const { type, filtreFileStatut } = params;

  try {
    if (type === 'impayes') {
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
          payeur: contactFrom(i.get('payeur')),
          apporteur: contactFrom(i.get('apporteur')),
          contactRelance: contactFrom(i.get('contact_relance')),
          sequenceId: seqObj ? seqObj.id : null,
          sequenceNom: seqObj ? seqObj.get('nom') : null,
        };
      });

      return { success: true, data: { impayes } };
    }

    if (type === 'file') {
      const q = new Parse.Query('Suivi');
      q.equalTo('manuelle', true);
      if (filtreFileStatut === 'a_traiter') {
        q.containedIn('statut', ['brouillon', 'pret pour envoi', "Erreur d'envoi"]);
      } else if (filtreFileStatut === 'envoyes') {
        q.equalTo('statut', 'Envoyée');
      }
      q.include('contact');
      q.include('impayes');
      q.include('smtpProfil');
      q.descending('createdAt');
      q.limit(200);
      const fileRaw = await q.find();

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

      return { success: true, data: { file } };
    }

    return { success: false, error: 'Type de chargement inconnu' };
  } catch (error) {
    console.error('load-all.js error:', error);
    return { success: false, error: error.message };
  }
}
