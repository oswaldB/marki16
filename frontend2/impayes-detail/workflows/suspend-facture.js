console.log('suspend-facture.js loaded');

export async function execute(context, params) {
  const { impayelId, jours } = params;

  if (!impayelId) {
    throw new Error('ID impayé manquant');
  }
  if (!jours || jours <= 0) {
    throw new Error('Durée invalide');
  }

  try {
    const Impaye = Parse.Object.extend('Impaye');
    const impayePtr = Impaye.createWithoutData(impayelId);
    const q = new Parse.Query('Relance');
    q.equalTo('impaye', impayePtr);
    q.equalTo('statut', 'pending');
    q.limit(500);
    const relances = await q.find();

    for (const r of relances) {
      const d = r.get('dateEnvoi');
      if (d) {
        const nouvelle = new Date(d);
        nouvelle.setDate(nouvelle.getDate() + jours);
        r.set('dateEnvoi', nouvelle);
      }
    }
    if (relances.length) {
      await Parse.Object.saveAll(relances);
    }

    return { success: true, data: { count: relances.length, jours } };
  } catch (err) {
    console.error('suspend-facture error:', err);
    throw err;
  }
}
