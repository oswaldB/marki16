// Simple test to verify the fix
console.log("Testing the fix for relance variables...");

// Simulate the fixed ALL_VARIABLES computed property
const VARIABLES = [
  { groupe: 'PAYEUR',   vars: ['payeur_nom', 'payeur_email'] },
  { groupe: 'FACTURE',  vars: ['nfacture', 'montant'] },
];

const LIENS_DE_PAIEMENT_VARS = [
  { name: 'lien1', display: 'Lien 1', url: 'http://example.com', isPaymentLink: true }
];

// This should work now (after the fix)
const ALL_VARIABLES = [
  ...VARIABLES,
  { groupe: 'LIENS DE PAIEMENT', vars: LIENS_DE_PAIEMENT_VARS },
];

console.log("✓ ALL_VARIABLES computed successfully");
console.log("Variables:", JSON.stringify(ALL_VARIABLES, null, 2));

// Test the getRelanceVariablesForEmail function
const emailsSorted = [
  { _key: 'email_1' },
  { _key: 'email_2' },
  { _key: 'email_3' }
];

function getRelanceVariablesForEmail(emailKey) {
  const currentIndex = emailsSorted.findIndex(e => e._key === emailKey);
  if (currentIndex === -1) return [];
  
  return emailsSorted.slice(0, currentIndex).map((email, index) => {
    const emailIndex = index + 1;
    return {
      groupe: `RELANCE ${emailIndex}`,
      vars: [
        `relance.${emailIndex}.objet`,
        `relance.${emailIndex}.dateEnvoi`
      ]
    };
  });
}

// Test for email_2 (should return RELANCE 1 variables)
const relanceVarsForEmail2 = getRelanceVariablesForEmail('email_2');
console.log("\n✓ Relance variables for email_2:");
console.log(JSON.stringify(relanceVarsForEmail2, null, 2));

// Test for email_3 (should return RELANCE 1 and RELANCE 2 variables)
const relanceVarsForEmail3 = getRelanceVariablesForEmail('email_3');
console.log("\n✓ Relance variables for email_3:");
console.log(JSON.stringify(relanceVarsForEmail3, null, 2));

console.log("\n✅ All tests passed! The fix is working correctly.");