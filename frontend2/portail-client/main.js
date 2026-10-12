import Alpine from 'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/module.esm.js';
import { execute as initExecute } from './workflows/init.js';

window.workflows = {
  'init': { execute: initExecute },
};

Alpine.data('portailclientPage', () => ({
  id: null,
  sig: null,
  expires: null,
  pdfUrl: null,
  loading: true,
  erreur: null,

  init() {
    this.loadInitialData();
  },

  async loadInitialData() {
    this.loading = true;
    this.erreur = null;
    try {
      const result = await this.runWorkflow('init', {});
      if (result.success) {
        this.id = result.data.id || null;
        this.sig = result.data.sig || null;
        this.expires = result.data.expires || null;
        this.pdfUrl = result.data.pdfUrl || null;
      } else {
        this.erreur = result.error || 'Erreur lors du chargement initial';
        this.loading = false;
      }
    } catch (err) {
      console.error(err);
      this.erreur = err.message || 'Erreur inconnue';
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
}));

Alpine.start();
