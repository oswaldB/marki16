// backend/cloud/utils/nunjucks.js
// Module utilitaire pour Nunjucks - Moteur de template

const nunjucks = require('nunjucks');

// Configuration de l'environnement Nunjucks
const env = nunjucks.configure({
  autoescape: false, // Désactive l'échappement HTML automatique (on génère du HTML)
  throwOnUndefined: false, // Ne pas planter sur variable manquante
  tags: {
    blockStart: '{%',
    blockEnd: '%}',
    variableStart: '{{',
    variableEnd: '}}',
    commentStart: '{#',
    commentEnd: '#}'
  }
});

// ============================================================================
// FILTRES PERSONNALISÉS
// ============================================================================

// Filtre pour formater une date
// Utilisation: {{ date_echeance | date("DD/MM/YYYY") }}
env.addFilter('date', function(d, format = 'DD/MM/YYYY') {
  if (!d) return '';
  
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) {
    // Si ce n'est pas une date valide, retourner la valeur d'origine
    return d;
  }
  
  const pad = (n) => n.toString().padStart(2, '0');
  
  return format
    .replace(/YYYY/g, dateObj.getFullYear())
    .replace(/MM/g, pad(dateObj.getMonth() + 1))
    .replace(/DD/g, pad(dateObj.getDate()))
    .replace(/HH/g, pad(dateObj.getHours()))
    .replace(/mm/g, pad(dateObj.getMinutes()))
    .replace(/ss/g, pad(dateObj.getSeconds()))
    .replace(/YYYY-MM-DD/g, `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}`)
    .replace(/DD\/MM\/YYYY/g, `${pad(dateObj.getDate())}/${pad(dateObj.getMonth() + 1)}/${dateObj.getFullYear()}`);
});

// Filtre pour arrondir un nombre
// Utilisation: {{ montant | round(2) }}
env.addFilter('round', function(value, decimals = 0) {
  if (typeof value !== 'number') {
    return value;
  }
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
});

// Filtre pour formater un montant en euros
// Utilisation: {{ montant_total | euro }}
env.addFilter('euro', function(value) {
  if (typeof value !== 'number') {
    return value;
  }
  return value.toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
});

// Filtre pour convertir en majuscule
env.addFilter('upper', function(value) {
  if (typeof value === 'string') {
    return value.toUpperCase();
  }
  return value;
});

// Filtre pour convertir en minuscule
env.addFilter('lower', function(value) {
  if (typeof value === 'string') {
    return value.toLowerCase();
  }
  return value;
});

// Filtre pour capitaliser (première lettre en majuscule)
env.addFilter('capitalize', function(value) {
  if (typeof value === 'string' && value.length > 0) {
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }
  return value;
});

// Filtre pour tronquer un texte
env.addFilter('truncate', function(value, length = 50, suffix = '...') {
  if (typeof value !== 'string') {
    return value;
  }
  if (value.length <= length) {
    return value;
  }
  return value.substring(0, length) + suffix;
});

// Filtre pour remplacer des caractères
env.addFilter('replace', function(value, from, to) {
  if (typeof value !== 'string') {
    return value;
  }
  return value.split(from).join(to);
});

// Filtre pour vérifier si une variable est définie
env.addFilter('default', function(value, defaultValue) {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  return value;
});

// ============================================================================
// FONCTIONS UTILITAIRES EXPORTÉES
// ============================================================================

/**
 * Rendu d'un template avec Nunjucks
 * @param {string} template - Le template avec syntaxe Nunjucks
 * @param {Object} data - Les données à injecter
 * @returns {string} Le template rendu
 */
function renderTemplate(template, data) {
  if (!template) return '';
  
  // Préparer le contexte avec toutes les variables nécessaires
  const context = {
    ...data,
    // Helper pour Math (utilisé dans les templates)
    Math: Math,
    // Helper pour JSON.stringify si besoin
    json: JSON.stringify,
    // Helper pour vérifier si une variable existe
    defined: (v) => v !== null && v !== undefined,
    // Helper pour les dates (alternative au filtre)
    formatDate: (d, format) => {
      if (!d) return '';
      return env.filters.date(new Date(d), format);
    },
    // Helper pour gérer les variables vides
    or: (a, b) => a || b
  };
  
  try {
    return env.renderString(template, context);
  } catch (error) {
    // En cas d'erreur, retourner le template non rendu
    console.error('[NUNJUCKS ERROR]', error.message);
    return template;
  }
}

/**
 * Rendu d'un template avec gestion des erreurs améliorée
 * @param {string} template - Le template
 * @param {Object} data - Les données
 * @returns {Promise<{success: boolean, result: string, error?: string}>}
 */
async function renderTemplateSafe(template, data) {
  try {
    const result = renderTemplate(template, data);
    return { success: true, result };
  } catch (error) {
    return { 
      success: false, 
      result: template,
      error: error.message 
    };
  }
}

module.exports = {
  env,
  renderTemplate,
  renderTemplateSafe
};
