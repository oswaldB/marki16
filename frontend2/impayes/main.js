import Alpine from 'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/module.esm.js';
import { execute as initExecute } from './workflows/init.js';
import { execute as loadAllExecute } from './workflows/load-all.js';
import { execute as openDetailExecute } from './workflows/open-detail.js';
import { execute as suspendFactureExecute } from './workflows/suspend-facture.js';
import { execute as unsuspendFactureExecute } from './workflows/unsuspend-facture.js';
import { execute as assignSequenceExecute } from './workflows/assign-sequence.js';
import { execute as syncInvoicesExecute } from './workflows/sync-invoices.js';
import { execute as generatePdfLinkExecute } from './workflows/generate-pdf-link.js';

window.workflows = {
  'init': { execute: initExecute },
  'load-all': { execute: loadAllExecute },
  'open-detail': { execute: openDetailExecute },
  'suspend-facture': { execute: suspendFactureExecute },
  'unsuspend-facture': { execute: unsuspendFactureExecute },
  'assign-sequence': { execute: assignSequenceExecute },
  'sync-invoices': { execute: syncInvoicesExecute },
  'generate-pdf-link': { execute: generatePdfLinkExecute },
};

Alpine.data('impayesPage', () => ({
  // ── État ──
  isLoading: false,
  error: null,
  activeView: 'unitaire',
  globalFilter: '',
  filtreSequence: 'all',
  sequencesLoading: false,
  syncing: false,

  // ── Données ──
  allImpayes: [],
  sequences: [],

  // ── Tri ──
  sortColumn: 'date_piece',
  sortDirection: 'desc',

  // ── Sélection ──
  selection: [],

  // ── Visibilité colonnes ──
  columnVisibility: {
    reference: false,
    reference_externe: false,
    statut_dossier: false,
    total_ht: false,
    total_ttc: false,
    apporteur_nom: false,
    commentaire_piece: false,
    numero_lot: false,
    etage: false,
    porte: false,
  },
  colonnesMenuOpen: false,

  // ── Groupes expansés ──
  expandedPayeurs: {},
  expandedContacts: {},
  expandedContactRoles: {},

  // ── PDF Drawer ──
  pdfOuvert: false,
  pdfImpayelId: null,
  pdfSignedUrl: null,
  pdfLoading: false,
  pdfErreur: null,

  // ── Drawer assignation ──
  drawerAssignOpen: false,
  drawerAssignPayeur: '',
  drawerAssignImpayes: [],
  drawerAssignSelection: [],
  drawerAssignSequenceChoisie: null,
  drawerAssignAssigning: false,

  // ── Modal assignation ──
  modalAssignerOuvert: false,
  sequenceChoisie: null,
  assignant: false,
  impayesCibles: [],

  // ── Vues ──
  vues: [
    { key: 'unitaire', label: 'Unitaire' },
    { key: 'payeur', label: 'Par payeur' },
    { key: 'contact', label: 'Par contact' },
    { key: 'sans-sequence', label: 'Sans séquence' },
  ],

  init() {
    this.loadInitialData();
    this.chargerSequences();

    this.$watch('activeView', (value) => {
      if (value === 'sans-sequence') {
        this.filtreSequence = 'none';
      } else if (this.filtreSequence === 'none') {
        this.filtreSequence = 'all';
      }
    });

    this.$watch('filtreSequence', (value) => {
      if (value === 'none' && this.activeView !== 'sans-sequence') {
        this.activeView = 'sans-sequence';
      }
    });
  },

  async loadInitialData() {
    this.isLoading = true;
    this.error = null;
    try {
      const result = await this.runWorkflow('init', {});
      if (result.success) {
        this.allImpayes = result.data.impayes || [];
        this.sequences = result.data.sequences || [];
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

  async charger() {
    this.isLoading = true;
    this.error = null;
    try {
      const result = await this.runWorkflow('load-all', {});
      if (result.success) {
        this.allImpayes = result.data.impayes || [];
        this.sequences = result.data.sequences || [];
      } else {
        this.error = result.error || 'Erreur lors du rechargement';
      }
    } catch (err) {
      console.error(err);
      this.error = err.message || 'Erreur inconnue';
    } finally {
      this.isLoading = false;
    }
  },

  async chargerSequences() {
    this.sequencesLoading = true;
    try {
      const q = new Parse.Query('Sequence');
      q.limit(200);
      const results = await q.find();
      this.sequences = results.map((s) => ({
        id: s.id,
        nom: s.get('nom'),
        description: s.get('description'),
        publiee: s.get('publiee'),
      }));
    } catch (err) {
      console.error('Erreur chargement séquences:', err);
    } finally {
      this.sequencesLoading = false;
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
  get filteredImpayes() {
    let data = [...this.allImpayes];

    // Filtre par séquence
    if (this.filtreSequence === 'none') {
      data = data.filter((i) => !i.sequenceId);
    } else if (this.filtreSequence !== 'all') {
      data = data.filter((i) => i.sequenceId === this.filtreSequence);
    }

    // Recherche
    if (this.globalFilter) {
      const searchLower = this.globalFilter.toLowerCase();
      data = data.filter(
        (i) =>
          (i.payeur_nom && i.payeur_nom.toLowerCase().includes(searchLower)) ||
          String(i.nfacture ?? '').toLowerCase().includes(searchLower) ||
          (i.reference && i.reference.toLowerCase().includes(searchLower)) ||
          (i.adresse_bien && i.adresse_bien.toLowerCase().includes(searchLower)),
      );
    }

    // Tri
    data.sort((a, b) => {
      let aVal, bVal;
      switch (this.sortColumn) {
        case 'reste_a_payer':
          aVal = a.reste_a_payer;
          bVal = b.reste_a_payer;
          break;
        case 'retard':
          aVal = a.retard;
          bVal = b.retard;
          break;
        case 'payeur_nom':
          aVal = a.payeur_nom;
          bVal = b.payeur_nom;
          break;
        case 'nfacture':
          aVal = a.nfacture;
          bVal = b.nfacture;
          break;
        case 'total_ht':
          aVal = a.total_ht;
          bVal = b.total_ht;
          break;
        case 'total_ttc':
          aVal = a.total_ttc;
          bVal = b.total_ttc;
          break;
        default:
          aVal = a.date_piece;
          bVal = b.date_piece;
          break;
      }

      if (aVal == null) aVal = '';
      if (bVal == null) bVal = '';

      if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return data;
  },

  get impayesUnitaireGroupes() {
    if (this.activeView !== 'unitaire') return [];

    const grouped = new Map();
    for (const impaye of this.filteredImpayes) {
      const key = impaye.nfacture;
      if (!grouped.has(key)) {
        grouped.set(key, {
          ...impaye,
          numero_dossier_list: [impaye.numero_dossier],
          groupedIds: [impaye.objectId],
        });
      } else {
        const existing = grouped.get(key);
        if (!existing.numero_dossier_list.includes(impaye.numero_dossier)) {
          existing.numero_dossier_list.push(impaye.numero_dossier);
        }
        existing.groupedIds.push(impaye.objectId);
      }
    }

    return [...grouped.values()].map((item) => ({
      ...item,
      numero_dossier:
        item.numero_dossier_list.filter((d) => d && d !== '—').length > 0
          ? item.numero_dossier_list.filter((d) => d && d !== '—').join(', ')
          : '—',
      objectId: item.groupedIds[0],
    }));
  },

  get impayesPayeurGroupes() {
    if (this.activeView !== 'payeur') return [];

    const grouped = new Map();
    for (const impaye of this.filteredImpayes) {
      const key = impaye.payeur_nom || '(inconnu)';
      if (!grouped.has(key)) {
        grouped.set(key, { key, items: [impaye] });
      } else {
        grouped.get(key).items.push(impaye);
      }
    }

    return [...grouped.values()].map((g) => ({
      ...g,
      count: g.items.length,
      maxRetard: Math.max(...g.items.map((i) => i.retard || 0)),
      totalReste: g.items.reduce(
        (s, i) => s + (Number(i.reste_a_payer) || 0),
        0,
      ),
      uniqueSequences:
        [...new Set(g.items.map((i) => i.sequenceNom).filter(Boolean))].join(', ') ||
        '—',
    }));
  },

  get impayesContactGroupes() {
    if (this.activeView !== 'contact') return [];

    const flat = [];
    for (const item of this.filteredImpayes) {
      if (item.payeur_nom) {
        flat.push({
          ...item,
          contact_nom: item.payeur_nom,
          contact_role: 'Ses propres impayés',
        });
      }
      if (item.apporteur_nom && item.apporteur_nom !== item.payeur_nom) {
        flat.push({
          ...item,
          contact_nom: item.apporteur_nom,
          contact_role: "Apporteur d'affaire pour",
        });
      }
    }

    const contacts = new Map();
    for (const item of flat) {
      if (!contacts.has(item.contact_nom)) {
        contacts.set(item.contact_nom, new Map());
      }
      const roles = contacts.get(item.contact_nom);
      if (!roles.has(item.contact_role)) {
        roles.set(item.contact_role, []);
      }
      roles.get(item.contact_role).push(item);
    }

    return [...contacts.entries()].map(([nom, rolesMap]) => {
      const roles = [...rolesMap.entries()].map(([role, items]) => ({
        role,
        count: items.length,
        maxRetard: Math.max(...items.map((i) => i.retard || 0)),
        totalReste: items.reduce(
          (s, i) => s + (Number(i.reste_a_payer) || 0),
          0,
        ),
        items,
      }));

      return {
        nom,
        totalCount: roles.reduce((s, r) => s + r.count, 0),
        maxRetard: Math.max(...roles.map((r) => r.maxRetard)),
        totalReste: roles.reduce((s, r) => s + r.totalReste, 0),
        roles,
      };
    });
  },

  get groupesPayeur() {
    const map = new Map();
    for (const item of this.filteredImpayes) {
      const key = item.payeur_nom || '(inconnu)';
      if (!map.has(key)) map.set(key, true);
    }
    return [...map.keys()];
  },

  get groupesContact() {
    const noms = new Set();
    for (const item of this.allImpayes) {
      if (item.payeur_nom) noms.add(item.payeur_nom);
      if (item.apporteur_nom && item.apporteur_nom !== item.payeur_nom)
        noms.add(item.apporteur_nom);
    }
    return [...noms];
  },

  get sequenceOptions() {
    return [
      { label: 'Toutes les séquences', value: 'all' },
      { label: 'Sans séquence', value: 'none' },
      ...this.sequences.map((s) => ({ label: s.nom, value: s.id })),
    ];
  },

  // ── Helpers ──
  formatDate(val) {
    if (!val) return '—';
    const d = val instanceof Date ? val : new Date(val);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('fr-FR', { dateStyle: 'short' });
  },

  formatMontant(val) {
    if (val == null) return '—';
    return Number(val).toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    });
  },

  getRetardClass(retard) {
    if (retard > 30) return 'text-red-600';
    if (retard > 7) return 'text-orange-500';
    return 'text-gray-600';
  },

  toggleSort(column) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  },

  sortIcon(column) {
    if (this.sortColumn !== column) return 'fa-sort';
    return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  },

  // ── Sélection ──
  isSelected(item) {
    if (item.groupedIds && item.groupedIds.length > 0) {
      return item.groupedIds.some((id) =>
        this.selection.some((s) => s.objectId === id),
      );
    }
    return this.selection.some((s) => s.objectId === item.objectId);
  },

  toggleSelection(item) {
    if (item.groupedIds && item.groupedIds.length > 0) {
      const allOriginals = this.allImpayes.filter((i) =>
        item.groupedIds.includes(i.objectId),
      );
      const firstId = item.groupedIds[0];
      const isFirstSelected = this.selection.some((s) => s.objectId === firstId);

      if (isFirstSelected) {
        this.selection = this.selection.filter(
          (s) => !item.groupedIds.includes(s.objectId),
        );
      } else {
        for (const orig of allOriginals) {
          if (!this.selection.some((s) => s.objectId === orig.objectId)) {
            this.selection.push(orig);
          }
        }
      }
    } else {
      const idx = this.selection.findIndex((s) => s.objectId === item.objectId);
      if (idx === -1) this.selection.push(item);
      else this.selection.splice(idx, 1);
    }
  },

  toggleSelectAllUnitaire() {
    const allGroupes = this.impayesUnitaireGroupes;
    const allSelected = allGroupes.every((g) => this.isSelected(g));
    if (allSelected) {
      for (const g of allGroupes) {
        if (g.groupedIds) {
          this.selection = this.selection.filter(
            (s) => !g.groupedIds.includes(s.objectId),
          );
        } else {
          this.selection = this.selection.filter(
            (s) => s.objectId !== g.objectId,
          );
        }
      }
    } else {
      for (const g of allGroupes) {
        if (g.groupedIds) {
          const originals = this.allImpayes.filter((i) =>
            g.groupedIds.includes(i.objectId),
          );
          for (const orig of originals) {
            if (!this.selection.some((s) => s.objectId === orig.objectId)) {
              this.selection.push(orig);
            }
          }
        } else {
          if (!this.selection.some((s) => s.objectId === g.objectId)) {
            this.selection.push(g);
          }
        }
      }
    }
  },

  toggleSelectAllSansSequence() {
    const all = this.filteredImpayes;
    const allSelected = all.every((i) => this.isSelected(i));
    if (allSelected) {
      this.selection = this.selection.filter(
        (s) => !all.some((i) => i.objectId === s.objectId),
      );
    } else {
      for (const item of all) {
        if (!this.selection.some((s) => s.objectId === item.objectId)) {
          this.selection.push(item);
        }
      }
    }
  },

  // ── Groupes ──
  togglePayeurGroup(key) {
    this.expandedPayeurs = { ...this.expandedPayeurs, [key]: !this.expandedPayeurs[key] };
  },

  toggleContactGroup(nom) {
    this.expandedContacts = { ...this.expandedContacts, [nom]: !this.expandedContacts[nom] };
  },

  toggleContactRole(key) {
    this.expandedContactRoles = { ...this.expandedContactRoles, [key]: !this.expandedContactRoles[key] };
  },

  // ── Actions ──
  async ouvrirPdf(item) {
    this.pdfImpayelId = item.objectId;
    this.pdfOuvert = true;
    this.pdfLoading = true;
    this.pdfErreur = null;
    this.pdfSignedUrl = null;
    try {
      const result = await this.runWorkflow('generate-pdf-link', {
        impayelId: item.objectId,
      });
      if (result.success) {
        this.pdfSignedUrl = result.data.url;
      } else {
        this.pdfErreur = result.error || 'Impossible de générer le lien PDF.';
      }
    } catch (err) {
      this.pdfErreur = 'Impossible de générer le lien PDF.';
    } finally {
      this.pdfLoading = false;
    }
  },

  async suspendFacture(item) {
    try {
      await this.runWorkflow('suspend-facture', { objectId: item.objectId });
      await this.charger();
    } catch (err) {
      this.error = err.message || 'Erreur lors de la suspension';
    }
  },

  async unsuspendFacture(item) {
    try {
      await this.runWorkflow('unsuspend-facture', { objectId: item.objectId });
      await this.charger();
    } catch (err) {
      this.error = err.message || 'Erreur lors de la réactivation';
    }
  },

  ouvrirDrawerAssignation(group) {
    this.drawerAssignPayeur = group.key || '(inconnu)';
    this.drawerAssignImpayes = group.items;
    this.drawerAssignSelection = group.items.map((i) => i.objectId);
    this.drawerAssignSequenceChoisie = null;
    this.drawerAssignOpen = true;
  },

  ouvrirDrawerAssignationContact(contactGroup, roleGroup) {
    this.drawerAssignPayeur = `${contactGroup.nom} (${roleGroup.role})`;
    this.drawerAssignImpayes = roleGroup.items;
    this.drawerAssignSelection = roleGroup.items.map((i) => i.objectId);
    this.drawerAssignSequenceChoisie = null;
    this.drawerAssignOpen = true;
  },

  ouvrirModalAssigner(item) {
    this.impayesCibles = [item.objectId];
    this.sequenceChoisie = null;
    this.modalAssignerOuvert = true;
  },

  ouvrirModalAssignerSelection() {
    this.impayesCibles = this.selection.map((s) => s.objectId);
    this.sequenceChoisie = null;
    this.modalAssignerOuvert = true;
  },

  async assignerSequenceWrapper() {
    if (!this.sequenceChoisie) return;
    this.assignant = true;
    try {
      await this.runWorkflow('assign-sequence', {
        objectIds: this.impayesCibles,
        sequenceId: this.sequenceChoisie,
      });
      this.selection = [];
      this.impayesCibles = [];
      this.modalAssignerOuvert = false;
      await this.charger();
    } catch (err) {
      this.error = err.message || "Erreur lors de l'assignation";
    } finally {
      this.assignant = false;
    }
  },

  async drawerAttribuer() {
    if (!this.drawerAssignSequenceChoisie || this.drawerAssignSelection.length === 0)
      return;
    this.drawerAssignAssigning = true;
    try {
      await this.runWorkflow('assign-sequence', {
        objectIds: this.drawerAssignSelection,
        sequenceId: this.drawerAssignSequenceChoisie,
      });
      this.drawerAssignOpen = false;
      await this.charger();
    } catch (err) {
      this.error = err.message || "Erreur lors de l'attribution";
    } finally {
      this.drawerAssignAssigning = false;
    }
  },

  drawerToggleItem(objectId) {
    const idx = this.drawerAssignSelection.indexOf(objectId);
    if (idx > -1) {
      const arr = [...this.drawerAssignSelection];
      arr.splice(idx, 1);
      this.drawerAssignSelection = arr;
    } else {
      this.drawerAssignSelection = [...this.drawerAssignSelection, objectId];
    }
  },

  drawerToggleTout() {
    if (this.drawerToutCoche()) {
      this.drawerAssignSelection = [];
    } else {
      this.drawerAssignSelection = this.drawerAssignImpayes.map((i) => i.objectId);
    }
  },

  drawerToutCoche() {
    return (
      this.drawerAssignSelection.length === this.drawerAssignImpayes.length &&
      this.drawerAssignImpayes.length > 0
    );
  },

  async syncNow() {
    this.syncing = true;
    try {
      await this.runWorkflow('sync-invoices', {});
      window.location.reload();
    } catch (err) {
      this.error = err.message || 'Erreur lors de la synchronisation';
      this.syncing = false;
    }
  },
}));

Alpine.start();
