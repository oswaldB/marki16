export async function execute(context, params) {
  try {
    const type = params.type || 'relances';
    const seq = new Parse.Object('Sequence');
    seq.set('nom', `Nouvelle ${type === 'relances' ? 'Relance' : 'Suivi'}`);
    seq.set('type', type);
    seq.set('emails', []);
    seq.set('regles', []);
    seq.set('regles_type', 'incluant');
    seq.set('lien_paiement', '');
    await seq.save();

    return { success: true, data: { id: seq.id, type: seq.get('type') } };
  } catch (error) {
    console.error('Erreur création séquence:', error);
    return { success: false, error: error.message || 'Erreur lors de la création' };
  }
}
