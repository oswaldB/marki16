// backend/cloud/jobs/updateDynamicOptions.js
// Cloud Function pour mettre à jour les options dynamiques (statuts, etc.)

module.exports = async function() {
  console.log('[updateDynamicOptions] Début de la mise à jour des options dynamiques');
  
  // 1. Statuts d'impayés
  await updateStatutOptions('statut_impaye', 'Impaye', 'statut');
  
  // 2. Statuts de relances
  await updateStatutOptions('statut_relance', 'Relance', 'statut');
  
  // 3. Statuts de dossiers
  await updateStatutOptions('statut_dossier', 'Impaye', 'statut_dossier');
  
  // 4. Types de payeurs
  await updateStatutOptions('payeur_type', 'Impaye', 'payeur_type');
  
  // 5. Types de payeurs (personne)
  await updateStatutOptions('payeur_type_personne', 'Impaye', 'payeur_type_personne');
  
  // 6. Types de propriétaires (personne)
  await updateStatutOptions('proprietaire_type_personne', 'Impaye', 'proprietaire_type_personne');
  
  // 7. Villes - toutes les valeurs
  await updateAllValues('ville', 'Impaye', 'ville');
  
  // 8. Codes postaux - toutes les valeurs
  await updateAllValues('code_postal', 'Impaye', 'code_postal');
  
  // 9. Entreprises - toutes les valeurs
  await updateAllValues('entreprise', 'Impaye', 'entreprise');
  
  // 10. Sociétés apporteurs - toutes les valeurs
  await updateAllValues('apporteur_societe', 'Impaye', 'apporteur_societe');
  
  // 11. Noms payeurs - toutes les valeurs
  await updateAllValues('payeur_nom', 'Impaye', 'payeur_nom');
  
  // 12. Emails payeurs - toutes les valeurs
  await updateAllValues('payeur_email', 'Impaye', 'payeur_email');
  
  // 13. Téléphones payeurs - toutes les valeurs
  await updateAllValues('payeur_telephone', 'Impaye', 'payeur_telephone');
  
  // 14. Noms apporteurs - toutes les valeurs
  await updateAllValues('apporteur_nom', 'Impaye', 'apporteur_nom');
  
  // 15. Emails apporteurs - toutes les valeurs
  await updateAllValues('apporteur_email', 'Impaye', 'apporteur_email');
  
  // 16. Téléphones apporteurs - toutes les valeurs
  await updateAllValues('apporteur_telephone', 'Impaye', 'apporteur_telephone');
  
  // 17. Noms propriétaires - toutes les valeurs
  await updateAllValues('proprietaire_nom', 'Impaye', 'proprietaire_nom');
  
  // 18. Emails propriétaires - toutes les valeurs
  await updateAllValues('proprietaire_email', 'Impaye', 'proprietaire_email');
  
  // 19. Téléphones propriétaires - toutes les valeurs
  await updateAllValues('proprietaire_telephone', 'Impaye', 'proprietaire_telephone');
  
  // 20. Adresses bien - toutes les valeurs
  await updateAllValues('adresse_bien', 'Impaye', 'adresse_bien');
  
  // 21. Numéros de lot - toutes les valeurs
  await updateAllValues('numero_lot', 'Impaye', 'numero_lot');

  console.log('[updateDynamicOptions] Toutes les options mises à jour avec succès');
  
  return {
    success: true,
    message: 'Options dynamiques mises à jour avec succès',
    updatedTypes: [
      'statut_impaye', 'statut_relance', 'statut_dossier', 'payeur_type',
      'payeur_type_personne', 'proprietaire_type_personne',
      'ville', 'code_postal', 'entreprise', 'apporteur_societe',
      'payeur_nom', 'payeur_email', 'payeur_telephone',
      'apporteur_nom', 'apporteur_email', 'apporteur_telephone',
      'proprietaire_nom', 'proprietaire_email', 'proprietaire_telephone',
      'adresse_bien', 'numero_lot'
    ]
  };
};

/**
 * Met à jour les options pour un type donné (valeurs distinctes)
 * @param {string} type - Type d'option (ex: 'statut_impaye')
 * @param {string} className - Nom de la classe Parse à interroger
 * @param {string} fieldName - Nom du champ à analyser
 */
async function updateStatutOptions(type, className, fieldName) {
  console.log(`[updateDynamicOptions] Mise à jour des options pour ${type} depuis ${className}.${fieldName}`);

  // Récupérer les valeurs distinctes
  const query = new Parse.Query(className);
  query.distinct(fieldName);
  query.exists(fieldName);
  
  const results = await query.find({ useMasterKey: true });
  const valeurs = [...new Set(results.map(r => r.get(fieldName)))].filter(Boolean);

  console.log(`[updateDynamicOptions] Trouvé ${valeurs.length} valeurs distinctes pour ${type}`);

  // Sauvegarder dans OptionsDynamiques
  await saveOptionsToParse(type, valeurs);

  console.log(`[updateDynamicOptions] Options ${type} mises à jour avec ${valeurs.length} valeurs`);
}

/**
 * Met à jour les options pour un type donné (top N valeurs les plus fréquentes)
 * @param {string} type - Type d'option
 * @param {string} className - Nom de la classe Parse
 * @param {string} fieldName - Nom du champ
 * @param {number} limit - Nombre maximum de valeurs à retourner
 */
async function updateTopValues(type, className, fieldName, limit) {
  console.log(`[updateDynamicOptions] Mise à jour des top ${limit} valeurs pour ${type} depuis ${className}.${fieldName}`);

  // Récupérer tous les enregistrements avec ce champ
  const query = new Parse.Query(className);
  query.exists(fieldName);
  query.limit(1000); // Limite pour éviter de tout charger
  
  const results = await query.find({ useMasterKey: true });
  
  // Compter les occurrences
  const countMap = {};
  for (const result of results) {
    const value = result.get(fieldName);
    if (value) {
      countMap[value] = (countMap[value] || 0) + 1;
    }
  }

  // Trier par fréquence décroissante
  const sortedValues = Object.entries(countMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(entry => entry[0]);

  console.log(`[updateDynamicOptions] Trouvé ${sortedValues.length} valeurs fréquentes pour ${type}`);

  // Sauvegarder dans OptionsDynamiques
  await saveOptionsToParse(type, sortedValues);

  console.log(`[updateDynamicOptions] Top ${limit} valeurs pour ${type} mises à jour`);
}

/**
 * Met à jour les options pour un type donné (toutes les valeurs distinctes)
 * @param {string} type - Type d'option
 * @param {string} className - Nom de la classe Parse
 * @param {string} fieldName - Nom du champ
 */
async function updateAllValues(type, className, fieldName) {
  console.log(`[updateDynamicOptions] Mise à jour de toutes les valeurs pour ${type} depuis ${className}.${fieldName}`);

  // Récupérer toutes les valeurs distinctes sans limite
  const query = new Parse.Query(className);
  query.distinct(fieldName);
  query.exists(fieldName);
  
  const results = await query.find({ useMasterKey: true });
  const valeurs = [...new Set(results.map(r => r.get(fieldName)))].filter(Boolean);

  console.log(`[updateDynamicOptions] Trouvé ${valeurs.length} valeurs distinctes pour ${type}`);

  // Sauvegarder dans OptionsDynamiques
  await saveOptionsToParse(type, valeurs);

  console.log(`[updateDynamicOptions] Toutes les valeurs pour ${type} mises à jour (${valeurs.length} valeurs)`);
}

/**
 * Sauvegarde les options dans la table OptionsDynamiques
 * @param {string} type - Type d'option
 * @param {Array} valeurs - Liste des valeurs
 */
async function saveOptionsToParse(type, valeurs) {
  const OptionsDynamiques = Parse.Object.extend('OptionsDynamiques');
  const optionsQuery = new Parse.Query(OptionsDynamiques);
  optionsQuery.equalTo('type', type);

  let optionsObj = await optionsQuery.first({ useMasterKey: true });
  
  if (!optionsObj) {
    optionsObj = new OptionsDynamiques();
    optionsObj.set('type', type);
  }

  optionsObj.set('valeurs', valeurs);
  await optionsObj.save(null, { useMasterKey: true });
}