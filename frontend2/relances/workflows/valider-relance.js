export async function execute(context, params) {
  const { relanceId } = params;
  try {
    const Relance = Parse.Object.extend('Relance');
    const query = new Parse.Query(Relance);
    const relance = await query.get(relanceId);
    if (!relance) throw new Error('Relance introuvable');
    relance.set('valide', true);
    await relance.save();
    return { success: true, data: {} };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
