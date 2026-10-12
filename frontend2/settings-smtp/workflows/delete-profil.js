export async function execute(context, params) {
  try {
    await params.profile.destroy();
    return { success: true };
  } catch (error) {
    console.error('Erreur delete-profil workflow:', error);
    return { success: false, error: error.message };
  }
}
