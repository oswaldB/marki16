console.log('init.js loaded');

export async function execute(context, params) {
  try {
    const currentUser = Parse.User.current();
    if (currentUser) {
      return {
        success: true,
        data: { user: currentUser.toJSON() },
        redirect: '../dashboard/index.html',
      };
    }
    return { success: true, data: {} };
  } catch (err) {
    console.error('init error:', err);
    return { success: false, error: err.message || 'Erreur lors du chargement initial' };
  }
}
