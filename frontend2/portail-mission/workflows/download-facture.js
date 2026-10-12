console.log('download-facture.js loaded');

export async function execute(context, params) {
  const { impayeId } = params;

  if (!impayeId) {
    return { success: false, error: 'ID facture manquant' };
  }

  try {
    const url = `/redirect-pdf/${impayeId}`;
    return { success: true, data: { url } };
  } catch (err) {
    console.error('download-facture error:', err);
    return { success: false, error: err.message || 'Impossible de générer le lien PDF' };
  }
}
