// backend/cloud/workflows/appliquer-regles-attribution/00-master.js
// Workflow: Applique les règles d'attribution automatique des séquences

const { appliquerReglesAttributionAutomatique } = require('./01-appliquerReglesAttributionAutomatique');

// Ce workflow est un service utilitaire
// Il n'a pas de point d'entrée cron ou Cloud Function directe
// Il est appelé par d'autres workflows

module.exports = { appliquerReglesAttributionAutomatique };
