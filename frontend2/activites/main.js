import Alpine from 'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/module.esm.js';
import { execute as initExecute } from './workflows/init.js';
import { execute as loadAllExecute } from './workflows/load-all.js';

window.workflows = {
  'init': { execute: initExecute },
  'load-all': { execute: loadAllExecute },
};

Alpine.data('activitesPage', () => ({
  loading: false,
  error: null,
  activites: [],
  filterType: 'all',
  filterOperation: 'all',
  searchNfacture: '',
  selectedView: 'detailed',

  viewTabs: [
    { label: 'Vue détaillée', key: 'detailed' },
    { label: 'Groupé par date/heure', key: 'grouped_datetime' },
    { label: 'Groupé par type', key: 'grouped_type' },
    { label: 'Groupé par opération', key: 'grouped_operation' },
  ],

  typeOptions: [
    { label: 'Tous les types', value: 'all' },
    { label: 'Sync impayés', value: 'sync_impaye' },
    { label: 'Vérification paiements', value: 'verification_paiement' },
  ],

  operationOptions: [
    { label: 'Toutes les opérations', value: 'all' },
    { label: 'Créé', value: 'created' },
    { label: 'Mis à jour', value: 'updated' },
    { label: 'Payé', value: 'paid' },
    { label: 'Erreur', value: 'error' },
  ],

  init() {
    this.loadInitialData();
  },

  async loadInitialData() {
    this.loading = true;
    this.error = null;
    try {
      const result = await this.runWorkflow('init', {});
      if (result.success) {
        this.activites = result.data.activites || [];
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

  async loadAll() {
    this.loading = true;
    this.error = null;
    try {
      const result = await this.runWorkflow('load-all', {});
      if (result.success) {
        this.activites = result.data.activites || [];
      } else {
        this.error = result.error || 'Erreur lors du rechargement';
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

  // ── Getters ──
  get filteredActivites() {
    const search = this.searchNfacture ? this.searchNfacture.toLowerCase() : '';
    return this.activites
      .filter(a => this.filterType === 'all' || a.type === this.filterType)
      .filter(a => this.filterOperation === 'all' || a.operation === this.filterOperation)
      .filter(a => !search || (a.nfacture && String(a.nfacture).toLowerCase().includes(search)))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  get groupedByDateTime() {
    const grouped = {};
    this.filteredActivites.forEach(activity => {
      const date = new Date(activity.timestamp).toLocaleDateString('fr-FR');
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(activity);
    });
    return Object.keys(grouped).map(date => ({
      date,
      activities: grouped[date]
    })).sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  get groupedByType() {
    const grouped = {};
    this.filteredActivites.forEach(activity => {
      if (!grouped[activity.type]) grouped[activity.type] = [];
      grouped[activity.type].push(activity);
    });
    return Object.keys(grouped).map(type => ({
      type,
      count: grouped[type].length,
      activities: grouped[type].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    }));
  },

  get groupedByOperation() {
    const grouped = {};
    this.filteredActivites.forEach(activity => {
      if (!grouped[activity.operation]) grouped[activity.operation] = [];
      grouped[activity.operation].push(activity);
    });
    return Object.keys(grouped).map(operation => ({
      operation,
      count: grouped[operation].length,
      activities: grouped[operation].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    }));
  },

  // ── Helpers ──
  typeColor(type) {
    if (type === 'sync_impaye') return 'blue';
    if (type === 'verification_paiement') return 'green';
    return 'gray';
  },

  typeLabel(type) {
    if (type === 'sync_impaye') return 'Sync impayés';
    if (type === 'verification_paiement') return 'Vérif. paiements';
    return type;
  },

  operationColor(operation) {
    if (operation === 'created') return 'green';
    if (operation === 'updated') return 'blue';
    if (operation === 'paid') return 'purple';
    if (operation === 'error') return 'red';
    return 'gray';
  },

  operationLabel(operation) {
    if (operation === 'created') return 'Créé';
    if (operation === 'updated') return 'Mis à jour';
    if (operation === 'paid') return 'Payé';
    if (operation === 'error') return 'Erreur';
    return operation;
  },

  formatDateTime(val) {
    if (!val) return '—';
    const d = val instanceof Date ? val : new Date(val);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'medium' });
  },

  formatTime(val) {
    if (!val) return '—';
    const d = val instanceof Date ? val : new Date(val);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  },

  formatCurrency(value) {
    if (value == null) return '—';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  },

  badgeClasses(color) {
    const map = {
      blue: 'bg-blue-50 text-blue-700',
      green: 'bg-green-50 text-green-700',
      purple: 'bg-purple-50 text-purple-700',
      red: 'bg-red-50 text-red-700',
      gray: 'bg-gray-50 text-gray-700',
    };
    return map[color] || map.gray;
  },
}));

Alpine.start();
