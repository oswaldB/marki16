export async function execute(context, params) {
  const { relanceIds } = params;
  try {
    const Relance = Parse.Object.extend('Relance');
    await Promise.all(relanceIds.map(async (id) => {
      const query = new Parse.Query(Relance);
      const relance = await query.get(id);
      if (relance) {
        relance.set('statut', 'annulé');
        await relance.save();
      }
    }));
    return { success: true, data: { count: relanceIds.length } };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
