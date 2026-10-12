import Alpine from 'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/module.esm.js';
import { execute as initExecute } from './workflows/init.js';
import { execute as loadAllExecute } from './workflows/load-all.js';
import { execute as generatePdfLinkExecute } from './workflows/generate-pdf-link.js';
import { execute as marquerPayeExecute } from './workflows/marquer-paye.js';
import { execute as marquerPayeGroupeExecute } from './workflows/marquer-paye-groupe.js';

window.workflows = {
  'init': { execute: initExecute },
  'load-all': { execute: loadAllExecute },
  'generate-pdf-link': { execute: generatePdfLinkExecute },
  'marquer-paye': { execute: marquerPayeExecute },
  'marquer-paye-groupe': { execute: marquerPayeGroupeExecute },
};

Alpine.data('recalcitrantsPage', () => ({
  // ── État ──
  loading: false,
  error: null,
  search: '',
  recalcitrants: [],
  expandedGroups: {},

  // ── PDF ──
  pdfOuvert: false,
  pdfImpayelId: null,
  pdfSignedUrl: null,
  pdfLoading: false,
  pdfErreur: null,

  // ── Toast ──
  toast: { show: false, title: '', description: '', color: 'green' },

  init() {
    this.loadInitialData();
  },

  async loadInitialData() {
    this.loading = true;
    this.error = null;
    try {
      const result = await this.runWorkflow('init', {});
      if (result.success) {
        this.recalcitrants = result.data.recalcitrants || [];
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

  async charger() {
    this.loading = true;
    this.error = null;
    try {
      const result = await this.runWorkflow('load-all', {});
      if (result.success) {
        this.recalcitrants = result.data.recalcitrants || [];
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
  get groupedData() {
    const searchLower = this.search.toLowerCase().trim();
    return this.recalcitrants.map((r) => {
      const contactNom = `${r.contact?.nom || ''} ${r.contact?.prenom || ''}`.trim() || '(inconnu)';
      const contactEmail = r.contact?.email || '';
      const contactId = r.contact?.id || contactNom;

      let impayes = (r.impayes || []).map((imp) => ({
        ...imp,
        contact_derniere_relance: imp.contact_derniere_relance || r.derniereRelanceDate,
      }));

      if (searchLower) {
        const matchesContact = contactNom.toLowerCase().includes(searchLower) || contactEmail.toLowerCase().includes(searchLower);
        const matchingImpayes = impayes.filter((imp) =>
          (imp.nfacture && imp.nfacture.toLowerCase().includes(searchLower)) ||
          (imp.adresse_bien && imp.adresse_bien.toLowerCase().includes(searchLower))
        );
        if (!matchesContact && matchingImpayes.length === 0) {
          return null;
        }
        if (!matchesContact) {
          impayes = matchingImpayes;
        }
      }

      if (impayes.length === 0) return null;

      const totalReste = impayes.reduce((s, i) => s + (Number(i.reste_a_payer) || 0), 0);
      const uniqueSequences = [...new Set(impayes.map((i) => i.sequenceNom).filter(Boolean))].join(', ') || '—';
      const derniereRelance = impayes[0]?.contact_derniere_relance || r.derniereRelanceDate;

      return {
        contactId,
        contactNom,
        contactEmail,
        impayes,
        totalReste,
        uniqueSequences,
        derniereRelance,
      };
    }).filter(Boolean);
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
    return Number(val).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  },

  toggleGroup(contactId) {
    this.expandedGroups = { ...this.expandedGroups, [contactId]: !this.expandedGroups[contactId] };
  },

  showToast(title, color = 'green', description = '') {
    this.toast = { show: true, title, color, description };
    setTimeout(() => { this.toast.show = false; }, 4000);
  },

  // ── Actions ──
  async ouvrirPdf(imp) {
    this.pdfImpayelId = imp.id;
    this.pdfOuvert = true;
    this.pdfLoading = true;
    this.pdfErreur = null;
    this.pdfSignedUrl = null;
    try {
      const result = await this.runWorkflow('generate-pdf-link', { impayelId: imp.id });
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

  async marquerPaye(imp) {
    try {
      const result = await this.runWorkflow('marquer-paye', { id: imp.id });
      if (result.success) {
        this.showToast('Facture marquée comme payée', 'green');
        await this.charger();
      } else {
        this.showToast('Erreur', 'red', result.error);
      }
    } catch (err) {
      this.showToast('Erreur', 'red', err.message);
    }
  },

  async marquerPayeGroupe(group) {
    const ids = group.impayes.map((imp) => imp.id);
    if (!ids.length) return;
    try {
      const result = await this.runWorkflow('marquer-paye-groupe', { ids });
      if (result.success) {
        this.showToast(`${ids.length} facture(s) marquée(s) comme payée(s)`, 'green');
        await this.charger();
      } else {
        this.showToast('Erreur', 'red', result.error);
      }
    } catch (err) {
      this.showToast('Erreur', 'red', err.message);
    }
  },
}));

Alpine.start();
