const EXEMPLE_VARS = {
  nfacture: 'FA-2024-01', ref_piece: 'REF-001', date_piece: '01/01/2024',
  reste_a_payer: '1200', montant_total: '1500', date_echeance: '31/01/2024',
  payeur_nom: 'Jean Dupont', payeur_email: 'jean@example.com',
  payeur_telephone: '0612345678', payeur_type: 'Propriétaire',
  adresse_bien: '123 rue de la Paix', code_postal: '75001', ville: 'Paris',
  numero_lot: 'A12', numero_dossier: 'DOS-001',
  employe_intervention: 'Marie Martin', date_debut_mission: '01/01/2024',
}

export function useLiensPaiement(parse) {
  const toast = useToast()

  // ── State ─────────────────────────────────────────────────────
  const liensPaiement = ref([])
  const showLienModal = ref(false)
  const lienPaiementEdit = ref('')
  const lienPaiementTextareaEl = ref(null)
  const nouveauLienNom = ref('')
  const editingLienId = ref(null)
  const lienVarsSearch = ref('')

  // ── Computed ──────────────────────────────────────────────────
  const lienPaiementApercu = computed(() => {
    let url = lienPaiementEdit.value
    for (const [k, v] of Object.entries(EXEMPLE_VARS)) {
      url = url.replace(new RegExp(`\\[\\[${k}\\]\\]`, 'g'), v)
    }
    return url
  })

  // ── API ───────────────────────────────────────────────────────
  async function chargerLiensPaiement() {
    try {
      const liens = await parse.Cloud.run('listLiensPaiement')
      liensPaiement.value = liens
    } catch (err) {
      console.error('Erreur lors du chargement des liens de paiement:', err)
      toast.add({ title: 'Erreur', description: 'Impossible de charger les liens de paiement', color: 'red' })
    }
  }

  async function enregistrerNouveauLienPaiement() {
    if (!nouveauLienNom.value.trim() || !lienPaiementEdit.value.trim()) {
      toast.add({ title: 'Erreur', description: 'Veuillez remplir tous les champs', color: 'red' })
      return
    }
    try {
      const lienData = {
        nom: nouveauLienNom.value.trim(),
        url: lienPaiementEdit.value.trim()
      }
      if (editingLienId.value) {
        await parse.Cloud.run('updateLienPaiement', { lienId: editingLienId.value, ...lienData })
        toast.add({ title: 'Lien mis à jour', color: 'green' })
      } else {
        await parse.Cloud.run('createLienPaiement', lienData)
        toast.add({ title: 'Lien créé', color: 'green' })
      }
      await chargerLiensPaiement()
      annulerEditionLien()
    } catch (err) {
      console.error("Erreur lors de l'enregistrement du lien de paiement:", err)
      toast.add({ title: 'Erreur', description: err.message || "Impossible d'enregistrer le lien de paiement", color: 'red' })
    }
  }

  async function supprimerLienPaiement(lienId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce lien de paiement ?')) return
    try {
      await parse.Cloud.run('deleteLienPaiement', { lienId })
      await chargerLiensPaiement()
      toast.add({ title: 'Lien supprimé', color: 'green' })
    } catch (err) {
      console.error('Erreur lors de la suppression du lien de paiement:', err)
      toast.add({ title: 'Erreur', description: 'Impossible de supprimer le lien de paiement', color: 'red' })
    }
  }

  // ── Modal ─────────────────────────────────────────────────────
  function ouvrirLienModal() {
    nouveauLienNom.value = ''
    lienPaiementEdit.value = ''
    editingLienId.value = null
    lienVarsSearch.value = ''
    showLienModal.value = true
  }

  function editerLienPaiement(lien) {
    editingLienId.value = lien.id
    nouveauLienNom.value = lien.nom
    lienPaiementEdit.value = lien.url
    showLienModal.value = true
  }

  function annulerEditionLien() {
    editingLienId.value = null
    nouveauLienNom.value = ''
    lienPaiementEdit.value = ''
  }

  function insererVariableEnLien(varName) {
    const el = lienPaiementTextareaEl.value
    const v = `[[${varName}]]`
    if (el) {
      const s = el.selectionStart ?? lienPaiementEdit.value.length
      const e = el.selectionEnd ?? lienPaiementEdit.value.length
      lienPaiementEdit.value = lienPaiementEdit.value.slice(0, s) + v + lienPaiementEdit.value.slice(e)
      nextTick(() => {
        el.selectionStart = el.selectionEnd = s + v.length
        el.focus()
      })
    } else {
      lienPaiementEdit.value += v
    }
  }

  return {
    liensPaiement,
    showLienModal,
    lienPaiementEdit,
    lienPaiementTextareaEl,
    nouveauLienNom,
    editingLienId,
    lienVarsSearch,
    lienPaiementApercu,
    chargerLiensPaiement,
    enregistrerNouveauLienPaiement,
    supprimerLienPaiement,
    ouvrirLienModal,
    editerLienPaiement,
    annulerEditionLien,
    insererVariableEnLien,
  }
}
