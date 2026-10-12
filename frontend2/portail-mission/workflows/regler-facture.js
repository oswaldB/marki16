console.log('regler-facture.js loaded');

export async function execute(context, params) {
  const { impaye } = params;

  if (!impaye) {
    return { success: false, error: 'Données facture manquantes' };
  }

  try {
    let url = null;

    // Priorité 1: lien_paiement direct
    if (impaye.lien_paiement) {
      url = impaye.lien_paiement;
    }
    // Priorité 2: liens_paiement (array)
    else if (impaye.liens_paiement && impaye.liens_paiement.length > 0) {
      url = impaye.liens_paiement[0].url;
    }
    // Priorité 3: lien de paiement par défaut (SystemPay)
    else if (impaye.reste_a_payer && impaye.nfacture) {
      const amount = Math.round((impaye.reste_a_payer || 0) * 100);
      url = `https://paiement.systempay.fr/vads-site/EXIM?vads_amount=${amount}&vads_order_id=${encodeURIComponent(impaye.nfacture || impaye.id)}&vads_cust_id=${encodeURIComponent(impaye.numero_dossier || '')}`;
    }

    if (!url) {
      return { success: false, error: 'Aucun lien de paiement disponible' };
    }

    return { success: true, data: { url } };
  } catch (err) {
    console.error('regler-facture error:', err);
    return { success: false, error: err.message || 'Impossible de générer le lien de paiement' };
  }
}
