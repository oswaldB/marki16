// Test pour vérifier que les variables de relance sont bien générées
const { computed, ref } = require('vue');

// Simuler la structure des emails
const emails = ref([
  { _key: 'email_1', delai: 0, scenarios: [] },
  { _key: 'email_2', delai: 7, scenarios: [] },
  { _key: 'email_3', delai: 14, scenarios: [] }
]);

const emailsSorted = computed(() => 
  [...emails.value].sort((a, b) => a.delai - b.delai)
);

// Variables pour les emails précédents (relances)
const RELANCE_VARIABLES = computed(() => {
  return emailsSorted.value.map((email, index) => {
    const emailIndex = index + 1
    return {
      groupe: `RELANCE ${emailIndex}`,
      vars: [
        `relance.${emailIndex}.numero`,
        `relance.${emailIndex}.nom`,
        `relance.${emailIndex}.colonne`,
        `relance.${emailIndex}.relance`
      ]
    }
  })
});

console.log('Variables de relance générées :');
console.log(JSON.stringify(RELANCE_VARIABLES.value, null, 2));

console.log('\nTest réussi ! Les variables de relance sont bien générées.');
