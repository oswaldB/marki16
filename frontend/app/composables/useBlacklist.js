import { useContactsStore } from '~/stores/contactsStore'

/**
 * Composable pour la gestion de la blacklist des contacts
 */
export function useBlacklist() {
  const { $parse } = useNuxtApp()
  const contactsStore = useContactsStore()
  const toast = useToast()

  // État de chargement
  const loading = ref(false)
  const error = ref(null)

  /**
   * Récupère les contacts blacklistés avec recherche dans TOUS les contacts
   * et filtre pour ne garder que les blacklistés
   */
  async function getBlacklistedContactsWithFilters(searchTerm = '', source = null) {
    loading.value = true
    error.value = null
    
    try {
      const Contact = $parse.Object.extend('Contact')
      const mainQuery = new $parse.Query(Contact)
      
      // On cherche dans TOUS les contacts (blacklistés ou non)
      mainQuery.limit(1000)
      mainQuery.include('entreprise')
      mainQuery.include('email_relance')
      mainQuery.descending('blacklistedAt')
      
      // Filtre par source
      if (source) {
        mainQuery.equalTo('source', source)
      }
      
      // Filtre de recherche dans TOUS les contacts
      if (searchTerm) {
        const searchRegex = new RegExp(searchTerm, 'i')
        const queries = []
        
        // Recherche par nom dans TOUS les contacts
        const nomQuery = new $parse.Query(Contact)
        nomQuery.matches('nom', searchRegex)
        if (source) nomQuery.equalTo('source', source)
        queries.push(nomQuery)
        
        // Recherche par email dans TOUS les contacts
        const emailQuery = new $parse.Query(Contact)
        emailQuery.matches('email', searchRegex)
        if (source) emailQuery.equalTo('source', source)
        queries.push(emailQuery)
        
        // Recherche par téléphone dans TOUS les contacts
        const telQuery = new $parse.Query(Contact)
        telQuery.matches('telephone', searchRegex)
        if (source) telQuery.equalTo('source', source)
        queries.push(telQuery)
        
        // Requête OR sur TOUS les contacts
        const orQuery = $parse.Query.or(...queries)
        orQuery.include('entreprise')
        orQuery.include('email_relance')
        orQuery.descending('blacklistedAt')
        orQuery.limit(1000)
        
        const allContacts = await orQuery.find()
        // Filtrer côté client pour ne garder que les blacklistés
        const blacklistedOnly = allContacts.filter(c => c.get('isBlacklisted') === true)
        return await contactsStore.addImpayesCountToContacts(blacklistedOnly)
      }
      
      // Sans recherche, récupérer uniquement les blacklistés
      mainQuery.equalTo('isBlacklisted', true)
      const contacts = await mainQuery.find()
      return await contactsStore.addImpayesCountToContacts(contacts)
    } catch (err) {
      error.value = err
      console.error('Erreur:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Récupère les contacts blacklistés depuis le store local
   */
  function getBlacklistedFromStore() {
    if (contactsStore.allContacts.length === 0) {
      return []
    }
    return contactsStore.allContacts.filter(c => c.get('isBlacklisted') === true)
  }

  /**
   * Filtre les contacts blacklistés avec option de recherche
   */
  function filterBlacklisted(contacts, searchTerm = '') {
    const searchLower = searchTerm.toLowerCase()
    return contacts.filter(contact => {
      const isBlacklisted = contact.get('isBlacklisted') === true
      if (!isBlacklisted) return false
      
      const nom = (contact.get('nom') || '').toLowerCase()
      const email = (contact.get('email') || '').toLowerCase()
      const telephone = (contact.get('telephone') || '').toLowerCase()
      
      return nom.includes(searchLower) || email.includes(searchLower) || telephone.includes(searchLower)
    })
  }

  /**
   * Toggle le statut blacklist d'un contact
   * @param {string} contactId - ID du contact
   * @param {boolean} isBlacklisted - Nouveau statut (optionnel, si non fourni, toggle)
   */
  async function toggleBlacklist(contactId, isBlacklisted = null) {
    loading.value = true
    error.value = null
    
    try {
      const Contact = $parse.Object.extend('Contact')
      const contact = Contact.createWithoutData(contactId)
      
      // Si isBlacklisted n'est pas fourni, on toggle
      if (isBlacklisted === null) {
        const currentContact = await new $parse.Query(Contact).get(contactId)
        isBlacklisted = !currentContact.get('isBlacklisted')
      }
      
      contact.set('isBlacklisted', isBlacklisted)
      contact.set('blacklistedAt', isBlacklisted ? new Date() : null)
      
      await contact.save()
      
      // Invalider le cache pour forcer le rechargement
      contactsStore.invalidateCache()
      
      // Message de succès
      toast.add({
        title: 'Succès',
        description: `Contact ${isBlacklisted ? 'ajouté à' : 'retiré de'} la blacklist`,
        color: 'green'
      })
      
      return { success: true, isBlacklisted }
    } catch (err) {
      error.value = err
      console.error('Erreur lors de la mise à jour du statut blacklist:', err)
      toast.add({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut blacklist',
        color: 'red'
      })
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Met à jour le statut blacklist pour plusieurs contacts
   * @param {string[]} contactIds - Tableau d'IDs de contacts
   * @param {boolean} isBlacklisted - Nouveau statut
   */
  async function updateMultipleBlacklist(contactIds, isBlacklisted) {
    loading.value = true
    error.value = null
    
    try {
      const Contact = $parse.Object.extend('Contact')
      const contactsToUpdate = contactIds.map(id => {
        const contact = Contact.createWithoutData(id)
        contact.set('isBlacklisted', isBlacklisted)
        contact.set('blacklistedAt', isBlacklisted ? new Date() : null)
        return contact
      })
      
      await $parse.Object.saveAll(contactsToUpdate)
      
      // Invalider le cache
      contactsStore.invalidateCache()
      
      // Message de succès
      toast.add({
        title: 'Succès',
        description: `${contactIds.length} contact(s) ${isBlacklisted ? 'ajoutés à' : 'retirés de'} la blacklist`,
        color: 'green'
      })
      
      return { success: true, count: contactIds.length }
    } catch (err) {
      error.value = err
      console.error('Erreur lors de la mise à jour groupée:', err)
      toast.add({
        title: 'Erreur',
        description: 'Impossible de mettre à jour les contacts',
        color: 'red'
      })
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Exporte la liste des contacts blacklistés au format CSV
   */
  function exportToCSV(contacts) {
    const headers = ['Nom', 'Email', 'Téléphone', 'Source', 'Date Blacklist']
    
    const csvContent = [
      headers.join(';'),
      ...contacts.map(c => [
        c.get('nom') || '',
        c.get('email') || '',
        c.get('telephone') || '',
        c.get('source') || '',
        c.get('blacklistedAt') ? new Date(c.get('blacklistedAt')).toLocaleDateString('fr-FR') : ''
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(';'))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `blacklist_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  /**
   * Convertit un contact en objet pour affichage dans le tableau
   */
  function contactToRow(contact) {
    return {
      id: contact.id,
      nom: contact.get('nom') || '—',
      email: contact.get('email') || '',
      telephone: contact.get('telephone') || '—',
      source: contact.get('source') || 'inconnu',
      isBlacklisted: contact.get('isBlacklisted') || false,
      blacklistedAt: contact.get('blacklistedAt'),
      nb_impayes: contact.get('nb_impayes') || 0,
      entreprise: contact.get('entreprise')
    }
  }

  return {
    loading,
    error,
    getBlacklistedContactsWithFilters,
    getBlacklistedFromStore,
    filterBlacklisted,
    toggleBlacklist,
    updateMultipleBlacklist,
    exportToCSV,
    contactToRow
  }
}
