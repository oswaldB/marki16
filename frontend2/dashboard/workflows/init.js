// Parse SDK global — PAS d'import

function startOfDay() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

async function chargerNombreRecalcitrants() {
  try {
    const res = await Parse.Cloud.run('getRecalcitrants');
    return res?.total ?? (res?.recalcitrants?.length || 0);
  } catch (err) {
    console.error('Erreur chargement récalcitrants:', err);
    return 0;
  }
}

async function chargerKpi() {
  const today = endOfDay();

  const qEnAttente = new Parse.Query('Impaye')
    .greaterThan('reste_a_payer', 0)
    .select('nfacture')
    .limit(10000);

  const qEchusActifs = new Parse.Query('Impaye')
    .lessThan('date_echeance', today)
    .greaterThan('reste_a_payer', 0)
    .select('nfacture')
    .limit(10000);

  const qEchus = new Parse.Query('Impaye')
    .lessThan('date_echeance', today)
    .select('nfacture')
    .limit(10000);

  const qEchusPayes = new Parse.Query('Impaye')
    .lessThan('date_echeance', today)
    .equalTo('reste_a_payer', 0)
    .select('nfacture')
    .limit(10000);

  const qMontant = new Parse.Query('Impaye')
    .lessThan('date_echeance', today)
    .greaterThan('reste_a_payer', 0)
    .select('nfacture', 'reste_a_payer')
    .limit(10000);

  const [enAttenteResult, actifsResult, echusResults, payeResults, impayes_actifs, recalcitrants] = await Promise.all([
    qEnAttente.find(),
    qEchusActifs.find(),
    qEchus.find(),
    qEchusPayes.find(),
    qMontant.find(),
    chargerNombreRecalcitrants(),
  ]);

  const en_attente = [...new Set(enAttenteResult.map(i => i.get('nfacture')))].length;
  const actifs = [...new Set(actifsResult.map(i => i.get('nfacture')))].length;
  const total_echus = [...new Set(echusResults.map(i => i.get('nfacture')))].length;
  const paye_count = [...new Set(payeResults.map(i => i.get('nfacture')))].length;

  const nfactureMap = new Map();
  for (const item of impayes_actifs) {
    const nfact = item.get('nfacture');
    if (nfact && !nfactureMap.has(nfact)) {
      nfactureMap.set(nfact, item.get('reste_a_payer') || 0);
    }
  }
  const montant = [...nfactureMap.values()].reduce((s, v) => s + v, 0);

  return {
    factures_en_attente: en_attente,
    impayes_actifs: actifs,
    montant_total: montant,
    recalcitrants: recalcitrants,
    taux_recouvrement: total_echus > 0 ? Math.round((paye_count / total_echus) * 100) : 0,
  };
}

async function chargerAging() {
  const now = new Date();
  const today = endOfDay();
  const daysAgo = (n) => {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    d.setHours(23, 59, 59, 999);
    return d;
  };

  const cutoff7   = daysAgo(7);
  const cutoff30  = daysAgo(30);
  const cutoff60  = daysAgo(60);
  const cutoff120 = daysAgo(120);

  const q = new Parse.Query('Impaye')
    .lessThan('date_echeance', today)
    .greaterThan('reste_a_payer', 0)
    .select('nfacture', 'date_echeance', 'reste_a_payer')
    .limit(2000);

  const items = await q.find();

  const j7Map = new Map();
  const j30Map = new Map();
  const j60Map = new Map();
  const j60_120Map = new Map();
  const j120Map = new Map();

  for (const item of items) {
    const nfact = item.get('nfacture');
    const de = item.get('date_echeance');
    const rap = item.get('reste_a_payer') || 0;
    if (!de || !nfact) continue;

    if (de >= cutoff7) {
      if (!j7Map.has(nfact)) j7Map.set(nfact, rap);
    } else if (de >= cutoff30) {
      if (!j30Map.has(nfact)) j30Map.set(nfact, rap);
    } else if (de >= cutoff60) {
      if (!j60Map.has(nfact)) j60Map.set(nfact, rap);
    } else if (de >= cutoff120) {
      if (!j60_120Map.has(nfact)) j60_120Map.set(nfact, rap);
    } else {
      if (!j120Map.has(nfact)) j120Map.set(nfact, rap);
    }
  }

  return {
    j7:   { count: j7Map.size,   montant: [...j7Map.values()].reduce((s, v) => s + v, 0) },
    j30:  { count: j30Map.size,  montant: [...j30Map.values()].reduce((s, v) => s + v, 0) },
    j60:  { count: j60Map.size,  montant: [...j60Map.values()].reduce((s, v) => s + v, 0) },
    j60_120: { count: j60_120Map.size, montant: [...j60_120Map.values()].reduce((s, v) => s + v, 0) },
    j120: { count: j120Map.size, montant: [...j120Map.values()].reduce((s, v) => s + v, 0) },
  };
}

async function chargerMontantsMois() {
  async function getMontantsForPeriode(debut, fin, pourAvant = false) {
    const q = new Parse.Query('Impaye');
    if (debut) q.greaterThanOrEqualTo('date_echeance', debut);
    if (fin) q.lessThanOrEqualTo('date_echeance', fin);
    if (pourAvant) q.greaterThan('reste_a_payer', 0);
    q.select('nfacture', 'total_ttc', 'reste_a_payer');
    q.limit(2000);
    const items = await q.find();

    const nfactureMap = new Map();
    for (const item of items) {
      const nfact = item.get('nfacture');
      if (nfact && !nfactureMap.has(nfact)) {
        nfactureMap.set(nfact, {
          ttc: item.get('total_ttc') || 0,
          reste: item.get('reste_a_payer') || 0
        });
      }
    }

    const values = [...nfactureMap.values()];
    return {
      ttc: values.reduce((s, v) => s + v.ttc, 0),
      paye: pourAvant ? 0 : values.filter(v => v.reste === 0).reduce((s, v) => s + v.ttc, 0),
      reste: values.filter(v => v.reste > 0).reduce((s, v) => s + v.reste, 0),
      count: values.filter(v => v.reste > 0).length
    };
  }

  const montantsTTC = [];
  const montantsPaye = [];
  const montantsReste = [];
  const montantsCount = [];

  const debut12Mois = new Date();
  debut12Mois.setDate(1);
  debut12Mois.setMonth(debut12Mois.getMonth() - 12);
  debut12Mois.setHours(0, 0, 0, 0);

  const avant = await getMontantsForPeriode(null, debut12Mois, true);
  montantsTTC.push(avant.ttc);
  montantsPaye.push(avant.paye);
  montantsReste.push(avant.reste);
  montantsCount.push(avant.count);

  for (let i = 12; i >= 0; i--) {
    const debut = new Date();
    debut.setDate(1);
    debut.setMonth(debut.getMonth() - i);
    debut.setHours(0, 0, 0, 0);

    const fin = new Date(debut);
    fin.setMonth(fin.getMonth() + 1);
    fin.setDate(0);
    fin.setHours(23, 59, 59, 999);

    const mois = await getMontantsForPeriode(debut, fin);
    montantsTTC.push(mois.ttc);
    montantsPaye.push(mois.paye);
    montantsReste.push(mois.reste);
    montantsCount.push(mois.count);
  }

  return {
    ttc: montantsTTC,
    paye: montantsPaye,
    reste: montantsReste,
    count: montantsCount,
  };
}

async function chargerRelancesJour() {
  if (!Parse.User.current()) return [];
  const today = startOfDay();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const q = new Parse.Query('Relance')
    .equalTo('statut', 'pret pour envoi')
    .equalTo('valide', true)
    .greaterThanOrEqualTo('dateEnvoi', today)
    .lessThan('dateEnvoi', tomorrow)
    .include('contact')
    .include('impayes')
    .ascending('dateEnvoi')
    .limit(5);

  const results = await q.find();

  return results.map(r => {
    const impayes = r.get('impayes') || [];
    const d = r.get('dateEnvoi');
    const firstImpaye = impayes[0] || null;
    return {
      id: r.id,
      payeur_nom: firstImpaye ? (firstImpaye.get('payeur_nom') || '—') : '—',
      nfacture: firstImpaye ? (firstImpaye.get('nfacture') || '—') : '—',
      dossier: firstImpaye ? (firstImpaye.get('numero_dossier') || '—') : '—',
      date: d ? d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : '—',
      numero: r.get('email_index') || '—',
    };
  });
}

async function chargerImpayes() {
  const q = new Parse.Query('Impaye')
    .descending('createdAt')
    .equalTo('facture_soldee', false)
    .greaterThan('reste_a_payer', 0)
    .limit(5);

  const results = await q.find();
  return results.map(r => ({
    id: r.id,
    nfacture: r.get('nfacture') || '—',
    payeur_nom: r.get('payeur_nom') || '—',
    reste_a_payer: r.get('reste_a_payer'),
    date_echeance: r.get('date_echeance'),
  }));
}

async function chargerContactsSansEmail() {
  if (!Parse.User.current()) return [];
  const q = new Parse.Query('Contact')
    .doesNotExist('email')
    .ascending('nom')
    .limit(5);

  const results = await q.find();
  return results.map(c => ({
    id: c.id,
    nom: c.get('nom') || '—',
    prenom: c.get('prenom') || '',
    telephone: c.get('telephone') || null,
  }));
}

export async function execute(context, params) {
  try {
    const [kpi, aging, montantsMois, relancesJour, impayes_recents, contactsSansEmail] = await Promise.all([
      chargerKpi(),
      chargerAging(),
      chargerMontantsMois(),
      chargerRelancesJour(),
      chargerImpayes(),
      chargerContactsSansEmail(),
    ]);

    return {
      success: true,
      data: {
        kpi,
        aging,
        montantsMois,
        relancesJour,
        impayes_recents,
        contactsSansEmail,
      }
    };
  } catch (error) {
    console.error('Init workflow error:', error);
    return { success: false, error: error.message };
  }
}
