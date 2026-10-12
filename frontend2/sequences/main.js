import Alpine from 'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/module.esm.js';
import { execute as initExecute } from './workflows/init.js';
import { execute as loadAllExecute } from './workflows/load-all.js';
import { execute as createSequenceExecute } from './workflows/create-sequence.js';
import { execute as duplicateSequenceExecute } from './workflows/duplicate-sequence.js';
import { execute as deleteSequenceExecute } from './workflows/delete-sequence.js';

window.workflows = {
  'init': { execute: initExecute },
  'load-all': { execute: loadAllExecute },
  'create-sequence': { execute: createSequenceExecute },
  'duplicate-sequence': { execute: duplicateSequenceExecute },
  'delete-sequence': { execute: deleteSequenceExecute },
};

Alpine.data('sequencesPage', () => ({
  isLoading: false,
  error: null,
  loading: false,
  creating: false,
  deleting: false,
  sequences: [],
  showDeleteModal: false,
  seqASupprimer: null,

  init() {
    this.loadInitialData();
  },

  async loadInitialData() {
    this.isLoading = true;
    this.error = null;
    try {
      const result = await this.runWorkflow('init', {});
      if (result.success) {
        this.sequences = result.data || [];
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

  async reload() {
    this.loading = true;
    try {
      const result = await this.runWorkflow('load-all', {});
      if (result.success) {
        this.sequences = result.data || [];
      }
    } catch (err) {
      console.error(err);
      this.showToast('Erreur', err.message, 'red');
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

  detailUrl(row) {
    return `../sequences-relance-detail/index.html?id=${encodeURIComponent(row.id)}&type=${encodeURIComponent(row.type)}`;
  },

  async nouvelleSequence(type = 'relances') {
    this.creating = true;
    try {
      const result = await this.runWorkflow('create-sequence', { type });
      if (result.success) {
        window.location.href = `../sequences-relance-detail/index.html?id=${encodeURIComponent(result.data.id)}&type=${encodeURIComponent(result.data.type)}`;
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error(err);
      this.showToast('Erreur', err.message, 'red');
      this.creating = false;
    }
  },

  confirmerSuppression(row) {
    this.seqASupprimer = row;
    this.showDeleteModal = true;
  },

  async supprimerSequence() {
    if (!this.seqASupprimer) return;
    this.deleting = true;
    try {
      const result = await this.runWorkflow('delete-sequence', { sequence: this.seqASupprimer._seq });
      if (result.success) {
        this.showDeleteModal = false;
        this.seqASupprimer = null;
        this.showToast('Séquence supprimée', '', 'green');
        await this.reload();
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error(err);
      this.showToast('Erreur', err.message, 'red');
    } finally {
      this.deleting = false;
    }
  },

  async dupliquerSequence(row) {
    try {
      const result = await this.runWorkflow('duplicate-sequence', { sequence: row._seq });
      if (result.success) {
        this.showToast('Séquence dupliquée', '', 'green');
        window.location.href = `../sequences-relance-detail/index.html?id=${encodeURIComponent(result.data.id)}&type=${encodeURIComponent(result.data.type)}`;
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error(err);
      this.showToast('Erreur', err.message, 'red');
    }
  },

  showToast(title, description, color = 'green') {
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { title, description, color, id: Date.now() }
    }));
  },
}));

Alpine.start();
