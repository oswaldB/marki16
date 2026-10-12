export async function execute(context, params) {
  try {
    const Impaye = Parse.Object.extend('Impaye');
    const o = Impaye.createWithoutData(params.id);
    o.set('statut', 'payé');
    o.set('facture_soldee', true);
    o.set('reste_a_payer', 0);
    await o.save();
    return { success: true };
  } catch (error) {
    console.error('Erreur marquer-paye:', error);
    return { success: false, error: error.message };
  }
}
