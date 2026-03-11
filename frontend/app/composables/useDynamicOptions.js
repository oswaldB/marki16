// frontend/app/composables/useDynamicOptions.js
// Composable pour récupérer les options dynamiques depuis Parse

export const useDynamicOptions = () => {
  const { $parse } = useNuxtApp();
  
  /**
   * Récupère les options dynamiques pour un type donné
   * @param {string} type - Type d'option (ex: 'statut_impaye')
   * @param {boolean} useCache - Utiliser le cache local (défaut: true)
   * @returns {Promise<Array>} Liste d'options formatées pour les selects
   */
  async function getOptions(type, useCache = true) {
    const cacheKey = `dynamicOptions_${type}`;
    
    // Vérifier le cache
    if (useCache) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          console.warn('Failed to parse cached options:', e);
        }
      }
    }
    
    // Récupérer depuis Parse
    try {
      const query = new $parse.Query('OptionsDynamiques');
      query.equalTo('type', type);
      const result = await query.first();
      
      if (result) {
        const valeurs = result.get('valeurs') || [];
        const options = valeurs.map(v => ({
          label: formatOptionLabel(v),
          value: v
        }));
        
        // Mettre en cache
        localStorage.setItem(cacheKey, JSON.stringify(options));
        
        return options;
      }
    } catch (error) {
      console.error(`Failed to fetch dynamic options for ${type}:`, error);
    }
    
    // Retourner des valeurs par défaut si échec
    return getDefaultOptions(type);
  }
  
  /**
   * Formate un label à partir d'une valeur
   */
  function formatOptionLabel(value) {
    if (!value) return '';
    
    // Remplacer les underscores par des espaces
    let formatted = value.replace(/_/g, ' ');
    
    // Capitalizer la première lettre
    formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    
    return formatted;
  }
  
  /**
   * Retourne des options par défaut pour les types connus
   */
  function getDefaultOptions(type) {
    const defaults = {
      'statut_impaye': [
        { label: 'Impayé', value: 'impaye' },
        { label: 'En cours', value: 'en cours' },
        { label: 'Payé', value: 'payé' },
        { label: 'Partiellement payé', value: 'partiellement_paye' },
        { label: 'En litige', value: 'en_litige' }
      ],
      'statut_relance': [
        { label: 'En attente', value: 'pending' },
        { label: 'Envoyé', value: 'envoyé' },
        { label: 'Échec', value: 'échec' },
        { label: 'Annulé', value: 'annulé' }
      ],
      'statut_dossier': [
        { label: 'Actif', value: 'actif' },
        { label: 'Clôturé', value: 'cloture' },
        { label: 'En attente', value: 'en_attente' }
      ],
      'payeur_type': [
        { label: 'Propriétaire', value: 'proprietaire' },
        { label: 'Locataire', value: 'locataire' },
        { label: 'Apporteur', value: 'apporteur' },
        { label: 'Entreprise', value: 'entreprise' }
      ],
      'payeur_type_personne': [
        { label: 'Physique', value: 'physique' },
        { label: 'Morale', value: 'morale' }
      ],
      'proprietaire_type_personne': [
        { label: 'Physique', value: 'physique' },
        { label: 'Morale', value: 'morale' }
      ],
      'ville': [], // Sera rempli dynamiquement
      'code_postal': [], // Sera rempli dynamiquement
      'entreprise': [], // Sera rempli dynamiquement
      'apporteur_societe': [], // Sera rempli dynamiquement
      'payeur_nom': [], // Sera rempli dynamiquement
      'payeur_email': [], // Sera rempli dynamiquement
      'payeur_telephone': [], // Sera rempli dynamiquement
      'apporteur_nom': [], // Sera rempli dynamiquement
      'apporteur_email': [], // Sera rempli dynamiquement
      'apporteur_telephone': [], // Sera rempli dynamiquement
      'proprietaire_nom': [], // Sera rempli dynamiquement
      'proprietaire_email': [], // Sera rempli dynamiquement
      'proprietaire_telephone': [], // Sera rempli dynamiquement
      'adresse_bien': [], // Sera rempli dynamiquement
      'numero_lot': [] // Sera rempli dynamiquement
    };
    
    return defaults[type] || [];
  }
  
  /**
   * Invalide le cache pour un type donné
   */
  function invalidateCache(type) {
    const cacheKey = `dynamicOptions_${type}`;
    localStorage.removeItem(cacheKey);
  }
  
  /**
   * Invalide tout le cache des options dynamiques
   */
  function invalidateAllCache() {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('dynamicOptions_')) {
        localStorage.removeItem(key);
      }
    });
  }
  
  return {
    getOptions,
    invalidateCache,
    invalidateAllCache
  };
};