// Workflow : create-user — Crée un nouvel utilisateur via Parse Cloud
export async function execute(context, params) {
  try {
    const { email, password, makeAdmin } = params;
    await Parse.Cloud.run('createUser', {
      email,
      password,
      makeAdmin,
    });
    return { success: true };
  } catch (err) {
    console.error('create-user.js error:', err);
    return { success: false, error: err.message || 'Erreur lors de la création' };
  }
}
