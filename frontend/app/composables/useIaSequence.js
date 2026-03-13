import yaml from 'js-yaml'
import { SCENARIO_FORMATS, getScenario, scenarioTabs } from '~/composables/useSequenceEditor'

export function useIaSequence(emails, allVariables, editorRefs) {
  const toast = useToast()

  // ── State ─────────────────────────────────────────────────────
  const showIaModal = ref(false)
  const iaResponse = ref('')

  const showChatGptModal = ref(false)
  const chatGptEmailIdx = ref(0)
  const chatGptResponse = ref('')
  const chatGptTargetFormat = ref('single')

  // ── Helpers ───────────────────────────────────────────────────
  async function copyToClipboard(text) {
    await navigator.clipboard.writeText(text)
    toast.add({ title: 'Copié', color: 'green', timeout: 2000 })
  }

  const emailsSorted = computed(() =>
    [...emails.value].sort((a, b) => a.delai - b.delai)
  )

  // ── IA globale ────────────────────────────────────────────────
  async function copyPromptIA() {
    const allVars = allVariables.value.flatMap(g => g.vars.map(v => `[[${v}]]`)).join(', ')
    const prompt = `Tu es un expert en relance de factures impayées pour le secteur immobilier.
Génère une séquence de ${emails.value.length || 3} emails de relance progressivement fermes.

Chaque email a 4 formats selon le contexte du payeur :
- single   : 1 seul impayé, sans apporteur d'affaire
- multiple : plusieurs impayés, sans apporteur d'affaire
- both     : plusieurs impayés ET un apporteur d'affaire
- broker   : 1 seul impayé ET un apporteur d'affaire

IMPORTANT: Retourne UNIQUEMENT un tableau YAML valide. Structure attendue :
---
- delai: [nombre de jours]
  scenarios:
    - format: single
      objet: "[Objet pour 1 impayé]"
      corps: |
        [Corps Markdown pour 1 impayé sans apporteur]
    - format: multiple
      objet: "[Objet pour plusieurs impayés]"
      corps: |
        [Corps Markdown pour plusieurs impayés sans apporteur]
    - format: both
      objet: "[Objet pour plusieurs impayés + apporteur]"
      corps: |
        [Corps Markdown pour plusieurs impayés avec apporteur]
    - format: broker
      objet: "[Objet pour 1 impayé + apporteur]"
      corps: |
        [Corps Markdown pour 1 impayé avec apporteur]

Variables disponibles : ${allVars}

Exemple complet :
---
- delai: 7
  scenarios:
    - format: single
      objet: "Rappel : Facture [[nfacture]] impayée"
      corps: |
        Bonjour [[payeur_nom]],

        Votre facture [[nfacture]] d'un montant de [[reste_a_payer]] € est en attente de règlement.

        [Régler ma facture](MET ICI LE LIEN DE PAIEMENT)

        | Facture | Échéance | Montant | Reste dû |
        |---------|----------|---------|----------|
        | [[nfacture]] | [[date_echeance]] | [[montant_total]] € | [[reste_a_payer]] € |
    - format: multiple
      objet: "Rappel : Plusieurs factures impayées"
      corps: |
        Bonjour [[payeur_nom]],

        Plusieurs de vos factures sont en attente de règlement, dont [[nfacture]] ([[reste_a_payer]] €).

        [Régler mes factures](MET ICI LE LIEN DE PAIEMENT)

        | Numéro de facture | Montant |
        |-------------------|---------|
        | [[nfacture]]      | [[montant]] |
        | [[nfacture+]]     | [[montant+]] |
    - format: both
      objet: "Rappel : Plusieurs factures impayées"
      corps: |
        Bonjour [[payeur_nom]],

        Plusieurs de vos factures sont en attente de règlement, dont [[nfacture]] ([[reste_a_payer]] €).
        Votre apporteur [[apporteur_nom]] est également informé.

        [Régler mes factures](MET ICI LE LIEN DE PAIEMENT)
    - format: broker
      objet: "Rappel : Facture [[nfacture]] impayée"
      corps: |
        Bonjour [[payeur_nom]],

        Votre facture [[nfacture]] d'un montant de [[reste_a_payer]] € est en attente de règlement.
        Votre apporteur [[apporteur_nom]] est également informé.

        [Régler ma facture](MET ICI LE LIEN DE PAIEMENT)

- delai: 14
  scenarios:
    - format: single
      objet: "Mise en demeure – Facture [[nfacture]]"
      corps: |
        Bonjour [[payeur_nom]],

        Malgré notre rappel, votre facture [[nfacture]] ([[reste_a_payer]] €) reste impayée.
        Sans règlement sous 8 jours, nous engagerons une procédure de recouvrement.
    - format: multiple
      objet: "Mise en demeure – Factures impayées"
      corps: |
        Bonjour [[payeur_nom]],

        Malgré nos rappels, plusieurs de vos factures dont [[nfacture]] restent impayées.
        Sans règlement global sous 8 jours, nous engagerons une procédure de recouvrement.

        | Numéro de facture | Montant |
        |-------------------|---------|
        | [[nfacture]]      | [[montant]] |
        | [[nfacture+]]     | [[montant+]] |
    - format: both
      objet: "Mise en demeure – Factures impayées"
      corps: |
        Bonjour [[payeur_nom]],

        Malgré nos rappels, plusieurs de vos factures dont [[nfacture]] restent impayées.
        Votre apporteur [[apporteur_nom]] est informé de cette procédure.

        | Numéro de facture | Montant |
        |-------------------|---------|
        | [[nfacture]]      | [[montant]] |
        | [[nfacture+]]     | [[montant+]] |
    - format: broker
      objet: "Mise en demeure – Facture [[nfacture]]"
      corps: |
        Bonjour [[payeur_nom]],

        Malgré notre rappel, votre facture [[nfacture]] ([[reste_a_payer]] €) reste impayée.
        Votre apporteur [[apporteur_nom]] est informé de cette procédure.
`
    await copyToClipboard(prompt)
  }

  function validerIA() {
    try {
      const parsed = yaml.load(iaResponse.value)
      if (!Array.isArray(parsed)) throw new Error('Attendu un tableau YAML')

      const newEmails = parsed.map((e, i) => {
        if (!Array.isArray(e.scenarios) || e.scenarios.length === 0)
          throw new Error(`Email ${i + 1} : propriété "scenarios" manquante ou vide`)

        const scenarios = SCENARIO_FORMATS.map(fmt => {
          const s = e.scenarios.find(s => s.format === fmt) || {}
          return { format: fmt, objet: s.objet || '', corps: s.corps || '' }
        })

        return {
          _key: `email_ia_${i}_${Date.now()}`,
          delai: e.delai ?? 0,
          smtp: '',
          to: '[[payeur_email]]',
          cc: '',
          activeScenario: 'single',
          scenarios
        }
      })

      emails.value = newEmails

      nextTick(() => {
        newEmails.forEach(email => {
          const editor = editorRefs[email._key]
          if (!editor) return
          const instance = editor.getInstance()
          if (!instance) return
          try {
            for (const scenario of email.scenarios) {
              if (!scenario.corps) continue
              email.activeScenario = scenario.format
              instance.setMarkdown(scenario.corps)
              scenario.corps = instance.getHTML()
            }
          } catch (err) {
            console.error('Erreur conversion markdown:', err)
          }
          email.activeScenario = 'single'
          instance.setHTML(getScenario(email, 'single').corps || '')
        })
      })

      showIaModal.value = false
      iaResponse.value = ''
      toast.add({ title: `${newEmails.length} email(s) générés`, color: 'green' })
    } catch (err) {
      toast.add({ title: 'YAML invalide', description: err.message, color: 'red' })
    }
  }

  // ── ChatGPT par email ─────────────────────────────────────────
  function openChatGptModal(idx) {
    chatGptEmailIdx.value = idx
    chatGptResponse.value = ''
    chatGptTargetFormat.value = emailsSorted.value[idx]?.activeScenario || 'single'
    showChatGptModal.value = true
  }

  async function copyChatGptPrompt(fmt) {
    const idx = chatGptEmailIdx.value
    const email = emailsSorted.value[idx]
    chatGptTargetFormat.value = fmt
    const scenarioLabels = {
      single:   "1 seul impayé, sans apporteur d'affaire",
      multiple: "plusieurs impayés, sans apporteur d'affaire",
      both:     "plusieurs impayés avec un apporteur d'affaire",
      broker:   "1 seul impayé avec un apporteur d'affaire",
    }
    const currentScenario = email ? getScenario(email, fmt) : null
    const emailsPrecedents = emailsSorted.value
      .slice(0, idx)
      .map((e, i) => `Email ${i + 1} (J+${e.delai}) : ${getScenario(e, fmt).objet || '(sans objet)'}`)
      .join('\n')
    const vars = allVariables.value.flatMap(g => g.vars.map(v => `[[${v}]]`)).join(', ')
    const prompt = `Rédige un email de relance de facture impayée pour le secteur immobilier.
Contexte du payeur : ${scenarioLabels[fmt]}.${emailsPrecedents ? `\nEmails précédents :\n${emailsPrecedents}\n` : ''}
Email ${idx + 1} (J+${email?.delai ?? 0}) - Objet prévu : ${currentScenario?.objet || '...'}
Variables disponibles : ${vars}

IMPORTANT: Retourne UNIQUEMENT le corps de l'email en Markdown (sans l'objet) :

Bonjour [[payeur_nom]],

Votre facture [[nfacture]] est en retard.

[Lien de paiement](MET ICI LE LIEN DE PAIEMENT)

| Facture | Date d'échéance | Montant TTC | Reste à payer |
|---------|-----------------|-------------|---------------|
| [[nfacture]] | [[date_echeance]] | [[montant_total]] € | [[reste_a_payer]] € |

Pour plusieurs impayés, utilisez la syntaxe avec + :
| Numéro de facture | Montant |
|-------------------|---------|
| [[nfacture]]      | [[montant]] |
| [[nfacture+]]     | [[montant+]] |
`
    await copyToClipboard(prompt)
  }

  function insererReponseChatGpt() {
    const idx = chatGptEmailIdx.value
    const email = emailsSorted.value[idx]
    if (email) {
      const fmt = chatGptTargetFormat.value || 'single'
      const scenario = getScenario(email, fmt)
      const editor = editorRefs[email._key]
      if (editor && email.activeScenario === fmt) {
        try {
          editor.getInstance().setMarkdown(chatGptResponse.value)
          scenario.corps = editor.getInstance().getHTML()
        } catch (err) {
          scenario.corps = chatGptResponse.value
        }
      } else if (editor) {
        try {
          const instance = editor.getInstance()
          const prevFormat = email.activeScenario
          email.activeScenario = fmt
          instance.setMarkdown(chatGptResponse.value)
          scenario.corps = instance.getHTML()
          email.activeScenario = prevFormat
          instance.setHTML(getScenario(email, prevFormat).corps || '')
        } catch (err) {
          scenario.corps = chatGptResponse.value
        }
      } else {
        scenario.corps = chatGptResponse.value
      }
      toast.add({ title: `Corps "${scenarioTabs.find(t => t.value === fmt)?.label}" mis à jour`, color: 'green', timeout: 2000 })
    }
    showChatGptModal.value = false
    chatGptResponse.value = ''
  }

  return {
    showIaModal, iaResponse,
    showChatGptModal, chatGptEmailIdx, chatGptResponse, chatGptTargetFormat,
    copyPromptIA, validerIA,
    openChatGptModal, copyChatGptPrompt, insererReponseChatGpt,
  }
}
