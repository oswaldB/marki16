export async function execute(context, params) {
  const { selection, smtpProfilId } = params;
  try {
    const res = await Parse.Cloud.run('generateRelancesManuelles', {
      selection,
      smtpProfilId,
    });
    const suivisCrees = res?.suivisCrees ?? 0;
    const erreurs = res?.erreurs || [];
    return {
      success: true,
      data: {
        suivisCrees,
        erreurs,
        raw: res,
      },
    };
  } catch (error) {
    console.error('create-relance.js error:', error);
    return { success: false, error: error.message };
  }
}
