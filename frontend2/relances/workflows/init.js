export async function execute(context, params) {
  try {
    // Séquences
    const seqQuery = new Parse.Query('Sequence');
    seqQuery.ascending('nom');
    seqQuery.limit(200);
    const sequences = await seqQuery.find();

    // Relances initiales
    const relQuery = new Parse.Query('Relance');
    relQuery.include('impaye');
    relQuery.include('impayes');
    relQuery.include('contact');
    relQuery.include('sequence');
    relQuery.descending('date_envoi_prevue');
    relQuery.limit(500);
    const relResults = await relQuery.find();

    // Options dynamiques statut_relance
    let statutOptions = [];
    try {
      const optQuery = new Parse.Query('OptionsDynamiques');
      optQuery.equalTo('type', 'statut_relance');
      const optResult = await optQuery.first();
      if (optResult) {
        const valeurs = optResult.get('valeurs') || [];
        statutOptions = [
          { label: 'Tous', value: 'tous' },
          ...valeurs.map(v => ({
            label: v.replace(/_/g, ' ').charAt(0).toUpperCase() + v.slice(1),
            value: v
          }))
        ];
      }
    } catch (e) {
      console.warn('Failed to load dynamic statut options:', e);
    }

    if (statutOptions.length === 0) {
      statutOptions = [
        { label: 'Tous', value: 'tous' },
        { label: 'En attente', value: 'pending' },
        { label: 'Envoyé', value: 'envoyé' },
        { label: 'Échec', value: 'échec' },
        { label: 'Annulé', value: 'annulé' },
      ];
    }

    // Liens PDF signés
    const pdfLinks = {};
    const uniqueImpayeIds = [...new Set(relResults.flatMap(r => {
      const impayes = r.get('impayes') || [];
      const impaye = r.get('impaye');
      const ids = [];
      for (const i of impayes) {
        if (i && typeof i !== 'string' && i.id) ids.push(i.id);
      }
      if (impaye && typeof impaye !== 'string' && impaye.id) ids.push(impaye.id);
      return ids;
    }))];

    for (const impayeId of uniqueImpayeIds) {
      try {
        const response = await Parse.Cloud.run('generatePdfLink', { impayeId });
        pdfLinks[impayeId] = response.url;
      } catch (err) {
        pdfLinks[impayeId] = null;
      }
    }

    return {
      success: true,
      data: {
        sequences: sequences.map(s => ({ id: s.id, nom: s.get('nom') })),
        relancesRaw: relResults,
        pdfLinks,
        statutOptions,
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
