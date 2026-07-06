# Utilitaire: logActivite

**Fichier** : `backend/cloud/utils/logActivite.js`  
**Feature** : F-013 (Système d'Activités)  
**Statut** : Nouveau  
**Date** : 2026-07-06

---

## **📌 Description**
Ce fichier contient le **helper central** `logActivite` pour enregistrer des activités dans la table `Activite` de Parse Server. Il standardise la création des activités et émet les checkpoints associés.

---

## **📊 Fonction `logActivite`**

### **Signature**
```javascript
async function logActivite({
  type,                      // String (obligatoire)
  acteur = null,             // Pointer<Contact> ou null (pour marki)
  cibleType,                 // String (obligatoire)
  cibleId,                   // String (obligatoire)
  metadata = {},             // Object (optionnel)
  statutAvant = null,        // String (optionnel)
  statutApres = null,        // String (optionnel)
  workflow = null,           // String (optionnel)
  isSystem = false,          // Boolean (obligatoire si acteur null)
}) {
  // ...
}
```

---

## **📌 Implémentation Complète**

```javascript
// backend/cloud/utils/logActivite.js
const Parse = require('parse/node');

/**
 * Enregistre une activité dans la table `Activite`.
 * 
 * @param {Object} params - Paramètres de l'activité.
 * @param {string} params.type - Type d'activité (ex: 'récupération_facture').
 * @param {Parse.Object|null} params.acteur - Acteur (Pointer<Contact>). Si null + isSystem=true → marki.
 * @param {string} params.cibleType - Type de la cible (ex: 'Facture', 'Payeur').
 * @param {string} params.cibleId - ID de la cible.
 * @param {Object} [params.metadata={}] - Données supplémentaires.
 * @param {string} [params.statutAvant=null] - Statut avant l'activité.
 * @param {string} [params.statutApres=null] - Statut après l'activité.
 * @param {string} [params.workflow=null] - Workflow associé.
 * @param {boolean} [params.isSystem=false] - Si true, acteur = marki.
 * @returns {Promise<Parse.Object>} - L'objet Activite sauvegardé.
 */
async function logActivite({
  type,
  acteur = null,
  cibleType,
  cibleId,
  metadata = {},
  statutAvant = null,
  statutApres = null,
  workflow = null,
  isSystem = false,
}) {
  // Validation des paramètres obligatoires
  if (!type) {
    throw new Error('Le type d\'activité est obligatoire.');
  }
  if (!cibleType) {
    throw new Error('Le type de cible (cibleType) est obligatoire.');
  }
  if (!cibleId) {
    throw new Error('L\'ID de la cible (cibleId) est obligatoire.');
  }

  // Si acteur est null et isSystem=false, forcer isSystem=true (marki)
  if (!acteur && !isSystem) {
    isSystem = true;
  }

  // Créer l'activité
  const Activite = Parse.Object.extend('Activite');
  const activite = new Activite();

  // Remplir les champs
  activite.set('type', type);
  activite.set('acteur', acteur);
  activite.set('cibleType', cibleType);
  activite.set('cibleId', cibleId);
  activite.set('metadata', metadata);
  activite.set('isSystem', isSystem);

  if (statutAvant) activite.set('statutAvant', statutAvant);
  if (statutApres) activite.set('statutApres', statutApres);
  if (workflow) activite.set('workflow', workflow);

  try {
    // Sauvegarder l'activité
    const savedActivite = await activite.save(null, { useMasterKey: true });
    
    // Logger le checkpoint de succès
    console.log(`[CHECKPOINT] activite-created { 
      type: "${type}", 
      cibleType: "${cibleType}", 
      cibleId: "${cibleId}", 
      workflow: "${workflow || 'N/A'}",
      isSystem: ${isSystem},
      activiteId: "${savedActivite.id}"
    }`);
    
    return savedActivite;
    
  } catch (error) {
    // Logger le checkpoint d'erreur
    console.error(`[CHECKPOINT] activite-failed { 
      type: "${type}", 
      cibleType: "${cibleType}", 
      cibleId: "${cibleId}",
      workflow: "${workflow || 'N/A'}",
      error: "${error.message}"
    }`);
    
    // Ne pas throw l'erreur pour ne pas bloquer le workflow appelant
    // (sauf si l'erreur est critique, ex: problème de connexion à Parse)
    if (error.code !== 100 && error.code !== 209) { // Erreurs réseau Parse
      throw error;
    }
    
    return null;
  }
}

module.exports = { logActivite };
```

---

## **📌 Utilisation**

### **1. Activité Système (`marki`)**
```javascript
// Dans un workflow backend
const { logActivite } = require('../../utils/logActivite');

await logActivite({
  type: 'récupération_facture',
  acteur: null, // marki
  cibleType: 'Facture',
  cibleId: facture.id,
  metadata: { numFacture: facture.get('numFacture'), source: 'CSV' },
  workflow: 'import-invoice',
  isSystem: true,
});
```

### **2. Activité Utilisateur**
```javascript
// Dans une Cloud Function ou le frontend
const { logActivite } = require('../../utils/logActivite');

await logActivite({
  type: 'ajout_note',
  acteur: Parse.User.currentUser, // Pointer<Contact>
  cibleType: 'Facture',
  cibleId: facture.id,
  metadata: { note: "À vérifier avec le client" },
  isSystem: false,
});
```

### **3. Batch Save (Gros Volume)**
```javascript
// Dans un workflow qui traite plusieurs cibles
const { logActivite } = require('../../utils/logActivite');

const activites = factures.map(facture => {
  return logActivite({
    type: 'régénération_relances',
    acteur: null, // marki
    cibleType: 'Facture',
    cibleId: facture.id,
    metadata: { payeurId: payeur.id },
    workflow: 'regenerate-relances-contact',
    isSystem: true,
  });
});

// Sauvegarde en batch (50 par 50)
const batchSize = 50;
for (let i = 0; i < activites.length; i += batchSize) {
  const batch = activites.slice(i, i + batchSize);
  await Promise.all(batch);
}
```

---

## **🔍 Checkpoints Émis**

| Checkpoint | Description | Quand ? |
|------------|-------------|--------|
| `[CHECKPOINT] activite-created` | Une activité est enregistrée avec succès. | Après `activite.save()`. |
| `[CHECKPOINT] activite-failed` | Échec de l'enregistrement d'une activité. | En cas d'erreur lors de `activite.save()`. |

---

## **⚡ Optimisations**

### **1. Batch Save**
Pour les gros volumes, utiliser `Parse.Object.saveAll()` :
```javascript
const activites = [];
for (const facture of factures) {
  const activite = new Activite();
  activite.set('type', 'régénération_relances');
  activite.set('acteur', null);
  activite.set('cibleType', 'Facture');
  activite.set('cibleId', facture.id);
  activite.set('metadata', { payeurId: payeur.id });
  activite.set('workflow', 'regenerate-relances-contact');
  activite.set('isSystem', true);
  activites.push(activite);
}

// Sauvegarde en batch
if (activites.length > 0) {
  await Parse.Object.saveAll(activites, { useMasterKey: true });
  console.log(`[CHECKPOINT] activite-batch-created { count: ${activites.length} }`);
}
```

### **2. Désactiver en Mode Test**
Ajouter une option pour désactiver le logging en mode test :
```javascript
async function logActivite(params) {
  if (process.env.NODE_ENV === 'test' || process.env.DISABLE_ACTIVITE_LOGGING === 'true') {
    return null; // Ne pas logger en test
  }
  // ... reste du code
}
```

---

## **⚠️ Gestion des Erreurs**

### **1. Ne Pas Bloquer les Workflows**
- Si `logActivite` échoue, **ne pas bloquer** le workflow appelant (sauf erreur critique).
- Logger l'erreur et continuer l'exécution.

### **2. Erreurs Critiques**
Les erreurs suivantes sont considérées comme critiques et peuvent bloquer le workflow :
- Erreur de connexion à Parse (`code: 100` ou `209`).
- Erreur de validation des paramètres (ex: `type` manquant).

### **3. Exemple de Gestion d'Erreur**
```javascript
try {
  await logActivite({ type: 'récupération_facture', ... });
} catch (error) {
  console.error(`[ERROR] logActivite-failed: ${error.message}`);
  // Ne pas throw, sauf si critique
  if (error.message.includes('obligatoire')) {
    throw error; // Bloquer si paramètre manquant
  }
}
```

---

## **📂 Fichiers Associés**
- `backend/cloud/workflows/*/00-master.js` (tous les workflows qui utilisent `logActivite`).
- `specs/F-013-système-activités.md` (spécification complète).
- `specs/_app/backend/models/Activite.md` (modèle de la table).

---

## **🔗 Voir aussi**
- [F-013 : Système d'Activités](../../../F-013-système-activités.md) (spécification complète).
- [Modèle Activite](../../models/Activite.md) (définition de la table).
- [Workflow import-invoice](../workflows/import-invoice/00-master.md) (exemple d'intégration).
- [Workflow regenerate-relances-contact](../workflows/regenerate-relances-contact/00-master.md) (exemple d'intégration).