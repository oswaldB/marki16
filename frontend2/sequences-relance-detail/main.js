import Alpine from 'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/module.esm.js';
import { execute as initExecute } from './workflows/init.js';
import { execute as loadDetailExecute } from './workflows/load-detail.js';
import { execute as saveDetailExecute } from './workflows/save-detail.js';
import { execute as ajouterEmailExecute } from './workflows/ajouter-email.js';
import { execute as supprimerEmailExecute } from './workflows/supprimer-email.js';
import { execute as testerEmailExecute } from './workflows/tester-email.js';

window.workflows = {
  'init': { execute: initExecute },
  'load-detail': { execute: loadDetailExecute },
  'save-detail': { execute: saveDetailExecute },
  'ajouter-email': { execute: ajouterEmailExecute },
  'supprimer-email': { execute: supprimerEmailExecute },
  'tester-email': { execute: testerEmailExecute },
};

const SCENARIO_FORMATS = ["single", "multiple", "both", "broker"];

const VARIABLES = [
  { groupe: "PAYEUR", vars: ["payeur_nom","payeur_prenom","payeur_email","payeur_telephone","payeur_type","payeur_civilite"] },
  { groupe: "FACTURE", vars: ["nfacture","ref_piece","date_piece","reste_a_payer","montant_total","date_echeance"] },
  { groupe: "BIEN", vars: ["adresse_bien","code_postal","ville","numero_lot","etage","porte","escalier","entree"] },
  { groupe: "PROPRIETAIRE", vars: ["proprietaire_nom","proprietaire_prenom","proprietaire_email","proprietaire_telephone"] },
  { groupe: "APPORTEUR", vars: ["apporteur_nom","apporteur_prenom","apporteur_email","apporteur_telephone","apporteur_societe","apporteur_civilite"] },
  { groupe: "CONTACTS PAYEUR", vars: ["payeur_contact_nom","payeur_contact_prenom","payeur_contact_email"] },
  { groupe: "CONTACTS PROPRIETAIRE", vars: ["proprietaire_contact_nom","proprietaire_contact_prenom","proprietaire_contact_email","proprietaire_contact_civilite"] },
  { groupe: "CONTACTS APPORTEUR", vars: ["apporteur_contact_nom","apporteur_contact_prenom","apporteur_contact_email","apporteur_contact_civilite"] },
  { groupe: "AUTRES", vars: ["acquereur_nom","acquereur_prenom","acquereur_email","donneur_ordre_nom","donneur_ordre_prenom","donneur_ordre_email","locataire_entrant_nom","locataire_entrant_prenom","locataire_sortant_nom","locataire_sortant_prenom","notaire_nom","notaire_prenom","notaire_email","syndic_nom","syndic_prenom","syndic_email","syndic_telephone"] },
  { groupe: "DOSSIER", vars: ["numero_dossier","employe_intervention","date_debut_mission"] },
  { groupe: "MULTIPLE", vars: ["total_impayes","nfactures_liste","ndossier_liste"] },
  { groupe: "LIENS", vars: ["lien_pdf","lien_espace"] },
  { groupe: "FORMATAGE", vars: ['Pour formater une date : [[date_echeance, date("DD/MM/YYYY")]] — Remplacez le format par celui souhaité'] },
];

const scenarioTabs = [
  { label: "1 impayé", value: "single" },
  { label: "Plusieurs impayés", value: "multiple" },
  { label: "Impayés + apporteur", value: "both" },
  { label: "Apporteur seul", value: "broker" },
];

const champOptions = [
  { label: "Type payeur", value: "payeur_type" },
  { label: "Nom payeur", value: "payeur_nom" },
  { label: "Prénom payeur", value: "payeur_prenom" },
  { label: "Email payeur", value: "payeur_email" },
  { label: "Téléphone payeur", value: "payeur_telephone" },
  { label: "Reste à payer", value: "reste_a_payer" },
  { label: "Statut", value: "statut" },
  { label: "Statut dossier", value: "statut_dossier" },
  { label: "Nom apporteur", value: "apporteur_nom" },
  { label: "Prénom apporteur", value: "apporteur_prenom" },
  { label: "Email apporteur", value: "apporteur_email" },
  { label: "Téléphone apporteur", value: "apporteur_telephone" },
  { label: "Société apporteur", value: "apporteur_societe" },
  { label: "Nom propriétaire", value: "proprietaire_nom" },
  { label: "Prénom propriétaire", value: "proprietaire_prenom" },
  { label: "Email propriétaire", value: "proprietaire_email" },
  { label: "Téléphone propriétaire", value: "proprietaire_telephone" },
  { label: "Adresse bien", value: "adresse_bien" },
  { label: "Code postal", value: "code_postal" },
  { label: "Ville", value: "ville" },
  { label: "Numéro lot", value: "numero_lot" },
];

const operateurOptions = [
  { label: "est égal à", value: "egal" },
  { label: "n'est pas égal à", value: "different" },
  { label: "supérieur à", value: "superieur" },
  { label: "inférieur à", value: "inferieur" },
  { label: "contient", value: "contient" },
  { label: "ne contient pas", value: "ne_contient_pas" },
  { label: "commence par", value: "commence_par" },
  { label: "ne commence pas par", value: "ne_commence_pas_par" },
  { label: "se termine par", value: "se_termine_par" },
  { label: "ne se termine pas par", value: "ne_se_termine_pas_par" },
];

Alpine.data('sequencesRelanceDetailPage', () => ({
  // ── Core ──
  loading: true,
  saving: false,
  publishing: false,
  error: null,
  sequence: null,
  nom: '',
  publiee: false,
  validationObligatoire: false,
  attributionAutomatique: false,
  emails: [],
  smtpProfiles: [],
  collapsedEmails: {},
  variablesCollapsed: {},
  showImpayesTable: false,
  apercuConcernes: 0,
  apercuExclus: 0,
  apercuSansEmail: 0,
  impayesConcernes: [],
  groupesRegles: [],
  liensPaiement: [],

  // Flags
  runningAutoAssign: false,
  regenerating: false,
  showIaModal: false,

  // Const refs
  scenarioTabs,
  champOptions,
  operateurOptions,

  // ── Getters ──
  get smtpOptions() {
    return this.smtpProfiles.map(p => ({ value: p.id, label: p.get('nom_affiche') || p.get('nom') }));
  },

  get emailsSorted() {
    return [...this.emails].sort((a, b) => a.delai - b.delai);
  },

  get sequenceId() {
    return new URLSearchParams(window.location.search).get('id');
  },

  // ── Init ──
  init() {
    this.loadInitialData();
  },

  async loadInitialData() {
    this.loading = true;
    this.error = null;
    try {
      const result = await this.runWorkflow('init', { sequenceId: this.sequenceId });
      if (result.success) {
        this.sequence = result.data.sequence;
        this.nom = result.data.nom;
        this.publiee = result.data.publiee;
        this.validationObligatoire = result.data.validationObligatoire;
        this.attributionAutomatique = result.data.attributionAutomatique;
        this.emails = result.data.emails || [];
        this.smtpProfiles = result.data.smtpProfiles || [];
        this.groupesRegles = result.data.groupesRegles || [];
        this.liensPaiement = result.data.liensPaiement || [];
        this.apercuConcernes = result.data.apercuConcernes || 0;
        this.apercuExclus = result.data.apercuExclus || 0;
        this.apercuSansEmail = result.data.apercuSansEmail || 0;
        this.impayesConcernes = result.data.impayesConcernes || [];
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

  // ── Scenario helpers ──
  getScenario(email, format) {
    const f = format || 'single';
    if (!Array.isArray(email.scenarios)) {
      email.scenarios = SCENARIO_FORMATS.map(fmt => ({ format: fmt, active: true, smtp: '', cc: '', objet: '', corps: '' }));
    }
    let s = email.scenarios.find(sc => sc.format === f);
    if (!s) {
      s = { format: f, active: true, smtp: '', cc: '', objet: '', corps: '' };
      email.scenarios.push(s);
    }
    if (s.active === undefined) s.active = true;
    if (s.smtp === undefined) s.smtp = '';
    if (s.cc === undefined) s.cc = '';
    return s;
  },

  currentScenario(email) {
    return this.getScenario(email, email.activeScenario || 'single');
  },

  switchScenario(email, newScenario) {
    email.activeScenario = newScenario;
  },

  // ── Email actions ──
  async ajouterEmail() {
    try {
      const result = await this.runWorkflow('ajouter-email', { count: this.emails.length });
      if (result.success && result.data) {
        this.emails.push(result.data);
      }
    } catch (err) {
      console.error(err);
      alert('Erreur : ' + (err.message || "Impossible d'ajouter l'email"));
    }
  },

  async supprimerEmail(key) {
    if (!confirm('Supprimer cet email ?')) return;
    try {
      const result = await this.runWorkflow('supprimer-email', { emails: this.emails, key });
      if (result.success) {
        this.emails = result.data.emails;
      }
    } catch (err) {
      console.error(err);
      alert('Erreur : ' + (err.message || 'Impossible de supprimer'));
    }
  },

  toggleEmailVisibility(key) {
    this.collapsedEmails[key] = !this.collapsedEmails[key];
  },

  toggleVariablesCollapsed(key) {
    this.variablesCollapsed[key] = !this.variablesCollapsed[key];
  },

  variablesForEmail(emailIdx) {
    const relanceVars = Array.from({ length: emailIdx }, (_, i) => ({
      groupe: `RELANCE ${i + 1}`,
      vars: [`relance.${i + 1}.objet`, `relance.${i + 1}.dateEnvoi`]
    }));
    const paymentLinkVars = this.liensPaiement.map(lien => ({
      name: `lien_paiement_${lien.id}`,
      display: lien.nom,
      url: lien.url,
      isPaymentLink: true,
    }));
    const baseVars = VARIABLES.filter(g => g.groupe !== 'LIENS DE PAIEMENT');
    const paymentGroup = paymentLinkVars.length ? [{ groupe: 'LIENS DE PAIEMENT', vars: paymentLinkVars }] : [];
    return [...baseVars, ...paymentGroup, ...relanceVars];
  },

  async copyVariable(v) {
    const varName = v.name || v;
    const DATE_VARIABLES = ['date_piece', 'date_echeance', 'date_debut_mission'];
    const formattedVar = DATE_VARIABLES.includes(varName) ? `[[${varName}, date("DD/MM/YYYY")]]` : `[[${varName}]]`;
    try {
      await navigator.clipboard.writeText(formattedVar);
      alert('Copié : ' + formattedVar);
    } catch (e) {
      console.error(e);
    }
  },

  // ── Save / Publish ──
  async sauvegarder() {
    this.saving = true;
    try {
      const result = await this.runWorkflow('save-detail', {
        sequence: this.sequence,
        nom: this.nom,
        emails: this.emails,
        groupesRegles: this.groupesRegles,
        attributionAutomatique: this.attributionAutomatique,
        validationObligatoire: this.validationObligatoire,
      });
      if (result.success) {
        alert('Séquence enregistrée');
      } else {
        alert('Erreur : ' + (result.error || 'Échec de la sauvegarde'));
      }
    } catch (err) {
      alert('Erreur : ' + (err.message || 'Échec de la sauvegarde'));
    } finally {
      this.saving = false;
    }
  },

  async togglePublication() {
    this.publishing = true;
    const precedent = this.publiee;
    try {
      this.publiee = !precedent;
      this.sequence.set('publiee', this.publiee);
      await this.sequence.save();
      alert(this.publiee ? 'Séquence publiée' : 'Séquence dépubliée');
    } catch (err) {
      this.publiee = precedent;
      this.sequence.set('publiee', precedent);
      alert('Erreur : ' + (err.message || 'Échec'));
    } finally {
      this.publishing = false;
    }
  },

  // ── Règles ──
  ajouterGroupeRegles() {
    this.groupesRegles.push({ logique: 'ET', regles: [{ champ: 'payeur_type', operateur: 'egal', valeur: [], options: [] }] });
  },

  supprimerGroupe(groupeIdx) {
    if (this.groupesRegles.length > 1) {
      this.groupesRegles.splice(groupeIdx, 1);
    } else {
      alert('Une séquence doit avoir au moins un groupe de règles');
    }
  },

  ajouterRegleAuGroupe(groupeIdx) {
    this.groupesRegles[groupeIdx].regles.push({ champ: 'payeur_type', operateur: 'egal', valeur: '', options: [] });
  },

  supprimerRegle(groupeIdx, regleIdx) {
    const groupe = this.groupesRegles[groupeIdx];
    if (groupe.regles.length > 1) {
      groupe.regles.splice(regleIdx, 1);
    } else {
      alert('Un groupe doit avoir au moins une règle');
    }
  },

  async chargerOptionsPourChamp(regle) {
    const numericFields = ['reste_a_payer'];
    if (numericFields.includes(regle.champ)) {
      regle.options = [];
      return;
    }
    try {
      let options = [];
      if (regle.champ === 'payeur_type') {
        options = ['Propriétaire', 'Locataire', 'Acheteur', 'Syndic', 'Apporteur', 'Notaire', 'Promoteur'].map(v => ({ label: v, value: v }));
      } else if (regle.champ === 'statut') {
        options = ['impayé', 'en attente', 'payé', 'partiellement_paye', 'en_litige'].map(v => ({ label: v, value: v }));
      } else if (regle.champ === 'statut_dossier') {
        options = ['actif', 'clos', 'en_cours', 'en_attente'].map(v => ({ label: v, value: v }));
      } else if (regle.champ === 'ville') {
        const q = new Parse.Query('Impaye');
        q.limit(1000);
        q.select('ville');
        const res = await q.find();
        const vals = [...new Set(res.map(i => i.get('ville')).filter(Boolean))];
        options = vals.map(v => ({ label: v, value: v }));
      } else if (regle.champ === 'code_postal') {
        const q = new Parse.Query('Impaye');
        q.limit(1000);
        q.select('code_postal');
        const res = await q.find();
        const vals = [...new Set(res.map(i => i.get('code_postal')).filter(Boolean))];
        options = vals.map(v => ({ label: v, value: v }));
      }
      regle.options = options;
    } catch (err) {
      console.error('Erreur options:', err);
      regle.options = [];
    }
  },

  // ── Actions avancées ──
  async lancerAttributionAuto() {
    this.runningAutoAssign = true;
    try {
      await this.sauvegarder();
      const result = await Parse.Cloud.run('triggerImportInvoices');
      const imported = result.stats?.etape5?.impayes_created || 0;
      const updated = result.stats?.etape5?.impayes_updated || 0;
      alert(`Import terminé : ${imported} factures importées, ${updated} mises à jour`);
    } catch (err) {
      alert('Erreur : ' + (err.message || "Échec de l'import"));
    } finally {
      this.runningAutoAssign = false;
    }
  },

  async regenererRelances() {
    if (!confirm('Régénérer les relances ? Les dates seront réinitialées.')) return;
    this.regenerating = true;
    try {
      await this.sauvegarder();
      const Relance = Parse.Object.extend('Relance');
      const query = new Parse.Query(Relance);
      query.equalTo('sequence', this.sequence);
      query.limit(10000);
      const allRelances = await query.find();
      for (const relance of allRelances) {
        relance.set('statut', 'En attente de generation');
        relance.set('dateEnvoi', null);
        relance.set('date_envoi_prevue', null);
        await relance.save();
      }
      const result = await Parse.Cloud.run('triggerImportInvoices');
      const created = result.result?.createRelances?.created || 0;
      const updated = result.result?.createRelances?.updated || 0;
      alert(`Régénération terminée : ${created} créées, ${updated} mises à jour`);
    } catch (err) {
      alert('Erreur : ' + (err.message || 'Échec de la régénération'));
    } finally {
      this.regenerating = false;
    }
  },

  async testerEmail(index) {
    try {
      const result = await this.runWorkflow('tester-email', { sequence: this.sequence, emails: this.emails, index });
      if (result.success) {
        alert('Email de test envoyé');
      } else {
        alert('Erreur : ' + (result.error || 'Échec'));
      }
    } catch (err) {
      alert('Erreur : ' + (err.message || 'Impossible de tester'));
    }
  },
}));

Alpine.start();
