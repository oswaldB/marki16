import { defineStore } from 'pinia'

export const useContactsStore = defineStore('contacts', {
  state: () => ({
    allContacts: [],
    loading: false,
    lastFetched: null,
    cacheDuration: 300000, // 5 minutes
    employeIds: new Set(), // IDs des contacts liés via relation 'employes' (entreprises ET particuliers)
    viewsData: {
      'tous': { data: [], loaded: false },
      'sans-email': { data: [], loaded: false },
      'par-entreprise': { data: [], loaded: false },
      'par-particuliers': { data: [], loaded: false }
    }
  }),

  getters: {
    hasCache: (state) => {
      return state.lastFetched && Date.now() - state.lastFetched < state.cacheDuration
    }
  },

  actions: {
    async fetchAllContacts(force = false) {
      if (!force && this.hasCache) {
        return this.allContacts
      }

      this.loading = true
      try {
        const { $parse } = useNuxtApp()
        const query = new $parse.Query('Contact')
        query.limit(1000)
        query.include('entreprise')
        query.include('email_relance')
        query.ascending('nom')
        
        const contacts = await query.find()
        
        // Calculer le nombre d'impayés pour chaque contact (optimisé)
        const contactsWithImpayes = await this.addImpayesCountToContacts(contacts)
        
        this.allContacts = contactsWithImpayes
        this.lastFetched = Date.now()
        return this.allContacts
      } catch (error) {
        console.error('Erreur chargement contacts:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Nouvelle méthode pour compter les impayés de manière optimisée
    async addImpayesCountToContacts(contacts) {
      const { $parse } = useNuxtApp()
      
      // Vérifier si le store impayés a déjà des données
      const impayesStore = useImpayesStore()
      
      if (impayesStore.allImpayes.length > 0 && impayesStore.hasCache) {
        // Utiliser les données locales du store impayés
        // Dans Parse, la relation payeur est un pointeur, donc on compare les objectId
        return contacts.map(contact => {
          const contactId = contact.id
          const count = impayesStore.allImpayes.filter(i => {
            // Vérifier si l'impayé a un payeur et si l'ID correspond
            return i._parse && i._parse.get('payeur') && i._parse.get('payeur').id === contactId
          }).length
          contact.set('nb_impayes', count)
          return contact
        })
      } else {
        // Si le store impayés est vide, faire un seul appel groupé
        try {
          // Récupérer tous les impayés en une seule requête
          await impayesStore.fetchAllImpayes()
          
          // Maintenant utiliser les données locales
          return contacts.map(contact => {
            const contactId = contact.id
            const count = impayesStore.allImpayes.filter(i => {
              return i._parse && i._parse.get('payeur') && i._parse.get('payeur').id === contactId
            }).length
            contact.set('nb_impayes', count)
            return contact
          })
        } catch (error) {
          console.warn('Impossible de charger les impayés, utilisation du fallback:', error)
          // Fallback: méthode originale avec appels individuels
          return await Promise.all(contacts.map(async contact => {
            const impayeQuery = new $parse.Query('Impaye')
            const count = await impayeQuery.equalTo('payeur', contact).count()
            contact.set('nb_impayes', count)
            return contact
          }))
        }
      }
    },

    async getViewData(viewType) {
      // Si pas encore chargé, charger depuis allContacts ou fetch
      if (!this.viewsData[viewType].loaded) {
        if (this.allContacts.length === 0 && !this.hasCache) {
          await this.fetchAllContacts()
        }
        this.viewsData[viewType].data = this.filterForView(viewType)
        this.viewsData[viewType].loaded = true
      }
      return this.viewsData[viewType].data
    },

    filterForView(viewType) {
      switch(viewType) {
        case 'sans-email':
          return this.allContacts.filter(c => !c.get('email') || c.get('email') === '')
        case 'par-entreprise':
          return this.groupByCompany(this.allContacts)
        default:
          return this.allContacts
      }
    },

    async fetchEntitesGroupes() {
      const { $parse } = useNuxtApp()
      const Contact = $parse.Object.extend('Contact')

      // 1. Récupérer toutes les personnes morales (type_personne === 'M')
      const q = new $parse.Query(Contact)
      q.equalTo('type_personne', 'M')
      q.include('email_relance')
      q.ascending('nom')
      const entreprises = await q.find()

      // 2. Pour chaque entreprise, récupérer ses employés via la relation
      const groups = await Promise.all(entreprises.map(async (entreprise) => {
        const employes = await entreprise.relation('employes').query().ascending('nom').find()
        return {
          nom: entreprise.get('nom') || 'Entreprise sans nom',
          entreprise,
          employes,
          contacts: [entreprise, ...employes],
          count: 1 + employes.length
        }
      }))

      // Mémoriser les IDs des employés (pour exclure des particuliers)
      const ids = new Set(this.employeIds)
      groups.forEach(g => g.employes.forEach(e => ids.add(e.id)))
      this.employeIds = ids

      return groups
    },

    async fetchParticuliersGroupes() {
      const { $parse } = useNuxtApp()
      const Contact = $parse.Object.extend('Contact')

      // Récupérer les personnes physiques (type_personne !== 'M') non-employés d'une entreprise
      const q = new $parse.Query(Contact)
      q.notEqualTo('type_personne', 'M')
      q.include('email_relance')
      q.ascending('nom')
      const candidats = await q.find()

      // Pour chaque candidat, récupérer ses membres via la relation 'employes'
      const groups = await Promise.all(candidats.map(async (chef) => {
        const membres = await chef.relation('employes').query().ascending('nom').find()
        return { chef, membres }
      }))

      // Ne garder que ceux qui ont au moins un membre
      const groupesAvecMembres = groups.filter(g => g.membres.length > 0)

      // Mémoriser les IDs des membres pour les exclure des particuliers seuls
      const ids = new Set(this.employeIds)
      groupesAvecMembres.forEach(g => g.membres.forEach(m => ids.add(m.id)))
      this.employeIds = ids

      return groupesAvecMembres.map(g => ({
        nom: g.chef.get('nom') || '—',
        chef: g.chef,
        membres: g.membres,
        contacts: [g.chef, ...g.membres],
        count: 1 + g.membres.length
      }))
    },

    groupByCompany(contacts) {
      // NE GARDER QUE LES PERSONNES MORALES (type_personne === 'M') ET LEURS EMPLOYÉS
      const grouped = {}
      
      contacts.forEach(contact => {
        // Si c'est une entreprise (type_personne === 'M' uniquement, pas null ou autre)
        if (contact.get('type_personne') === 'M') {
          const entrepriseNom = contact.get('nom') || 'Entreprise sans nom'
          if (!grouped[entrepriseNom]) {
            grouped[entrepriseNom] = {
              entreprise: contact,
              employes: []
            }
          }
        }
        // Si c'est une personne physique avec une entreprise ET que l'entreprise est une personne morale
        else if (contact.get('entreprise')) {
          const entreprise = contact.get('entreprise')
          // Vérifier que l'entreprise est bien une personne morale (type_personne === 'M')
          if (entreprise && entreprise.get('type_personne') === 'M') {
            const entrepriseNom = entreprise.get('nom') || 'Entreprise sans nom'
            if (!grouped[entrepriseNom]) {
              grouped[entrepriseNom] = {
                entreprise: null,
                employes: [contact]
              }
            } else {
              grouped[entrepriseNom].employes.push(contact)
            }
          }
        }
      })
      
      // Créer les groupes finaux
      return Object.entries(grouped).map(([nom, data]) => ({
        nom,
        entreprise: data.entreprise,
        employes: data.employes,
        contacts: data.entreprise ? [data.entreprise, ...data.employes] : data.employes,
        count: (data.entreprise ? 1 : 0) + data.employes.length
      }))
    },

    invalidateCache() {
      this.lastFetched = null
      this.employeIds = new Set()
      Object.keys(this.viewsData).forEach(key => {
        this.viewsData[key].loaded = false
        this.viewsData[key].data = []
      })
    },


    async prefetchAllViews() {
      await this.fetchAllContacts()
      Object.keys(this.viewsData).forEach(view => {
        this.viewsData[view].data = this.filterForView(view)
        this.viewsData[view].loaded = true
      })
    }
  }
})