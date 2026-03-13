import { defineStore } from 'pinia'

export const useImpayesStore = defineStore('impayes', {
  state: () => ({
    allImpayes: [],
    loading: false,
    lastFetched: null,
    cacheDuration: 300000, // 5 minutes
    viewsData: {
      'unitaire': { data: [], loaded: false },
      'payeur': { data: [], loaded: false },
      'contact': { data: [], loaded: false },
      'sans-sequence': { data: [], loaded: false }
    },
    sequences: [],
    sequencesLoading: false
  }),

  getters: {
    hasCache: (state) => {
      return state.lastFetched && Date.now() - state.lastFetched < state.cacheDuration
    }
  },

  actions: {
    async fetchAllImpayes(force = false) {
      if (!force && this.hasCache) {
        return this.allImpayes
      }

      this.loading = true
      try {
        const { $parse } = useNuxtApp()
        const query = new $parse.Query('Impaye')
        query.limit(1000)
        query.include('sequence')
        query.descending('date_piece')
        
        const results = await query.find()
        this.allImpayes = results.map(this.rowToPlain)
        this.lastFetched = Date.now()
        return this.allImpayes
      } catch (error) {
        console.error('Erreur chargement impayés:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async getViewData(viewType, search = '', filtreSequence = 'all', sortColumn = 'date_piece', sortDirection = 'desc') {
      // Si pas encore chargé, charger depuis allImpayes ou fetch
      if (!this.viewsData[viewType].loaded) {
        if (this.allImpayes.length === 0 && !this.hasCache) {
          await this.fetchAllImpayes()
        }
        this.viewsData[viewType].data = this.filterForView(viewType, search, filtreSequence, sortColumn, sortDirection)
        this.viewsData[viewType].loaded = true
      }
      return this.viewsData[viewType].data
    },

    filterForView(viewType, search = '', filtreSequence = 'all', sortColumn = 'date_piece', sortDirection = 'desc') {
      let data = [...this.allImpayes]
      
      // Filtre par séquence
      if (filtreSequence === 'none') {
        data = data.filter(i => !i.sequenceId)
      } else if (filtreSequence !== 'all') {
        data = data.filter(i => i.sequenceId === filtreSequence)
      }
      
      // Recherche
      if (search) {
        const searchLower = search.toLowerCase()
        data = data.filter(i => 
          (i.payeur_nom && i.payeur_nom.toLowerCase().includes(searchLower)) ||
          (i.nfacture && i.nfacture.toLowerCase().includes(searchLower)) ||
          (i.reference && i.reference.toLowerCase().includes(searchLower)) ||
          (i.adresse_bien && i.adresse_bien.toLowerCase().includes(searchLower))
        )
      }
      
      // Tri
      data.sort((a, b) => {
        let aVal, bVal
        switch(sortColumn) {
          case 'reste_a_payer': aVal = a.reste_a_payer; bVal = b.reste_a_payer; break
          case 'retard': aVal = a.retard; bVal = b.retard; break
          case 'payeur_nom': aVal = a.payeur_nom; bVal = b.payeur_nom; break
          case 'nfacture': aVal = a.nfacture; bVal = b.nfacture; break
          default: // date_piece
            aVal = a.date_piece; bVal = b.date_piece; break
        }
        
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
      
      return data
    },

    async fetchSequences() {
      if (this.sequences.length > 0) return this.sequences
      
      this.sequencesLoading = true
      try {
        const { $parse } = useNuxtApp()
        const q = new $parse.Query('Sequence')
        q.limit(200)
        this.sequences = await q.find()
        return this.sequences
      } catch (error) {
        console.error('Erreur chargement séquences:', error)
        throw error
      } finally {
        this.sequencesLoading = false
      }
    },

    rowToPlain(r) {
      const seq = r.get('sequence')
      const today = new Date()
      const calcRetard = (datePiece) => {
        if (!datePiece) return 0
        const d = datePiece instanceof Date ? datePiece : new Date(datePiece)
        return Math.floor((today - d) / 86_400_000)
      }
      
      return {
        _parse: r,
        objectId: r.id,
        nfacture:           r.get('nfacture') || '—',
        numero_dossier:     r.get('numero_dossier') || '—',
        adresse_bien:       [r.get('adresse_bien'), r.get('code_postal'), r.get('ville')].filter(Boolean).join(', ') || '—',
        payeur_nom:         r.get('payeur_nom') || '—',
        apporteur_nom:      r.get('apporteur_nom') || null,
        retard:             calcRetard(r.get('date_piece')),
        reste_a_payer:      r.get('reste_a_payer'),
        total_ht:           r.get('total_ht'),
        total_ttc:          r.get('total_ttc'),
        date_piece:         r.get('date_piece'),
        date_debut_mission: r.get('date_debut_mission'),
        reference:          r.get('reference'),
        reference_externe:  r.get('reference_externe'),
        statut_dossier:     r.get('statut_dossier'),
        commentaire_piece:  r.get('commentaire_piece'),
        numero_lot:         r.get('numero_lot'),
        etage:              r.get('etage'),
        porte:              r.get('porte'),
        statut:             r.get('statut'),
        url_pdf:            r.get('url_pdf'),
        sequenceNom:        seq ? seq.get('nom') : null,
        sequenceId:         seq ? seq.id : null,
      }
    },

    invalidateCache() {
      this.lastFetched = null
      Object.keys(this.viewsData).forEach(key => {
        this.viewsData[key].loaded = false
        this.viewsData[key].data = []
      })
    },

    async prefetchAllViews() {
      await this.fetchAllImpayes()
      Object.keys(this.viewsData).forEach(view => {
        this.viewsData[view].data = this.filterForView(view)
        this.viewsData[view].loaded = true
      })
    }
  }
})