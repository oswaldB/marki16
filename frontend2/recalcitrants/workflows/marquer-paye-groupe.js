export async function execute(context, params) {
  try {
    const Impaye = Parse.Object.extend('Impaye');
    const objs = params.ids.map((id) => {
      const o = Impaye.createWithoutData(id);
      o.set('statut', 'payé');
      o.set('facture_soldee', true);
      o.set('reste_a_payer', 0);
      return o;
    });
    await Parse.Object.saveAll(objs);
    return { success: true };
  } catch (error) {
    console.error('Erreur marquer-paye-groupe:', error);
    return { success: false, error: error.message };
  }
}
