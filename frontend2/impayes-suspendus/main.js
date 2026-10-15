import Alpine from 'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/module.esm.js';
import { execute as initExecute } from './workflows/init.js';
import { execute as loadAllExecute } from './workflows/load-all.js';
import { execute as reactivateExecute } from './workflows/reactivate-impaye.js';

window.workflows = {
  'init': { execute: initExecute },
  'load-all': { execute: loadAllExecute },
  'reactivate-impaye': { execute: reactivateExecute },
};

const BLACKLIST_MOTIF_TYPES = [
  { value: 'litige', label: 'Litige commercial', description: 'Contestations liées à la prestation' },
  { value: 'reglement_en_cours', label: 'Règlement en cours', description: 'Paiement en attente de validation' },
  { value: 'erreur_facturation', label: 'Erreur de facturation', description: 'Facture erronée à corriger' },
  { value: 'procedure_judiciaire', label: 'Procédure judiciaire', description: 'Contentieux en cours' },
  { value: 'accord_special', label: 'Accord spécial', description: 'Arrangement particulier avec le client' },
  { value: 'accord_paiement_notaire', label: 'Accord paiement notaire', description: 'Accord de paiement en attente chez le notaire' },
  { value: 'cheque_encaissement_differe', label: 'Chèque reçus, encaissement différé', description: 'Chèque reçu mais encaissement programmé plus tard' },
  { value: 'reglement_plusieurs_fois', label: 'Règlement en plusieurs fois', description: 'Paiement étalé sur plusieurs échéances' },
  { value: 'autre', label: 'Autre', description: 'Motif non listé ci-dessus' }
];

Alpine.data('impayesSuspendusPage', () => ({
  // État
  blacklistedImpayes: [],
  loading: false,
  saving: false,
  error: null,

  searchQuery: '',
  motifFilter: '',

  modalOuvert: false,
  selectedImpaye: null,
  modalError: null,

  toast: { show: false, title: '', description: '', color: 'green' },

  motifOptions: BLACKLIST_MOTIF_TYPES.map(m => ({ label: m.label, value: m.value })),

  init() {
    this.loadInitialData();
  },

  async loadInitialData() {
    this.loading = true;
    this.error = null;
    try {
      const result = await this.runWorkflow('init', {});
      if (result.success) {
        this.blacklistedImpayes = result.data || [];
      } else {
        this.error = result.error || 'Erreur lors du chargement initial';
      }
    } catch (err) {
      console.error(err);
      this.error = err.message || 'Erreur inconnue';
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

  // Computed-like getters via Alpine magic
  get filteredRows() {
    let data = this.blacklistedImpayes;

    if (this.motifFilter) {
      data = data.filter(i => i.blacklistMotifType === this.motifFilter);
    }

    if (this.searchQuery) {
      const searchLower = this.searchQuery.toLowerCase();
      data = data.filter(i => {
        const nfacture = String(i.nfacture ?? '').toLowerCase();
        const payeurNom = (i.payeurNom || '').toLowerCase();
        const reference = (i.reference || '').toLowerCase();
        const motif = (i.blacklistMotif || '').toLowerCase();
        return nfacture.includes(searchLower) ||
               payeurNom.includes(searchLower) ||
               reference.includes(searchLower) ||
               motif.includes(searchLower);
      });
    }

    return data.map(i => {
      const motifType = i.blacklistMotifType;
      const motifLabel = BLACKLIST_MOTIF_TYPES.find(m => m.value === motifType)?.label || motifType;
      return {
        id: i.id,
        nfacture: i.nfacture || '—',
        payeurNom: i.payeurNom || '—',
        contactEmail: i.contactEmail || '',
        montant: i.resteAPayer || 0,
        motifType,
        motifLabel,
        motifDetail: i.blacklistMotif || '',
        blacklistedAt: i.blacklistedAt,
        contactId: i.contactId,
        objectId: i.objectId
      };
    });
  },

  get stats() {
    const impayes = this.blacklistedImpayes;
    return {
      total: impayes.length,
      litige: impayes.filter(i => i.blacklistMotifType === 'litige').length,
      totalMontant: impayes.reduce((sum, i) => sum + (i.resteAPayer || 0), 0)
    };
  },

  getMotifBadgeClass(type) {
    const classes = {
      'litige': 'bg-red-100 text-red-800',
      'reglement_en_cours': 'bg-green-100 text-green-800',
      'erreur_facturation': 'bg-amber-100 text-amber-800',
      'procedure_judiciaire': 'bg-red-100 text-red-800',
      'accord_special': 'bg-blue-100 text-blue-800',
      'accord_paiement_notaire': 'bg-emerald-100 text-emerald-800',
      'cheque_encaissement_differe': 'bg-cyan-100 text-cyan-800',
      'reglement_plusieurs_fois': 'bg-indigo-100 text-indigo-800',
      'autre': 'bg-gray-100 text-gray-800'
    };
    return classes[type] || 'bg-gray-100 text-gray-800';
  },

  formatMontant(val) {
    if (val == null) return '—';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val);
  },

  formatDate(val) {
    if (!val) return '—';
    const d = val instanceof Date ? val : new Date(val);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  },

  formatRelativeDate(val) {
    if (!val) return '';
    const d = val instanceof Date ? val : new Date(val);
    const now = new Date();
    const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'aujourd\'hui';
    if (diff === 1) return 'hier';
    if (diff < 7) return `il y a ${diff} jours`;
    if (diff < 30) return `il y a ${Math.floor(diff / 7)} semaine(s)`;
    return `il y a ${Math.floor(diff / 30)} mois`;
  },

  async refresh() {
    this.loading = true;
    try {
      const result = await this.runWorkflow('load-all', {});
      if (result.success) {
        this.blacklistedImpayes = result.data || [];
        this.showToast('Actualisé', '', 'green');
      } else {
        this.error = result.error || 'Erreur lors du rafraîchissement';
      }
    } catch (err) {
      console.error(err);
      this.error = err.message || 'Erreur inconnue';
    } finally {
      this.loading = false;
    }
  },

  reactiver(row) {
    this.selectedImpaye = row;
    this.modalError = null;
    this.modalOuvert = true;
  },

  closeModal() {
    this.modalOuvert = false;
    this.selectedImpaye = null;
    this.modalError = null;
  },

  async confirmReactivation() {
    if (!this.selectedImpaye) return;
    this.saving = true;
    this.modalError = null;
    try {
      const result = await this.runWorkflow('reactivate-impaye', {
        impayeId: this.selectedImpaye.objectId || this.selectedImpaye.id,
        contactId: this.selectedImpaye.contactId
      });
      if (result.success) {
        this.closeModal();
        this.showToast('Succès', 'L\'impayé a été réactivé et les relances régénérées', 'green');
        // Recharger la liste
        const reload = await this.runWorkflow('load-all', {});
        if (reload.success) {
          this.blacklistedImpayes = reload.data || [];
        }
      } else {
        this.modalError = result.error || 'Une erreur est survenue';
      }
    } catch (err) {
      console.error(err);
      this.modalError = err.message || 'Une erreur est survenue';
    } finally {
      this.saving = false;
    }
  },

  showToast(title, description = '', color = 'green') {
    this.toast = { show: true, title, description, color };
    setTimeout(() => { this.toast.show = false; }, 3000);
  }
}));

Alpine.start();
