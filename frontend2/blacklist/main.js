import Alpine from 'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/module.esm.js';
import { execute as initExecute } from './workflows/init.js';
import { execute as loadAllExecute } from './workflows/load-all.js';
import { execute as removeFromBlacklistExecute } from './workflows/remove-from-blacklist.js';
import { execute as addToBlacklistExecute } from './workflows/add-to-blacklist.js';

window.workflows = {
  'init': { execute: initExecute },
  'load-all': { execute: loadAllExecute },
  'remove-from-blacklist': { execute: removeFromBlacklistExecute },
  'add-to-blacklist': { execute: addToBlacklistExecute },
};

Alpine.data('blacklistPage', () => ({
  // ── État général ──
  loading: false,
  error: null,

  // ── Données ──
  contacts: [],

  // ── Filtres ──
  searchQuery: '',
  sourceFilter: '',

  // ── Sélection ──
  selected: [],

  // ── Tri ──
  sortColumn: 'nom',
  sortDirection: 'asc',

  // ── Slideover d'ajout ──
  showAddSlideover: false,
  addSearchQuery: '',
  searchResults: [],
  selectedForAdd: [],
  searching: false,
  deleteRelances: false,
  progressMessage: '',

  // ── Debounce timer ──
  addSearchTimeout: null,

  init() {
    this.loadInitialData();
  },

  async loadInitialData() {
    this.loading = true;
    this.error = null;
    try {
      const result = await this.runWorkflow('init', {});
      if (result.success) {
        this.contacts = result.data.contacts || [];
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

  // ── Computed : rows filtrés et triés ──
  get filteredRows() {
    let data = [...this.contacts];

    // Filtre par recherche
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      data = data.filter(c =>
        (c.nom || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.telephone || '').toLowerCase().includes(q)
      );
    }

    // Filtre par source
    if (this.sourceFilter) {
      data = data.filter(c => c.source === this.sourceFilter);
    }

    // Tri
    data.sort((a, b) => {
      let va = a[this.sortColumn];
      let vb = b[this.sortColumn];

      if (this.sortColumn === 'blacklistedAt') {
        va = va ? new Date(va).getTime() : 0;
        vb = vb ? new Date(vb).getTime() : 0;
        return this.sortDirection === 'asc' ? va - vb : vb - va;
      }

      if (typeof va === 'number' && typeof vb === 'number') {
        return this.sortDirection === 'asc' ? va - vb : vb - va;
      }

      const sa = String(va || '').toLowerCase();
      const sb = String(vb || '').toLowerCase();
      if (sa < sb) return this.sortDirection === 'asc' ? -1 : 1;
      if (sa > sb) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return data;
  },

  get selectAllChecked() {
    return this.filteredRows.length > 0 && this.filteredRows.every(r => this.selected.includes(r.id));
  },

  // ── Tri ──
  setSort(column) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  },

  // ── Sélection ──
  toggleSelection(contactId) {
    const index = this.selected.indexOf(contactId);
    if (index > -1) {
      this.selected.splice(index, 1);
    } else {
      this.selected.push(contactId);
    }
  },

  toggleSelectAll() {
    const allSelected = this.selectAllChecked;
    if (allSelected) {
      // Désélectionner tous les rows filtrés
      this.filteredRows.forEach(r => {
        const idx = this.selected.indexOf(r.id);
        if (idx > -1) this.selected.splice(idx, 1);
      });
    } else {
      // Sélectionner tous les rows filtrés
      this.filteredRows.forEach(r => {
        if (!this.selected.includes(r.id)) {
          this.selected.push(r.id);
        }
      });
    }
  },

  // ── Retirer de la blacklist ──
  async removeSingleFromBlacklist(contactId) {
    await this.removeFromBlacklist([contactId]);
  },

  async removeSelectedFromBlacklist() {
    if (this.selected.length === 0) return;
    await this.removeFromBlacklist(this.selected);
  },

  async removeFromBlacklist(contactIds) {
    this.loading = true;
    try {
      const result = await this.runWorkflow('remove-from-blacklist', { contactIds });
      if (result.success) {
        this.selected = this.selected.filter(id => !contactIds.includes(id));
        this.showToast('Succès', 'Contact(s) retiré(s) de la blacklist', 'green');
        await this.loadInitialData();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Erreur retrait blacklist:', error);
      this.showToast('Erreur', 'Impossible de retirer le(s) contact(s) de la blacklist', 'red');
    } finally {
      this.loading = false;
    }
  },

  // ── Slideover : recherche et ajout ──
  debounceAddSearch() {
    clearTimeout(this.addSearchTimeout);
    this.addSearchTimeout = setTimeout(() => {
      this.searchInAllContacts();
    }, 500);
  },

  async searchInAllContacts() {
    if (!this.addSearchQuery) {
      this.searchResults = [];
      this.searching = false;
      return;
    }
    this.searching = true;
    try {
      const result = await this.runWorkflow('load-all', { query: this.addSearchQuery });
      if (result.success) {
        this.searchResults = result.data || [];
      } else {
        this.searchResults = [];
      }
    } catch (error) {
      console.error('Erreur recherche:', error);
      this.searchResults = [];
    } finally {
      this.searching = false;
    }
  },

  toggleSelectionForAdd(contactId) {
    const index = this.selectedForAdd.indexOf(contactId);
    if (index > -1) {
      this.selectedForAdd.splice(index, 1);
    } else {
      this.selectedForAdd.push(contactId);
    }
  },

  async addSelectedToBlacklist() {
    if (this.selectedForAdd.length === 0) return;

    this.progressMessage = this.deleteRelances
      ? 'Ajout à la blacklist et suppression des relances en cours... Merci de ne pas fermer cette page.'
      : 'Ajout à la blacklist en cours...';
    this.loading = true;

    try {
      const result = await this.runWorkflow('add-to-blacklist', {
        contactIds: this.selectedForAdd,
        deleteRelances: this.deleteRelances,
      });

      if (result.success) {
        this.showAddSlideover = false;
        this.progressMessage = '';
        this.selectedForAdd = [];
        this.deleteRelances = false;
        this.addSearchQuery = '';
        this.searchResults = [];

        let description = `${result.data.contactsAdded} contact(s) ajouté(s) à la blacklist`;
        if (result.data.relancesDeleted > 0) {
          description += ` et ${result.data.relancesDeleted} relance(s) supprimée(s)`;
        }
        this.showToast('Succès', description, 'green');
        await this.loadInitialData();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Erreur:', error);
      this.progressMessage = '';
      this.showToast('Erreur', "Impossible d'ajouter les contacts à la blacklist", 'red');
    } finally {
      this.loading = false;
    }
  },

  // ── Format date ──
  formatDate(dateValue) {
    if (!dateValue) return '';
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }) + ' ' + d.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // ── Toast ──
  showToast(title, description, color = 'green') {
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { title, description, color, id: Date.now() }
    }));
  },
}));

Alpine.start();
