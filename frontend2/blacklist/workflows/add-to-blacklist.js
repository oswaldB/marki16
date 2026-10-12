/**
 * Workflow add-to-blacklist — ajoute des contacts à la blacklist avec option suppression relances
 * params.contactIds: string[]
 * params.deleteRelances: boolean
 */
export async function execute(context, params) {
  const { contactIds, deleteRelances = false } = params;

  if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
    return { success: false, error: 'Aucun contact sélectionné' };
  }

  try {
    const Contact = Parse.Object.extend('Contact');
    const contactsToUpdate = [];

    for (const id of contactIds) {
      const contact = Contact.createWithoutData(id);
      contact.set('isBlacklisted', true);
      contact.set('blacklistedAt', new Date());
      contactsToUpdate.push(contact);
    }

    await Promise.all(contactsToUpdate.map(contact => contact.save()));

    let relancesDeleted = 0;
    if (deleteRelances) {
      const Relance = Parse.Object.extend('Relance');

      for (let i = 0; i < contactIds.length; i++) {
        const id = contactIds[i];
        try {
          const relanceQuery = new Parse.Query(Relance);
          relanceQuery.equalTo('contact', Contact.createWithoutData(id));
          const relances = await relanceQuery.find();

          if (relances.length > 0) {
            await Promise.all(relances.map(relance => relance.destroy()));
            relancesDeleted += relances.length;
          }

          // Mettre à jour le message de progression si possible
          if (context && context.progressMessage !== undefined) {
            context.progressMessage = `Suppression des relances (${i + 1}/${contactIds.length}) - ${relancesDeleted} supprimées`;
          }
        } catch (err) {
          console.error(`Erreur suppression relances pour ${id}:`, err);
        }
      }
    }

    return {
      success: true,
      data: {
        contactsAdded: contactIds.length,
        relancesDeleted,
      },
    };
  } catch (error) {
    console.error('Erreur add-to-blacklist workflow:', error);
    return {
      success: false,
      error: error.message || "Impossible d'ajouter le(s) contact(s) à la blacklist",
    };
  }
}
