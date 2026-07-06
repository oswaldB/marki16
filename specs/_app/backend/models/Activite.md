# Modèle: Activite (Parse)

**Classe** : `Activite`  
**Feature** : F-013 (Système d'Activités)  
**Statut** : Nouveau  
**Date** : 2026-07-06

---

## **📌 Description**
La classe `Activite` centralise **toutes les actions** (système et utilisateurs) pour une **traçabilité complète** des workflows, des modifications, et des événements dans l'application.

**Objectifs** :
- Savoir **qui** a fait **quoi**, **quand**, et sur **quelle cible**.
- Reconstruire l'historique d'une facture, d'un payeur, ou d'un utilisateur.
- Identifier les goulots d'étranglement ou les erreurs récurrentes.
- Faciliter l'audit et l'analyse des données.

---

## **📊 Champs**

### **Champs Principaux**

| Champ | Type | Obligatoire | Description | Exemple |
|-------|------|-------------|-------------|---------|
| `objectId` | String | ✅ | ID unique (géré par Parse). | `"a1B2c3D4e5F6"` |
| `type` | String | ✅ | Type d'activité (énumération). | `"récupération_facture"` |
| `acteur` | Pointer\<Contact\> | ❌ | Qui a déclenché l'activité. **Si vide + `isSystem=true` → `marki`**. | `Pointer("Contact", "user_123")` |
| `cibleType` | String | ✅ | Type de la cible (ex: `Facture`, `Payeur`, `Relance`, `Impaye`, `Client`, `Dashboard`, `Export`). | `"Facture"` |
| `cibleId` | String | ✅ | ID de la cible (ex: `objectId` d'une `Facture`). | `"facture_456"` |
| `metadata` | Object | ❌ | Données supplémentaires (flexible). | `{ numFacture: "FACT-2026-001", montant: 1500 }` |
| `statutAvant` | String | ❌ | Statut avant l'activité (optionnel). | `"en_attente"` |
| `statutApres` | String | ❌ | Statut après l'activité (optionnel). | `"payée"` |
| `workflow` | String | ❌ | Workflow associé (ex: `import-invoice`, `send-emails`). | `"verify-paid-invoices"` |
| `isSystem` | Boolean | ✅ | `true` si déclenché par le système (`marki`). | `true` |
| `createdAt` | DateTime | ✅ | Date/heure de création (automatique). | `"2026-07-06T14:30:00Z"` |

---

## **📌 Types d'Activités (Énumération)**

### **🔹 Activités Système (`isSystem: true`)**

| Type | Description | Workflow Associé | Cible Typique |
|------|-------------|------------------|---------------|
| `récupération_facture` | Import d'une facture depuis une source externe. | `import-invoice` | `Facture` |
| `mise_à_jour_facture` | Mise à jour d'une facture existante. | `import-invoice` | `Facture` |
| `passage_à_échue` | Une facture passe au statut "échue". | `verify-paid-invoices` | `Facture` |
| `règlement_facture` | Une facture est marquée comme réglée. | `verify-paid-invoices` | `Facture` |
| `génération_relances` | Génération automatique d'une relance pour un contact. | `generate-relances` | `Relance` |
| `exclusion_blacklistés` | Exclusion des impayés blacklistés lors de la génération. | `generate-relances` | `Relance` |
| `envoi_relance` | Envoi d'une relance par email. | `send-emails` | `Relance` |
| `envoi_suivi` | Envoi d'un suivi par email. | `send-suivi` | `Suivi` |
| `nettoyage_relances` | Nettoyage des relances obsolètes. | `cleanup-orphan-relances` | `Relance` |
| `chargement_kpis` | Chargement des KPIs du tableau de bord. | `charger-kpis` | `Dashboard` |
| `rafraîchissement_auto` | Rafraîchissement automatique des données. | `refresh-auto` | `Dashboard` |
| `chargement_top_débiteurs` | Chargement de la liste des top débiteurs. | `charger-top-debiteurs` | `Dashboard` |
| `chargement_graphique` | Chargement du graphique d'évolution. | `charger-graphique` | `Dashboard` |
| `détection_risques` | Détection automatique des clients à risque. | `detecter-risques` | `Alerte` |
| `préparation_export` | Préparation des données pour export. | `preparer-export` | `Export` |
| `génération_pdf` | Génération d'un rapport PDF. | `generer-pdf` | `Export` |
| `génération_excel` | Génération d'un fichier Excel. | `generer-excel` | `Export` |

### **🔹 Activités Utilisateur (`isSystem: false`)**

| Type | Description | Workflow Associé | Cible Typique |
|------|-------------|------------------|---------------|
| `ajout_note` | Un utilisateur ajoute une note sur une facture. | - | `Facture` |
| `mise_à_jour_contact` | Mise à jour des infos d'un contact. | - | `Contact` |
| `blacklist_impaye` | Un impayé est blacklisté. | `toggle-blacklist-impaye` | `Impaye` |
| `unblacklist_impaye` | Un impayé est retiré de la blacklist. | `toggle-blacklist-impaye` | `Impaye` |
| `régénération_relances_blacklist` | Régénération des relances après blacklist/unblacklist. | `regenerate-relances-contact` | `Impaye` |
| `préparation_relance` | Préparation d'un template de relance. | `preparer-template` | `Relance` |
| `édition_message` | Édition du message avant envoi. | `editer-message` | `Relance` |
| `enregistrement_relance` | Enregistrement des modifications d'une relance sans validation. | - | `Relance` |
| `création_séquence` | Création d'une nouvelle séquence de relances. | - | `SéquenceRelance` |
| `mise_à_jour_séquence` | Mise à jour d'une séquence existante. | - | `SéquenceRelance` |
| `suppression_séquence` | Suppression d'une séquence. | - | `SéquenceRelance` |
| `activation_séquence` | Activation ou désactivation d'une séquence. | - | `SéquenceRelance` |
| `consultation_historique` | Consultation de l'historique des relances. | - | `HistoriqueRelances` |
| `filtrage_historique` | Application de filtres sur l'historique. | - | `HistoriqueRelances` |
| `export_historique` | Export de l'historique (CSV/PDF). | - | `HistoriqueRelances` |
| `consultation_détail_relance` | Consultation du détail d'une relance. | - | `Relance` |
| `chargement_client` | Chargement des informations d'un client. | `charger-client` | `Client` |
| `chargement_historique` | Chargement de l'historique des factures d'un client. | `charger-historique` | `Client` |
| `calcul_score` | Calcul du score (A/B/C/D) pour un client. | `calculer-score` | `Client` |
| `affichage_solde` | Calcul et affichage du solde débiteur. | `afficher-solde` | `Client` |
| `consultation_fiche_client` | Consultation de la fiche client par un utilisateur. | - | `Client` |
| `chargement_factures` | Chargement initial de la liste des factures. | `charger-factures` | `ListeFactures` |
| `filtrage_factures` | Application d'un filtre (statut, date, etc.). | `filtrer-statut` | `ListeFactures` |
| `tri_factures` | Tri des factures par colonne. | `trier-colonnes` | `ListeFactures` |
| `recherche_factures` | Recherche textuelle sur les factures. | `rechercher` | `ListeFactures` |
| `pagination_factures` | Changement de page dans la liste. | `paginer` | `ListeFactures` |

---

## **🔄 Règles de Gestion**

### **1. 1 Activité = 1 Cible**
- Chaque ligne dans `Activite` ne concerne **qu'une seule cible**.
- Si une action concerne **N cibles** (ex: régénération de relances pour 10 factures), on crée **N lignes** dans `Activite` (une par cible).

### **2. Duplication Autorisée**
- La duplication est **autorisée** si nécessaire (ex: même action sur plusieurs cibles).

### **3. Metadata pour le Contexte**
- Utiliser `metadata` pour stocker des infos communes (ex: `payeurId` pour lier les factures à un payeur).

### **4. Batch Save pour les Gros Volumes**
- Pour les workflows massifs (ex: 1000 factures), utiliser `Parse.Object.saveAll()` pour optimiser les performances.

---

## **🔧 Exemples d'Utilisation**

### **1. Activité Système (`marki`)**
```javascript
// Dans le workflow `import-invoice`
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
// Dans le frontend, après ajout d'une note
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
// Dans le workflow `regenerate-relances-contact`
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

## **🔍 Requêtes Typiques**

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

### **5. Récupérer les activités par type**
```javascript
const query = new Parse.Query('Activite');
query.equalTo('type', 'règlement_facture');
query.descending('createdAt');
const activites = await query.find();
```

---

## **⚡ Indexes Recommandés**

Pour optimiser les requêtes, ajouter les index suivants dans Parse Dashboard :

| Champ | Type d'Index | Justification |
|-------|--------------|---------------|
| `acteur` | Index simple | Requêtes par utilisateur. |
| `cibleType` + `cibleId` | Index composé | Requêtes par cible (ex: toutes les activités d'une facture). |
| `workflow` | Index simple | Requêtes par workflow. |
| `type` | Index simple | Requêtes par type d'activité. |
| `createdAt` | Index simple | Requêtes temporelles (ex: activités récentes). |
| `isSystem` | Index simple | Filtrer les activités système/utilisateur. |

---

## **🔗 Hooks (Optionnels)**

### **Avant Sauvegarde**
```javascript
Parse.Cloud.beforeSave('Activite', (request) => {
  const activite = request.object;
  
  // Vérifier que cibleType et cibleId sont présents
  if (!activite.get('cibleType') || !activite.get('cibleId')) {
    throw new Error('cibleType et cibleId sont obligatoires');
  }
  
  // Vérifier que type est présent
  if (!activite.get('type')) {
    throw new Error('Le type d\'activité est obligatoire');
  }
  
  // Si acteur est vide et isSystem=false, forcer isSystem=true (marki)
  if (!activite.get('acteur') && !activite.get('isSystem')) {
    activite.set('isSystem', true);
  }
});
```

### **Après Sauvegarde**
```javascript
Parse.Cloud.afterSave('Activite', (request) => {
  const activite = request.object;
  console.log(`[CHECKPOINT] activite-created { type: ${activite.get('type')}, cibleType: ${activite.get('cibleType')}, cibleId: ${activite.get('cibleId')}, workflow: ${activite.get('workflow')} }`);
});
```

---

## **📌 Bonnes Pratiques**

1. **Toujours logger** : Chaque action importante doit être loggée dans `Activite`.
2. **Être précis** : Utiliser des `type` et `metadata` descriptifs pour faciliter les requêtes.
3. **Gérer les erreurs** : En cas d'échec de `logActivite()`, ne pas bloquer le workflow principal (sauf si critique).
4. **Nettoyer les anciennes activités** : Prévoir un script de nettoyage pour supprimer les activités de +1 an.

---

## **🔗 Relations avec Autres Modèles**

| Modèle | Relation | Description |
|--------|----------|-------------|
| `Contact` | Pointer (`acteur`) | L'utilisateur ou le contact qui a déclenché l'activité. |
| `Facture` | String (`cibleId`) | La facture concernée par l'activité. |
| `Impaye` | String (`cibleId`) | L'impayé concerné par l'activité. |
| `Relance` | String (`cibleId`) | La relance concernée par l'activité. |
| `SéquenceRelance` | String (`cibleId`) | La séquence concernée par l'activité. |

---

## **📂 Fichiers Associés**
- `backend/cloud/utils/logActivite.js` (helper central pour logger les activités).
- `backend/cloud/workflows/*/00-master.js` (intégration dans les workflows).
- `frontend/*` (intégration pour les actions utilisateurs).

---

## **🔗 Voir aussi**
- [F-013 : Système d'Activités](../../F-013-système-activités.md) (spécification complète).
- [F-001 : Import de données](../../features/F-001-import-donnees.md) (exemple d'intégration).
- [F-008 : Blacklist des impayés](../../features/F-008-blacklist-impayes.md) (exemple d'intégration).