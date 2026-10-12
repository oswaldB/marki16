export async function execute(context, params) {
  const {
    relanceId,
    dateEnvoi,
    to,
    cc,
    objet,
    corps,
    applyToAllFollowing,
    currentImpayelIds,
    currentDateEnvoi,
    nouveauTo,
  } = params;

  try {
    const Relance = Parse.Object.extend('Relance');
    const query = new Parse.Query(Relance);
    const relance = await query.get(relanceId);
    if (!relance) throw new Error('Relance introuvable');

    if (dateEnvoi) {
      relance.set('dateEnvoi', new Date(dateEnvoi));
    }
    relance.set('to', to);
    relance.set('cc', cc || '');
    relance.set('objet', objet || '');
    if (corps !== undefined) relance.set('corps', corps);

    await relance.save();

    // Appliquer aux relances suivantes si demandé
    if (applyToAllFollowing && currentImpayelIds && currentImpayelIds.length > 0 && nouveauTo && currentDateEnvoi) {
      const followQuery = new Parse.Query(Relance);
      followQuery.greaterThan('date_envoi_prevue', new Date(currentDateEnvoi));
      followQuery.notEqualTo('objectId', relanceId);
      followQuery.limit(500);
      const suivantes = await followQuery.find();

      const aMettreAJour = suivantes.filter(r => {
        const impayes = r.get('impayes') || [];
        const impaye = r.get('impaye');
        const ids = [];
        for (const i of impayes) {
          if (i && typeof i !== 'string' && i.id) ids.push(i.id);
        }
        if (impaye && typeof impaye !== 'string' && impaye.id) ids.push(impaye.id);
        return currentImpayelIds.some(cid => ids.includes(cid));
      });

      if (aMettreAJour.length > 0) {
        await Promise.all(aMettreAJour.map(async (r) => {
          r.set('to', nouveauTo);
          await r.save();
        }));
      }
    }

    return { success: true, data: {} };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
