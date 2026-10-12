console.log('submit.js loaded');

export async function execute(context, params) {
  const { username, password } = params;

  if (!username || !password) {
    return { success: false, error: 'Veuillez renseigner tous les champs.' };
  }

  try {
    const loggedUser = await Parse.User.logIn(username, password);
    return {
      success: true,
      data: { user: loggedUser.toJSON() },
      redirect: '../dashboard/index.html',
    };
  } catch (err) {
    console.error('submit error:', err);
    return { success: false, error: err.message || 'Identifiants incorrects' };
  }
}
