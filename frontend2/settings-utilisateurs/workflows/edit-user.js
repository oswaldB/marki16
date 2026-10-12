// Workflow : edit-user — Actions sur un utilisateur existant (mot de passe, rôle, suppression)
export async function execute(context, params) {
  try {
    const { action, userId, newPassword, makeAdmin } = params;

    if (action === 'updatePassword') {
      await Parse.Cloud.run('updateUserPassword', {
        userId,
        newPassword,
      });
      return { success: true };
    }

    if (action === 'setAdminRole') {
      await Parse.Cloud.run('setAdminRole', {
        userId,
        makeAdmin,
      });
      return { success: true };
    }

    if (action === 'deleteUser') {
      await Parse.Cloud.run('deleteUser', {
        userId,
      });
      return { success: true };
    }

    return { success: false, error: 'Action inconnue : ' + action };
  } catch (err) {
    console.error('edit-user.js error:', err);
    return { success: false, error: err.message || 'Erreur lors de la modification' };
  }
}
