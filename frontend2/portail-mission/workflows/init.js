console.log('init.js loaded');

export async function execute(context, params) {
  const { contactId, sig, expires } = params;

  if (!contactId) {
    return { success: false, error: 'ID contact manquant dans l\'URL' };
  }
  if (!sig || !expires) {
    return { success: false, error: 'Lien invalide. Veuillez réutiliser le lien reçu par email.' };
  }

  try {
    const result = await Parse.Cloud.run('getContactImpayes', {
      contactId,
      sig,
      expires,
    });

    if (result && result.impayes) {
      return {
        success: true,
        data: {
          impayes: result.impayes,
          contactId,
          sig,
          expires,
        }
      };
    }

    return { success: true, data: { impayes: [], contactId, sig, expires } };
  } catch (err) {
    console.error('init error:', err);
    return { success: false, error: err.message || 'Impossible de charger les factures' };
  }
}
