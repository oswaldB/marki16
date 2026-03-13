import { useImpayesStore } from '~/stores/impayesStore'

export function useImpayesStoreComposable() {
  const store = useImpayesStore()
  const { $parse } = useNuxtApp()
  const toast = useToast()
  
  // État local pour les filtres
  const search = ref('')
  const filtreSequence = ref('all')
  const sortColumn = ref('date_piece')
  const sortDirection = ref('desc')
  const activeView = ref('unitaire')
  
  // Données réactives
  const impayes = computed(() => {
    return store.viewsData[activeView.value]?.data || []
  })
  
  const loading = computed(() => store.loading)
  const sequences = computed(() => store.sequences)
  const sequencesLoading = computed(() => store.sequencesLoading)
  
  // Charger les données pour la vue active
  async function charger() {
    await store.getViewData(
      activeView.value,
      search.value,
      filtreSequence.value,
      sortColumn.value,
      sortDirection.value
    )
  }
  
  // Charger toutes les séquences
  async function chargerSequences() {
    await store.fetchSequences()
  }
  
  // Gestion du changement de vue
  watch(activeView, async (newView) => {
    await charger()
  })
  
  // Recherche avec debounce
  let searchTimer = null
  function onSearchInput() {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      charger()
    }, 400)
  }
  
  // Tri
  function toggleSortDirection() {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    charger()
  }
  
  // Actions sur les impayés
  async function marquerPaye(row) {
    try {
      row._parse.set('statut', 'payé')
      await row._parse.save()
      row.statut = 'payé'
      toast.add({ title: 'Facture marquée comme payée', color: 'green' })
      // Rafraîchir les données
      await store.fetchAllImpayes(true)
      await charger()
    } catch (err) {
      toast.add({ title: 'Erreur', description: err.message, color: 'red' })
    }
  }
  
  async function marquerPayesGroupes(selection) {
    try {
      const parseObjs = selection.map(r => r._parse)
      parseObjs.forEach(o => o.set('statut', 'payé'))
      await $parse.Object.saveAll(parseObjs)
      toast.add({ title: `${parseObjs.length} facture(s) marquées comme payées`, color: 'green' })
      // Rafraîchir les données
      await store.fetchAllImpayes(true)
      await charger()
    } catch (err) {
      toast.add({ title: 'Erreur', description: err.message, color: 'red' })
    }
  }
  
  async function assignerSequence(impayesCibles, sequenceId) {
    try {
      const cibles = impayesCibles.length ? impayesCibles : selection.value.map(r => r._parse)
      
      for (const impayeObj of cibles) {
        await $parse.Cloud.run('assignerSequence', {
          impayelId:  impayeObj.id,
          sequenceId: sequenceId,
        })
      }
      
      toast.add({ title: 'Séquence assignée', color: 'green' })
      // Rafraîchir les données
      await store.fetchAllImpayes(true)
      await charger()
    } catch (err) {
      toast.add({ title: 'Erreur', description: err.message, color: 'red' })
    }
  }
  
  // Options pour les sélecteurs
  const sequenceOptions = computed(() => [
    { label: 'Toutes les séquences', value: 'all' },
    { label: 'Sans séquence', value: 'none' },
    ...sequences.value.map(s => ({ label: s.get('nom'), value: s.id })),
  ])
  
  const sortOptions = [
    { label: 'Date pièce', value: 'date_piece' },
    { label: 'Montant', value: 'reste_a_payer' },
    { label: 'Payeur', value: 'payeur_nom' },
    { label: 'N° Facture', value: 'nfacture' },
  ]
  
  const vues = [
    { key: 'unitaire', label: 'Unitaire' },
    { key: 'payeur', label: 'Par payeur' },
    { key: 'contact', label: 'Par contact' },
    { key: 'sans-sequence', label: 'Sans séquence' },
  ]
  
  return {
    // État
    search,
    filtreSequence,
    sortColumn,
    sortDirection,
    activeView,
    
    // Données
    impayes,
    loading,
    sequences,
    sequencesLoading,
    
    // Fonctions
    charger,
    chargerSequences,
    onSearchInput,
    toggleSortDirection,
    marquerPaye,
    marquerPayesGroupes,
    assignerSequence,
    
    // Options
    sequenceOptions,
    sortOptions,
    vues,
  }
}