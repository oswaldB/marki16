console.log('init.js loaded');

export async function execute(context, params) {
  try {
    const Impaye = Parse.Object.extend('Impaye');
    const query = new Parse.Query(Impaye);

    // Filtrer uniquement les impayés blacklistés non soldés
    query.equalTo('isBlacklisted', true);
    query.equalTo('facture_soldee', false);
    query.greaterThan('reste_a_payer', 0);

    // Inclure les relations utiles
    query.include('sequence');
    query.include('contact_relance');
    query.include('payeur');

    // Trier par date de blacklist desc
    query.descending('blacklistedAt');
    query.limit(1000);

    const impayes = await query.find();

    const data = impayes.map(i => {
      const contact = i.get('contact_relance') || i.get('payeur');
      return {
        id: i.id,
        objectId: i.id,
        nfacture: i.get('nfacture') || '—',
        payeurNom: i.get('payeur_nom') || '—',
        contactEmail: contact?.get('email') || '',
        resteAPayer: i.get('reste_a_payer') || 0,
        blacklistMotifType: i.get('blacklistMotifType'),
        blacklistMotif: i.get('blacklistMotif') || '',
        blacklistedAt: i.get('blacklistedAt'),
        reference: i.get('reference') || '',
        contactId: contact?.id || null
      };
    });

    return { success: true, data, error: null };
  } catch (error) {
    console.error('Erreur chargement impayés blacklistés:', error);
    return { success: false, data: null, error: error.message || 'Erreur lors du chargement' };
  }
}
