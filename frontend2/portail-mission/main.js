import Alpine from 'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/module.esm.js';
import { execute as initExecute } from './workflows/init.js';
import { execute as loadDetailExecute } from './workflows/load-detail.js';
import { execute as downloadFactureExecute } from './workflows/download-facture.js';
import { execute as reglerFactureExecute } from './workflows/regler-facture.js';

window.workflows = {
  'init': { execute: initExecute },
  'load-detail': { execute: loadDetailExecute },
  'download-facture': { execute: downloadFactureExecute },
  'regler-facture': { execute: reglerFactureExecute },
};

Alpine.data('portailmissionPage', () => ({
  loading: true,
  erreur: null,
  impayes: [],

  contactId: null,
  impayeId: null,
  sig: null,
  expires: null,

  init() {
    this.loadInitialData();
  },

  async loadInitialData() {
    this.loading = true;
    this.erreur = null;

    const urlParams = new URLSearchParams(window.location.search);
    this.contactId = urlParams.get('contactId');
    this.impayeId = urlParams.get('impayeId');
    this.sig = urlParams.get('sig');
    this.expires = urlParams.get('expires');

    // Vérifier token
    if (!this.sig || !this.expires) {
      this.erreur = 'Lien invalide. Veuillez réutiliser le lien reçu par email.';
      this.loading = false;
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    if (parseInt(this.expires) < now) {
      this.erreur = 'Ce lien a expiré. Veuillez réutiliser le lien reçu par email.';
      this.loading = false;
      return;
    }

    try {
      const result = await this.runWorkflow('init', {
        contactId: this.contactId,
        sig: this.sig,
        expires: this.expires,
      });
      if (result.success) {
        this.impayes = result.data.impayes || [];
      } else {
        this.erreur = result.error || 'Impossible de charger les factures';
      }
    } catch (err) {
      console.error(err);
      this.erreur = err.message || 'Erreur inconnue';
    } finally {
      this.loading = false;
    }
  },

  async runWorkflow(name, params = {}) {
    const wf = window.workflows[name];
    if (!wf || !wf.execute) {
      throw new Error('Workflow "' + name + '" introuvable');
    }
    return await wf.execute(this, params);
  },

  get impayesNonRegles() {
    return this.impayes.filter(i => !i.facture_soldee && (i.reste_a_payer || 0) > 0);
  },

  get currentImpaye() {
    if (!this.impayeId) return null;
    return this.impayes.find(i => i.id === this.impayeId) || null;
  },

  // ── Helpers formatage ──
  formatDate(dateString) {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  },

  formatCurrency(amount) {
    if (amount === undefined || amount === null) return '0 €';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  },

  formatAdresse(adresse, cp, ville) {
    if (!adresse) return '';
    let result = adresse;
    if (cp) result += `, ${cp}`;
    if (ville) result += ` ${ville}`;
    return result.trim();
  },

  getAdressesList(impaye) {
    const list = [];
    if (impaye.dossiers && Array.isArray(impaye.dossiers)) {
      impaye.dossiers.forEach(d => {
        const adresse = this.formatAdresse(d.adresse_bien || d.adresse, d.code_postal, d.ville);
        if (adresse) {
          list.push({ dossier: d.numero_dossier || d.code || d.id || 'N/A', adresse });
        }
      });
    } else if (impaye.adresses && Array.isArray(impaye.adresses)) {
      impaye.adresses.forEach(a => {
        const adresse = this.formatAdresse(a.adresse_bien || a.adresse, a.code_postal, a.ville);
        if (adresse) {
          list.push({ dossier: a.numero_dossier || a.dossier || a.code || 'N/A', adresse });
        }
      });
    } else if (impaye.adresse_bien) {
      const adresse = this.formatAdresse(impaye.adresse_bien, impaye.code_postal, impaye.ville);
      if (adresse) {
        list.push({ dossier: impaye.numero_dossier || 'N/A', adresse });
      }
    }
    return list;
  },

  getPaymentLink(impaye) {
    if (impaye.lien_paiement) return impaye.lien_paiement;
    if (impaye.liens_paiement && impaye.liens_paiement.length > 0) {
      return impaye.liens_paiement[0].url;
    }
    if (impaye.reste_a_payer && impaye.nfacture) {
      return `https://paiement.systempay.fr/vads-site/EXIM?vads_amount=${Math.round((impaye.reste_a_payer || 0) * 100)}&vads_order_id=${impaye.nfacture || impaye.id}&vads_cust_id=${impaye.numero_dossier || ''}`;
    }
    return null;
  },

  // ── Render card HTML ──
  renderCard(impaye) {
    if (!impaye) return '';
    const adresses = this.getAdressesList(impaye);
    const hasAdresses = adresses.length > 0;
    const paymentLink = this.getPaymentLink(impaye);
    const nfacture = impaye.nfacture || impaye.ref_piece || impaye.id;

    let adressesHtml = '';
    if (hasAdresses) {
      if (adresses.length > 1) {
        const rows = adresses.map(a =>
          `<tr><td class="px-3 py-2 text-gray-900 font-medium">${this.escapeHtml(a.dossier)}</td><td class="px-3 py-2 text-gray-600">${this.escapeHtml(a.adresse)}</td></tr>`
        ).join('');
        adressesHtml = `
          <div class="mt-3">
            <div class="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
              <table class="min-w-full text-sm">
                <thead class="bg-gray-100 text-gray-700"><tr><th class="px-3 py-2 text-left font-medium">Dossier</th><th class="px-3 py-2 text-left font-medium">Adresse</th></tr></thead>
                <tbody class="divide-y divide-gray-200">${rows}</tbody>
              </table>
            </div>
          </div>`;
      } else {
        adressesHtml = `<p class="mt-3 text-sm text-gray-600">${this.escapeHtml(adresses[0].adresse)}</p>`;
      }
    }

    const datePiece = impaye.date_piece ? this.formatDate(impaye.date_piece) : '';
    const dateEcheance = impaye.date_echeance ? `<span class="text-red-500"> - Échéance : ${this.formatDate(impaye.date_echeance)}</span>` : '';
    const montantTotal = this.formatCurrency(impaye.montant_total || impaye.reste_a_payer || 0);
    const resteAPayer = impaye.reste_a_payer ? `<div class="text-right"><p class="text-sm text-gray-500">Reste à payer</p><p class="text-lg font-semibold text-red-600">${this.formatCurrency(impaye.reste_a_payer)}</p></div>` : '';

    let actionsHtml = '';
    if (impaye.id) {
      actionsHtml += `
        <a id="btn-download-facture-${impaye.id}" href="/redirect-pdf/${impaye.id}" target="_blank" class="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
          <i class="fa-solid fa-arrow-down-to-bracket"></i> Télécharger facture
        </a>`;
    }
    if (paymentLink) {
      actionsHtml += `
        <a id="btn-regler-facture-${impaye.id}" href="${this.escapeHtml(paymentLink)}" target="_blank" class="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
          <i class="fa-solid fa-credit-card"></i> Payer en ligne
        </a>`;
    }

    return `
      <div class="w-full">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-blue-100 rounded-lg">
                <i class="fa-solid fa-file-invoice text-blue-600 text-base"></i>
              </div>
              <div>
                <h3 class="font-medium text-gray-900">Facture n°${this.escapeHtml(nfacture)}</h3>
                <p class="text-sm text-gray-500">${datePiece}${dateEcheance}</p>
              </div>
            </div>
            ${adressesHtml}
          </div>
          <div class="flex flex-col items-end gap-2 md:min-w-[200px]">
            <div class="text-right">
              <p class="text-sm text-gray-500">Montant TTC</p>
              <p class="text-xl font-bold text-gray-900">${montantTotal}</p>
            </div>
            ${resteAPayer}
          </div>
        </div>
        <div class="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-2">
          ${actionsHtml}
        </div>
      </div>`;
  },

  escapeHtml(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
}));

Alpine.start();
