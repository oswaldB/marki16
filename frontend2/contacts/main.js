import Alpine from 'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/module.esm.js';
import { execute as initExecute } from './workflows/init.js';
import { execute as loadAllExecute } from './workflows/load-all.js';
import { execute as blacklistExecute } from './workflows/blacklist.js';
import { execute as setEmailForceExecute } from './workflows/set-email-force.js';

window.workflows = {
  'init': { execute: initExecute },
  'load-all': { execute: loadAllExecute },
  'blacklist': { execute: blacklistExecute },
  'set-email-force': { execute: setEmailForceExecute },
};

Alpine.data('contactsPage', () => ({
  // ── État général ──
  isLoading: false,
  error: null,
  loading: false,
  loadingEntites: false,
  loadingParticuliers: false,
  blacklistLoading: false,

  // ── Onglets ──
  ongletActif: 'tous',

  // ── Filtres ──
  globalFilter: '',
  filtreSource: 'all',
  filtreSansEmail: false,

  // ── Données ──
  allContacts: [],
  totalCount: 0,
  sansEmailTotalCount: 0,
  entites: [],
  entitesFiltrees: [],
  particuliers: [],
  particuliersFiltres: [],
  expanded: { entites: {}, particuliers: {} },

  // ── Tri ──
  sortColumn: 'nom',
  sortDirection: 'asc',

  // ── Pagination ──
  currentPage: 1,
  pageSize: 50,
  totalPages: 1,

  // ── Sync ──
  syncing: false,
  syncResult: null,
  syncResultMessage: '',

  // ── Slideover Email ──
  showEmailSlideover: false,
  selectedContactId: null,
  emailSlideover: {
    searchQuery: '',
    allEmails: [],
    filteredEmails: [],
    loading: false,
    newEmail: { email: '', name: '' },
    creating: false,
  },

  init() {
    this.loadInitialData();

    // Watch globalFilter pour entités et particuliers
    this.$watch('globalFilter', () => {
      if (this.ongletActif === 'par-entite') {
        this.applyFilterEntites();
      } else if (this.ongletActif === 'par-groupe-particuliers') {
        this.applyFilterParticuliers();
      }
    });

    // Watch filtreSource pour les onglets tous/sans-email
    this.$watch('filtreSource', () => {
      if (this.ongletActif === 'tous' || this.ongletActif === 'sans-email') {
        this.currentPage = 1;
      }
    });
  },

  async loadInitialData() {
    this.isLoading = true;
    this.error = null;
    try {
      const result = await this.runWorkflow('init', {});
      if (result.success) {
        this.allContacts = result.data.contacts || [];
        this.totalCount = result.data.totalCount || 0;
        this.sansEmailTotalCount = result.data.sansEmailTotalCount || 0;
        this.totalPages = Math.ceil(this.totalCount / this.pageSize) || 1;
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

  async runWorkflow(name, params = {}) {
    const wf = window.workflows[name];
    if (!wf || !wf.execute) {
      throw new Error('Workflow "' + name + '" introuvable');
    }
    return await wf.execute(this, params);
  },

  // ── Navigation onglets ──
  async switchTab(tab) {
    this.ongletActif = tab;
    this.globalFilter = '';
    this.sortColumn = 'nom';
    this.sortDirection = 'asc';
    this.currentPage = 1;

    if (tab === 'sans-email') {
      this.filtreSansEmail = true;
      await this.loadInitialData();
    } else if (tab === 'par-entite') {
      await this.chargerEntitesGroupes();
    } else if (tab === 'par-groupe-particuliers') {
      await this.chargerParticuliersGroupes();
    } else {
      this.filtreSansEmail = false;
      await this.loadInitialData();
    }
  },

  // ── Tri ──
  setSort(column) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.currentPage = 1;
  },

  // ── Pagination ──
  goToPage(page) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  },

  changerTaillePage(size) {
    this.pageSize = parseInt(size);
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.totalCount / this.pageSize) || 1;
  },

  // ── Computed rows (filtrés + triés) ──
  get filteredRows() {
    let data = [...this.allContacts];

    if (this.filtreSource !== 'all') {
      data = data.filter(c => c.source === this.filtreSource);
    }

    if (this.filtreSansEmail) {
      data = data.filter(c => !c.email || c.email === '');
    }

    if (this.globalFilter) {
      const q = this.globalFilter.toLowerCase();
      data = data.filter(c =>
        (c.nom || '').toLowerCase().includes(q) ||
        (c.prenom || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.telephone || '').toLowerCase().includes(q)
      );
    }

    // Tri
    data.sort((a, b) => {
      const va = a[this.sortColumn] ?? '';
      const vb = b[this.sortColumn] ?? '';
      if (typeof va === 'number' && typeof vb === 'number') {
        return this.sortDirection === 'asc' ? va - vb : vb - va;
      }
      const sa = String(va).toLowerCase();
      const sb = String(vb).toLowerCase();
      if (sa < sb) return this.sortDirection === 'asc' ? -1 : 1;
      if (sa > sb) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return data;
  },

  get paginatedRows() {
    const rows = this.filteredRows;
    this.totalCount = rows.length;
    this.totalPages = Math.ceil(rows.length / this.pageSize) || 1;
    const start = (this.currentPage - 1) * this.pageSize;
    return rows.slice(start, start + this.pageSize);
  },

  // ── Page numbers pour pagination ──
  get pageNumbers() {
    const total = this.totalPages;
    const current = this.currentPage;
    const max = 5;
    const pages = [];

    if (total <= max) {
      for (let i = 1; i <= total; i++) pages.push(i);
      return pages;
    }

    let start = Math.max(1, current - 2);
    let end = Math.min(total, current + 2);

    if (current <= 3) {
      start = 1;
      end = Math.min(total, max);
    } else if (current >= total - 2) {
      start = Math.max(1, total - max + 1);
      end = total;
    }

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('...');
    }

    for (let i = start; i <= end; i++) pages.push(i);

    if (end < total) {
      if (end < total - 1) pages.push('...');
      pages.push(total);
    }

    return pages;
  },

  // ── Expansion tree ──
  toggleExpanded(type, id) {
    this.expanded[type][id] = !this.expanded[type][id];
  },

  isExpanded(type, id) {
    return !!this.expanded[type][id];
  },

  // ── Charger entités ──
  async chargerEntitesGroupes() {
    this.loadingEntites = true;
    try {
      const result = await this.runWorkflow('load-all', { type: 'entites' });
      if (result.success) {
        this.entites = result.data || [];
        this.applyFilterEntites();
      }
    } catch (err) {
      console.error('Erreur chargement entités:', err);
      this.showToast('Erreur', 'Impossible de charger les entités', 'red');
    } finally {
      this.loadingEntites = false;
    }
  },

  applyFilterEntites() {
    let data = [...this.entites];
    if (this.globalFilter) {
      const q = this.globalFilter.toLowerCase();
      data = data.filter(e =>
        (e.nom || '').toLowerCase().includes(q) ||
        e.subRows.some(s =>
          (s.nom || '').toLowerCase().includes(q) ||
          (s.prenom || '').toLowerCase().includes(q)
        )
      );
    }
    this.entitesFiltrees = data;
  },

  // ── Charger particuliers ──
  async chargerParticuliersGroupes() {
    this.loadingParticuliers = true;
    try {
      const result = await this.runWorkflow('load-all', { type: 'particuliers' });
      if (result.success) {
        this.particuliers = result.data || [];
        this.applyFilterParticuliers();
      }
    } catch (err) {
      console.error('Erreur chargement particuliers:', err);
      this.showToast('Erreur', 'Impossible de charger les groupes de particuliers', 'red');
    } finally {
      this.loadingParticuliers = false;
    }
  },

  applyFilterParticuliers() {
    let data = [...this.particuliers];
    if (this.globalFilter) {
      const q = this.globalFilter.toLowerCase();
      data = data.filter(g =>
        (g.nom || '').toLowerCase().includes(q) ||
        g.subRows.some(s =>
          (s.nom || '').toLowerCase().includes(q) ||
          (s.prenom || '').toLowerCase().includes(q)
        )
      );
    }
    this.particuliersFiltres = data;
  },

  // ── Watchers (manuels via getters) ──
  get entitesFiltreesComputed() {
    this.applyFilterEntites();
    return this.entitesFiltrees;
  },

  get particuliersFiltresComputed() {
    this.applyFilterParticuliers();
    return this.particuliersFiltres;
  },

  // ── Sync ──
  async lancerSync() {
    this.syncing = true;
    this.syncResult = null;
    try {
      const result = await Parse.Cloud.run('syncContacts', {});
      this.syncResult = result;
      if (result.errors && result.errors.length) {
        this.syncResultMessage = `${result.updated} mis à jour, ${result.errors.length} erreurs`;
      } else {
        this.syncResultMessage = `${result.updated} contacts synchronisés`;
      }
      await this.loadInitialData();
    } catch (error) {
      this.syncResult = { errors: [{ error: error.message }] };
      this.syncResultMessage = error.message;
    } finally {
      this.syncing = false;
    }
  },

  // ── Blacklist ──
  async toggleContactBlacklist(contact) {
    const isCurrentlyBlacklisted = contact.isBlacklisted || false;
    const newStatus = !isCurrentlyBlacklisted;

    // Optimistic update
    contact.isBlacklisted = newStatus;
    this.blacklistLoading = true;

    try {
      const result = await this.runWorkflow('blacklist', { contactId: contact.id, isBlacklisted: newStatus });
      if (result.success) {
        this.showToast('Succès', `Contact ${newStatus ? 'blacklisté' : 'retiré de la blacklist'}`, 'green');
        // Recharger si on est sur entités ou particuliers
        if (this.ongletActif === 'par-entite') {
          await this.chargerEntitesGroupes();
        } else if (this.ongletActif === 'par-groupe-particuliers') {
          await this.chargerParticuliersGroupes();
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Erreur toggle blacklist:', error);
      contact.isBlacklisted = isCurrentlyBlacklisted;
      this.showToast('Erreur', 'Impossible de mettre à jour la blacklist', 'red');
    } finally {
      this.blacklistLoading = false;
    }
  },

  // ── Slideover Email ──
  ouvrirSlideoverEmailPourContact(contactId) {
    this.selectedContactId = contactId;
    this.emailSlideover.searchQuery = '';
    this.emailSlideover.filteredEmails = [...this.emailSlideover.allEmails];
    this.emailSlideover.newEmail = { email: '', name: '' };
    this.showEmailSlideover = true;
    this.loadAllEmails();
  },

  closeEmailSlideover() {
    this.showEmailSlideover = false;
    this.selectedContactId = null;
  },

  async loadAllEmails() {
    this.emailSlideover.loading = true;
    try {
      const Contact = Parse.Object.extend('Contact');
      const query = new Parse.Query(Contact);
      query.exists('email');
      query.notEqualTo('email', '');
      query.limit(1000);
      const contacts = await query.find();
      this.emailSlideover.allEmails = contacts.map(c => ({
        id: c.id,
        email: c.get('email'),
        name: c.get('nom') || c.get('email'),
      }));
      this.emailSlideover.filteredEmails = [...this.emailSlideover.allEmails];
    } catch (error) {
      console.error('Erreur chargement emails:', error);
      this.showToast('Erreur', 'Impossible de charger les emails de relance', 'red');
    } finally {
      this.emailSlideover.loading = false;
    }
  },

  searchEmails() {
    const q = this.emailSlideover.searchQuery.toLowerCase();
    if (!q) {
      this.emailSlideover.filteredEmails = [...this.emailSlideover.allEmails];
      return;
    }
    this.emailSlideover.filteredEmails = this.emailSlideover.allEmails.filter(e =>
      e.email.toLowerCase().includes(q)
    );
  },

  async selectEmail(email) {
    try {
      await this.handleEmailSelected(email.email, email.id);
      this.showEmailSlideover = false;
    } catch (error) {
      console.error('Erreur sélection email:', error);
      this.showToast('Erreur', 'Impossible de sélectionner le contact', 'red');
    }
  },

  async createNewEmail() {
    if (!this.emailSlideover.newEmail.email) {
      this.showToast('Erreur', 'Veuillez entrer un email', 'red');
      return;
    }
    this.emailSlideover.creating = true;
    try {
      const result = await this.runWorkflow('set-email-force', {
        contactId: this.selectedContactId,
        email: this.emailSlideover.newEmail.email,
        name: this.emailSlideover.newEmail.name || this.emailSlideover.newEmail.email,
        createNew: true,
      });
      if (result.success) {
        this.showToast('Succès', 'Nouvel email de relance enregistré', 'green');
        this.showEmailSlideover = false;
        await this.refreshCurrentTab();
        await this.loadAllEmails();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Erreur création email:', error);
      this.showToast('Erreur', 'Impossible de créer l\'email de relance', 'red');
    } finally {
      this.emailSlideover.creating = false;
    }
  },

  async handleEmailSelected(email, emailRelanceId) {
    try {
      const result = await this.runWorkflow('set-email-force', {
        contactId: this.selectedContactId,
        email: email,
        emailRelanceId: emailRelanceId,
      });
      if (result.success) {
        this.showToast('Email de relance défini', `L'email de relance a été défini: ${email}`, 'green');
        await this.refreshCurrentTab();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Erreur mise à jour email:', error);
      this.showToast('Erreur', 'Impossible de mettre à jour l\'email de relance', 'red');
      throw error;
    }
  },

  async refreshCurrentTab() {
    if (this.ongletActif === 'tous' || this.ongletActif === 'sans-email') {
      await this.loadInitialData();
    } else if (this.ongletActif === 'par-entite') {
      await this.chargerEntitesGroupes();
    } else if (this.ongletActif === 'par-groupe-particuliers') {
      await this.chargerParticuliersGroupes();
    }
  },

  // ── Toast ──
  showToast(title, description, color = 'green') {
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { title, description, color, id: Date.now() }
    }));
  },
}));

Alpine.start();
