export async function execute(context, params) {
  try {
    const seq = params.sequence;
    if (!seq) {
      return { success: false, error: 'Séquence manquante' };
    }
    await seq.destroy();
    return { success: true };
  } catch (error) {
    console.error('Erreur suppression séquence:', error);
    return { success: false, error: error.message || 'Erreur lors de la suppression' };
  }
}
