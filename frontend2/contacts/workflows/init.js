/**
 * Workflow init — charge les contacts avec pagination et compteurs
 */
export async function execute(context, params) {
  try {
    const pageSize = 50;
    const page = 1;

    const query = new Parse.Query('Contact');
    query.limit(pageSize);
    query.skip((page - 1) * pageSize);
    query.include('entreprise');
    query.include('email_relance');
    query.ascending('nom');

    // Comptage total
    const countQuery = new Parse.Query('Contact');
    const totalCount = await countQuery.count();

    // Comptage sans email
    const emailVideQuery = new Parse.Query('Contact');
    emailVideQuery.equalTo('email', '');
    const emailAbsentQuery = new Parse.Query('Contact');
    emailAbsentQuery.doesNotExist('email');
    const sansEmailQuery = Parse.Query.or(emailVideQuery, emailAbsentQuery);
    const sansEmailTotalCount = await sansEmailQuery.count();

    const contacts = await query.find();

    // Charger les impayés pour compter
    let impayesMap = {};
    try {
      const impayeQuery = new Parse.Query('Impaye');
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
        prenom: c.get('prenom') || null,
        email: c.get('email') || '',
        telephone: c.get('telephone') || '—',
        source: c.get('source') || 'inconnu',
        nb_impayes: impayesMap[c.id] || 0,
        isBlacklisted: c.get('isBlacklisted') || false,
        blacklistedAt: c.get('blacklistedAt') || null,
        email_relance: emailRelance && typeof emailRelance.get === 'function'
          ? emailRelance.get('email')
          : (emailRelance && emailRelance.email ? emailRelance.email : null),
        entreprise: c.get('entreprise'),
      };
    });

    return {
      success: true,
      data: {
        contacts: formattedContacts,
        totalCount,
        sansEmailTotalCount,
      }
    };
  } catch (error) {
    console.error('Erreur init workflow:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors du chargement des contacts',
      data: {}
    };
  }
}
