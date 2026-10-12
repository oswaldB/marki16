import Alpine from 'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/module.esm.js';
import { execute as initExecute } from './workflows/init.js';
import { execute as submitExecute } from './workflows/submit.js';

window.workflows = {
  'init': { execute: initExecute },
  'submit': { execute: submitExecute },
};

Alpine.data('loginPage', () => ({
  isLoading: false,
  loading: false,
  error: null,
  data: {},
  form: {
    username: '',
    password: '',
  },

  init() {
    this.loadInitialData();
  },

  async loadInitialData() {
    this.isLoading = true;
    this.error = null;
    try {
      const result = await this.runWorkflow('init', {});
      if (result.success) {
        this.data = result.data || {};
        if (result.redirect) {
          window.location.href = result.redirect;
        }
      } else {
        this.error = result.error || 'Erreur lors du chargement initial';
      }
    } catch (err) {
      console.error(err);
      this.error = err.message || 'Erreur inconnue';
    } finally {
      this.isLoading = false;
    }
  },

  async handleSubmit() {
    this.loading = true;
    this.error = null;
    try {
      const result = await this.runWorkflow('submit', {
        username: this.form.username,
        password: this.form.password,
      });
      if (result.success) {
        this.data = result.data || {};
        if (result.redirect) {
          window.location.href = result.redirect;
        }
      } else {
        this.error = result.error || 'Identifiants incorrects';
      }
    } catch (err) {
      console.error(err);
      this.error = err.message || 'Identifiants incorrects';
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
}));

Alpine.start();
