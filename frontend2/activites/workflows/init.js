export async function execute(context, params) {
  try {
    const q = new Parse.Query('Activite');
    q.descending('timestamp');
    q.limit(200);
    const results = await q.find();

    const activites = results.map(r => ({
      objectId: r.id,
      timestamp: r.get('timestamp'),
      type: r.get('type') ?? 'unknown',
      operation: r.get('operation') ?? 'unknown',
      nfacture: r.get('nfacture'),
      impaye_id: r.get('impaye_id'),
      montant: r.get('montant'),
      payeur_nom: r.get('payeur_nom'),
      trigger: r.get('trigger') ?? 'cron',
      error_message: r.get('error_message'),
    }));

    return { success: true, data: { activites } };
  } catch (error) {
    console.error('Erreur init activites:', error);
    return { success: false, error: error.message };
  }
}
