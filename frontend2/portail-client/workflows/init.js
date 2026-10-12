// Parse SDK global — PAS d'import
// Pas d'appel Parse ici : cet écran public charge un PDF via URL signée

const API_BASE_URL = 'https://adti.markidiags.com/api';

export async function execute(context, params) {
  try {
    // Extraire l'id depuis le pathname (ex: /espace/abc123 → abc123)
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const id = pathParts[pathParts.length - 1] || null;

    // Extraire sig et expires des query params
    const urlParams = new URLSearchParams(window.location.search);
    const sig = urlParams.get('sig');
    const expires = urlParams.get('expires');

    // Valider la présence des paramètres obligatoires
    if (!id || !sig || !expires) {
      return {
        success: false,
        error: 'Lien invalide. Veuillez réutiliser le lien envoyé par email.',
      };
    }

    // Vérifier l'expiration (timestamp UNIX en secondes)
    const now = Math.floor(Date.now() / 1000);
    if (parseInt(expires, 10) < now) {
      return {
        success: false,
        error: 'Ce lien a expiré. Veuillez réutiliser le lien envoyé par email.',
      };
    }

    // Construire l'URL du PDF
    const pdfUrl = `${API_BASE_URL}/pdf/${id}?sig=${encodeURIComponent(sig)}&expires=${encodeURIComponent(expires)}`;

    return {
      success: true,
      data: { id, sig, expires, pdfUrl },
    };
  } catch (error) {
    console.error('Init workflow error:', error);
    return { success: false, error: error.message };
  }
}
