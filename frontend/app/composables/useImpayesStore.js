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
        // Mise à jour directe en frontend au lieu d'appeler le cloud
        const sequenceObj = $parse.Object.extend('Sequence').createWithoutData(sequenceId)
        impayeObj.set('sequence', sequenceObj)
        await impayeObj.save()
        
        // Mettre à jour directement dans le store pour la réactivité
        const impayeIndex = store.allImpayes.findIndex(i => i.objectId === impayeObj.id)
        if (impayeIndex !== -1) {
          store.allImpayes[impayeIndex] = store.rowToPlain(impayeObj)
        }
      }
      
      // Appeler la fonction cloud pour créer les relances pour tous les impayés
      const relancesPromises = cibles.map(async (impayeObj) => {
        try {
          const result = await $parse.Cloud.run('createOneRelanceWithTemplates', { impayeId: impayeObj.id })
          console.log(`Relances créées pour l'impayé ${impayeObj.id}: ${result.relancesCreated} relance(s)`)
          return result
        } catch (error) {
          console.error(`Erreur création relances pour ${impayeObj.id}:`, error)
          return { success: false, error: error.message }
        }
      })
      
      // Attendre que toutes les créations de relances soient terminées
      const relancesResults = await Promise.all(relancesPromises)
      const successfulRelances = relancesResults.filter(r => r.success).length
      
      toast.add({ 
        title: 'Séquence assignée', 
        description: successfulRelances > 0 ? `${successfulRelances} relance(s) créée(s)` : 'Aucune relance créée',
        color: 'green' 
      })
      
      // Forcer le rechargement des vues basées sur allImpayes
      for (const viewKey in store.viewsData) {
        store.viewsData[viewKey].loaded = false
      }
      
      // Recharger la vue active
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