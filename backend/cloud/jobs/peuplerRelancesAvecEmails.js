// backend/cloud/jobs/peuplerRelancesAvecEmails.js
// Job pour peupler les relances avec les contacts de type "email_relance"

module.exports = async function peuplerRelancesAvecEmails() {
  if (typeof Parse === 'undefined') {
    throw new Error('Parse SDK not initialized. This job must run in a Parse Cloud environment.');
  }

  console.log('[peuplerRelancesAvecEmails] Début du peuplement des relances avec contacts de relance...');

  const startedAt = new Date();
  const stats = {
    relancesTraitees: 0,
    contactsRelanceAppliques: 0,
    erreurs: 0
  };

  try {
    // 1. Récupérer tous les contacts qui sont utilisés comme emails de relance
    const Contact = Parse.Object.extend('Contact');
    const contactRelanceQuery = new Parse.Query(Contact);
    contactRelanceQuery.equalTo('estActif', true);
    contactRelanceQuery.exists('email');
    contactRelanceQuery.notEqualTo('email', '');
    contactRelanceQuery.exists('nombreUtilisations');
    contactRelanceQuery.limit(1000);

    const contactsRelance = await contactRelanceQuery.find({ useMasterKey: true });
    console.log(`[peuplerRelancesAvecEmails] ${contactsRelance.length} contacts utilisés comme emails de relance trouvés`);

    // 2. Pour chaque contact de relance, trouver les relances correspondantes
    for (const contactRelance of contactsRelance) {
      const emailAddress = contactRelance.get('email');
      if (!emailAddress) continue;

      try {
        // Trouver les relances avec cet email (ou un email similaire)
        const Relance = Parse.Object.extend('Relance');
        const relanceQuery = new Parse.Query(Relance);
        relanceQuery.equalTo('statut', 'pending');
        relanceQuery.equalTo('to', emailAddress);
        relanceQuery.limit(100);

        const relances = await relanceQuery.find({ useMasterKey: true });
        console.log(`[peuplerRelancesAvecEmails] ${relances.length} relances trouvées pour ${emailAddress}`);

        // 3. Mettre à jour chaque relance avec le contact de relance
        const relancesAMettreAJour = [];
        const activites = [];

        for (const relance of relances) {
          stats.relancesTraitees++;
          
          // Vérifier si la relance a déjà un contact de relance associé
          const aDejaContactRelance = relance.get('contactRelance') !== undefined;
          
          if (!aDejaContactRelance) {
            // Associer le contact de relance à la relance
            relance.set('contactRelance', contactRelance);
            relancesAMettreAJour.push(relance);
            
            // Créer une activité pour tracer l'association
            const Activite = Parse.Object.extend('Activite');
            const activite = new Activite();
            activite.set('type', 'email_relance_associe');
            activite.set('details', `Contact de relance associé à la relance: ${emailAddress}`);
            activite.set('contactRelance', contactRelance);
            activite.set('relance', relance);
            activites.push(activite);
            
            stats.contactsRelanceAppliques++;
          }
        }

        // Sauvegarder les modifications par lots
        if (relancesAMettreAJour.length > 0) {
          await Parse.Object.saveAll(relancesAMettreAJour, { useMasterKey: true });
        }
        
        if (activites.length > 0) {
          await Parse.Object.saveAll(activites, { useMasterKey: true });
        }
        
        // Mettre à jour les statistiques du contact de relance
        contactRelance.set('nombreUtilisations', (contactRelance.get('nombreUtilisations') || 0) + relancesAMettreAJour.length);
        contactRelance.set('dateDerniereUtilisation', new Date());
        await contactRelance.save(null, { useMasterKey: true });
        
        console.log(`[peuplerRelancesAvecEmails] ${relancesAMettreAJour.length} relances mises à jour pour ${emailAddress}`);
        
      } catch (error) {
        stats.erreurs++;
        console.error(`[peuplerRelancesAvecEmails] Erreur pour ${emailAddress}:`, error.message);
      }
    }

    console.log(`[peuplerRelancesAvecEmails] Peuplement terminé:`, stats);

    try {
      const finishedAt = new Date();
      const log = new Parse.Object('PeuplementLog');
      log.set('startedAt', startedAt);
      log.set('finishedAt', finishedAt);
      log.set('durationMs', finishedAt - startedAt);
      log.set('trigger', 'cron');
      log.set('status', stats.erreurs === 0 ? 'success' : (stats.contactsRelanceAppliques > 0 ? 'partial' : 'error'));
      log.set('relances_traitees', stats.relancesTraitees);
      log.set('contacts_relance_appliques', stats.contactsRelanceAppliques);
      log.set('erreurs', stats.erreurs);
      await log.save(null, { useMasterKey: true });
    } catch (logErr) {
      console.error('[peuplerRelancesAvecEmails] Impossible d\'écrire le PeuplementLog:', logErr.message);
    }

    return stats;

  } catch (error) {
    console.error('[peuplerRelancesAvecEmails] Erreur critique:', error);
    try {
      const log = new Parse.Object('PeuplementLog');
      log.set('startedAt', startedAt);
      log.set('finishedAt', new Date());
      log.set('trigger', 'cron');
      log.set('status', 'error');
      log.set('error', error.message);
      await log.save(null, { useMasterKey: true });
    } catch (logErr) {
      console.error('[peuplerRelancesAvecEmails] Impossible d\'écrire le PeuplementLog d\'erreur:', logErr.message);
    }
    throw error;
  }
};
