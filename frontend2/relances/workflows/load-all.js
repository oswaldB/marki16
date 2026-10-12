export async function execute(context, params) {
  const { filtreStatut, filtreSequence } = params;
  try {
    const q = new Parse.Query('Relance');
    q.include('impaye');
    q.include('impayes');
    q.include('contact');
    q.include('sequence');
    q.descending('date_envoi_prevue');
    q.limit(500);

    if (filtreStatut && filtreStatut !== 'tous') {
      q.equalTo('statut', filtreStatut);
    }

    if (filtreSequence && filtreSequence !== 'tous') {
      const ptr = Parse.Object.fromJSON({ __type: 'Pointer', className: 'Sequence', objectId: filtreSequence });
      q.equalTo('sequence', ptr);
    }

    const results = await q.find();
    return { success: true, data: { relancesRaw: results } };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
