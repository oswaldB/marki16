// backend/cloud/workflows/send-email/00-master.js
// Cloud Functions pour l'envoi d'emails

const { sendEmail, sendEmailViaSmtp } = require('./01-sendEmail');

// Enregistrement des Cloud Functions Parse
Parse.Cloud.define('sendEmail', sendEmail);
Parse.Cloud.define('sendEmailViaSmtp', sendEmailViaSmtp);

module.exports = { sendEmail, sendEmailViaSmtp };
