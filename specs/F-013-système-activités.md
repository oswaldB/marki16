# F-013 : Système d'Activités

**Personas** : Développeur, Responsable technique, Auditeur  
**Contexte** : Centraliser toutes les actions (système et utilisateurs) dans une table `Activite` pour une traçabilité complète des workflows et une analyse fine des événements.  
**Statut** : Validé  
**Date** : 2026-07-06

---

## **🎯 Objectifs**
- **Traçabilité** : Savoir qui a fait quoi, quand, et sur quelle cible.
- **Audit** : Reconstruire l'historique d'une facture, d'un payeur, ou d'un utilisateur.
- **Analyse** : Identifier les goulots d'étranglement ou les erreurs récurrentes.
- **Intégration** : Ajout minimal dans les workflows existants.

---

## **📊 Modèle de Données**

### **Table `Activite` (Parse Server)**

| Champ | Type | Obligatoire | Description | Exemple |
|-------|------|-------------|-------------|---------|
| `type` | String | ✅ | Type d'activité (énumération). | `"récupération_facture"` |
| `acteur` | Pointer\<Contact\> | ❌ | Qui a déclenché l'activité. Si vide + `isSystem=true` → `marki`. | `Pointer("Contact", "user_123")` |
| `cibleType` | String | ✅ | Type de la cible (ex: `Facture`, `Payeur`, `Relance`). | `"Facture"` |
| `cibleId` | String | ✅ | ID de la cible. | `"facture_456"` |
| `metadata` | Object | ❌ | Données supplémentaires. | `{ numFacture: "FACT-2026-001", montant: 1500 }` |
| `statutAvant` | String | ❌ | Statut avant l'activité (optionnel). | `"en_attente"` |
| `statutApres` | String | ❌ | Statut après l'activité (optionnel). | `"payée"` |
| `workflow` | String | ❌ | Workflow associé. | `"import-invoice"` |
| `isSystem` | Boolean | ✅ | `true` si déclenché par le système (`marki`). | `true` |
| `createdAt` | DateTime | ✅ | Date/heure de création (automatique). | `"2026-07-06T14:30:00Z"` |

---

## **📌 Types d'Activités**

| Type | Description | Acteur Typique | Cible |
|------|-------------|----------------|-------|
| `récupération_facture` | Import d'une facture depuis une source externe. | `marki` | `Facture` |
| `mise_à_jour_facture` | Mise à jour d'une facture existante. | `marki` | `Facture` |
| `passage_à_échue` | Une facture passe au statut "échue". | `marki` | `Facture` |
| `ajout_note` | Un utilisateur ajoute une note sur une facture. | `user_id` | `Facture` |
| `règlement_facture` | Une facture est marquée comme réglée. | `marki` ou `user_id` | `Facture` |
| `régénération_relances` | Régénération des relances pour un payeur. | `marki` | `Payeur` ou `Facture` |
| `envoi_relance` | Envoi d'une relance par email. | `marki` | `Relance` |
| `envoi_suivi` | Envoi d'un suivi par email. | `marki` | `Suivi` |
| `nettoyage_relances` | Nettoyage des relances obsolètes. | `marki` | `Relance` |
| `mise_à_jour_contact` | Mise à jour des infos d'un contact. | `user_id` | `Contact` |
| `blacklist_impaye` | Un impayé est blacklisté. | `user_id` | `Impaye` |
| `unblacklist_impaye` | Un impayé est retiré de la blacklist. | `user_id` | `Impaye` |

---

## **🔄 Règles de Gestion des Cibles Multiples**
- **1 activité = 1 cible** : Chaque ligne dans `Activite` ne concerne qu'une seule cible.
- **Duplication autorisée** : Si une action concerne N cibles (ex: régénération de relances pour 10 factures), on crée **N lignes** dans `Activite` (une par cible).
- **Metadata pour le contexte** : Utiliser `metadata` pour stocker des infos communes (ex: `payeurId` pour lier les factures à un payeur).
- **Batch save** : Pour les gros volumes, utiliser `Parse.Object.saveAll()` pour optimiser les performances.

---

## **🔧 Intégration dans les Workflows Existants**

### **1. Helper `logActivite`**
Un utilitaire centralisé pour logger les activités :

```javascript
// backend/cloud/utils/logActivite.js
const Parse = require('parse/node');

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
  const Activite = Parse.Object.extend('Activite');
  const activite = new Activite();

  activite.set('type', type);
  activite.set('acteur', acteur);
  activite.set('cibleType', cibleType);
  activite.set('cibleId', cibleId);
  activite.set('metadata', metadata);
  activite.set('isSystem', isSystem);

  if (statutAvant) activite.set('statutAvant', statutAvant);
  if (statutApres) activite.set('statutApres', statutApres);
  if (workflow) activite.set('workflow', workflow);

  await activite.save();
  console.log(`[CHECKPOINT] activite-created { type: ${type}, cibleType: ${cibleType}, cibleId: ${cibleId} }`);
}

module.exports = { logActivite };
```

---

### **2. `import-invoice` (00:00)**
**Activités** :
- `récupération_facture` pour chaque facture importée.
- `mise_à_jour_facture` si une facture existante est modifiée.

**Code** :
```javascript
const { logActivite } = require('../../utils/logActivite');

// Après import d'une facture
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

---

### **3. `verify-paid-invoices` (toutes les heures à xx:50)**
**Activités** :
- `passage_à_échue` si une facture devient échue.
- `règlement_facture` si une facture est marquée comme payée.

**Code** :
```javascript
if (facture.get('statut') === 'payée' && ancienStatut !== 'payée') {
  await logActivite({
    type: 'règlement_facture',
    acteur: null, // marki
    cibleType: 'Facture',
    cibleId: facture.id,
    metadata: { montant: facture.get('montant'), méthode: 'virement' },
    statutAvant: ancienStatut,
    statutApres: 'payée',
    workflow: 'verify-paid-invoices',
    isSystem: true,
  });
}
```

---

### **4. `regenerate-relances-contact`**
**Activités** :
- `régénération_relances` pour chaque facture concernée.

**Code** :
```javascript
const { logActivite } = require('../../utils/logActivite');

const activites = factures.map(facture => {
  return logActivite({
    type: 'régénération_relances',
    acteur: null, // marki
    cibleType: 'Facture',
    cibleId: facture.id,
    metadata: { payeurId: payeur.id, payeurNom: payeur.get('nom') },
    workflow: 'regenerate-relances-contact',
    isSystem: true,
  });
});

// Sauvegarde en batch
await Promise.all(activites);
```

---

### **5. `send-emails` (19:00) et `send-suivi` (19:30)**
**Activités** :
- `envoi_relance` ou `envoi_suivi` pour chaque email envoyé.

**Code** :
```javascript
await logActivite({
  type: 'envoi_relance',
  acteur: null, // marki
  cibleType: 'Relance',
  cibleId: relance.id,
  metadata: { email: relance.get('email'), sujet: relance.get('sujet') },
  workflow: 'send-emails',
  isSystem: true,
});
```

---

### **6. Actions Utilisateurs (Frontend)**
**Exemple : Ajout d'une note sur une facture** :
```javascript
// Dans un Cloud Function ou directement dans le frontend
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

---

## **🔍 Requêtes Utiles**

### **1. Récupérer toutes les activités d'une facture**
```javascript
const query = new Parse.Query('Activite');
query.equalTo('cibleType', 'Facture');
query.equalTo('cibleId', 'facture_123');
query.descending('createdAt');
const activites = await query.find();
```

### **2. Récupérer les activités d'un utilisateur**
```javascript
const query = new Parse.Query('Activite');
query.equalTo('acteur', Parse.User.currentUser);
query.notEqualTo('isSystem', true);
query.greaterThan('createdAt', new Date('2026-07-01'));
const activites = await query.find();
```

### **3. Récupérer les activités système récentes**
```javascript
const query = new Parse.Query('Activite');
query.equalTo('isSystem', true);
query.greaterThan('createdAt', new Date('2026-07-05'));
query.limit(100);
const activites = await query.find();
```

### **4. Récupérer les activités par workflow**
```javascript
const query = new Parse.Query('Activite');
query.equalTo('workflow', 'import-invoice');
query.descending('createdAt');
const activites = await query.find();
```

---

## **📌 Checkpoints Associés**

| Checkpoint | Description | Contexte |
|------------|-------------|----------|
| `[CHECKPOINT] activite-created` | Une activité est enregistrée dans `Activite`. | Tous les workflows |
| `[CHECKPOINT] activite-failed` | Échec de l'enregistrement d'une activité. | Tous les workflows |

---

## **⚠️ Points d'Attention**

### **Performance**
- Éviter de logger des activités en boucle sans contrôle (ex: dans une boucle de 10 000 factures).
- Utiliser `Parse.Object.saveAll()` pour les batchs.

### **Sécurité**
- Vérifier que les `cibleId` existent bien avant de logger une activité.
- Limiter les droits d'écriture sur `Activite` aux rôles autorisés.

### **Maintenance**
- Prévoir un nettoyage périodique des anciennes activités (ex: supprimer les activités de +1 an).
- Archiver les données avant suppression si nécessaire.

---

## **🚀 Étapes d'Implémentation**

1. **Créer la classe `Activite`** dans Parse Server avec les champs décrits.
2. **Ajouter les index** sur `acteur`, `cibleType` + `cibleId`, `workflow`, et `createdAt`.
3. **Ajouter le helper `logActivite`** dans `backend/cloud/utils/`.
4. **Intégrer dans 1-2 workflows pilotes** (ex: `import-invoice` et `verify-paid-invoices`).
5. **Tester** l'enregistrement des activités et leur exploitation.
6. **Étendre à tous les workflows** et au frontend.

---

## **📂 Fichiers Impactés**
- `backend/cloud/utils/logActivite.js` (nouveau)
- `backend/cloud/workflows/*/00-master.js` (tous les workflows)
- `frontend/*` (actions utilisateurs)

---

## **🔗 Liens avec Autres Features**
- **F-001** : Import de données → `récupération_facture`
- **F-002** : Tableau de bord → `charger-kpis` (logs existants)
- **F-003** : Liste des factures → `charger-factures` (logs existants)
- **F-004** : Fiche client → `charger-client` (logs existants)
- **F-005** : Détection anomalies → `detecter-risques` (logs existants)
- **F-006** : Export rapports → `preparer-export` (logs existants)
- **F-007** : Relances email → `envoi_relance`
- **F-008** : Blacklist des impayés → `blacklist_impaye`, `unblacklist_impaye`
- **F-009** : Bouton enregistrer → `enregistrement_relance`
- **F-010** : Génération automatique → `régénération_relances`
- **F-011** : Configuration séquences → `mise_à_jour_séquence`
- **F-012** : Historique et suivi → `consultation_historique`

---

## **📝 Historique des Modifications**
| Date | Auteur | Modification |
|------|--------|--------------|
| 2026-07-06 | oswaldB | Création initiale de la spécification |
