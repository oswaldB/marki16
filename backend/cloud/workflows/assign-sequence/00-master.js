// backend/cloud/workflows/assign-sequence/00-master.js
// Cloud Function: Attribue une séquence spécifique

const assignSpecificSequence = require('./01-assignSpecificSequence');

// Enregistrement de la Cloud Function Parse
Parse.Cloud.define('assignSpecificSequence', assignSpecificSequence);

module.exports = { assignSpecificSequence };
