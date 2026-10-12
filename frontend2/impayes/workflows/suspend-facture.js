export async function execute(context, params) {
  try {
    const { objectId } = params;
    const Impaye = Parse.Object.extend('Impaye');
    const query = new Parse.Query(Impaye);
    const obj = await query.get(objectId);
    obj.set('statut', 'payé');
    obj.set('facture_soldee', true);
    await obj.save();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
