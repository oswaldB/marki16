/**
 * Workflow load-all — charge les entités ou les groupes de particuliers
 * params.type: 'entites' | 'particuliers'
 */
export async function execute(context, params) {
  const type = params.type;

  try {
    if (type === 'entites') {
      return await loadEntites();
    } else if (type === 'particuliers') {
      return await loadParticuliers();
    } else {
      return { success: false, error: 'Type inconnu: ' + type };
    }
  } catch (error) {
    console.error('Erreur load-all workflow:', error);
    return { success: false, error: error.message };
  }
}

async function loadEntites() {
  const Contact = Parse.Object.extend('Contact');

  // 1. Récupérer les personnes morales
  const q = new Parse.Query(Contact);
  q.equalTo('type_personne', 'M');
  q.include('email_relance');
  q.ascending('nom');
  const entreprises = await q.find();

  // 2. Pour chaque entreprise, récupérer ses employés
  const groups = await Promise.all(
    entreprises.map(async (entreprise) => {
      const employes = await entreprise
        .relation('employes')
        .query()
        .ascending('nom')
        .find();

      const emailRelance = entreprise.get('email_relance');

      return {
        id: `entite-${entreprise.id}`,
        nom: entreprise.get('nom') || 'Entreprise sans nom',
        email: entreprise.get('email') || '',
        telephone: entreprise.get('telephone') || '—',
        isEntite: true,
        isBlacklisted: entreprise.get('isBlacklisted') || false,
        email_relance: emailRelance && typeof emailRelance.get === 'function'
          ? emailRelance.get('email')
          : (emailRelance && emailRelance.email ? emailRelance.email : null),
        subRows: employes.map((e) => {
          const empEmailRelance = e.get('email_relance');
          return {
            id: e.id,
            nom: e.get('nom') || '—',
            prenom: e.get('prenom') || null,
            email: e.get('email') || '',
            telephone: e.get('telephone') || '—',
            isEntite: false,
            isBlacklisted: e.get('isBlacklisted') || false,
            email_relance: empEmailRelance && typeof empEmailRelance.get === 'function'
              ? empEmailRelance.get('email')
              : (empEmailRelance && empEmailRelance.email ? empEmailRelance.email : null),
          };
        }),
      };
    })
  );

  return { success: true, data: groups };
}

async function loadParticuliers() {
  const Contact = Parse.Object.extend('Contact');

  // Récupérer les personnes physiques non-employés d'entreprise
  const q = new Parse.Query(Contact);
  q.notEqualTo('type_personne', 'M');
  q.include('email_relance');
  q.ascending('nom');
  const candidats = await q.find();

  // Pour chaque candidat, récupérer ses membres via relation employes
  const groups = await Promise.all(
    candidats.map(async (chef) => {
      const membres = await chef
        .relation('employes')
        .query()
        .ascending('nom')
        .find();
      return { chef, membres };
    })
  );

  // Ne garder que ceux qui ont au moins un membre
  const groupesAvecMembres = groups.filter((g) => g.membres.length > 0);

  const formatted = groupesAvecMembres.map((g) => {
    const emailRelance = g.chef.get('email_relance');
    return {
      id: `particulier-${g.chef.id}`,
      nom: g.chef.get('nom') || '—',
      prenom: g.chef.get('prenom') || null,
      email: g.chef.get('email') || '',
      telephone: g.chef.get('telephone') || '—',
      isParticulier: true,
      isBlacklisted: g.chef.get('isBlacklisted') || false,
      email_relance: emailRelance && typeof emailRelance.get === 'function'
        ? emailRelance.get('email')
        : (emailRelance && emailRelance.email ? emailRelance.email : null),
      subRows: g.membres.map((m) => {
        const mEmailRelance = m.get('email_relance');
        return {
          id: m.id,
          nom: m.get('nom') || '—',
          prenom: m.get('prenom') || null,
          email: m.get('email') || '',
          telephone: m.get('telephone') || '—',
          isParticulier: false,
          isBlacklisted: m.get('isBlacklisted') || false,
          email_relance: mEmailRelance && typeof mEmailRelance.get === 'function'
            ? mEmailRelance.get('email')
            : (mEmailRelance && mEmailRelance.email ? mEmailRelance.email : null),
        };
      }),
    };
  });

  return { success: true, data: formatted };
}
