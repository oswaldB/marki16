# Workflow Backend: import-invoice - Intégration du Système d'Activités

**Feature** : F-001 Import des données depuis DB externe  
**Fichier** : `backend/cloud/workflows/import-invoice/00-master.js`  
**Statut** : Mis à jour avec le système d'activités  
**Date** : 2026-07-06

---

## **🔄 Intégration du Système d'Activités**

### **Activités Loggées dans ce Workflow**

| Type | Acteur | Cible | Workflow | Description | Quand ? |
|------|--------|-------|----------|-------------|--------|
| `récupération_facture` | `marki` | `Facture` | `import-invoice` | Une facture est importée depuis un fichier externe. | Après chaque import de facture. |
| `mise_à_jour_facture` | `marki` | `Facture` | `import-invoice` | Une facture existante est mise à jour. | Après chaque mise à jour de facture. |
| `import_batch_completed` | `marki` | `ImportBatch` | `import-invoice` | Un batch d'import est terminé. | À la fin de l'import. |

---

## **📌 Modifications à Apporter**

### **1. Ajouter le Helper `logActivite`**
Dans `backend/cloud/workflows/import-invoice/00-master.js`, ajouter en haut du fichier :
```javascript
const { logActivite } = require('../../utils/logActivite');
```

---

### **2. Logger les Activités dans `processAndSaveImpayes`**

#### **Dans `prepareImpayeUpsert` (pour chaque facture)**
```javascript
function prepareImpayeUpsert(pieceRow, existingImpaye, statutsMap, employesMap, interlocuteurs) {
  const impaye = existingImpaye || new Impaye();
  
  // ... (logique existante)
  
  // Logger l'activité après préparation de l'impayé
  const activite = new Activite();
  activite.set('type', existingImpaye ? 'mise_à_jour_facture' : 'récupération_facture');
  activite.set('acteur', null); // marki
  activite.set('cibleType', 'Facture');
  activite.set('cibleId', String(pieceRow.nfacture));
  activite.set('metadata', {
    numFacture: pieceRow.nfacture,
    refPiece: pieceRow.refpiece,
    montant: pieceRow.resteapayer,
    source: 'DB_externe',
    isNew: !existingImpaye
  });
  activite.set('workflow', 'import-invoice');
  activite.set('isSystem', true);
  
  return { impaye, isNew: !existingImpaye, activite };
}
```

#### **Dans `processAndSaveImpayes` (après sauvegarde des activités)**
```javascript
// Après la sauvegarde des impayés et contacts
if (activitesToSave.length > 0) {
  await batchSave(activitesToSave, { useMasterKey: true }, 50);
  
  // Logger un checkpoint pour le batch
  console.log(`[CHECKPOINT] import_batch_completed { count: ${activitesToSave.length}, workflow: 'import-invoice' }`);
}
```

---

### **3. Exemple Complet de `processAndSaveImpayes` avec Activités**
```javascript
async function processAndSaveImpayes({ pieces, statutsMap, employesMap, interlocuteursByDossier, dryRun }) {
  const contactsToSave = [];
  const impayesToSave = [];
  const activitesToSave = [];

  for (const pieceRow of pieces) {
    const dossierId = pieceRow.idDossier || pieceRow.dossier_id;
    const interlocuteurs = interlocuteursByDossier[dossierId] || [];
    
    // Préparation des contacts
    const payeurData = interlocuteurs.find(i => i.role === "Payeur");
    const apporteurData = interlocuteurs.find(i => i.role === "Apporteur d'affaire");
    
    const payeurContact = prepareContactUpsert({
      externeId: payeurData?.idInterlocuteur,
      nom: payeurData?.nom,
      prenom: payeurData?.prenom,
      email: payeurData?.email,
      existingContact: existingContactsMap.get(String(payeurData?.idInterlocuteur))
    });
    if (payeurContact) contactsToSave.push(payeurContact);
    
    // Préparation de l'impayé et de l'activité
    const existingImpaye = await findExistingImpaye(pieceRow.nfacture);
    const { impaye, isNew, activite } = prepareImpayeUpsert({
      pieceRow,
      existingImpaye,
      statutsMap,
      employesMap,
      interlocuteurs
    });
    
    impayesToSave.push(impaye);
    if (activite) activitesToSave.push(activite);
  }

  // Sauvegarde par batch
  if (contactsToSave.length > 0) {
    await batchSave(contactsToSave, { useMasterKey: true }, 50);
  }
  
  if (impayesToSave.length > 0) {
    await batchSave(impayesToSave, { useMasterKey: true }, 50);
  }
  
  if (activitesToSave.length > 0 && !dryRun) {
    await batchSave(activitesToSave, { useMasterKey: true }, 50);
    console.log(`[CHECKPOINT] import_batch_completed { count: ${activitesToSave.length}, workflow: 'import-invoice' }`);
  }

  return {
    impayes_created: impayesToSave.filter(i => !i.id).length,
    impayes_updated: impayesToSave.filter(i => i.id).length,
    contacts_created: contactsToSave.filter(c => !c.id).length,
    contacts_updated: contactsToSave.filter(c => c.id).length,
    activites_created: activitesToSave.length,
    errors: []
  };
}
```

---

## **🔍 Checkpoints Associés**

| Checkpoint | Description | Contexte |
|------------|-------------|----------|
| `[CHECKPOINT] import-invoice-started` | Début de l'import. | Début de `importImpayes()`. |
| `[CHECKPOINT] fetch-pieces-completed` | Pièces et dossiers récupérés. | Fin de `fetchPiecesAndDossiers()`. |
| `[CHECKPOINT] fetch-statuts-completed` | Statuts récupérés. | Fin de `fetchStatutsDossier()`. |
| `[CHECKPOINT] fetch-employes-completed` | Employés récupérés. | Fin de `fetchEmployes()`. |
| `[CHECKPOINT] fetch-interlocuteurs-completed` | Interlocuteurs récupérés. | Fin de `fetchInterlocuteurs()`. |
| `[CHECKPOINT] process-impayes-completed` | Traitement des impayés terminé. | Fin de `processAndSaveImpayes()`. |
| `[CHECKPOINT] import-invoice-completed` | Import terminé avec succès. | Fin de `importImpayes()`. |
| `[CHECKPOINT] import_batch_completed` | **Nouveau** : Batch d'activités enregistré. | Après sauvegarde des activités. |
| `[CHECKPOINT] activite-created` | **Nouveau** : Une activité est enregistrée. | Après chaque `logActivite()`. |
| `[ERROR] import-invoice-failed` | Échec de l'import. | En cas d'erreur. |

---

## **📌 Exemple de Log Complet**

```
[2026-07-06T14:30:00.000Z] [CHECKPOINT] import-invoice-started { dryRun: false }
[2026-07-06T14:30:01.000Z] [CHECKPOINT] fetch-pieces-completed { count: 156 }
[2026-07-06T14:30:02.000Z] [CHECKPOINT] fetch-statuts-completed { count: 12 }
[2026-07-06T14:30:03.000Z] [CHECKPOINT] fetch-employes-completed { count: 45 }
[2026-07-06T14:30:04.000Z] [CHECKPOINT] fetch-interlocuteurs-completed { dossierCount: 89, totalInterlocuteurs: 234 }
[2026-07-06T14:30:05.000Z] [CHECKPOINT] activite-created { type: "récupération_facture", cibleType: "Facture", cibleId: "FACT-2026-001", workflow: "import-invoice" }
[2026-07-06T14:30:05.001Z] [CHECKPOINT] activite-created { type: "récupération_facture", cibleType: "Facture", cibleId: "FACT-2026-002", workflow: "import-invoice" }
...
[2026-07-06T14:30:10.000Z] [CHECKPOINT] import_batch_completed { count: 156, workflow: 'import-invoice' }
[2026-07-06T14:30:10.001Z] [CHECKPOINT] process-impayes-completed { impayes_created: 45, impayes_updated: 111, activites_created: 156 }
[2026-07-06T14:30:10.002Z] [CHECKPOINT] import-invoice-completed { duration: "10000ms", piecesProcessed: 156 }
```

---

## **🔗 Fichiers Associés**
- `backend/cloud/utils/logActivite.js` (helper central).
- `specs/F-013-système-activités.md` (spécification complète).
- `specs/features/F-001-import-donnees.md` (feature associée).

---

## **⚠️ Points d'Attention**
1. **Ordre de sauvegarde** : Toujours sauvegarder les `Activite` **après** les `Impaye` et `Contact` pour éviter les références manquantes.
2. **Batch Size** : Respecter la limite de **50 objets par batch** pour `Parse.Object.saveAll()`.
3. **Mode `dryRun`** : Ne pas sauvegarder les activités en mode `dryRun`.
4. **Gestion des erreurs** : Si une activité échoue à se sauvegarder, ne pas bloquer l'import complet (logger l'erreur et continuer).

---

## **📂 Structure des Fichiers**
```
backend/cloud/workflows/import-invoice/
├── 00-master.js                    # Mega-fonction orchestratrice (modifiée)
├── 01-fetchPiecesAndDossiers.js    # Étape 1: Pièces + Dossiers + Missions
├── 02-fetchStatutsDossier.js       # Étape 2: Statuts
├── 03-fetchEmployes.js             # Étape 3: Employés
├── 04-fetchInterlocuteurs.js       # Étape 4: Interlocuteurs
├── 05-processAndSaveImpayes.js     # Étape 5: Traitement BATCH (modifiée)
└── __tests__/
    └── import-invoice.test.js      # Tests unitaires
```

---

## **🔗 Voir aussi**
- [F-013 : Système d'Activités](../../../F-013-système-activités.md) (spécification complète).
- [Modèle Activite](../../models/Activite.md) (définition de la table).
- [F-001 : Import de données](../../../features/F-001-import-donnees.md) (feature associée).