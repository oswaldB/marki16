import Alpine from 'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/module.esm.js';
import { execute as initExecute } from './workflows/init.js';
import { execute as loadAllExecute } from './workflows/load-all.js';
import { execute as createRelanceExecute } from './workflows/create-relance.js';

window.workflows = {
  'init': { execute: initExecute },
  'load-all': { execute: loadAllExecute },
  'create-relance': { execute: createRelanceExecute },
};

Alpine.data('relancesManuellesPage', () => ({
  // ── State ──────────────────────────────────────────────────────
  loading: false,
  impayes: [],
  sequences: [],
  smtpProfiles: [],

  search: '',
  filtreRole: 'payeur',
  filtreSequence: 'all',
  filtreStatutDossier: 'all',
  rapMin: '',
  rapMax: '',
  retardMin: '',
  includeBlacklist: false,
  includeSuspendus: false,
  includeSansEmail: false,
  smtpProfilId: '',

  selectedKeys: [],
  generant: false,

  showFactures: false,
  showFiltres: true,
  groupeFactures: null,

  file: [],
  fileLoading: false,
  filtreFileStatut: 'a_traiter',
  envoiGroupe: false,
  planifGroupe: false,
  datePlanification: new Date().toISOString().slice(0, 10),

  showSuiviDrawer: false,
  suiviSelectionne: null,
  drawerDateEnvoi: '',
  drawerCc: '',
  drawerObjet: '',
  drawerCorps: '',
  drawerSaving: false,
  drawerSending: false,

  showSupprModal: false,
  suiviASupprimer: null,
  supprimant: false,

  toastMessage: '',
  toastColor: 'green',
  toastTimer: null,

  // ── Lifecycle ──────────────────────────────────────────────────
  init() {
    this.loadInitialData();
  },

  async loadInitialData() {
    this.loading = true;
    this.fileLoading = true;
    try {
      const result = await this.runWorkflow('init', {});
      if (result.success) {
        this.impayes = result.data.impayes || [];
        this.sequences = result.data.sequences || [];
        this.smtpProfiles = result.data.smtpProfiles || [];
        this.file = result.data.file || [];
        if (!this.smtpProfilId && this.smtpProfiles.length > 0) {
          this.smtpProfilId = this.smtpProfiles[0].id;
        }
      } else {
        this.showToast(result.error || 'Erreur lors du chargement initial', 'red');
      }
    } catch (err) {
      console.error(err);
      this.showToast(err.message || 'Erreur inconnue', 'red');
    } finally {
      this.loading = false;
      this.fileLoading = false;
    }
  },

  async runWorkflow(name, params = {}) {
    const wf = window.workflows[name];
    if (!wf || !wf.execute) {
      throw new Error('Workflow "' + name + '" introuvable');
    }
    return await wf.execute(this, params);
  },

  // ── Helpers ────────────────────────────────────────────────────
  showToast(message, color = 'green') {
    this.toastMessage = message;
    this.toastColor = color;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { this.toastMessage = ''; }, 4000);
  },

  calcRetard(dateEcheance) {
    if (!dateEcheance) return 0;
    const d = dateEcheance instanceof Date ? dateEcheance : new Date(dateEcheance);
    if (isNaN(d.getTime())) return 0;
    return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86_400_000));
  },

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

  formatMontant(val) {
    if (val == null) return '—';
    return Number(val).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  },

  statutBadgeClass(statut) {
    if (statut === 'Envoyée') return 'bg-green-100 text-green-700';
    if (statut === "Erreur d'envoi") return 'bg-red-100 text-red-700';
    if (statut === 'pret pour envoi') return 'bg-blue-100 text-blue-700';
    if (statut === 'brouillon') return 'bg-orange-100 text-orange-700';
    return 'bg-gray-100 text-gray-600';
  },

  statutLabel(statut) {
    if (statut === 'brouillon') return 'À envoyer';
    if (statut === 'pret pour envoi') return 'Planifié';
    return statut;
  },

  estEnvoyee(s) {
    return s?.statut === 'Envoyée' || s?.emailSent === true;
  },

  // ── Computed-ish getters (called as methods in Alpine) ─────────
  get statutDossierValues() {
    const values = new Set();
    for (const i of this.impayes) {
      if (i.statut_dossier) values.add(i.statut_dossier);
    }
    return [...values].sort();
  },

  get nbFiltresActifs() {
    let n = 0;
    if (this.filtreRole !== 'payeur') n++;
    if (this.filtreSequence !== 'all') n++;
    if (this.filtreStatutDossier !== 'all') n++;
    if (this.rapMin !== '') n++;
    if (this.rapMax !== '') n++;
    if (this.retardMin !== '') n++;
    if (this.includeBlacklist) n++;
    if (this.includeSuspendus) n++;
    if (this.includeSansEmail) n++;
    return n;
  },

  impayePasse(i) {
    if (!this.includeBlacklist && i.isBlacklisted) return false;
    const statut = (i.statut_dossier || '').toLowerCase();
    if (!this.includeSuspendus && statut.includes('suspend')) return false;

    if (this.filtreSequence === 'none') {
      if (i.sequenceId) return false;
    } else if (this.filtreSequence !== 'all') {
      if (i.sequenceId !== this.filtreSequence) return false;
    }

    if (this.filtreStatutDossier !== 'all' && i.statut_dossier !== this.filtreStatutDossier) return false;

    const rap = Number(i.reste_a_payer) || 0;
    if (this.rapMin !== '' && rap < Number(this.rapMin)) return false;
    if (this.rapMax !== '' && rap > Number(this.rapMax)) return false;
    if (this.retardMin !== '' && i.retard < Number(this.retardMin)) return false;
    return true;
  },

  get groupes() {
    const map = new Map();
    const role = this.filtreRole;

    for (const imp of this.impayes) {
      if (!this.impayePasse(imp)) continue;

      const candidats = [];
      const payeurContact = imp.contactRelance || imp.payeur;
      if (role !== 'apporteur' && payeurContact) candidats.push({ contact: payeurContact, role: 'payeur' });
      if (role !== 'payeur' && imp.apporteur) candidats.push({ contact: imp.apporteur, role: 'apporteur' });

      for (const { contact, role: r } of candidats) {
        if (!this.includeSansEmail && !contact.email) continue;
        if (contact.isBlacklisted && !this.includeBlacklist) continue;
        const key = `${contact.id}::${r}`;
        if (!map.has(key)) map.set(key, { key, contact, role: r, impayes: [] });
        map.get(key).impayes.push(imp);
      }
    }

    let list = [...map.values()].map((g) => {
      const totalRap = g.impayes.reduce((s, i) => s + (Number(i.reste_a_payer) || 0), 0);
      const retardMax = g.impayes.reduce((m, i) => Math.max(m, i.retard || 0), 0);
      return {
        ...g,
        contactNom: `${g.contact.prenom} ${g.contact.nom}`.trim() || g.contact.email || '(inconnu)',
        nbFactures: g.impayes.length,
        totalRap,
        retardMax,
      };
    });

    if (this.search) {
      const s = this.search.toLowerCase();
      list = list.filter(
        (g) =>
          g.contactNom.toLowerCase().includes(s) ||
          g.contact.email.toLowerCase().includes(s) ||
          g.impayes.some(
            (i) =>
              (i.nfacture || '').toLowerCase().includes(s) ||
              (i.adresse_bien || '').toLowerCase().includes(s),
          ),
      );
    }

    return list.sort((a, b) => b.totalRap - a.totalRap);
  },

  get totalSelection() {
    return this.groupes
      .filter((g) => this.selectedKeys.includes(g.key))
      .reduce((s, g) => s + (Number(g.totalRap) || 0), 0);
  },

  // ── Sélection ──────────────────────────────────────────────────
  isSelected(g) {
    return this.selectedKeys.includes(g.key);
  },

  toggleSelection(g) {
    const idx = this.selectedKeys.indexOf(g.key);
    if (idx === -1) this.selectedKeys.push(g.key);
    else this.selectedKeys.splice(idx, 1);
  },

  toutSelectionner() {
    this.selectedKeys = this.groupes.map((g) => g.key);
  },

  deselectionner() {
    this.selectedKeys = [];
  },

  reinitialiser() {
    this.search = '';
    this.filtreRole = 'payeur';
    this.filtreSequence = 'all';
    this.filtreStatutDossier = 'all';
    this.rapMin = '';
    this.rapMax = '';
    this.retardMin = '';
    this.includeBlacklist = false;
    this.includeSuspendus = false;
    this.includeSansEmail = false;
    this.selectedKeys = [];
  },

  // ── Chargements ────────────────────────────────────────────────
  async chargerImpayes() {
    this.loading = true;
    try {
      const result = await this.runWorkflow('load-all', { type: 'impayes' });
      if (result.success) {
        this.impayes = result.data.impayes || [];
        this.selectedKeys = [];
      } else {
        this.showToast(result.error || 'Erreur chargement impayés', 'red');
      }
    } catch (err) {
      this.showToast(err.message || 'Erreur chargement impayés', 'red');
    } finally {
      this.loading = false;
    }
  },

  async chargerFile() {
    this.fileLoading = true;
    try {
      const result = await this.runWorkflow('load-all', { type: 'file', filtreFileStatut: this.filtreFileStatut });
      if (result.success) {
        this.file = result.data.file || [];
      } else {
        this.showToast(result.error || 'Erreur chargement file', 'red');
      }
    } catch (err) {
      this.showToast(err.message || 'Erreur chargement file', 'red');
    } finally {
      this.fileLoading = false;
    }
  },

  // ── Génération ───────────────────────────────────────────────────
  get payloadGeneration() {
    return this.groupes
      .filter((g) => this.selectedKeys.includes(g.key))
      .map((g) => ({
        contactId: g.contact.id,
        role: g.role,
        impayeIds: g.impayes.map((i) => i.id),
      }));
  },

  async generer() {
    if (this.payloadGeneration.length === 0) {
      this.showToast('Aucun groupe sélectionné', 'orange');
      return;
    }
    if (!this.smtpProfilId) {
      this.showToast('Sélectionnez un profil SMTP', 'orange');
      return;
    }

    this.generant = true;
    try {
      const result = await this.runWorkflow('create-relance', {
        selection: this.payloadGeneration,
        smtpProfilId: this.smtpProfilId,
      });
      const crees = result.data?.suivisCrees ?? 0;
      const erreurs = result.data?.erreurs || [];
      this.showToast(
        `${crees} email(s) de suivi généré(s)`,
        crees > 0 ? 'green' : 'orange'
      );
      this.selectedKeys = [];
      await this.chargerFile();
    } catch (err) {
      this.showToast(err.message || 'Erreur génération', 'red');
    } finally {
      this.generant = false;
    }
  },

  // ── Actions file ───────────────────────────────────────────────
  ouvrirFactures(groupe) {
    this.groupeFactures = groupe;
    this.showFactures = true;
  },

  ouvrirSuivi(row) {
    this.suiviSelectionne = row;
    this.drawerDateEnvoi = this.toDateInput(row.dateEnvoi);
    this.drawerCc = row.cc || '';
    this.drawerObjet = row.objet || '';
    this.drawerCorps = row.corps || '';
    this.showSuiviDrawer = true;
  },

  demanderSuppression(row) {
    if (this.estEnvoyee(row)) {
      this.showToast('Relance déjà envoyée. Elle ne peut plus être supprimée.', 'orange');
      return;
    }
    this.suiviASupprimer = row;
    this.showSupprModal = true;
  },

  async supprimerSuivi() {
    const row = this.suiviASupprimer;
    if (!row) return;

    this.supprimant = true;
    try {
      await Parse.Cloud.run('supprimerRelanceManuelle', { suiviId: row.id });
      this.showToast('Relance supprimée', 'green');
      this.showSupprModal = false;
      this.suiviASupprimer = null;
      await this.chargerFile();
    } catch (err) {
      this.showToast(err.message || 'Erreur suppression', 'red');
    } finally {
      this.supprimant = false;
    }
  },

  suivisATraiter() {
    return this.file.filter(
      (f) =>
        f.statut === 'brouillon' ||
        f.statut === 'pret pour envoi' ||
        f.statut === "Erreur d'envoi",
    );
  },

  async envoyerTous() {
    const rows = this.suivisATraiter();
    if (rows.length === 0) {
      this.showToast('Aucun email à envoyer', 'orange');
      return;
    }
    if (!window.confirm(`Envoyer ${rows.length} email(s) maintenant ?`)) return;

    this.envoiGroupe = true;
    try {
      const res = await Parse.Cloud.run('sendSuivis', { suiviIds: rows.map((r) => r.id) });
      const stats = res?.stats || res?.result || {};
      const ok = stats?.suivisEnvoyes ?? 0;
      const ko = stats?.suivisErreurs ?? 0;
      this.showToast(`${ok} email(s) envoyé(s)`, ko ? 'orange' : 'green');
      await this.chargerFile();
    } catch (err) {
      this.showToast(err.message || "Erreur d'envoi groupé", 'red');
    } finally {
      this.envoiGroupe = false;
    }
  },

  async planifierTous() {
    const rows = this.suivisATraiter();
    if (rows.length === 0) {
      this.showToast('Aucun email à planifier', 'orange');
      return;
    }
    if (!this.datePlanification) {
      this.showToast('Choisissez une date', 'orange');
      return;
    }

    this.planifGroupe = true;
    try {
      const d = new Date(this.datePlanification);
      await Promise.all(
        rows.map((r) => {
          const s = r._parse;
          s.set('dateEnvoi', d);
          s.set('statut', 'pret pour envoi');
          return s.save();
        }),
      );
      this.showToast(`${rows.length} email(s) planifié(s)`, 'green');
      await this.chargerFile();
    } catch (err) {
      this.showToast(err.message || 'Erreur planification', 'red');
    } finally {
      this.planifGroupe = false;
    }
  },

  // ── Drawer actions ─────────────────────────────────────────────
  async enregistrerSuivi() {
    if (!this.suiviSelectionne?._parse) return;
    this.drawerSaving = true;
    try {
      const s = this.suiviSelectionne._parse;
      const nouvelleDate = this.drawerDateEnvoi ? new Date(this.drawerDateEnvoi) : s.get('dateEnvoi');
      s.set('dateEnvoi', nouvelleDate);
      s.set('cc', this.drawerCc);
      s.set('objet', this.drawerObjet);
      s.set('corps', this.drawerCorps);

      let statutMaj = null;
      if (nouvelleDate) {
        const jour = new Date(nouvelleDate);
        jour.setHours(0, 0, 0, 0);
        const aujourdHui = new Date();
        aujourdHui.setHours(0, 0, 0, 0);
        if (jour.getTime() > aujourdHui.getTime()) {
          statutMaj = 'pret pour envoi';
        } else if (s.get('statut') === 'pret pour envoi') {
          statutMaj = 'brouillon';
        }
      }
      if (statutMaj) s.set('statut', statutMaj);

      await s.save();

      this.suiviSelectionne.cc = this.drawerCc;
      this.suiviSelectionne.objet = this.drawerObjet;
      this.suiviSelectionne.corps = this.drawerCorps;
      this.suiviSelectionne.dateEnvoi = nouvelleDate;
      if (statutMaj) this.suiviSelectionne.statut = statutMaj;

      this.showToast(statutMaj === 'pret pour envoi' ? 'Suivi planifié' : 'Suivi enregistré', 'green');
      this.showSuiviDrawer = false;
      await this.chargerFile();
    } catch (err) {
      this.showToast(err.message || 'Erreur enregistrement', 'red');
    } finally {
      this.drawerSaving = false;
    }
  },

  async envoyerSuivi() {
    if (!this.suiviSelectionne?.id) return;
    await this.enregistrerSuivi();
    if (this.showSuiviDrawer) return; // drawer still open means error

    this.drawerSending = true;
    try {
      const res = await Parse.Cloud.run('sendSuivis', { suiviIds: [this.suiviSelectionne.id] });
      const stats = res?.stats || res?.result || {};
      const erreurs = stats?.suivisErreurs ?? res?.errors?.length ?? 0;

      if (erreurs > 0) {
        const detail = res?.errors?.[0]?.erreur || 'Voir la dernière erreur du suivi.';
        this.showToast("L'email n'a pas pu être envoyé : " + detail, 'red');
      } else {
        this.showToast('Email envoyé', 'green');
      }
      await this.chargerFile();
    } catch (err) {
      this.showToast(err.message || "Erreur d'envoi", 'red');
    } finally {
      this.drawerSending = false;
      this.showSuiviDrawer = false;
    }
  },
}));

Alpine.start();
