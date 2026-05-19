// Cloud Functions principales pour Marki16
// Ce fichier charge toutes les cloud functions nécessaires

// Importer les workflows qui contiennent les Cloud Functions
require("./workflows/import-invoice/00-master");
require("./workflows/generate-relances/00-master");
require("./workflows/send-sequence-test/00-master");
require("./workflows/verify-paid-invoices/00-master");

// Importer les workflows utilitaires
require("./workflows/appliquer-regles-attribution/00-master");

// Importer les workflows de gestion des utilisateurs
require("./workflows/users/00-master");

// Importer le workflow de synchronisation des contacts
require("./workflows/sync-contacts/00-master");

// Exposer les workflows pour qu'ils soient accessibles depuis d'autres parties de l'application
global.importInvoicesMaster = require("./workflows/import-invoice/00-master");
global.sendEmailsMaster = require("./workflows/send-emails/00-master");
global.updateDynamicOptionsMaster = require("./workflows/update-dynamic-options/00-master");
global.verifyPaidInvoicesMaster = require("./workflows/verify-paid-invoices/00-master");

console.log(
    "✅ Cloud Functions Marki16 chargées (incluant users et sync-contacts)",
);
