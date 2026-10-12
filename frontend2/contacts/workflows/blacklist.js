/**
 * Workflow blacklist — toggle le statut blacklist d'un contact
 * params.contactId: string
 * params.isBlacklisted: boolean
 */
export async function execute(context, params) {
  const { contactId, isBlacklisted } = params;

  if (!contactId) {
    return { success: false, error: 'ID du contact manquant' };
  }

  try {
    const Contact = Parse.Object.extend('Contact');
    const contact = Contact.createWithoutData(contactId);
    contact.set('isBlacklisted', isBlacklisted);
    contact.set('blacklistedAt', isBlacklisted ? new Date() : null);
    await contact.save();

    return {
      success: true,
      data: { contactId, isBlacklisted }
    };
  } catch (error) {
    console.error('Erreur blacklist workflow:', error);
    return {
      success: false,
      error: error.message || 'Impossible de mettre à jour la blacklist'
    };
  }
}
