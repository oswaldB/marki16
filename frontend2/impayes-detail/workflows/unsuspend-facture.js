console.log('unsuspend-facture.js loaded');

export async function execute(context, params) {
  const { impayelId } = params;

  if (!impayelId) {
    throw new Error('ID impayé manquant');
  }

  try {
    const Impaye = Parse.Object.extend('Impaye');
    const impaye = await new Parse.Query(Impaye).get(impayelId);
    if (!impaye) {
      throw new Error('Impayé non trouvé');
    }

    impaye.set('isBlacklisted', false);
    impaye.set('blacklistedAt', null);
    impaye.set('blacklistMotifType', null);
    impaye.set('blacklistMotif', null);
    await impaye.save();

    const contact = impaye.get('contact_relance') || impaye.get('payeur');
    const contactId = contact?.id;
    if (contactId) {
      try {
        await Parse.Cloud.run('regenerateRelancesContact', { contactId });
      } catch (regenError) {
        console.error('Erreur régénération relances:', regenError);
      }
    }

    return { success: true };
  } catch (err) {
    console.error('unblacklist error:', err);
    throw err;
  }
}
