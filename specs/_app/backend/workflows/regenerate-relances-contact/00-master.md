# Workflow Backend: regenerate-relances-contact - Intégration du Système d'Activités

**Feature** : F-008 (Blacklist des Impayés)  
**Fichier** : `backend/cloud/workflows/regenerate-relances-contact/00-master.js`  
**Statut** : Mis à jour avec le système d'activités  
**Date** : 2026-07-06

---

## **🔄 Intégration du Système d'Activités**

### **Activités Loggées dans ce Workflow**

| Type | Acteur | Cible | Workflow | Description | Quand ? |
|------|--------|-------|----------|-------------|--------|
| `régénération_relances` | `marki` | `Facture` | `regenerate-relances-contact` | Régénération des relances pour une facture. | Après chaque régénération pour une facture. |
| `régénération_relances_payeur` | `marki` | `Payeur` | `regenerate-relances-contact` | Régénération des relances pour un payeur (action globale). | Après régénération pour un payeur. |
| `suppression_brouillons` | `marki` | `Relance` | `regenerate-relances-contact` | Suppression des brouillons de relances avant régénération. | Après suppression des brouillons. |

---

## **📌 Contexte**
Ce workflow est déclenché **automatiquement** lors d'un **blacklist/unblacklist** d'un impayé (via `F-008`) pour :
1. Supprimer les relances **non envoyées** (brouillons) pour le contact concerné.
2. Régénérer les relances pour ce contact **en excluant** l'impayé blacklisté (ou en l'incluant si déblacklisté).

---

## **📌 Modifications à Apporter**

### **1. Ajouter le Helper `logActivite`**
Dans `backend/cloud/workflows/regenerate-relances-contact/00-master.js`, ajouter en haut du fichier :
```javascript
const { logActivite } = require('../../utils/logActivite');
```

---

### **2. Logger les Activités dans la Fonction Principale**

#### **Dans la fonction `regenerateRelancesForContact`**
```javascript
Parse.Cloud.define("regenerateRelancesForContact", async (request) => {
  const { contactId, reason, excludeImpayeId } = request.params;
  
  try {
    // 1. Supprimer les relances non envoyées (brouillons) pour ce contact
    const Relance = Parse.Object.extend("Relance");
    const query = new Parse.Query(Relance);
    query.equalTo("contact", { __type: "Pointer", className: "Contact", objectId: contactId });
    query.doesNotExist("dateEnvoi"); // Non envoyées
    query.notEqualTo("statut", "envoyee");
    
    const brouillons = await query.find({ useMasterKey: true });
    
    if (brouillons.length > 0) {
      await Parse.Object.destroyAll(brouillons, { useMasterKey: true });
      
      // Logger la suppression des brouillons
      await logActivite({
        type: 'suppression_brouillons',
        acteur: null, // marki
        cibleType: 'Relance',
        cibleId: 'batch_' + Date.now(),
        metadata: {
          contactId: contactId,
          nombreBrouillons: brouillons.length,
          reason: reason || 'blacklist_change'
        },
        workflow: 'regenerate-relances-contact',
        isSystem: true,
      });
    }
    
    // 2. Si unblacklist (pas d'exclusion), relancer generate-relances pour ce contact seul
    if (!excludeImpayeId) {
      // Appeler le workflow de génération pour ce contact spécifique
      const result = await Parse.Cloud.run("generateRelancesForContact", { contactId });
      
      // Logger la régénération pour le payeur
      await logActivite({
        type: 'régénération_relances_payeur',
        acteur: null, // marki
        cibleType: 'Payeur',
        cibleId: contactId,
        metadata: {
          nombreRelances: result.count || 0,
          reason: reason || 'unblacklist'
        },
        workflow: 'regenerate-relances-contact',
        isSystem: true,
      });
    } else {
      // Si blacklist, régénérer en excluant l'impayé
      const result = await Parse.Cloud.run("generateRelancesForContact", { 
        contactId, 
        excludeImpayeId 
      });
      
      // Logger la régénération pour chaque facture du payeur (sauf l'exclue)
      const Impaye = Parse.Object.extend('Impaye');
      const impayeQuery = new Parse.Query(Impaye);
      impayeQuery.equalTo('payeur', { __type: 'Pointer', className: 'Contact', objectId: contactId });
      impayeQuery.notEqualTo('objectId', excludeImpayeId);
      const impayes = await impayeQuery.find({ useMasterKey: true });
      
      for (const impaye of impayes) {
        await logActivite({
          type: 'régénération_relances',
          acteur: null, // marki
          cibleType: 'Facture',
          cibleId: impaye.id,
          metadata: {
            payeurId: contactId,
            payeurNom: impaye.get('payeur')?.get('nom'),
            reason: reason || 'blacklist'
          },
          workflow: 'regenerate-relances-contact',
          isSystem: true,
        });
      }
    }
    
    return { 
      success: true, 
      deletedCount: brouillons.length,
      regenerated: !excludeImpayeId
    };
    
  } catch (error) {
    console.error(`[ERROR] regenerate-relances-contact-failed: { error: ${error.message}, contactId: ${contactId} }`);
    throw error;
  }
});
```

---

## **🔍 Checkpoints Associés**

| Checkpoint | Description | Contexte |
|------------|-------------|----------|
| `[CHECKPOINT] regenerate-relances-started` | Début de la régénération. | Début de `regenerateRelancesForContact`. |
| `[CHECKPOINT] brouillons-deleted` | Brouillons supprimés. | Après suppression des brouillons. |
| `[CHECKPOINT] relances-regenerated` | Relances régénérées. | Après appel à `generateRelancesForContact`. |
| `[CHECKPOINT] activite-created` | **Nouveau** : Une activité est enregistrée. | Après chaque `logActivite()`. |
| `[ERROR] regenerate-relances-contact-failed` | Échec de la régénération. | En cas d'erreur. |

---

## **📌 Exemple de Log Complet**

```
[2026-07-06T15:30:00.000Z] [CHECKPOINT] regenerate-relances-started { contactId: "contact_123", reason: "blacklist" }
[2026-07-06T15:30:01.000Z] [CHECKPOINT] brouillons-deleted { contactId: "contact_123", count: 5 }
[2026-07-06T15:30:01.001Z] [CHECKPOINT] activite-created { type: "suppression_brouillons", cibleType: "Relance", cibleId: "batch_123456789", workflow: "regenerate-relances-contact" }
[2026-07-06T15:30:02.000Z] [CHECKPOINT] relances-regenerated { contactId: "contact_123", count: 3 }
[2026-07-06T15:30:02.001Z] [CHECKPOINT] activite-created { type: "régénération_relances", cibleType: "Facture", cibleId: "facture_456", workflow: "regenerate-relances-contact" }
[2026-07-06T15:30:02.002Z] [CHECKPOINT] activite-created { type: "régénération_relances", cibleType: "Facture", cibleId: "facture_789", workflow: "regenerate-relances-contact" }
[2026-07-06T15:30:02.003Z] [CHECKPOINT] activite-created { type: "régénération_relances", cibleType: "Facture", cibleId: "facture_101", workflow: "regenerate-relances-contact" }
```

---

## **🔗 Intégration avec F-008 (Blacklist des Impayés)**

### **Dans `F-008` (frontend ou Cloud Function)**
Quand un impayé est **blacklisté** ou **déblacklisté**, appeler ce workflow :
```javascript
// Après blacklist/unblacklist d'un impayé
const contactId = impaye.get('payeur')?.id || impaye.get('contact_relance')?.id;
if (contactId) {
  await Parse.Cloud.run('regenerateRelancesForContact', {
    contactId: contactId,
    reason: 'blacklist_change',
    excludeImpayeId: isBlacklisted ? impaye.id : null
  });
}
```

---

## **📌 Bonnes Pratiques**
1. **Toujours logger** : Chaque suppression de brouillon ou régénération doit être loggée.
2. **1 activité = 1 cible** : Pour les régénérations par facture, créer une activité **par facture** (même si le workflow est déclenché pour un payeur).
3. **Metadata complet** : Inclure `payeurId`, `reason`, et `nombreRelances` pour faciliter les requêtes.
4. **Gestion des erreurs** : Si une activité échoue, ne pas bloquer la régénération (logger l'erreur et continuer).

---

## **📂 Fichiers Associés**
- `backend/cloud/utils/logActivite.js` (helper central).
- `specs/F-013-système-activités.md` (spécification complète).
- `specs/features/F-008-blacklist-impayes.md` (feature associée).
- `specs/_app/backend/models/Activite.md` (modèle de la table).

---

## **🔗 Voir aussi**
- [F-013 : Système d'Activités](../../../F-013-système-activités.md) (spécification complète).
- [Modèle Activite](../../models/Activite.md) (définition de la table).
- [F-008 : Blacklist des impayés](../../../features/F-008-blacklist-impayes.md) (feature associée).
- [Workflow generate-relances](../generate-relances/00-master.md) (workflow appelé).