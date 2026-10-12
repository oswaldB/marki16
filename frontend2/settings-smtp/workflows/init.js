export async function execute(context, params) {
  try {
    const query = new Parse.Query('SmtpProfile');
    query.ascending('nom');
    query.limit(1000);
    const profiles = await query.find();

    const formatted = profiles.map(p => ({
      _parse: p,
      id: p.id,
      nom: p.get('nom') || '—',
      host: p.get('host') || '—',
      email_from: p.get('email_from') || '—',
    }));

    return { success: true, data: { profiles: formatted } };
  } catch (error) {
    console.error('Erreur init workflow:', error);
    return { success: false, error: error.message };
  }
}
