import { defineStore } from 'pinia'

/**
 * Store dédié à la gestion de la blacklist des impayés
 * F-008: Blacklist des Impayés
 */
export const useBlacklistImpayeStore = defineStore('blacklistImpaye', {
    state: () => ({
        blacklistedImpayes: [],      // Liste des impayés blacklistés (Parse Objects)
        loading: false,
        saving: false,
        error: null,
        lastFetched: null,
        cacheDuration: 300000        // 5 minutes
    }),

    getters: {
        // Nombre d'impayés blacklistés
        count: (state) => state.blacklistedImpayes.length,

        // Vérifie si un impayé est blacklisté
        isBlacklisted: (state) => (impayeId) => {
            return state.blacklistedImpayes.some(i => i.id === impayeId)
        },

        // Vérifie si le cache est valide
        hasValidCache: (state) => {
            return state.lastFetched && Date.now() - state.lastFetched < state.cacheDuration
        },

        // Liste filtrée par motif type
        getByMotifType: (state) => (motifType) => {
            if (!motifType) return state.blacklistedImpayes
            return state.blacklistedImpayes.filter(i => i.get('blacklistMotifType') === motifType)
        },

        // Get motif details for an impayé
        getMotifDetails: (state) => (impayeId) => {
            const impaye = state.blacklistedImpayes.find(i => i.id === impayeId)
            if (!impaye) return null
            return {
                type: impaye.get('blacklistMotifType'),
                detail: impaye.get('blacklistMotif'),
                date: impaye.get('blacklistedAt'),
                isBlacklisted: impaye.get('isBlacklisted')
            }
        }
    },

    actions: {
        /**
         * Charge tous les impayés blacklistés depuis Parse
         * Filtre: isBlacklisted = true ET facture_soldee = false
         */
        async fetchBlacklistedImpayes(force = false) {
            if (!force && this.hasValidCache) {
                return this.blacklistedImpayes
            }

            this.loading = true
            this.error = null

            try {
                const { $parse } = useNuxtApp()
                const Impaye = $parse.Object.extend('Impaye')
                const query = new $parse.Query(Impaye)

                // Filtrer uniquement les impayés blacklistés non soldés
                query.equalTo('isBlacklisted', true)
                query.equalTo('facture_soldee', false)
                query.greaterThan('reste_a_payer', 0)

                // Inclure les relations utiles
                query.include('sequence')
                query.include('contact_relance')
                query.include('payeur')

                // Trier par date de blacklist desc
                query.descending('blacklistedAt')
                query.limit(1000)

                const impayes = await query.find()
                this.blacklistedImpayes = impayes
                this.lastFetched = Date.now()

                return impayes
            } catch (error) {
                this.error = error
                console.error('Erreur chargement impayés blacklistés:', error)
                throw error
            } finally {
                this.loading = false
            }
        },

        /**
         * Blackliste un impayé avec motif
         * @param {string} impayeId - ID de l'impayé
         * @param {string} motifType - Type de motif (6 options prédéfinies)
         * @param {string} motifDetail - Détail complémentaire
         * @param {string} contactId - ID du contact pour régénération
         * @returns {Promise<Object>} - Résultat avec impaye mis à jour
         */
        async blacklistImpaye(impayeId, motifType, motifDetail = '', contactId = null) {
            // Validation FRONTEND obligatoire
            if (!motifType && !motifDetail) {
                throw new Error('Motif de blacklist obligatoire')
            }

            this.saving = true
            this.error = null

            try {
                const { $parse } = useNuxtApp()
                const Impaye = $parse.Object.extend('Impaye')

                // Récupérer l'impayé
                const impaye = await new $parse.Query(Impaye).get(impayeId)
                if (!impaye) {
                    throw new Error('Impayé non trouvé')
                }

                // Récupérer le contact si non fourni
                if (!contactId) {
                    const contact = impaye.get('contact_relance') || impaye.get('payeur')
                    contactId = contact?.id
                }

                // Auto-set champs
                impaye.set('isBlacklisted', true)
                impaye.set('blacklistedAt', new Date())
                impaye.set('blacklistMotifType', motifType)
                impaye.set('blacklistMotif', motifDetail)

                // Sauvegarde directe - pas de hook backend
                await impaye.save()

                // Régénérer les relances du contact (avec exclusion de cet impayé)
                let regenerationResult = null
                if (contactId) {
                    try {
                        regenerationResult = await $parse.Cloud.run('regenerateRelancesContact', {
                            contactId,
                            excludeImpayeId: impayeId
                        })
                    } catch (regenError) {
                        console.error('Erreur régénération relances:', regenError)
                        // L'impayé est déjà blacklisté, on log l'erreur mais on ne rollback pas
                        // L'utilisateur pourra relancer manuellement si besoin
                    }
                }

                // Invalider le cache
                this.lastFetched = null

                return {
                    success: true,
                    impaye,
                    regenerationResult
                }
            } catch (error) {
                this.error = error
                console.error('Erreur blacklist impayé:', error)
                throw error
            } finally {
                this.saving = false
            }
        },

        /**
         * Déblackliste un impayé (réactive les relances)
         * @param {string} impayeId - ID de l'impayé
         * @param {string} contactId - ID du contact pour régénération
         * @returns {Promise<Object>} - Résultat avec impaye mis à jour
         */
        async unblacklistImpaye(impayeId, contactId = null) {
            this.saving = true
            this.error = null

            try {
                const { $parse } = useNuxtApp()
                const Impaye = $parse.Object.extend('Impaye')

                // Récupérer l'impayé
                const impaye = await new $parse.Query(Impaye).get(impayeId)
                if (!impaye) {
                    throw new Error('Impayé non trouvé')
                }

                // Récupérer le contact si non fourni
                if (!contactId) {
                    const contact = impaye.get('contact_relance') || impaye.get('payeur')
                    contactId = contact?.id
                }

                // Reset champs
                impaye.set('isBlacklisted', false)
                impaye.set('blacklistedAt', null)
                impaye.set('blacklistMotifType', null)
                impaye.set('blacklistMotif', null)

                await impaye.save()

                // Régénérer les relances du contact (cet impayé sera maintenant inclus)
                let regenerationResult = null
                if (contactId) {
                    try {
                        regenerationResult = await $parse.Cloud.run('regenerateRelancesContact', {
                            contactId
                            // Pas d'excludeImpayeId car on veut l'inclure
                        })
                    } catch (regenError) {
                        console.error('Erreur régénération relances:', regenError)
                    }
                }

                // Invalider le cache
                this.lastFetched = null

                return {
                    success: true,
                    impaye,
                    regenerationResult
                }
            } catch (error) {
                this.error = error
                console.error('Erreur unblacklist impayé:', error)
                throw error
            } finally {
                this.saving = false
            }
        },

        /**
         * Toggle le statut blacklist d'un impayé
         * @param {string} impayeId - ID de l'impayé
         * @param {Object} options - { motifType, motifDetail, contactId }
         * @returns {Promise<Object>}
         */
        async toggleBlacklist(impayeId, options = {}) {
            const { $parse } = useNuxtApp()
            const Impaye = $parse.Object.extend('Impaye')

            try {
                const impaye = await new $parse.Query(Impaye).get(impayeId)
                const isCurrentlyBlacklisted = impaye.get('isBlacklisted') === true

                if (isCurrentlyBlacklisted) {
                    return await this.unblacklistImpaye(impayeId, options.contactId)
                } else {
                    return await this.blacklistImpaye(
                        impayeId,
                        options.motifType,
                        options.motifDetail,
                        options.contactId
                    )
                }
            } catch (error) {
                console.error('Erreur toggle blacklist:', error)
                throw error
            }
        },

        /**
         * Régénère les relances pour un contact (utile après modification manuelle)
         * @param {string} contactId - ID du contact
         * @param {string} excludeImpayeId - ID de l'impayé à exclure (optionnel)
         * @returns {Promise<Object>}
         */
        async regenerateRelancesForContact(contactId, excludeImpayeId = null) {
            try {
                const { $parse } = useNuxtApp()
                const result = await $parse.Cloud.run('regenerateRelancesContact', {
                    contactId,
                    excludeImpayeId
                })
                return result
            } catch (error) {
                console.error('Erreur régénération relances:', error)
                throw error
            }
        },

        /**
         * Invalide le cache
         */
        invalidateCache() {
            this.lastFetched = null
            this.blacklistedImpayes = []
        },

        /**
         * Filtre les impayés blacklistés
         * @param {string} searchQuery - Terme de recherche
         * @param {string} motifFilter - Filtre par motif type
         * @returns {Array} - Impayés filtrés
         */
        getFilteredImpayes(searchQuery = '', motifFilter = null) {
            let data = this.blacklistedImpayes

            // Filtre par motif
            if (motifFilter) {
                data = data.filter(impaye => impaye.get('blacklistMotifType') === motifFilter)
            }

            // Filtre par recherche
            if (searchQuery) {
                const searchLower = searchQuery.toLowerCase()
                data = data.filter(impaye => {
                    const nfacture = (impaye.get('nfacture') || '').toLowerCase()
                    const payeurNom = (impaye.get('payeur_nom') || '').toLowerCase()
                    const reference = (impaye.get('reference') || '').toLowerCase()
                    const motif = (impaye.get('blacklistMotif') || '').toLowerCase()

                    return nfacture.includes(searchLower) ||
                           payeurNom.includes(searchLower) ||
                           reference.includes(searchLower) ||
                           motif.includes(searchLower)
                })
            }

            return data
        }
    }
})

// Types de motifs prédéfinis pour la blacklist
export const BLACKLIST_MOTIF_TYPES = [
    { value: 'litige', label: 'Litige commercial', description: 'Contestations liées à la prestation' },
    { value: 'reglement_en_cours', label: 'Règlement en cours', description: 'Paiement en attente de validation' },
    { value: ' erreur_facturation', label: 'Erreur de facturation', description: 'Facture erronée à corriger' },
    { value: 'procedure_judiciaire', label: 'Procédure judiciaire', description: 'Contentieux en cours' },
    { value: 'accord_special', label: 'Accord spécial', description: 'Arrangement particulier avec le client' },
    { value: 'accord_paiement_notaire', label: 'Accord paiement notaire', description: 'Accord de paiement en attente chez le notaire' },
    { value: 'cheque_encaissement_differe', label: 'Chèque reçus, encaissement différé', description: 'Chèque reçu mais encaissement programmé plus tard' },
    { value: 'reglement_plusieurs_fois', label: 'Règlement en plusieurs fois', description: 'Paiement étalé sur plusieurs échéances' },
    { value: 'autre', label: 'Autre', description: 'Motif non listé ci-dessus' }
]
