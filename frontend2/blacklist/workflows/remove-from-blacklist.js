/**
 * Workflow remove-from-blacklist — retire un ou plusieurs contacts de la blacklist
 * params.contactIds: string[]
 */
export async function execute(context, params) {
  const { contactIds } = params;

  if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
    return { success: false, error: 'Aucun contact sélectionné' };
  }

  try {
    const Contact = Parse.Object.extend('Contact');
    const contactsToUpdate = [];

    for (const id of contactIds) {
      const contact = Contact.createWithoutData(id);
      contact.set('isBlacklisted', false);
      contact.set('blacklistedAt', null);
      contactsToUpdate.push(contact);
    }

    await Promise.all(contactsToUpdate.map(contact => contact.save()));

    return {
      success: true,
      data: { contactIds, count: contactIds.length },
    };
  } catch (error) {
    console.error('Erreur remove-from-blacklist workflow:', error);
    return {
      success: false,
      error: error.message || 'Impossible de retirer le(s) contact(s) de la blacklist',
    };
  }
}
