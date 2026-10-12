// Parse SDK global — PAS d'import

function parseContact(c) {
  if (!c) return null;
  const getValue = (key) => {
    if (c.get) return c.get(key);
    if (c[key] !== undefined) return c[key];
    return undefined;
  };
  return {
    id: c.id,
    nom: getValue('nom') || getValue('name') || getValue('Nom') || '—',
    email: getValue('email') || getValue('Email') || '',
    telephone: getValue('telephone') || '',
    type: getValue('type') || getValue('Type') || '—',
    externe_id: getValue('externe_id') || getValue('externeId') || getValue('code_interlocuteur') || '',
    nb_impayes: 0,
  };
}

function parseImpaye(i) {
  if (!i) return null;
  const getValue = (key) => {
    if (i.get) return i.get(key);
    if (i[key] !== undefined) return i[key];
    return undefined;
  };
  return {
    id: i.id,
    nfacture: getValue('nfacture') || '—',
    numero_dossier: getValue('numero_dossier') || '—',
    montant: getValue('total_ttc') || getValue('montant_total') || null,
    dateEcheance: getValue('date_echeance') || getValue('dateEcheance') || null,
    payeur: getValue('payeur_nom') || getValue('payeur') || getValue('nom_payeur') || '',
  };
}

async function chargerContactsSansEmail() {
  const q1 = new Parse.Query('Contact');
  q1.doesNotExist('email');
  q1.limit(10000);

  const q2 = new Parse.Query('Contact');
  q2.equalTo('email', '');
  q2.limit(10000);

  const q3 = new Parse.Query('Contact');
  q3.equalTo('email', null);
  q3.limit(10000);

  const [results1, results2, results3] = await Promise.all([
    q1.find(),
    q2.find(),
    q3.find(),
  ]);

  const seenIds = new Set();
  const uniqueResults = [...results1, ...results2, ...results3].filter((item) => {
    if (seenIds.has(item.id)) return false;
    seenIds.add(item.id);
    return true;
  });

  const Contact = Parse.Object.extend('Contact');
  const contactPointers = uniqueResults.map(c => Contact.createWithoutData(c.id));
  const impayesMap = new Map();

  const batchSize = 100;
  for (let i = 0; i < contactPointers.length; i += batchSize) {
    const batch = contactPointers.slice(i, i + batchSize);
    const impayeQ = new Parse.Query('Impaye');
    impayeQ.containedIn('payeur', batch);
    impayeQ.greaterThan('reste_a_payer', 0);
    impayeQ.limit(10000);
    const impayes = await impayeQ.find();
    for (const impaye of impayes) {
      const payeur = impaye.get('payeur');
      if (payeur && payeur.id) {
        const data = impayesMap.get(payeur.id) || { count: 0, numero_dossiers: new Set(), nfactures: new Set() };
        data.count++;
        const nd = impaye.get('numero_dossier');
        if (nd) data.numero_dossiers.add(nd);
        const nf = impaye.get('nfacture');
        if (nf) data.nfactures.add(nf);
        impayesMap.set(payeur.id, data);
      }
    }
  }

  return uniqueResults
    .map(parseContact)
    .map(c => {
      const data = impayesMap.get(c.id) || { count: 0, numero_dossiers: new Set(), nfactures: new Set() };
      return {
        ...c,
        code_interlocuteur: c.externe_id || '',
        nb_impayes: data.count,
        numero_dossier: Array.from(data.numero_dossiers).join(', '),
        nfacture: Array.from(data.nfactures).join(', '),
      };
    })
    .filter(c => c.nb_impayes > 0)
    .sort((a, b) => {
      const nomA = a.nom || '';
      const nomB = b.nom || '';
      return nomA.localeCompare(nomB, 'fr', { sensitivity: 'base' });
    });
}

async function chargerImpayesSansPayeur() {
  const q = new Parse.Query('Impaye');
  q.doesNotExist('payeur');
  q.equalTo('facture_soldee', false);
  q.limit(10000);

  const results = await q.find();
  return results.map(parseImpaye);
}

export async function execute(context, params) {
  try {
    const [contactsSansEmail, impayesSansPayeur] = await Promise.all([
      chargerContactsSansEmail(),
      chargerImpayesSansPayeur(),
    ]);

    return {
      success: true,
      data: {
        contactsSansEmail,
        impayesSansPayeur,
      }
    };
  } catch (error) {
    console.error('Erreur load-all a-corriger:', error);
    return { success: false, error: error.message };
  }
}
