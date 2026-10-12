import Alpine from 'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/module.esm.js';
import { execute as initExecute } from './workflows/init.js';
import { execute as loadAllExecute } from './workflows/load-all.js';

window.workflows = {
  'init': { execute: initExecute },
  'load-all': { execute: loadAllExecute },
};

Alpine.data('acorrigerPage', () => ({
  // ── État ──
  loading: false,
  error: null,
  activeTab: 'contacts',
  contactsSansEmail: [],
  impayesSansPayeur: [],

  // ── Toast ──
  toast: { show: false, title: '', description: '', color: 'green' },

  init() {
    this.loadInitialData();
  },

  async loadInitialData() {
    this.loading = true;
    this.error = null;
    try {
      const result = await this.runWorkflow('init', {});
      if (result.success) {
        this.contactsSansEmail = result.data.contactsSansEmail || [];
        this.impayesSansPayeur = result.data.impayesSansPayeur || [];
      } else {
        this.error = result.error || 'Erreur lors du chargement initial';
        this.showToast('Erreur', 'red', this.error);
      }
    } catch (err) {
      console.error(err);
      this.error = err.message || 'Erreur inconnue';
      this.showToast('Erreur', 'red', this.error);
    } finally {
      this.loading = false;
    }
  },

  async setTab(tab) {
    this.activeTab = tab;
    // Si on change d'onglet, on recharge toujours les données
    await this.charger();
  },

  async charger() {
    this.loading = true;
    this.error = null;
    try {
      const result = await this.runWorkflow('load-all', { tab: this.activeTab });
      if (result.success) {
        this.contactsSansEmail = result.data.contactsSansEmail || [];
        this.impayesSansPayeur = result.data.impayesSansPayeur || [];
      } else {
        this.error = result.error || 'Erreur lors du rechargement';
        this.showToast('Erreur', 'red', this.error);
      }
    } catch (err) {
      console.error(err);
      this.error = err.message || 'Erreur inconnue';
      this.showToast('Erreur', 'red', this.error);
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

  // ── Helpers ──
  formatDate(val) {
    if (!val) return '—';
    const d = val instanceof Date ? val : new Date(val);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('fr-FR', { dateStyle: 'short' });
  },

  showToast(title, color = 'green', description = '') {
    this.toast = { show: true, title, color, description };
    setTimeout(() => { this.toast.show = false; }, 4000);
  },
}));

Alpine.start();
