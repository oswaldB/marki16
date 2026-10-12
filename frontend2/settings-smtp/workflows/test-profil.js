export async function execute(context, params) {
  try {
    const response = await fetch('https://adti.markidiags.com/api/smtp/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        host: params.host,
        port: params.port,
        username: params.username,
        password: params.password,
      }),
    });
    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error('Erreur test-profil workflow:', error);
    return { success: false, error: error.message };
  }
}
