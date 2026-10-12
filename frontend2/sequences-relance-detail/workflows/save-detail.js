export async function execute(ctx, params) {
  try {
    const { sequence, nom, emails, groupesRegles, attributionAutomatique, validationObligatoire } = params;
    sequence.set('nom', nom);
    sequence.set('type', 'relances');
    sequence.set('emails', emails.map(email => {
      const { _key, ...rest } = email;
      return rest;
    }));
    sequence.set('groupes_regles', groupesRegles);
    sequence.set('attribution_automatique', attributionAutomatique);
    sequence.set('validation_obligatoire', validationObligatoire);
    sequence.unset('regles');
    sequence.unset('regles_type');
    await sequence.save();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || "Échec de l'enregistrement" };
  }
}
