import Alpine from 'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/module.esm.js';
import { execute as initExecute } from './workflows/init.js';
import { execute as createUserExecute } from './workflows/create-user.js';
import { execute as editUserExecute } from './workflows/edit-user.js';

window.workflows = {
  'init': { execute: initExecute },
  'create-user': { execute: createUserExecute },
  'edit-user': { execute: editUserExecute },
};

Alpine.data('settingsUtilisateursPage', () => ({
  // ── State ──────────────────────────────────────────────────────
  loading: false,
  saving: false,
  users: [],
  currentUserId: null,

  // Modales
  showCreateModal: false,
  showPasswordModal: false,
  showDeleteModal: false,
  userEnAction: null,

  // Formulaire unifié
  form: {
    email: '',
    password: '',
    makeAdmin: false,
    newPassword: '',
    confirmPassword: '',
  },

  // Toast
  toast: {
    visible: false,
    type: 'success',
    title: '',
    description: '',
  },
  toastTimer: null,

  init() {
    this.currentUserId = Parse.User.current()?.id || null;
    this.charger();
  },

  // ── Computed rows ─────────────────────────────────────────────
  get rows() {
    return this.users.map(u => ({
      ...u,
      identifiant: u.username || u.email || '—',
      createdAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : '—',
    }));
  },

  // ── Toast ─────────────────────────────────────────────────────
  showToast(type, title, description = '') {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast = { visible: true, type, title, description };
    this.toastTimer = setTimeout(() => {
      this.toast.visible = false;
    }, 4000);
  },

  // ── Chargement ────────────────────────────────────────────────
  async charger() {
    this.loading = true;
    try {
      const result = await this.runWorkflow('init', {});
      if (result.success) {
        this.users = result.data || [];
      } else {
        this.showToast('error', 'Erreur chargement', result.error);
      }
    } catch (err) {
      console.error(err);
      this.showToast('error', 'Erreur chargement', err.message);
    } finally {
      this.loading = false;
    }
  },

  // ── Création ──────────────────────────────────────────────────
  ouvrirCreation() {
    this.form.email = '';
    this.form.password = '';
    this.form.makeAdmin = false;
    this.showCreateModal = true;
  },

  async creerUtilisateur() {
    if (!this.form.email || !this.form.password) {
      this.showToast('warning', 'Champs requis', 'Email et mot de passe obligatoires');
      return;
    }
    this.saving = true;
    try {
      const result = await this.runWorkflow('create-user', {
        email: this.form.email,
        password: this.form.password,
        makeAdmin: this.form.makeAdmin,
      });
      if (result.success) {
        this.showCreateModal = false;
        this.showToast('success', 'Utilisateur créé');
        await this.charger();
      } else {
        this.showToast('error', 'Erreur', result.error);
      }
    } catch (err) {
      console.error(err);
      this.showToast('error', 'Erreur', err.message);
    } finally {
      this.saving = false;
    }
  },

  // ── Changer mot de passe ──────────────────────────────────────
  ouvrirChangerMdp(user) {
    this.userEnAction = user;
    this.form.newPassword = '';
    this.form.confirmPassword = '';
    this.showPasswordModal = true;
  },

  async changerMotDePasse() {
    if (!this.form.newPassword) {
      this.showToast('warning', 'Mot de passe vide');
      return;
    }
    if (this.form.newPassword !== this.form.confirmPassword) {
      this.showToast('warning', 'Les mots de passe ne correspondent pas');
      return;
    }
    this.saving = true;
    try {
      const result = await this.runWorkflow('edit-user', {
        action: 'updatePassword',
        userId: this.userEnAction.id,
        newPassword: this.form.newPassword,
      });
      if (result.success) {
        this.showPasswordModal = false;
        this.showToast('success', 'Mot de passe mis à jour');
      } else {
        this.showToast('error', 'Erreur', result.error);
      }
    } catch (err) {
      console.error(err);
      this.showToast('error', 'Erreur', err.message);
    } finally {
      this.saving = false;
    }
  },

  // ── Toggle admin ───────────────────────────────────────────────
  async toggleAdmin(user) {
    try {
      const result = await this.runWorkflow('edit-user', {
        action: 'setAdminRole',
        userId: user.id,
        makeAdmin: !user.isAdmin,
      });
      if (result.success) {
        this.showToast('success', user.isAdmin ? 'Droits admin retirés' : 'Utilisateur promu admin');
        await this.charger();
      } else {
        this.showToast('error', 'Erreur', result.error);
      }
    } catch (err) {
      console.error(err);
      this.showToast('error', 'Erreur', err.message);
    }
  },

  // ── Suppression ───────────────────────────────────────────────
  confirmerSuppression(user) {
    this.userEnAction = user;
    this.showDeleteModal = true;
  },

  async supprimerUtilisateur() {
    this.saving = true;
    try {
      const result = await this.runWorkflow('edit-user', {
        action: 'deleteUser',
        userId: this.userEnAction.id,
      });
      if (result.success) {
        this.showDeleteModal = false;
        this.showToast('success', 'Utilisateur supprimé');
        await this.charger();
      } else {
        this.showToast('error', 'Erreur', result.error);
      }
    } catch (err) {
      console.error(err);
      this.showToast('error', 'Erreur', err.message);
    } finally {
      this.saving = false;
    }
  },

  // ── Workflow runner ───────────────────────────────────────────
  async runWorkflow(name, params = {}) {
    const wf = window.workflows[name];
    if (!wf || !wf.execute) {
      throw new Error('Workflow "' + name + '" introuvable');
    }
    return await wf.execute(this, params);
  },
}));

Alpine.start();
