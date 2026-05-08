// backend/cloud/workflows/send-sequence-test/00-master.js
// Cloud Function: Envoie des emails de test

const sendSequenceTest = require('./01-sendSequenceTest');

// Enregistrement de la Cloud Function Parse
Parse.Cloud.define('sendSequenceTest', sendSequenceTest);

module.exports = { sendSequenceTest };
