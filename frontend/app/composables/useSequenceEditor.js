// ── Constants ──────────────────────────────────────────────────
export const SCENARIO_FORMATS = ['single', 'multiple', 'both', 'broker']

export const VARIABLES = [
  { groupe: 'PAYEUR',   vars: ['payeur_nom', 'payeur_email', 'payeur_telephone', 'payeur_type'] },
  { groupe: 'FACTURE',  vars: ['nfacture', 'ref_piece', 'date_piece', 'reste_a_payer', 'montant_total', 'date_echeance'] },
  { groupe: 'BIEN',     vars: ['adresse_bien', 'code_postal', 'ville', 'numero_lot', 'etage', 'porte', 'batiment', 'residence'] },
  { groupe: 'PROPRIETAIRE', vars: ['proprietaire_nom', 'proprietaire_email', 'proprietaire_telephone', 'proprietaire_adresse'] },
  { groupe: 'APPORTEUR',   vars: ['apporteur_nom', 'apporteur_email', 'apporteur_telephone', 'apporteur_societe'] },
  { groupe: 'DOSSIER',  vars: ['numero_dossier', 'employe_intervention', 'date_debut_mission'] },
  { groupe: 'MULTIPLE', vars: ['total_impayes', 'nfactures_liste', 'ndossier_liste'] },
]

export const EXEMPLE_VARS = {
  nfacture: 'FA-2024-01', ref_piece: 'REF-001', date_piece: '01/01/2024',
  reste_a_payer: '1200', montant_total: '1500', date_echeance: '31/01/2024',
  payeur_nom: 'Jean Dupont', payeur_email: 'jean@example.com',
  payeur_telephone: '0612345678', payeur_type: 'Propriétaire',
  adresse_bien: '123 rue de la Paix', code_postal: '75001', ville: 'Paris',
  numero_lot: 'A12', numero_dossier: 'DOS-001',
  employe_intervention: 'Marie Martin', date_debut_mission: '01/01/2024',
}

export const champOptions = [
  { label: 'Type payeur', value: 'payeur_type' },
  { label: 'Nom payeur', value: 'payeur_nom' },
  { label: 'Email payeur', value: 'payeur_email' },
  { label: 'Téléphone payeur', value: 'payeur_telephone' },
  { label: 'Reste à payer', value: 'reste_a_payer' },
  { label: 'Statut', value: 'statut' },
  { label: 'Statut dossier', value: 'statut_dossier' },
  { label: 'Nom apporteur', value: 'apporteur_nom' },
  { label: 'Email apporteur', value: 'apporteur_email' },
  { label: 'Téléphone apporteur', value: 'apporteur_telephone' },
  { label: 'Société apporteur', value: 'apporteur_societe' },
  { label: 'Nom propriétaire', value: 'proprietaire_nom' },
  { label: 'Email propriétaire', value: 'proprietaire_email' },
  { label: 'Téléphone propriétaire', value: 'proprietaire_telephone' },
  { label: 'Adresse bien', value: 'adresse_bien' },
  { label: 'Code postal', value: 'code_postal' },
  { label: 'Ville', value: 'ville' },
  { label: 'Numéro lot', value: 'numero_lot' },
]

export const operateurOptions = [
  { label: 'est égal à', value: 'egal' },
  { label: "n'est pas égal à", value: 'different' },
  { label: 'supérieur à', value: 'superieur' },
  { label: 'inférieur à', value: 'inferieur' },
  { label: 'contient', value: 'contient' },
  { label: 'ne contient pas', value: 'ne_contient_pas' },
  { label: 'commence par', value: 'commence_par' },
  { label: 'ne commence pas par', value: 'ne_commence_pas_par' },
  { label: 'se termine par', value: 'se_termine_par' },
  { label: 'ne se termine pas par', value: 'ne_se_termine_pas_par' },
]

export const groupeLogiqueOptions = [
  { label: 'ET', value: 'ET' },
  { label: 'OU', value: 'OU' },
]

export const scenarioTabs = [
  { label: '1 impayé', value: 'single' },
  { label: 'Plusieurs impayés', value: 'multiple' },
  { label: 'Impayés + apporteur', value: 'both' },
  { label: 'Apporteur seul', value: 'broker' },
]

export const editorOptions = {
  minHeight: '200px',
  language: 'fr',
  usageStatistics: false,
  hideModeSwitch: true,
}

// ── Helpers email (exportés pour réutilisation dans composants) ──
export function getScenario(email, format) {
  const f = format || 'single'
  if (!Array.isArray(email.scenarios)) {
    email.scenarios = SCENARIO_FORMATS.map(fmt => ({ format: fmt, active: true, smtp: '', cc: '', objet: '', corps: '' }))
  }
  let s = email.scenarios.find(s => s.format === f)
  if (!s) {
    s = { format: f, active: true, smtp: '', cc: '', objet: '', corps: '' }
    email.scenarios.push(s)
  }
  if (s.active === undefined) s.active = true
  if (s.smtp === undefined) s.smtp = ''
  if (s.cc === undefined) s.cc = ''
  return s
}

export function getCurrentCorps(email) {
  return getScenario(email, email.activeScenario || 'single').corps || ''
}

export function updateCorps(email, html) {
  getScenario(email, email.activeScenario || 'single').corps = html
}

export function switchScenario(email, newScenario, editorRefs) {
  const editor = editorRefs[email._key]
  if (editor) {
    try {
      const instance = editor.getInstance()
      if (instance) {
        getScenario(email, email.activeScenario || 'single').corps = instance.getHTML()
        email.activeScenario = newScenario
        instance.setHTML(getScenario(email, newScenario).corps || '')
        return
      }
    } catch (err) {
      console.error('Erreur switch scénario:', err)
    }
  }
  email.activeScenario = newScenario
}

// ── Composable principal ───────────────────────────────────────
export function useSequenceEditor(parse, groupesRegles, calculerApercu, chargerLiensPaiement, loadAllOptions) {
  const toast = useToast()
  const route = useRoute()

  // ── State ────────────────────────────────────────────────────
  const loading = ref(true)
  const saving = ref(false)
  const publishing = ref(false)

  const sequence = ref(null)
  const nom = ref('')
  const publiee = ref(false)
  const emails = ref([])
  const smtpProfiles = ref([])

  const collapsedEmails = ref({})
  const smtpCreateForEmailKey = ref(null)
  const smtpCreateForEmailFormat = ref(null)
  const showSmtpModal = ref(false)

  const varsSearch = ref('')

  // ── Computed ─────────────────────────────────────────────────
  const emailsSorted = computed(() =>
    [...emails.value].sort((a, b) => a.delai - b.delai)
  )

  const smtpOptions = computed(() =>
    smtpProfiles.value.map(p => ({
      value: p.id,
      label: p.get('nom_affiche') || p.get('nom'),
    }))
  )

  // ── Chargement ───────────────────────────────────────────────
  async function charger() {
    loading.value = true
    try {
      const q = new parse.Query('Sequence')
      const seq = await q.get(route.params.id)
      sequence.value = seq
      nom.value = seq.get('nom') || ''
      publiee.value = seq.get('publiee') || false

      // Charger règles dans groupesRegles (passé depuis useSequenceRules)
      const anciennesRegles = seq.get('regles') || []
      const nouveauxGroupes = seq.get('groupes_regles') || []

      if (nouveauxGroupes.length > 0) {
        groupesRegles.value = nouveauxGroupes.map(g => ({
          logique: g.logique || 'ET',
          regles: g.regles.map(r => ({
            champ: r.champ || 'payeur_type',
            operateur: r.operateur || 'egal',
            valeur: (r.operateur === 'egal' || r.operateur === 'different') && !Array.isArray(r.valeur)
                     ? (r.valeur ? [r.valeur] : [])
                     : (Array.isArray(r.valeur) ? r.valeur : (r.valeur || '')),
            options: []
          }))
        }))
      } else if (anciennesRegles.length > 0) {
        groupesRegles.value = [{
          logique: 'ET',
          regles: anciennesRegles.map(r => ({
            champ: r.champ || 'payeur_type',
            operateur: r.operateur || 'egal',
            valeur: (r.operateur === 'egal' || r.operateur === 'different')
                     ? (r.valeur ? [r.valeur] : [])
                     : (r.valeur || ''),
            options: []
          }))
        }]
      } else {
        groupesRegles.value = [{
          logique: 'ET',
          regles: [{ champ: 'payeur_type', operateur: 'egal', valeur: [], options: [] }]
        }]
      }

      // Charger emails
      const rawEmails = seq.get('emails') || []
      emails.value = rawEmails.map((e, i) => {
        let scenarios
        if (Array.isArray(e.scenarios)) {
          scenarios = SCENARIO_FORMATS.map(fmt => {
            const existing = e.scenarios.find(s => s.format === fmt) || {}
            return {
              format: fmt,
              active: existing.active !== false,
              smtp:   existing.smtp  ?? e.smtp ?? '',
              cc:     existing.cc    ?? e.cc   ?? '',
              objet:  existing.objet ?? '',
              corps:  existing.corps ?? ''
            }
          })
        } else if (e.corps && typeof e.corps === 'object') {
          scenarios = SCENARIO_FORMATS.map(fmt => ({
            format: fmt, active: true,
            smtp: e.smtp || '', cc: e.cc || '',
            objet: e.objet || '', corps: e.corps[fmt] || ''
          }))
        } else {
          scenarios = SCENARIO_FORMATS.map(fmt => ({
            format: fmt, active: true,
            smtp: e.smtp || '', cc: e.cc || '',
            objet: e.objet || '',
            corps: fmt === 'single' ? (e.corps || '') : ''
          }))
        }
        return {
          _key: `email_${i}_${seq.id}`,
          delai: e.delai || 0,
          smtp: e.smtp || '',
          to: e.to || '[[payeur_email]]',
          cc: e.cc || '',
          activeScenario: 'single',
          scenarios
        }
      })

      const sq = new parse.Query('SmtpProfile')
      sq.ascending('nom')
      sq.limit(50)
      smtpProfiles.value = await sq.find()

      await chargerLiensPaiement()
      await loadAllOptions()
      await calculerApercu()
    } catch (err) {
      toast.add({ title: 'Erreur de chargement', description: err.message, color: 'red' })
    } finally {
      loading.value = false
    }
  }

  // ── Sauvegarde ───────────────────────────────────────────────
  async function sauvegarder(editorRefs) {
    saving.value = true
    try {
      for (const email of emails.value) {
        const editor = editorRefs[email._key]
        if (editor) {
          try {
            getScenario(email, email.activeScenario || 'single').corps = editor.getInstance().getHTML()
          } catch {}
        }
      }
      sequence.value.set('nom', nom.value)
      sequence.value.set('emails', emails.value.map(({ _key, activeScenario, ...rest }) => rest))
      sequence.value.set('groupes_regles', groupesRegles.value)

      // Compat arrière
      const anciennesRegles = groupesRegles.value.flatMap(g =>
        g.regles.map(r => ({ champ: r.champ, operateur: r.operateur, valeur: r.valeur }))
      )
      sequence.value.set('regles', anciennesRegles)
      sequence.value.set('regles_type', groupesRegles.value.length > 0 ? groupesRegles.value[0].logique : 'ET')

      await sequence.value.save()
      toast.add({ title: 'Séquence enregistrée', color: 'green' })
    } catch (err) {
      toast.add({ title: 'Erreur', description: err.message, color: 'red' })
    } finally {
      saving.value = false
    }
  }

  // ── Publication ──────────────────────────────────────────────
  async function togglePublication() {
    publishing.value = true
    const precedent = publiee.value
    try {
      publiee.value = !precedent
      sequence.value.set('publiee', publiee.value)
      await sequence.value.save()
      toast.add({ title: publiee.value ? 'Séquence publiée' : 'Séquence dépubliée', color: 'green' })
    } catch (err) {
      publiee.value = precedent
      toast.add({ title: 'Erreur', description: err.message, color: 'red' })
    } finally {
      publishing.value = false
    }
  }

  // ── Emails ───────────────────────────────────────────────────
  function ajouterEmail() {
    emails.value.push({
      _key: `email_new_${Date.now()}`,
      delai: 0,
      smtp: '',
      to: '[[payeur_email]]',
      cc: '',
      activeScenario: 'single',
      scenarios: SCENARIO_FORMATS.map(format => ({ format, active: true, smtp: '', cc: '', objet: '', corps: '' }))
    })
  }

  function supprimerEmail(key) {
    const idx = emails.value.findIndex(e => e._key === key)
    if (idx !== -1) emails.value.splice(idx, 1)
  }

  function toggleEmailVisibility(key) {
    if (collapsedEmails.value[key]) {
      delete collapsedEmails.value[key]
    } else {
      collapsedEmails.value[key] = true
    }
  }

  function onSmtpChange(email, scenario, val) {
    if (val === '__create__') {
      smtpCreateForEmailKey.value = email._key
      smtpCreateForEmailFormat.value = scenario.format
      scenario.smtp = ''
      showSmtpModal.value = true
    }
  }

  function onSmtpSaved(profile) {
    smtpProfiles.value.push(profile)
    if (smtpCreateForEmailKey.value) {
      const email = emails.value.find(e => e._key === smtpCreateForEmailKey.value)
      if (email) getScenario(email, smtpCreateForEmailFormat.value || 'single').smtp = profile.id
    }
    smtpCreateForEmailKey.value = null
    smtpCreateForEmailFormat.value = null
  }

  return {
    loading, saving, publishing,
    sequence, nom, publiee,
    emails, emailsSorted,
    smtpProfiles, smtpOptions,
    collapsedEmails,
    showSmtpModal,
    varsSearch,
    charger,
    sauvegarder,
    togglePublication,
    ajouterEmail,
    supprimerEmail,
    toggleEmailVisibility,
    onSmtpChange,
    onSmtpSaved,
  }
}
