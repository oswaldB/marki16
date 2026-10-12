/**
 * Workflow load-all — recherche dans tous les contacts pour le slideover d'ajout
 * params.query: string
 */
export async function execute(context, params) {
  const { query } = params;
  if (!query) {
    return { success: true, data: [] };
  }

  try {
    const Contact = Parse.Object.extend('Contact');
    const searchRegex = new RegExp(query, 'i');

    const queries = [];

    const nomQuery = new Parse.Query(Contact);
    nomQuery.matches('nom', searchRegex);
    nomQuery.limit(50);
    queries.push(nomQuery);

    const emailQuery = new Parse.Query(Contact);
    emailQuery.matches('email', searchRegex);
    emailQuery.limit(50);
    queries.push(emailQuery);

    const telQuery = new Parse.Query(Contact);
    telQuery.matches('telephone', searchRegex);
    telQuery.limit(50);
    queries.push(telQuery);

    const orQuery = Parse.Query.or(...queries);
    orQuery.include('entreprise');
    orQuery.limit(100);
    orQuery.ascending('nom');

    const contacts = await orQuery.find();

    const formattedContacts = contacts.map(c => ({
      id: c.id,
      nom: c.get('nom') || '—',
      prenom: c.get('prenom') || '',
      email: c.get('email') || '',
      telephone: c.get('telephone') || '—',
      isBlacklisted: c.get('isBlacklisted') || false,
    }));

    return {
      success: true,
      data: formattedContacts,
    };
  } catch (error) {
    console.error('Erreur load-all workflow:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de la recherche',
      data: [],
    };
  }
}
