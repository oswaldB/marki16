/**
 * Workflow set-email-force — définit ou crée un email de relance pour un contact
 * params.contactId: string
 * params.email: string
 * params.emailRelanceId: string (optionnel — ID d'un contact existant à utiliser comme pointeur)
 * params.createNew: boolean — si true, crée un nouveau contact de relance
 * params.name: string — nom pour le nouveau contact de relance (si createNew)
 */
export async function execute(context, params) {
  const { contactId, email, emailRelanceId, createNew, name } = params;

  if (!contactId) {
    return { success: false, error: 'ID du contact manquant' };
  }

  try {
    const Contact = Parse.Object.extend('Contact');
    const contact = Contact.createWithoutData(contactId);

    let contactRelancePtr = null;
    let finalEmailRelanceId = emailRelanceId;

    if (createNew) {
      // Créer un nouveau contact de relance
      const newContactRelance = new Contact();
      newContactRelance.set('email', email);
      newContactRelance.set('nom', name || email);
      newContactRelance.set('estActif', true);
      newContactRelance.set('nombreUtilisations', 1);
      await newContactRelance.save();

      contactRelancePtr = Contact.createWithoutData(newContactRelance.id);
      finalEmailRelanceId = newContactRelance.id;
    } else if (emailRelanceId) {
      // Utiliser un contact existant comme pointeur
      contactRelancePtr = Contact.createWithoutData(emailRelanceId);
    } else {
      // Aucun ID fourni — créer implicitement
      const newContactRelance = new Contact();
      newContactRelance.set('email', email);
      newContactRelance.set('nom', name || email);
      newContactRelance.set('estActif', true);
      newContactRelance.set('nombreUtilisations', 1);
      await newContactRelance.save();

      contactRelancePtr = Contact.createWithoutData(newContactRelance.id);
      finalEmailRelanceId = newContactRelance.id;
    }

    contact.set('email_relance', contactRelancePtr);
    await contact.save();

    // Créer une activité pour tracer
    try {
      const Activite = Parse.Object.extend('Activite');
      const activite = new Activite();
      activite.set('type', createNew ? 'email_relance_cree' : 'email_relance_defini');
      activite.set('details', `Email de relance défini: ${email}`);
      activite.set('contactRelance', contactRelancePtr);
      activite.set('contact', Contact.createWithoutData(contactId));
      await activite.save();
    } catch (activiteError) {
      console.warn('Activité non enregistrée:', activiteError);
    }

    // Mettre à jour les relances en attente si un ID existant est utilisé
    if (!createNew && emailRelanceId) {
      try {
        await mettreAJourRelancesAvecEmailRelance(emailRelanceId, email);
      } catch (relanceError) {
        console.warn('Relances non mises à jour:', relanceError);
      }
    }

    return {
      success: true,
      data: { contactId, email, emailRelanceId: finalEmailRelanceId }
    };
  } catch (error) {
    console.error('Erreur set-email-force workflow:', error);
    return {
      success: false,
      error: error.message || 'Impossible de définir l\'email de relance'
    };
  }
}

async function mettreAJourRelancesAvecEmailRelance(contactRelanceId, email) {
  const Contact = Parse.Object.extend('Contact');
  const Relance = Parse.Object.extend('Relance');

  // Récupérer le contact de relance
  const contactRelanceQuery = new Parse.Query(Contact);
  const contactRelance = await contactRelanceQuery.get(contactRelanceId);

  // Trouver les relances en attente
  const relanceQuery = new Parse.Query(Relance);
  relanceQuery.equalTo('statut', 'pending');
  const relances = await relanceQuery.find();

  const relancesAMettreAJour = [];
  const activites = [];

  for (const relance of relances) {
    const ancienEmail = relance.get('to');
    if (ancienEmail && ancienEmail !== email) {
      const Activite = Parse.Object.extend('Activite');
      const activite = new Activite();
      activite.set('type', 'email_relance_remplace');
      activite.set('details', `Email de relance remplacé: ${ancienEmail} → ${email}`);
      activite.set('contactRelance', contactRelance);
      activite.set('relance', relance);
      activites.push(activite);

      relance.set('to', email);
      relance.set('contactRelance', contactRelance);
      relancesAMettreAJour.push(relance);
    }
  }

  if (relancesAMettreAJour.length > 0) {
    if (activites.length > 0) {
      await Promise.all(activites.map(a => a.save()));
    }
    await Promise.all(relancesAMettreAJour.map(r => r.save()));

    contactRelance.set('nombreUtilisations', (contactRelance.get('nombreUtilisations') || 0) + relancesAMettreAJour.length);
    contactRelance.set('dateDerniereUtilisation', new Date());
    await contactRelance.save();
  }
}
