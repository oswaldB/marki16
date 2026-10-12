export async function execute(context, params) {
  const { impayeId, contactId } = params;

  try {
    const Impaye = Parse.Object.extend('Impaye');

    // Récupérer l'impayé
    const impaye = await new Parse.Query(Impaye).get(impayeId);
    if (!impaye) {
      throw new Error('Impayé non trouvé');
    }

    // Récupérer le contact si non fourni
    let resolvedContactId = contactId;
    if (!resolvedContactId) {
      const contact = impaye.get('contact_relance') || impaye.get('payeur');
      resolvedContactId = contact?.id;
    }

    // Reset champs
    impaye.set('isBlacklisted', false);
    impaye.set('blacklistedAt', null);
    impaye.set('blacklistMotifType', null);
    impaye.set('blacklistMotif', null);

    await impaye.save();

    // Régénérer les relances du contact (cet impayé sera maintenant inclus)
    let regenerationResult = null;
    if (resolvedContactId) {
      try {
        regenerationResult = await Parse.Cloud.run('regenerateRelancesContact', {
          contactId: resolvedContactId
        });
      } catch (regenError) {
        console.error('Erreur régénération relances:', regenError);
      }
    }

    return {
      success: true,
      data: { impaye, regenerationResult },
      error: null
    };
  } catch (error) {
    console.error('Erreur réactivation impayé:', error);
    return { success: false, data: null, error: error.message || 'Une erreur est survenue' };
  }
}
