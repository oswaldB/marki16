import { defineStore } from 'pinia'

/**
 * Store dédié à la gestion de la blacklist des contacts
 */
export const useBlacklistStore = defineStore('blacklist', {
  state: () => ({
    blacklistedContacts: [],    // Liste des contacts blacklistés (Parse Objects)
    loading: false,
    error: null,
    lastFetched: null,
    cacheDuration: 300000       // 5 minutes
  }),

  getters: {
    // Nombre de contacts blacklistés
    count: (state) => state.blacklistedContacts.length,
    
    // Vérifie si un contact est blacklisté
    isBlacklisted: (state) => (contactId) => {
      return state.blacklistedContacts.some(c => c.id === contactId)
    },
    
    // Vérifie si le cache est valide
    hasValidCache: (state) => {
      return state.lastFetched && Date.now() - state.lastFetched < state.cacheDuration
    }
  },

  actions: {
    /**
     * Charge tous les contacts blacklistés depuis Parse
     */
    async fetchBlacklistedContacts(force = false) {
      if (!force && this.hasValidCache) {
        return this.blacklistedContacts
      }

      this.loading = true
      this.error = null
      
      try {
        const { $parse } = useNuxtApp()
        const Contact = $parse.Object.extend('Contact')
        const query = new $parse.Query(Contact)
        query.equalTo('isBlacklisted', true)
        query.limit(1000)
        query.include('entreprise')
        query.include('email_relance')
        query.ascending('nom')
        
        const contacts = await query.find()
        this.blacklistedContacts = contacts
        this.lastFetched = Date.now()
        return contacts
      } catch (error) {
        this.error = error
        console.error('Erreur chargement blacklist:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Ajoute un ou plusieurs contacts à la blacklist
     * @param {string|string[]} contactIds - ID(s) du/des contact(s)
     * @returns {Promise<void>}
     */
    async addToBlacklist(contactIds) {
      const { $parse } = useNuxtApp()
      const Contact = $parse.Object.extend('Contact')
      
      const ids = Array.isArray(contactIds) ? contactIds : [contactIds]
      const contactsToUpdate = []
      
      for (const id of ids) {
        const contact = Contact.createWithoutData(id)
        contact.set('isBlacklisted', true)
        contact.set('blacklistedAt', new Date())
        contactsToUpdate.push(contact)
      }
      
      try {
        await $parse.Object.saveAll(contactsToUpdate)
        // Invalider le cache et recharger
        this.lastFetched = null
        await this.fetchBlacklistedContacts(true)
      } catch (error) {
        console.error('Erreur ajout blacklist:', error)
        throw error
      }
    },

    /**
     * Retire un ou plusieurs contacts de la blacklist
     * @param {string|string[]} contactIds - ID(s) du/des contact(s)
     * @returns {Promise<void>}
     */
    async removeFromBlacklist(contactIds) {
      const { $parse } = useNuxtApp()
      const Contact = $parse.Object.extend('Contact')
      
      const ids = Array.isArray(contactIds) ? contactIds : [contactIds]
      const contactsToUpdate = []
      
      for (const id of ids) {
        const contact = Contact.createWithoutData(id)
        contact.set('isBlacklisted', false)
        contact.set('blacklistedAt', null)
        contactsToUpdate.push(contact)
      }
      
      try {
        await $parse.Object.saveAll(contactsToUpdate)
        // Invalider le cache et recharger
        this.lastFetched = null
        await this.fetchBlacklistedContacts(true)
      } catch (error) {
        console.error('Erreur retrait blacklist:', error)
        throw error
      }
    },

    /**
     * Toggle le statut blacklist d'un contact
     * @param {string} contactId - ID du contact
     * @param {boolean} isBlacklisted - Statut souhaité (optionnel, si non fourni, toggle)
     * @returns {Promise<void>}
     */
    async toggleBlacklist(contactId, isBlacklisted = null) {
      const { $parse } = useNuxtApp()
      const Contact = $parse.Object.extend('Contact')
      
      try {
        // Si isBlacklisted n'est pas fourni, on récupère le statut actuel
        if (isBlacklisted === null) {
          const contact = await new $parse.Query(Contact).get(contactId)
          isBlacklisted = !contact.get('isBlacklisted')
        }
        
        const contact = Contact.createWithoutData(contactId)
        contact.set('isBlacklisted', isBlacklisted)
        contact.set('blacklistedAt', isBlacklisted ? new Date() : null)
        
        await contact.save()
        // Invalider le cache et recharger
        this.lastFetched = null
        await this.fetchBlacklistedContacts(true)
      } catch (error) {
        console.error('Erreur toggle blacklist:', error)
        throw error
      }
    },

    /**
     * Supprime toutes les relances associées à un ou plusieurs contacts
     * @param {string|string[]} contactIds - ID(s) du/des contact(s)
     * @returns {Promise<number>} - Nombre de relances supprimées
     */
    async deleteContactRelances(contactIds) {
      const { $parse } = useNuxtApp()
      const Relance = $parse.Object.extend('Relance')
      const Contact = $parse.Object.extend('Contact')
      
      const ids = Array.isArray(contactIds) ? contactIds : [contactIds]
      let deletedCount = 0
      
      for (const id of ids) {
        try {
          const query = new $parse.Query(Relance)
          query.equalTo('contact', Contact.createWithoutData(id))
          const relances = await query.find()
          
          if (relances.length > 0) {
            await $parse.Object.destroyAll(relances)
            deletedCount += relances.length
          }
        } catch (error) {
          console.error(`Erreur suppression relances pour ${id}:`, error)
        }
      }
      
      return deletedCount
    },

    /**
     * Ajoute des contacts à la blacklist avec option de suppression des relances
     * @param {string[]} contactIds - IDs des contacts
     * @param {boolean} deleteRelances - Supprimer les relances associées
     * @param {function} onProgress - Callback pour suivre la progression (optionnel)
     * @returns {Promise<{contactsAdded: number, relancesDeleted: number}>}
     */
    async addToBlacklistWithOptions(contactIds, deleteRelances = false, onProgress = null) {
      const ids = Array.isArray(contactIds) ? contactIds : [contactIds]
      
      try {
        // Mettre à jour le loading
        this.loading = true
        
        await this.addToBlacklist(ids)
        
        let relancesDeleted = 0
        if (deleteRelances) {
          // Si callback fourni, indiquer qu'on supprime les relances
          if (onProgress) onProgress({ step: 'deleting_relances', total: ids.length, current: 0 })
          
          for (let i = 0; i < ids.length; i++) {
            const count = await this.deleteContactRelances(ids[i])
            relancesDeleted += count
            
            // Mise à jour progression
            if (onProgress) onProgress({ step: 'deleting_relances', total: ids.length, current: i + 1, deleted: relancesDeleted })
          }
        }
        
        return {
          contactsAdded: ids.length,
          relancesDeleted
        }
      } catch (error) {
        console.error('Erreur:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Filtre les contacts blacklistés par recherche et source
     * @param {string} searchQuery - Terme de recherche
     * @param {string} sourceFilter - Filtre par source
     * @returns {Array} - Contacts filtrés
     */
    getFilteredContacts(searchQuery = '', sourceFilter = null) {
      let data = this.blacklistedContacts
      
      // Filtre par recherche
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase()
        data = data.filter(contact => {
          const nom = (contact.get('nom') || '').toLowerCase()
          const email = (contact.get('email') || '').toLowerCase()
          const telephone = (contact.get('telephone') || '').toLowerCase()
          return nom.includes(searchLower) || email.includes(searchLower) || telephone.includes(searchLower)
        })
      }
      
      // Filtre par source
      if (sourceFilter) {
        data = data.filter(contact => contact.get('source') === sourceFilter)
      }
      
      return data
    },

    /**
     * Invalide le cache
     */
    invalidateCache() {
      this.lastFetched = null
      this.blacklistedContacts = []
    }
  }
})
