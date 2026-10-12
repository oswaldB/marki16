console.log('blacklist-facture.js loaded');

export async function execute(context, params) {
  const { impayelId, motifType, motifDetail } = params;

  if (!impayelId) {
    throw new Error('ID impayé manquant');
  }
  if (!motifType && !motifDetail) {
    throw new Error('Motif de blacklist obligatoire');
  }

  try {
    const Impaye = Parse.Object.extend('Impaye');
    const impaye = await new Parse.Query(Impaye).get(impayelId);
    if (!impaye) {
      throw new Error('Impayé non trouvé');
    }

    impaye.set('isBlacklisted', true);
    impaye.set('blacklistedAt', new Date());
    impaye.set('blacklistMotifType', motifType || null);
    impaye.set('blacklistMotif', motifDetail || null);
    await impaye.save();

    const contact = impaye.get('contact_relance') || impaye.get('payeur');
    const contactId = contact?.id;
    if (contactId) {
      try {
        await Parse.Cloud.run('regenerateRelancesContact', {
          contactId,
          excludeImpayeId: impayelId,
        });
      } catch (regenError) {
        console.error('Erreur régénération relances:', regenError);
      }
    }

    return { success: true };
  } catch (err) {
    console.error('blacklist error:', err);
    throw err;
  }
}
