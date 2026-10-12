/**
 * Workflow init — charge les contacts blacklistés depuis Parse
 */
export async function execute(context, params) {
  try {
    const Contact = Parse.Object.extend('Contact');
    const query = new Parse.Query(Contact);
    query.equalTo('isBlacklisted', true);
    query.limit(1000);
    query.include('entreprise');
    query.include('email_relance');
    query.ascending('nom');

    const contacts = await query.find();

    // Charger les impayés pour compter
    let impayesMap = {};
    try {
      const Impaye = Parse.Object.extend('Impaye');
      const impayeQuery = new Parse.Query(Impaye);
      impayeQuery.limit(10000);
      const impayes = await impayeQuery.find();
      impayes.forEach(i => {
        const payeur = i.get('payeur');
        if (payeur && payeur.id) {
          impayesMap[payeur.id] = (impayesMap[payeur.id] || 0) + 1;
        }
      });
    } catch (e) {
      console.warn('Impossible de charger les impayés:', e);
    }

    const formattedContacts = contacts.map(c => {
      const emailRelance = c.get('email_relance');
      return {
        id: c.id,
        nom: c.get('nom') || '—',
        prenom: c.get('prenom') || '',
        email: c.get('email') || '',
        telephone: c.get('telephone') || '—',
        source: c.get('source') || 'inconnu',
        nb_impayes: impayesMap[c.id] || 0,
        blacklistedAt: c.get('blacklistedAt') || null,
        isBlacklisted: c.get('isBlacklisted') || false,
        email_relance: emailRelance && typeof emailRelance.get === 'function'
          ? emailRelance.get('email')
          : (emailRelance && emailRelance.email ? emailRelance.email : null),
      };
    });

    return {
      success: true,
      data: {
        contacts: formattedContacts,
      }
    };
  } catch (error) {
    console.error('Erreur init workflow:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors du chargement des contacts blacklistés',
      data: {}
    };
  }
}
