// Parse SDK global — PAS d'import

export async function execute(context, params) {
  try {
    const data = await Parse.Cloud.run('getAuditPhases');
    return { success: true, data };
  } catch (error) {
    console.error('Load-all workflow error:', error);
    return { success: false, error: error.message || 'Impossible de charger les données d\'audit' };
  }
}
