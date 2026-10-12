console.log('change-sequence.js loaded');

export async function execute(context, params) {
  const { impayelId, action, sequenceId, contactId } = params;

  if (!impayelId) {
    throw new Error('ID impayé manquant');
  }

  try {
    const Impaye = Parse.Object.extend('Impaye');

    if (action === 'assign') {
      if (!sequenceId) throw new Error('ID séquence manquant');
      const impaye = await Impaye.createWithoutData(impayelId).fetch();
      const Sequence = Parse.Object.extend('Sequence');
      const sequence = Sequence.createWithoutData(sequenceId);
      impaye.set('sequence', sequence);
      await impaye.save();
      const seq = await new Parse.Query('Sequence').get(sequenceId);
      return { success: true, data: { sequenceActive: seq ? { id: seq.id, nom: seq.get('nom') } : null } };
    }

    if (action === 'remove') {
      const impaye = await Impaye.createWithoutData(impayelId).fetch();
      impaye.unset('sequence');
      await impaye.save();
      return { success: true, data: { sequenceActive: null } };
    }

    if (action === 'setEmailRelance') {
      if (!contactId) throw new Error('ID contact manquant');
      const impayeToUpdate = Impaye.createWithoutData(impayelId);
      const Contact = Parse.Object.extend('Contact');
      const contactPointer = Contact.createWithoutData(contactId);
      impayeToUpdate.set('email_relance', contactPointer);
      await impayeToUpdate.save();

      // Mettre à jour les relances en attente
      const Relance = Parse.Object.extend('Relance');
      const qRelances = new Parse.Query(Relance);
      qRelances.equalTo('impaye', impayeToUpdate);
      qRelances.equalTo('statut', 'pending');
      const pendingRelances = await qRelances.find();

      for (const relance of pendingRelances) {
        relance.set('to', '');
      }
      if (pendingRelances.length) {
        await Parse.Object.saveAll(pendingRelances);
      }
      return { success: true };
    }

    if (action === 'removeEmailRelance') {
      const impayeToUpdate = Impaye.createWithoutData(impayelId);
      impayeToUpdate.unset('email_relance');
      await impayeToUpdate.save();

      const Relance = Parse.Object.extend('Relance');
      const qRelances = new Parse.Query(Relance);
      qRelances.equalTo('impaye', impayeToUpdate);
      qRelances.equalTo('statut', 'pending');
      const pendingRelances = await qRelances.find();

      for (const relance of pendingRelances) {
        relance.set('to', '');
      }
      if (pendingRelances.length) {
        await Parse.Object.saveAll(pendingRelances);
      }
      return { success: true };
    }

    throw new Error('Action non reconnue');
  } catch (err) {
    console.error('change-sequence error:', err);
    throw err;
  }
}
