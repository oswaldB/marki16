import Alpine from 'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/module.esm.js';
import { execute as initExecute } from './workflows/init.js';
import { execute as loadAllExecute } from './workflows/load-all.js';
import { execute as supprimerRelanceExecute } from './workflows/supprimer-relance.js';
import { execute as editRelanceExecute } from './workflows/edit-relance.js';
import { execute as validerRelanceExecute } from './workflows/valider-relance.js';
import { execute as createRelancesExecute } from './workflows/create-relances.js';
import { execute as retryRelanceExecute } from './workflows/retry-relance.js';
import { execute as annulerGroupeExecute } from './workflows/annuler-groupe.js';

window.workflows = {
  'init': { execute: initExecute },
  'load-all': { execute: loadAllExecute },
  'supprimer-relance': { execute: supprimerRelanceExecute },
  'edit-relance': { execute: editRelanceExecute },
  'valider-relance': { execute: validerRelanceExecute },
  'create-relances': { execute: createRelancesExecute },
  'retry-relance': { execute: retryRelanceExecute },
  'annuler-groupe': { execute: annulerGroupeExecute },
};

Alpine.data('relancesPage', () => ({
  // ── State ──
  loading: false,
  vue: 'tableau',
  relances: [],
  sequences: [],
  selection: [],
  pdfLinks: {},
  annulantGroupe: false,
  creatingRelances: false,

  // Filtres
  filtreStatut: 'tous',
  filtreSequence: 'tous',
  search: '',

  // Statut options
  statutOptions: [
    { label: 'Tous', value: 'tous' },
    { label: 'En attente', value: 'pending' },
    { label: 'Envoyé', value: 'envoyé' },
    { label: 'Échec', value: 'échec' },
    { label: 'Annulé', value: 'annulé' },
  ],

  // Sorting
  sortColumn: 'dateEnvoi',
  sortDirection: 'asc',

  // Calendrier
  jourSelectionne: null,
  calendarInstance: null,

  // Drawer
  showDrawer: false,
  drawerReadonly: false,
  drawerRow: null,
  drawerDateEnvoi: '',
  drawerTo: '',
  drawerCc: '',
  drawerObjet: '',
  drawerCorps: '',
  savingDrawer: false,
  editorInstance: null,
  applyToAllFollowing: false,
  originalToValue: '',

  // Toast
  toastMessage: '',
  toastColor: 'green',
  toastTimer: null,

  // ── Constants ──
  STATUT_CONFIG: {
    pending:     { label: 'En attente', color: 'neutral' },
    'envoyé':    { label: 'Envoyé',     color: 'green'   },
    'échec':     { label: 'Échec',      color: 'red'     },
    'annulé':    { label: 'Annulé',     color: 'orange'  },
    'optimisee': { label: 'Optimisée',  color: 'purple'  },
  },

  // ── Getters ──
  get sequenceOptions() {
    return [
      { label: 'Toutes les séquences', value: 'tous' },
      ...this.sequences.map(s => ({ label: s.nom, value: s.id })),
    ];
  },

  get relancesFiltrees() {
    if (!this.search) return this.relances;
    const s = this.search.toLowerCase();
    return this.relances.filter(r =>
      (r.objet || '').toLowerCase().includes(s) ||
      (r.to || '').toLowerCase().includes(s)
    );
  },

  get relancesPourCalendrier() {
    return this.relancesFiltrees.filter(r => {
      const aImpayeSuspenduOuBlacklist = r.impayes?.some(imp => {
        const estSuspendu = (imp.statutDossier || '').toLowerCase().includes('suspend');
        const estBlacklist = imp.isBlacklisted === true;
        return estSuspendu || estBlacklist;
      });
      return !aImpayeSuspenduOuBlacklist;
    });
  },

  get relancesJour() {
    if (!this.jourSelectionne) return [];
    const jour = new Date(this.jourSelectionne).toDateString();
    return this.relancesPourCalendrier.filter(r => {
      const d = r.dateEnvoi ? new Date(r.dateEnvoi).toDateString() : null;
      return d === jour;
    });
  },

  get sortedRelances() {
    const data = [...this.relancesFiltrees];
    if (!this.sortColumn) return data;
    data.sort((a, b) => {
      const aVal = (a[this.sortColumn] || '').toString().toLowerCase();
      const bVal = (b[this.sortColumn] || '').toString().toLowerCase();
      if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return data;
  },

  get allSelected() {
    return this.relancesFiltrees.length > 0 && this.selection.length === this.relancesFiltrees.length;
  },

  get relanceDrawer() {
    return this.drawerRow;
  },

  get calendarEvents() {
    return this.relancesPourCalendrier.map(r => {
      const dateRelance = new Date(r.dateEnvoi);
      if (!isNaN(dateRelance)) dateRelance.setHours(0, 0, 0, 0);
      const color = !r.valide ? '#f97316' : this.statutCalColor(r.statut);
      return {
        id: r.id,
        title: (r.to?.split('@')[0] || '?') + ' — ' + (r.objet?.slice(0, 20) || ''),
        start: isNaN(dateRelance) ? null : dateRelance.toISOString(),
        backgroundColor: color,
        borderColor: color,
        extendedProps: { row: r },
      };
    }).filter(e => e.start);
  },

  // ── Lifecycle ──
  init() {
    // Sync vue with URL
    const params = new URLSearchParams(window.location.search);
    const urlVue = params.get('vue');
    if (urlVue === 'calendrier') this.vue = 'calendrier';
    else if (urlVue === 'tableau' || !urlVue) this.vue = 'tableau';

    this.$watch('vue', (val) => {
      const url = new URL(window.location);
      if (val === 'tableau') url.searchParams.delete('vue');
      else url.searchParams.set('vue', val);
      window.history.replaceState({}, '', url);
      if (val === 'calendrier') {
        setTimeout(() => this.initCalendar(), 50);
      }
    });

    this.$watch('relancesFiltrees', () => {
      if (this.calendarInstance) {
        this.calendarInstance.removeAllEvents();
        this.calendarInstance.addEventSource(this.calendarEvents);
      }
    });

    this.loadInitialData();
  },

  async loadInitialData() {
    this.loading = true;
    try {
      const result = await this.runWorkflow('init', {});
      if (result.success) {
        this.sequences = result.data.sequences || [];
        this.relances = (result.data.relancesRaw || []).map(r => this.parseRelance(r));
        this.pdfLinks = result.data.pdfLinks || {};
        if (result.data.statutOptions && result.data.statutOptions.length > 0) {
          this.statutOptions = result.data.statutOptions;
        }
        // Generate missing PDF links
        await this.generateMissingPdfLinks();
      } else {
        this.showToast(result.error || 'Erreur lors du chargement initial', 'red');
      }
    } catch (err) {
      console.error(err);
      this.showToast(err.message || 'Erreur inconnue', 'red');
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
    return isNaN(d) ? '—' : d.toLocaleDateString('fr-FR', { dateStyle: 'short' });
  },

  toDateInput(val) {
    if (!val) return '';
    const d = val instanceof Date ? val : new Date(val);
    return isNaN(d) ? '' : d.toISOString().slice(0, 10);
  },

  statutCalColor(s) {
    if (s === 'envoyé') return '#22c55e';
    if (s === 'échec')  return '#ef4444';
    if (s === 'annulé') return '#9ca3af';
    if (s === 'optimisee') return '#a855f7';
    return '#3b82f6';
  },

  statutLabel(s) {
    return this.STATUT_CONFIG[s]?.label || s;
  },

  sortBy(col) {
    if (this.sortColumn === col) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = col;
      this.sortDirection = 'asc';
    }
  },

  sortIcon(col) {
    if (this.sortColumn !== col) return 'fa-sort';
    return this.sortDirection === 'asc' ? 'fa-arrow-up' : 'fa-arrow-down';
  },

  toggleSelectAll() {
    if (this.allSelected) {
      this.selection = [];
    } else {
      this.selection = this.relancesFiltrees.map(r => r.id);
    }
  },

  showToast(message, color = 'green') {
    this.toastMessage = message;
    this.toastColor = color;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { this.toastMessage = ''; }, 4000);
  },

  // ── Parse helpers ──
  parseImpaye(i) {
    if (!i) return null;
    const getValue = (key) => {
      return i.get ? i.get(key) : i[key];
    };
    return {
      id:           i.id,
      nfacture:     getValue('nfacture') || '—',
      statut:       getValue('statut') || '',
      statutDossier: getValue('statut_dossier') || '',
      isBlacklisted: getValue('isBlacklisted') === true,
      resteAPayer:  getValue('reste_a_payer') ?? null,
      montantTotal: getValue('total_ttc') ?? null,
      adresseBien:  getValue('adresse_bien') || '',
      payeurNom:    getValue('payeur_nom') || '',
    };
  },

  parseRelance(r) {
    const impayes = r.get('impayes');
    const impaye  = r.get('impaye');

    const impayeliste = Array.isArray(impayes) && impayes.length > 0
      ? impayes.map(i => {
          if (typeof i === 'string' || !i.get) return null;
          return this.parseImpaye(i);
        }).filter(Boolean)
      : impaye ? [this.parseImpaye(impaye)] : [];

    const getValue = (key) => {
      return r.get ? r.get(key) : r[key];
    };

    const metadata = getValue('metadata') || {};
    const templateData = metadata.templateData || {};

    const nfactureFromMetadata = templateData.nfacture || templateData.nfactures_liste;
    const factureNumber = impayeliste.length > 0
      ? impayeliste.map(imp => imp.nfacture).join(', ')
      : (nfactureFromMetadata ? String(nfactureFromMetadata) : '—');

    const contact = r.get('contact');
    const contactEmail = contact ? (contact.get ? contact.get('email') : contact.email) : null;

    return {
      _parse:      r,
      id:          r.id,
      dateEnvoi:   getValue('date_envoi_prevue') || getValue('date_envoi') || getValue('dateEnvoi'),
      objet:       getValue('sujet') || getValue('objet') || '',
      to:          templateData.payeur_email || templateData.proprio_email || contactEmail || getValue('to') || getValue('destinataire') || '',
      cc:          getValue('cc') || '',
      corps:       getValue('contenu') || getValue('corps') || '',
      statut:      getValue('statut') || 'pending',
      manuelle:    getValue('manuel') || false,
      valide:      getValue('valide') === true,
      nfacture:    factureNumber,
      impayelId:   impayeliste.length > 0 ? impayeliste.map(imp => imp.id) : null,
      email_index: getValue('email_index') ?? null,
      impayes:     impayeliste,
      isGrouped:   impayeliste.length > 1,
    };
  },

  // ── PDF links ──
  async generateMissingPdfLinks() {
    const uniqueIds = [...new Set(this.relances.flatMap(r =>
      (r.impayes || []).map(i => i.id).filter(Boolean)
    ))].filter(id => !this.pdfLinks[id]);

    for (const id of uniqueIds) {
      try {
        const response = await Parse.Cloud.run('generatePdfLink', { impayeId: id });
        this.pdfLinks[id] = response.url;
      } catch (err) {
        this.pdfLinks[id] = null;
      }
    }
  },

  // ── Actions ──
  async charger() {
    this.loading = true;
    this.selection = [];
    try {
      const result = await this.runWorkflow('load-all', {
        filtreStatut: this.filtreStatut,
        filtreSequence: this.filtreSequence,
      });
      if (result.success) {
        this.relances = (result.data.relancesRaw || []).map(r => this.parseRelance(r));
        await this.generateMissingPdfLinks();
      } else {
        this.showToast(result.error || 'Erreur chargement', 'red');
      }
    } catch (err) {
      this.showToast(err.message || 'Erreur chargement', 'red');
    } finally {
      this.loading = false;
    }
  },

  async createRelancesForAllActiveSequences() {
    this.creatingRelances = true;
    try {
      const result = await this.runWorkflow('create-relances', {});
      if (result.success) {
        const created = result.data.relancesCrees || 0;
        const updated = result.data.relancesMisesAJour || 0;
        this.showToast(`${created} relance(s) créée(s), ${updated} mise(s) à jour.`, 'green');
        await this.charger();
      } else {
        this.showToast(result.error || 'Erreur lors de la création des relances', 'red');
      }
    } catch (error) {
      console.error(error);
      this.showToast(error.message || 'Erreur lors de la création des relances', 'red');
    } finally {
      this.creatingRelances = false;
    }
  },

  async annulerRelance(row) {
    try {
      const result = await this.runWorkflow('supprimer-relance', { relanceId: row.id });
      if (result.success) {
        row.statut = 'annulé';
        this.showToast('Relance annulée', 'green');
        await this.charger();
      } else {
        this.showToast(result.error || 'Erreur', 'red');
      }
    } catch (err) {
      this.showToast(err.message || 'Erreur', 'red');
    }
  },

  async reessayerRelance(row) {
    try {
      const result = await this.runWorkflow('retry-relance', { relanceId: row.id });
      if (result.success) {
        row.statut = 'pending';
        row.dateEnvoi = new Date();
        this.showToast('Relance remise en attente', 'green');
        await this.charger();
      } else {
        this.showToast(result.error || 'Erreur', 'red');
      }
    } catch (err) {
      this.showToast(err.message || 'Erreur', 'red');
    }
  },

  async annulerGroupe() {
    this.annulantGroupe = true;
    try {
      const relancesParId = {};
      this.selection.forEach(id => {
        const row = this.relances.find(r => r.id === id);
        if (row) relancesParId[id] = row;
      });
      const ids = Object.keys(relancesParId);
      if (ids.length === 0) {
        this.selection = [];
        return;
      }
      const result = await this.runWorkflow('annuler-groupe', { relanceIds: ids });
      if (result.success) {
        this.showToast(`${ids.length} relance(s) annulée(s)`, 'green');
        this.selection = [];
        await this.charger();
      } else {
        this.showToast(result.error || 'Erreur', 'red');
      }
    } catch (err) {
      this.showToast(err.message || 'Erreur', 'red');
    } finally {
      this.annulantGroupe = false;
    }
  },

  // ── Drawer ──
  ouvrirDrawer(row, readonly) {
    const relance = row.original || row;
    this.drawerRow = relance;
    this.drawerReadonly = readonly;
    this.drawerDateEnvoi = this.toDateInput(relance.dateEnvoi);
    this.drawerTo = relance.to;
    this.drawerCc = relance.cc;
    this.drawerObjet = relance.objet;
    this.drawerCorps = relance.corps;
    this.originalToValue = relance.to;
    this.applyToAllFollowing = false;
    this.showDrawer = true;

    // Destroy previous editor
    if (this.editorInstance) {
      try { this.editorInstance.destroy(); } catch (e) {}
      this.editorInstance = null;
    }

    if (!readonly) {
      setTimeout(() => {
        this.initEditor();
      }, 350);
    }
  },

  initEditor() {
    const el = this.$refs.editorEl;
    if (!el) return;
    if (this.editorInstance) {
      try { this.editorInstance.destroy(); } catch (e) {}
    }
    this.editorInstance = new toastui.Editor({
      el: el,
      initialEditType: 'wysiwyg',
      initialValue: this.drawerCorps || '',
      minHeight: '400px',
      usageStatistics: false,
      hideModeSwitch: true,
    });
  },

  async enregistrerDrawer() {
    this.savingDrawer = true;
    try {
      let corps = this.drawerCorps;
      if (this.editorInstance) {
        try { corps = this.editorInstance.getHTML(); } catch (e) {}
      }

      const result = await this.runWorkflow('edit-relance', {
        relanceId: this.drawerRow.id,
        dateEnvoi: this.drawerDateEnvoi,
        to: this.drawerTo,
        cc: this.drawerCc,
        objet: this.drawerObjet,
        corps: corps,
        applyToAllFollowing: this.applyToAllFollowing && this.drawerTo !== this.originalToValue,
        currentImpayelIds: this.drawerRow.impayelId || [],
        currentDateEnvoi: this.drawerRow.dateEnvoi,
        nouveauTo: this.drawerTo,
      });

      if (result.success) {

        this.showDrawer = false;
        this.showToast('Relance enregistrée', 'green');
        await this.charger();
      } else {
        this.showToast(result.error || 'Erreur', 'red');
      }
    } catch (err) {
      this.showToast(err.message || 'Erreur', 'red');
    } finally {
      this.savingDrawer = false;
    }
  },

  // ── Calendar ──
  initCalendar() {
    if (this.calendarInstance) {
      this.calendarInstance.destroy();
    }
    const el = this.$refs.calendarEl;
    if (!el) return;
    this.calendarInstance = new FullCalendar.Calendar(el, {
      initialView: 'dayGridMonth',
      locale: 'fr',
      headerToolbar: { left: 'prev,next today', center: 'title', right: '' },
      displayEventTime: false,
      dayMaxEvents: false,
      events: this.calendarEvents,
      eventClick: (info) => {
        this.ouvrirDrawer(info.event.extendedProps.row, true);
      },
      dateClick: (info) => {
        this.jourSelectionne = info.dateStr;
      },
    });
    this.calendarInstance.render();
  },
}));

Alpine.start();
