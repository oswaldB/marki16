import Alpine from 'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/module.esm.js';
import { execute as initExecute } from './workflows/init.js';
import { execute as loadDetailExecute } from './workflows/load-detail.js';
import { execute as blacklistExecute } from './workflows/blacklist-facture.js';
import { execute as unblacklistExecute } from './workflows/unsuspend-facture.js';
import { execute as changeSequenceExecute } from './workflows/change-sequence.js';
import { execute as suspendExecute } from './workflows/suspend-facture.js';

window.workflows = {
  'init': { execute: initExecute },
  'load-detail': { execute: loadDetailExecute },
  'blacklist-facture': { execute: blacklistExecute },
  'unsuspend-facture': { execute: unblacklistExecute },
  'change-sequence': { execute: changeSequenceExecute },
  'suspend-facture': { execute: suspendExecute },
};

Alpine.data('impayesdetailPage', () => ({
  // ── État ──
  loading: true,
  error: null,
  impaye: null,
  sequenceActive: null,
  relances: [],
  sequences: [],

  // Blacklist (F-008)
  showBlacklistForm: false,
  blacklistSaving: false,
  blacklistError: null,
  blacklistForm: { motifType: '', motifDetail: '' },
  blacklistMotifOptions: [
    { value: 'litige', label: 'Litige commercial' },
    { value: 'reglement_en_cours', label: 'Règlement en cours' },
    { value: 'erreur_facturation', label: 'Erreur de facturation' },
    { value: 'procedure_judiciaire', label: 'Procédure judiciaire' },
    { value: 'accord_special', label: 'Accord spécial' },
    { value: 'accord_paiement_notaire', label: 'Accord paiement notaire' },
    { value: 'cheque_encaissement_differe', label: 'Chèque reçus, encaissement différé' },
    { value: 'reglement_plusieurs_fois', label: 'Règlement en plusieurs fois' },
    { value: 'autre', label: 'Autre' },
  ],

  // PDF
  pdfDrawerOuvert: false,
  pdfLoading: true,
  pdfErreur: null,
  signedPdfUrl: null,

  // Séquence
  modalSequenceOuvert: false,
  sequenceChoisie: '',
  assignantSequence: false,
  retirantSequence: false,

  // Email relance
  modalRelanceContactOuvert: false,
  attribuantContact: false,
  emailSearchQuery: '',
  emailLoading: false,
  allEmails: [],
  filteredEmails: [],
  newEmail: { email: '', name: '' },
  creatingEmail: false,

  // Pause séquence
  pauseDrawerOuvert: false,
  pauseSaving: false,
  pauseChoix: null,
  pauseDateCustom: '',
  pauseOptions: [
    { value: '7j', label: '7 jours' },
    { value: '1m', label: '1 mois' },
    { value: 'custom', label: 'Choisir une date…' },
  ],

  // Relances
  relanceDrawerOuvert: false,
  relanceDrawerMode: 'create',
  relanceSelectionnee: null,
  relanceSaving: false,
  relanceForm: { dateEnvoi: '', objet: '', corps: '', to: '' },

  // ── Getters (via getters Alpine, on les expose comme méthodes/computed) ──
  get impayelId() {
    return new URLSearchParams(window.location.search).get('id');
  },

  get isBlacklisted() {
    return !!(this.impaye?.isBlacklisted);
  },

  get canSubmitBlacklist() {
    return !!(this.blacklistForm.motifType || this.blacklistForm.motifDetail?.trim());
  },

  get statutLabel() {
    const map = {
      'impaye': 'Impayé',
      'en cours': 'En cours',
      'payé': 'Payé',
      'partiellement_paye': 'Partiellement payé',
      'en_litige': 'En litige',
    };
    return map[this.impaye?.statut] || this.impaye?.statut || 'impaye';
  },

  get retard() {
    const d = this.impaye?.date_piece;
    if (!d) return 0;
    const date = d instanceof Date ? d : new Date(d);
    return Math.floor((new Date() - date) / 86_400_000);
  },

  get sequenceOptions() {
    return this.sequences.map(s => ({ label: s.get('nom'), value: s.id }));
  },

  get minPauseDate() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  },

  get joursDecalage() {
    if (this.pauseChoix === '7j') return 7;
    if (this.pauseChoix === '1m') return 30;
    if (this.pauseChoix === 'custom' && this.pauseDateCustom) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const cible = new Date(this.pauseDateCustom);
      return Math.round((cible - today) / 86_400_000);
    }
    return 0;
  },

  get peutSoumettrePause() {
    if (!this.pauseChoix) return false;
    if (this.pauseChoix === 'custom') return this.pauseDateCustom && this.joursDecalage > 0;
    return true;
  },

  get pauseResume() {
    if (!this.peutSoumettrePause) return null;
    const j = this.joursDecalage;
    return `Les relances en attente seront décalées de ${j} jour${j > 1 ? 's' : ''}.`;
  },

  get historique() {
    const evts = [];
    if (this.impaye?.createdAt) {
      evts.push({ date: this.impaye.createdAt, label: 'Impayé créé (sync automatique)' });
    }
    for (const r of this.relances) {
      if (r.statut === 'envoyé') {
        evts.push({ date: r.dateEnvoi, label: `Email envoyé — ${r.objet || '(sans objet)'}` });
      } else if (r.statut === 'échec') {
        evts.push({ date: r.dateEnvoi, label: `Échec d'envoi — ${r.objet || '(sans objet)'}` });
      }
    }
    return evts.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  // ── Init ──
  init() {
    this.loadInitialData();
  },

  async loadInitialData() {
    this.loading = true;
    this.error = null;
    try {
      const result = await this.runWorkflow('init', {});
      if (result.success) {
        this.impaye = result.data.impaye || null;
        this.sequenceActive = result.data.sequenceActive || null;
        this.relances = result.data.relances || [];
        this.sequences = result.data.sequences || [];
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

  // ── Helpers ──
  formatDate(val) {
    if (!val) return '—';
    const d = val instanceof Date ? val : new Date(val);
    if (isNaN(d)) return '—';
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  },

  formatDatetime(val) {
    if (!val) return '—';
    const d = val instanceof Date ? val : new Date(val);
    if (isNaN(d)) return '—';
    return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  },

  formatMontant(val) {
    if (val == null) return '—';
    return Number(val).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  },

  statutRelanceColor(s) {
    if (s === 'envoyé') return 'green';
    if (s === 'échec') return 'red';
    if (s === 'annulé') return 'orange';
    return 'neutral';
  },

  statutRelanceLabel(s) {
    if (s === 'envoyé') return 'Envoyé';
    if (s === 'échec') return 'Échec';
    if (s === 'pending') return 'En attente';
    if (s === 'annulé') return 'Annulé';
    return s;
  },

  // ── Reload ──
  async reload() {
    this.loading = true;
    try {
      const result = await this.runWorkflow('load-detail', { impayelId: this.impayelId });
      if (result.success) {
        this.impaye = result.data.impaye || null;
        this.sequenceActive = result.data.sequenceActive || null;
        this.relances = result.data.relances || [];
      } else {
        this.error = result.error;
      }
    } catch (err) {
      console.error(err);
      this.error = err.message;
    } finally {
      this.loading = false;
    }
  },

  // ── Blacklist ──
  toggleBlacklistForm() {
    this.showBlacklistForm = !this.showBlacklistForm;
    if (this.showBlacklistForm) {
      this.blacklistForm = { motifType: '', motifDetail: '' };
      this.blacklistError = null;
    }
  },

  async handleBlacklistSubmit() {
    this.blacklistError = null;
    this.blacklistSaving = true;
    try {
      await this.runWorkflow('blacklist-facture', {
        impayelId: this.impayelId,
        motifType: this.blacklistForm.motifType,
        motifDetail: this.blacklistForm.motifDetail,
      });
      this.showBlacklistForm = false;
      await this.reload();
    } catch (err) {
      this.blacklistError = err.message || 'Une erreur est survenue';
    } finally {
      this.blacklistSaving = false;
    }
  },

  async handleUnblacklist() {
    this.blacklistSaving = true;
    try {
      await this.runWorkflow('unsuspend-facture', { impayelId: this.impayelId });
      await this.reload();
    } catch (err) {
      alert('Erreur : ' + (err.message || 'Impossible de réactiver'));
    } finally {
      this.blacklistSaving = false;
    }
  },

  // ── PDF ──
  async ouvrirPdfDrawer() {
    this.pdfDrawerOuvert = true;
    this.pdfLoading = true;
    this.pdfErreur = null;
    this.signedPdfUrl = null;
    try {
      const response = await Parse.Cloud.run('generatePdfLink', { impayelId: this.impayelId });
      this.signedPdfUrl = response.url;
      this.pdfLoading = false;
    } catch (err) {
      this.pdfErreur = 'Impossible de générer le lien PDF.';
      this.pdfLoading = false;
    }
  },

  // ── Séquence ──
  ouvrirModalSequence() {
    this.sequenceChoisie = this.sequenceActive?.id || '';
    this.modalSequenceOuvert = true;
  },

  async assignerSequence() {
    if (!this.sequenceChoisie) return;
    this.assignantSequence = true;
    try {
      const result = await this.runWorkflow('change-sequence', {
        impayelId: this.impayelId,
        sequenceId: this.sequenceChoisie,
        action: 'assign',
      });
      if (result.success) {
        this.sequenceActive = result.data.sequenceActive || null;
        this.modalSequenceOuvert = false;
        await this.reload();
      }
    } catch (err) {
      alert('Erreur : ' + err.message);
    } finally {
      this.assignantSequence = false;
    }
  },

  async retirerSequence() {
    if (!confirm('Retirer la séquence de cet impayé ?')) return;
    this.retirantSequence = true;
    try {
      const result = await this.runWorkflow('change-sequence', {
        impayelId: this.impayelId,
        action: 'remove',
      });
      if (result.success) {
        this.sequenceActive = null;
        await this.reload();
      }
    } catch (err) {
      alert('Erreur : ' + err.message);
    } finally {
      this.retirantSequence = false;
    }
  },

  // ── Email relance ──
  ouvrirModalRelanceContact() {
    this.modalRelanceContactOuvert = true;
    this.emailSearchQuery = '';
    this.filteredEmails = this.allEmails;
    this.loadAllEmails();
  },

  async loadAllEmails() {
    this.emailLoading = true;
    try {
      const query = new Parse.Query('Contact');
      query.exists('email');
      query.notEqualTo('email', '');
      query.limit(1000);
      const contacts = await query.find();
      this.allEmails = contacts.map(c => ({
        id: c.id,
        email: c.get('email'),
        name: c.get('nom') || c.get('email'),
      }));
      this.filteredEmails = [...this.allEmails];
    } catch (err) {
      console.error('Erreur chargement contacts:', err);
    } finally {
      this.emailLoading = false;
    }
  },

  searchEmails() {
    if (!this.emailSearchQuery) {
      this.filteredEmails = this.allEmails;
      return;
    }
    const q = this.emailSearchQuery.toLowerCase();
    this.filteredEmails = this.allEmails.filter(e =>
      e.email.toLowerCase().includes(q) || (e.name && e.name.toLowerCase().includes(q))
    );
  },

  async selectEmail(email) {
    try {
      await this.runWorkflow('change-sequence', {
        impayelId: this.impayelId,
        action: 'setEmailRelance',
        contactId: email.id,
      });
      this.modalRelanceContactOuvert = false;
      await this.reload();
    } catch (err) {
      alert('Erreur : ' + (err.message || "Impossible d'attribuer l'email"));
    }
  },

  async createNewEmail() {
    if (!this.newEmail.email) {
      alert('Veuillez entrer un email');
      return;
    }
    this.creatingEmail = true;
    try {
      const Contact = Parse.Object.extend('Contact');
      const contactRelance = new Contact();
      contactRelance.set('email', this.newEmail.email);
      contactRelance.set('nom', this.newEmail.name || this.newEmail.email);
      contactRelance.set('estActif', true);
      contactRelance.set('nombreUtilisations', 0);
      await contactRelance.save();

      await this.runWorkflow('change-sequence', {
        impayelId: this.impayelId,
        action: 'setEmailRelance',
        contactId: contactRelance.id,
      });

      this.modalRelanceContactOuvert = false;
      this.newEmail = { email: '', name: '' };
      await this.reload();
    } catch (err) {
      alert('Erreur : ' + (err.message || "Impossible de créer l'email"));
    } finally {
      this.creatingEmail = false;
    }
  },

  async retirerEmailRelance() {
    if (!confirm('Retirer l\'email de relance de cet impayé ?')) return;
    this.attribuantContact = true;
    try {
      await this.runWorkflow('change-sequence', {
        impayelId: this.impayelId,
        action: 'removeEmailRelance',
      });
      await this.reload();
    } catch (err) {
      alert('Erreur : ' + (err.message || "Impossible de retirer l'email"));
    } finally {
      this.attribuantContact = false;
    }
  },

  // ── Pause (suspend-facture) ──
  ouvrirPauseDrawer() {
    this.pauseDrawerOuvert = true;
    this.pauseChoix = null;
    this.pauseDateCustom = '';
  },

  async soumettrePause() {
    if (!this.peutSoumettrePause) return;
    this.pauseSaving = true;
    try {
      await this.runWorkflow('suspend-facture', {
        impayelId: this.impayelId,
        jours: this.joursDecalage,
      });
      this.pauseDrawerOuvert = false;
      await this.reload();
    } catch (err) {
      alert('Erreur : ' + (err.message || "Impossible d'appliquer la pause"));
    } finally {
      this.pauseSaving = false;
    }
  },

  // ── Relances CRUD ──
  ouvrirRelanceCreate() {
    this.relanceSelectionnee = null;
    this.relanceDrawerMode = 'create';
    this.relanceForm = { dateEnvoi: '', objet: '', corps: '', to: '' };
    this.relanceDrawerOuvert = true;
  },

  ouvrirRelanceEdit(row) {
    this.relanceSelectionnee = row;
    this.relanceDrawerMode = 'edit';
    const d = row.dateEnvoi ? (row.dateEnvoi instanceof Date ? row.dateEnvoi : new Date(row.dateEnvoi)) : null;
    this.relanceForm = {
      dateEnvoi: d ? d.toISOString().split('T')[0] : '',
      objet: row.objet || '',
      corps: row.corps || '',
      to: row.to || '',
    };
    this.relanceDrawerOuvert = true;
  },

  async soumettreRelance() {
    if (!this.relanceForm.dateEnvoi) {
      alert("Date d'envoi obligatoire");
      return;
    }
    this.relanceSaving = true;
    try {
      const dateEnvoi = new Date(this.relanceForm.dateEnvoi);
      if (this.relanceDrawerMode === 'create') {
        const Impaye = Parse.Object.extend('Impaye');
        const impayePtr = Impaye.createWithoutData(this.impayelId);
        const r = new Parse.Object('Relance');
        r.set('impaye', impayePtr);
        r.set('dateEnvoi', dateEnvoi);
        r.set('objet', this.relanceForm.objet);
        r.set('corps', this.relanceForm.corps);
        r.set('to', this.relanceForm.to);
        r.set('statut', 'pending');
        r.set('manuel', true);
        await r.save();
      } else if (this.relanceSelectionnee?._parse) {
        const p = this.relanceSelectionnee._parse;
        p.set('dateEnvoi', dateEnvoi);
        p.set('objet', this.relanceForm.objet);
        p.set('corps', this.relanceForm.corps);
        p.set('to', this.relanceForm.to);
        p.set('manuel', true);
        await p.save();
      }
      this.relanceDrawerOuvert = false;
      await this.reload();
    } catch (err) {
      alert('Erreur : ' + (err.message || "Impossible d'enregistrer"));
    } finally {
      this.relanceSaving = false;
    }
  },

  async supprimerRelance(row) {
    if (!confirm('Supprimer cette relance ?')) return;
    try {
      if (row._parse) {
        await row._parse.destroy();
        this.relances = this.relances.filter(r => r.objectId !== row.objectId);
      }
    } catch (err) {
      alert('Erreur : ' + (err.message || 'Impossible de supprimer'));
    }
  },
}));

Alpine.start();
