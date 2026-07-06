# F-T-ERROR : Gestion d'erreurs

**Personas** : Tous les utilisateurs  
**Contexte** : L'application doit gérer gracieusement les erreurs et informer l'utilisateur.

## User Stories

### US-T-ERROR-1
En tant qu'utilisateur  
Je veux voir un message clair quand une erreur survient  
Afin de comprendre ce qui s'est passé.

### US-T-ERROR-2
En tant qu'utilisateur  
Je veux pouvoir réessayer une action qui a échoué  
Afin de ne pas perdre ma progression.

## Critères d'acceptation

- Une erreur API affiche un toast rouge avec message explicite
- Un bouton "Réessayer" est présent sur les écrans en erreur
- Les erreurs réseau sont détectées et un message "Hors ligne" s'affiche
- Un log `[ERROR]` est émis avec détails techniques

---

## **🔄 Système d'Activités (Parse Server)**
**Nouveau** : Les erreurs liées au système d'activités sont gérées et loggées de manière spécifique.

### **Erreurs Spécifiques aux Activités**
| Erreur | Description | Log Associé | Toast Utilisateur |
|-------|-------------|------------|------------------|
| `activite-creation-failed` | Échec de la création d'une activité dans Parse. | `[ERROR] activite-creation-failed: { error: "...", type: "...", cibleType: "...", cibleId: "..." }` | "Erreur lors de l'enregistrement de l'activité. Veuillez réessayer." |
| `activite-save-failed` | Échec de la sauvegarde d'une activité (ex: validation échouée). | `[ERROR] activite-save-failed: { error: "...", type: "..." }` | "Impossible d'enregistrer l'activité. Vérifiez les données." |
| `activite-batch-failed` | Échec de la sauvegarde en batch d'activités. | `[ERROR] activite-batch-failed: { count: 10, error: "..." }` | "Certaines activités n'ont pas pu être enregistrées." |

### **Exemple de Gestion d'Erreur**
```javascript
// Dans le helper logActivite.js
try {
  await activite.save();
  console.log(`[CHECKPOINT] activite-created { type: ${type}, cibleType: ${cibleType}, cibleId: ${cibleId} }`);
} catch (error) {
  console.error(`[ERROR] activite-creation-failed: { error: "${error.message}", type: "${type}", cibleType: "${cibleType}", cibleId: "${cibleId}" }`);
  throw new Error(`Échec de l'enregistrement de l'activité: ${error.message}`);
}
```

### **Exemple de Gestion d'Erreur en Batch**
```javascript
// Dans un workflow qui logge plusieurs activités
const { logActivite } = require('../../utils/logActivite');

try {
  const activites = factures.map(facture => {
    return logActivite({
      type: 'régénération_relances',
      acteur: null,
      cibleType: 'Facture',
      cibleId: facture.id,
      metadata: { payeurId: payeur.id },
      workflow: 'regenerate-relances-contact',
      isSystem: true,
    });
  });
  await Promise.all(activites);
} catch (error) {
  console.error(`[ERROR] activite-batch-failed: { count: ${factures.length}, error: "${error.message}" }`);
  // Réessayer ou notifier l'utilisateur
}
```

---

## **📌 Règles de Gestion des Erreurs pour le Système d'Activités**
1. **Ne pas bloquer les workflows** : Une erreur de logging ne doit pas bloquer l'exécution du workflow principal (sauf si critique).
2. **Logger les détails** : Toujours inclure `type`, `cibleType`, `cibleId`, et `error.message` dans les logs d'erreur.
3. **Notifier l'utilisateur** : Afficher un toast ou un message clair en cas d'erreur non récupérable.
4. **Réessayer si possible** : Proposer un bouton "Réessayer" pour les actions utilisateurs.

---

## **🔗 Exemples d'Erreurs par Feature**

### **F-001 : Import de données**
```
[ERROR] import-error: { message: "Format de fichier invalide" }
[ERROR] activite-creation-failed: { error: "Validation failed", type: "récupération_facture", cibleType: "Facture", cibleId: "facture_123" }
```

### **F-007 : Relances email**
```
[ERROR] relance-save-failed: { error: "SMTP connection timeout", relanceId: "relance_456" }
[ERROR] activite-creation-failed: { error: "Network error", type: "envoi_relance", cibleType: "Relance", cibleId: "relance_456" }
```

### **F-008 : Blacklist des impayés**
```
[ERROR] impaye-blacklist-failed: { error: "Permission denied", impayeId: "impaye_789" }
[ERROR] activite-creation-failed: { error: "Invalid pointer", type: "blacklist_impaye", cibleType: "Impaye", cibleId: "impaye_789" }
```

---

## **📂 Fichiers Concernés**
- `backend/cloud/utils/logActivite.js` (gestion des erreurs)
- `backend/cloud/workflows/*/00-master.js` (tous les workflows)
- `frontend/*` (affichage des toasts d'erreur)

---

## **🔗 Voir aussi**
- [F-013 : Système d'Activités](../F-013-système-activités.md) (spécification complète)
- [F-T-LOG : Observabilité / Logging](./F-T-LOG.md) (logs associés)