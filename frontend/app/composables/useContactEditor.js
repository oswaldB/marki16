export function useContactEditor($parse, onRefresh) {
  const toast = useToast()

  // ── State ──────────────────────────────────────────────────────
  const showDrawer        = ref(false)
  const contactSelectionne = ref(null)
  const impayelsDuContact = ref([])
  const loadingImpayes    = ref(false)
  const showDeleteModal   = ref(false)
  const saving            = ref(false)
  const deleting          = ref(false)

  // ── Drawer ─────────────────────────────────────────────────────
  function fermerDrawer() {
    showDrawer.value = false
  }

  async function ouvrirDrawer(row) {
    contactSelectionne.value = row
    impayelsDuContact.value  = []
    showDrawer.value         = true
    loadingImpayes.value     = true
    try {
      const qImp = new $parse.Query('Impaye')
      qImp.equalTo('payeur', row._parse)
      qImp.descending('date_piece')
      qImp.limit(20)
      impayelsDuContact.value = await qImp.find()
    } catch { /* silencieux */ } finally {
      loadingImpayes.value = false
    }
  }

  async function enregistrer(formData) {
    saving.value = true
    try {
      const c = contactSelectionne.value._parse
      c.set('nom',       formData.nom)
      c.set('email',     formData.email     || undefined)
      c.set('telephone', formData.telephone || undefined)
      c.set('type',      formData.type      || undefined)
      await c.save()
      toast.add({ title: 'Contact mis à jour', color: 'green' })
      showDrawer.value = false
      await onRefresh()
    } catch (err) {
      toast.add({ title: 'Erreur', description: err.message, color: 'red' })
    } finally {
      saving.value = false
    }
  }

  function confirmerSuppression() {
    showDeleteModal.value = true
  }

  async function supprimerContact() {
    deleting.value = true
    try {
      await contactSelectionne.value._parse.destroy()
      showDeleteModal.value = false
      showDrawer.value      = false
      toast.add({ title: 'Contact supprimé', color: 'green' })
      await onRefresh()
    } catch (err) {
      toast.add({ title: 'Erreur', description: err.message, color: 'red' })
    } finally {
      deleting.value = false
    }
  }

  // ── Helpers ────────────────────────────────────────────────────
  function formatMontant(val) {
    if (val == null) return '—'
    return Number(val).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
  }

  function statutColor(statut) {
    if (statut === 'payé')     return 'green'
    if (statut === 'en cours') return 'blue'
    return 'orange'
  }

  return {
    showDrawer, contactSelectionne,
    impayelsDuContact, loadingImpayes,
    showDeleteModal, saving, deleting,
    ouvrirDrawer, fermerDrawer,
    enregistrer, confirmerSuppression, supprimerContact,
    formatMontant, statutColor,
  }
}
