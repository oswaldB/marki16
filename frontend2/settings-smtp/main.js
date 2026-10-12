import Alpine from 'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/module.esm.js';
import { execute as initExecute } from './workflows/init.js';
import { execute as loadAllExecute } from './workflows/load-all.js';
import { execute as createProfilExecute } from './workflows/create-profil.js';
import { execute as editProfilExecute } from './workflows/edit-profil.js';
import { execute as deleteProfilExecute } from './workflows/delete-profil.js';
import { execute as testProfilExecute } from './workflows/test-profil.js';

window.workflows = {
  'init': { execute: initExecute },
  'load-all': { execute: loadAllExecute },
  'create-profil': { execute: createProfilExecute },
  'edit-profil': { execute: editProfilExecute },
  'delete-profil': { execute: deleteProfilExecute },
  'test-profil': { execute: testProfilExecute },
};

Alpine.data('settingsSmtpPage', () => ({
  // Loading states
  loading: false,
  deleting: false,
  saving: false,
  error: null,

  // Data
  profiles: [],

  // Delete modal
  showDeleteModal: false,
  profileASupprimer: null,
  usagesSequences: 0,

  // Drawer
  showDrawer: false,
  modeEdition: false,
  profileEnEdition: null,

  // Form
  form: {
    nom: '',
    nom_affiche: '',
    host: '',
    port: 587,
    username: '',
    password: '',
    email_from: '',
    signature_html: ''
  },

  // Test
  testStatus: 'idle', // idle | loading | ok | error
  testMessage: '',

  init() {
    this.loadInitialData();
  },

  async loadInitialData() {
    this.loading = true;
    this.error = null;
    try {
      const result = await this.runWorkflow('init', {});
      if (result.success) {
        this.profiles = result.data.profiles || [];
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

  async reload() {
    this.loading = true;
    try {
      const result = await this.runWorkflow('load-all', {});
      if (result.success) {
        this.profiles = result.data.profiles || [];
      }
    } catch (err) {
      console.error(err);
      this.showToast('Erreur', err.message, 'red');
    } finally {
      this.loading = false;
    }
  },

  // ── Drawer ──
  ouvrirCreation() {
    this.modeEdition = false;
    this.profileEnEdition = null;
    this.resetForm();
    this.testStatus = 'idle';
    this.testMessage = '';
    this.showDrawer = true;
  },

  ouvrirEdition(row) {
    this.modeEdition = true;
    this.profileEnEdition = row._parse;
    this.form = {
      nom: row._parse.get('nom') || '',
      nom_affiche: row._parse.get('nom_affiche') || '',
      host: row._parse.get('host') || '',
      port: row._parse.get('port') || 587,
      username: row._parse.get('username') || '',
      password: row._parse.get('password') || '',
      email_from: row._parse.get('email_from') || '',
      signature_html: row._parse.get('signature_html') || '',
    };
    this.testStatus = 'idle';
    this.testMessage = '';
    this.showDrawer = true;
  },

  resetForm() {
    this.form = {
      nom: '',
      nom_affiche: '',
      host: '',
      port: 587,
      username: '',
      password: '',
      email_from: '',
      signature_html: ''
    };
  },

  fermerDrawer() {
    this.showDrawer = false;
    this.resetForm();
    this.testStatus = 'idle';
  },

  async enregistrer() {
    if (!this.form.nom || !this.form.host || !this.form.username || !this.form.email_from) {
      this.showToast('Champs requis manquants', 'Veuillez remplir tous les champs obligatoires.', 'orange');
      return;
    }

    this.saving = true;
    try {
      const workflowName = this.modeEdition ? 'edit-profil' : 'create-profil';
      const params = { ...this.form };
      if (this.modeEdition) {
        params.profile = this.profileEnEdition;
      }
      const result = await this.runWorkflow(workflowName, params);
      if (result.success) {
        this.showToast(this.modeEdition ? 'Profil mis à jour' : 'Profil créé', '', 'green');
        this.fermerDrawer();
        await this.reload();
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error(err);
      this.showToast('Erreur', err.message, 'red');
    } finally {
      this.saving = false;
    }
  },

  // ── Test ──
  async testerConnexion() {
    this.testStatus = 'loading';
    this.testMessage = '';
    try {
      const result = await this.runWorkflow('test-profil', {
        host: this.form.host,
        port: this.form.port,
        username: this.form.username,
        password: this.form.password,
      });
      if (result.success) {
        this.testStatus = result.data.ok ? 'ok' : 'error';
        this.testMessage = result.data.error || '';
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      this.testStatus = 'error';
      this.testMessage = err.message || 'Erreur réseau';
    }
  },

  // ── Suppression ──
  async confirmerSuppression(row) {
    this.profileASupprimer = row;
    this.usagesSequences = 0;

    try {
      const seqs = await new Parse.Query('Sequence').limit(200).find();
      let count = 0;
      for (const seq of seqs) {
        const emails = seq.get('emails') || [];
        if (emails.some(e => e.smtp === row.id)) count++;
      }
      this.usagesSequences = count;
    } catch {}

    this.showDeleteModal = true;
  },

  async supprimerProfile() {
    if (!this.profileASupprimer) return;
    this.deleting = true;
    try {
      const result = await this.runWorkflow('delete-profil', { profile: this.profileASupprimer._parse });
      if (result.success) {
        this.showDeleteModal = false;
        this.profileASupprimer = null;
        this.showToast('Profil supprimé', '', 'green');
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

  // ── Helpers ──
  async runWorkflow(name, params = {}) {
    const wf = window.workflows[name];
    if (!wf || !wf.execute) {
      throw new Error('Workflow "' + name + '" introuvable');
    }
    return await wf.execute(this, params);
  },

  showToast(title, description, color = 'green') {
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { title, description, color, id: Date.now() }
    }));
  },
}));

Alpine.start();
