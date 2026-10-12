// Workflow : init — Charge la liste des utilisateurs via Parse Cloud
export async function execute(context, params) {
  try {
    const users = await Parse.Cloud.run('listUsers');
    return { success: true, data: users || [] };
  } catch (err) {
    console.error('init.js error:', err);
    return { success: false, error: err.message || 'Erreur lors du chargement des utilisateurs' };
  }
}
