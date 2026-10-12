export async function execute(context, params) {
  try {
    const p = params.profile;
    p.set('nom', params.nom);
    p.set('nom_affiche', params.nom_affiche || '');
    p.set('host', params.host);
    p.set('port', Number(params.port) || 587);
    p.set('username', params.username);
    p.set('password', params.password);
    p.set('email_from', params.email_from);
    p.set('signature_html', params.signature_html || '');
    await p.save();
    return { success: true, data: { profile: p } };
  } catch (error) {
    console.error('Erreur edit-profil workflow:', error);
    return { success: false, error: error.message };
  }
}
