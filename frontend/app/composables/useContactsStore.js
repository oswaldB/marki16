import { useContactsStore } from '~/stores/contactsStore'

export function useContactsStoreComposable() {
  const contactsStore = useContactsStore()
  const { $parse } = useNuxtApp()


  // État local pour les filtres (hors recherche texte — gérée par global-filter de UTable)
  const filtreSource = ref('all')
  const filtreSansEmail = ref(false)
  
  // Données calculées
  const total = computed(() => contactsStore.allContacts.length)
  const sansEmailCount = computed(() => 
    contactsStore.allContacts.filter(c => !c.get('email') || c.get('email') === '').length
  )
  
  // Options de filtre
  const sourceOptions = [
    { label: 'Toutes les sources', value: 'all' },
    { label: 'BD externe', value: 'db_externe' },
    { label: 'Upload', value: 'upload' }
  ]
  
  // Charger les données
  async function charger(force = false) {
    await contactsStore.fetchAllContacts(force)
  }
  
  // Rafraîchir le compteur sans email
  async function chargerSansEmailCount() {
    if (contactsStore.allContacts.length === 0) {
      await charger()
    }
  }
  
  // Réinitialiser et recharger
  function resetEtCharger() {
    filtreSource.value = 'all'
    return charger(true)
  }

  // Données filtrées pour la vue courante (recherche texte déléguée au global-filter de UTable)
  const rows = computed(() => {
    let data = contactsStore.allContacts

    if (filtreSource.value !== 'all') {
      data = data.filter(c => c.get('source') === filtreSource.value)
    }

    if (filtreSansEmail.value) {
      data = data.filter(c => !c.get('email') || c.get('email') === '')
    }

    return data.map(contactToRow)
  })
  
  // Conversion Contact → Row
  function contactToRow(contact) {
    return {
      id: contact.id,
      nom: contact.get('nom') || '—',
      email: contact.get('email') || '',
      telephone: contact.get('telephone') || '—',
      source: contact.get('source') || 'inconnu',
      nb_impayes: contact.get('nb_impayes') || 0,
      entreprise: contact.get('entreprise')
    }
  }
  
  // Colonnes de base — les headers triables sont définis dans la page via sortHeader()
  const colonnes = [
    { accessorKey: 'nom',        header: 'Nom' },
    { accessorKey: 'email',      header: 'Email' },
    { accessorKey: 'telephone',  header: 'Téléphone' },
    { accessorKey: 'source',     header: 'Source' },
    { accessorKey: 'nb_impayes', header: 'Impayés' },
  ]
  
  // Invalider le cache
  function invalidateCache() {
    contactsStore.invalidateCache()
  }
  
  return {
    loading: contactsStore.loading,
    total,
    sansEmailCount,
    filtreSource,
    filtreSansEmail,
    rows,
    colonnes,
    sourceOptions,
    charger,
    chargerSansEmailCount,
    resetEtCharger,
    invalidateCache,
  }
}

export function useContactsEntitesComposable() {
  const contactsStore = useContactsStore()
  const { $parse } = useNuxtApp()
  
  const search = ref('')
  const loadingEntites = ref(false)
  const expandedEntites = ref({})
  
  const entitesFiltrees = computed(() => {
    // S'assurer que les données sont chargées
    if (contactsStore.allContacts.length === 0 && !contactsStore.hasCache) {
      return []
    }
    
    // Utiliser le cache si disponible
    if (contactsStore.viewsData['par-entreprise'].loaded) {
      let data = contactsStore.viewsData['par-entreprise'].data || []
      
      if (search.value) {
        const searchLower = search.value.toLowerCase()
        data = data.filter(group => 
          group.nom.toLowerCase().includes(searchLower) ||
          group.contacts.some(c => 
            (c.get('nom') || '').toLowerCase().includes(searchLower)
          )
        )
      }
      
      // NE GARDER QUE LES ENTREPRISES (personnes morales) AVEC LEURS EMPLOYÉS
      // Filtrer pour ne garder que les groupes qui ont une entreprise (type_personne = 'M')
      return data.filter(group => group.entreprise)
        .map(group => {
          // L'entreprise devient la ligne parente
          return {
            id: `entite-${group.entreprise.id}`,
            nom: group.nom,
            email: group.entreprise.get('email') || '',
            telephone: group.entreprise.get('telephone') || '—',
            isEntite: true,
            subRows: group.employes.map(employe => ({
              id: employe.id,
              nom: employe.get('nom') || '—',
              email: employe.get('email') || '',
              telephone: employe.get('telephone') || '—',
              isEntite: false
            }))
          }
        })
    }
    
    // Sinon, calculer à partir des contacts
    const grouped = contactsStore.groupByCompany(contactsStore.allContacts)
    let data = grouped
    
    if (search.value) {
      const searchLower = search.value.toLowerCase()
      data = data.filter(group => 
        group.nom.toLowerCase().includes(searchLower) ||
        group.contacts.some(c => 
          (c.get('nom') || '').toLowerCase().includes(searchLower)
        )
      )
    }
    
    // NE GARDER QUE LES ENTREPRISES (personnes morales) AVEC LEURS EMPLOYÉS
    return data.filter(group => group.entreprise)
      .map(group => {
        // L'entreprise devient la ligne parente
        return {
          id: `entite-${group.entreprise.id}`,
          nom: group.nom,
          email: group.entreprise.get('email') || '',
          telephone: group.entreprise.get('telephone') || '—',
          isEntite: true,
          subRows: group.employes.map(employe => ({
            id: employe.id,
            nom: employe.get('nom') || '—',
            email: employe.get('email') || '',
            telephone: employe.get('telephone') || '—',
            isEntite: false
          }))
        }
      })
  })
  
  // Fonction supprimée car non utilisée (structure créée directement dans le computed)
  
  async function chargerEntitesGroupes() {
    loadingEntites.value = true
    try {
      const data = await contactsStore.fetchEntitesGroupes()
      contactsStore.viewsData['par-entreprise'].data = data
      contactsStore.viewsData['par-entreprise'].loaded = true
    } catch (error) {
      console.error('Erreur chargement entités:', error)
    } finally {
      loadingEntites.value = false
    }
  }
  
  const colonnesEntites = [
    { accessorKey: 'nom', header: 'Nom' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'telephone', header: 'Téléphone' }
  ]
  
  return {
    entitesFiltrees,
    colonnesEntites,
    expandedEntites,
    loadingEntites,
    chargerEntitesGroupes
  }
}

export function useContactsParticuliersComposable() {
  const contactsStore = useContactsStore()
  const { $parse } = useNuxtApp()
  
  const search = ref('')
  const loadingParticuliers = ref(false)
  const expandedParticuliers = ref({})
  
  const particuliersFiltres = computed(() => {
    const viewData = contactsStore.viewsData['par-particuliers']
    if (!viewData.loaded) return []

    let data = viewData.data

    if (search.value) {
      const searchLower = search.value.toLowerCase()
      data = data.filter(group =>
        group.nom.toLowerCase().includes(searchLower) ||
        group.membres.some(m => (m.get('nom') || '').toLowerCase().includes(searchLower))
      )
    }

    return data.map(group => ({
      id: `particulier-${group.chef.id}`,
      nom: group.nom,
      email: group.chef.get('email') || '',
      telephone: group.chef.get('telephone') || '—',
      isParticulier: true,
      subRows: group.membres.map(m => ({
        id: m.id,
        nom: m.get('nom') || '—',
        email: m.get('email') || '',
        telephone: m.get('telephone') || '—',
        isParticulier: false
      }))
    }))
  })

  async function chargerParticuliersGroupes() {
    loadingParticuliers.value = true
    try {
      const data = await contactsStore.fetchParticuliersGroupes()
      contactsStore.viewsData['par-particuliers'].data = data
      contactsStore.viewsData['par-particuliers'].loaded = true
    } catch (error) {
      console.error('Erreur chargement groupes particuliers:', error)
    } finally {
      loadingParticuliers.value = false
    }
  }
  
  const colonnesParticuliers = [
    { accessorKey: 'nom', header: 'Nom' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'telephone', header: 'Téléphone' }
  ]
  
  return {
    particuliersFiltres,
    colonnesParticuliers,
    expandedParticuliers,
    loadingParticuliers,
    chargerParticuliersGroupes
  }
}

export function useContactsSyncComposable($parse, refreshCallback) {
  const syncing = ref(false)
  const syncResult = ref(null)
  const contactsStore = useContactsStore()
  
  const syncResultMessage = computed(() => {
    if (!syncResult.value) return ''
    if (syncResult.value.errors?.length) {
      return `${syncResult.value.updated} mis à jour, ${syncResult.value.errors.length} erreurs`
    }
    return `${syncResult.value.updated} contacts synchronisés`
  })
  
  async function lancerSync() {
    syncing.value = true
    syncResult.value = null
    try {
      const result = await $parse.Cloud.run('syncContacts', {})
      syncResult.value = result
      await refreshCallback()
      contactsStore.invalidateCache() // Invalider le cache après sync
    } catch (error) {
      syncResult.value = { errors: [{ error: error.message }] }
    } finally {
      syncing.value = false
    }
  }
  
  return {
    syncing,
    syncResult,
    syncResultMessage,
    lancerSync
  }
}