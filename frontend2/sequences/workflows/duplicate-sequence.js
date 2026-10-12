export async function execute(context, params) {
  try {
    const originalSeq = params.sequence;
    if (!originalSeq) {
      return { success: false, error: 'Séquence manquante' };
    }

    const newSeq = new Parse.Object('Sequence');
    newSeq.set('nom', `${originalSeq.get('nom')} (Copie)`);
    newSeq.set('type', originalSeq.get('type'));
    newSeq.set('emails', originalSeq.get('emails') || []);
    newSeq.set('regles', originalSeq.get('regles') || []);
    newSeq.set('regles_type', originalSeq.get('regles_type'));
    newSeq.set('lien_paiement', originalSeq.get('lien_paiement') || '');
    newSeq.set('publiee', false);
    await newSeq.save();

    return { success: true, data: { id: newSeq.id, type: newSeq.get('type') } };
  } catch (error) {
    console.error('Erreur duplication séquence:', error);
    return { success: false, error: error.message || 'Erreur lors de la duplication' };
  }
}
