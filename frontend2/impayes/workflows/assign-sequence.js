export async function execute(context, params) {
  try {
    const { objectIds, sequenceId } = params;
    const Sequence = Parse.Object.extend('Sequence');
    const sequenceObj = Sequence.createWithoutData(sequenceId);

    const results = [];

    for (const objectId of objectIds) {
      const Impaye = Parse.Object.extend('Impaye');
      const query = new Parse.Query(Impaye);
      const impayeObj = await query.get(objectId);
      impayeObj.set('sequence', sequenceObj);
      await impayeObj.save();

      const Relance = Parse.Object.extend('Relance');
      const relance = new Relance();
      const impayePtr = Parse.Object.extend('Impaye').createWithoutData(objectId);
      const sequencePtr = Parse.Object.extend('Sequence').createWithoutData(sequenceId);
      relance.set('impaye', impayePtr);
      relance.set('sequence', sequencePtr);
      relance.set('statut', 'En attente de generation');
      await relance.save();

      results.push({ objectId, success: true });
    }

    return { success: true, data: { results, count: results.length } };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
