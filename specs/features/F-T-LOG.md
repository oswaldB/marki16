# F-T-LOG : Observabilité / Logging

**Personas** : Système (développeur)  
**Contexte** : L'application doit émettre des logs structurés pour faciliter le débogage et le monitoring.

## User Stories

### US-T-LOG-1
En tant que développeur  
Je veux que chaque action importante émette un log préfixé `[CHECKPOINT]`  
Afin de suivre le parcours utilisateur dans la console.

### US-T-LOG-2
En tant que développeur  
Je veux que les erreurs émettent un log `[ERROR]` avec stack trace  
Afin de diagnostiquer rapidement les problèmes.

## Critères d'acceptation

- Chaque workflow frontend émet au moins un `[CHECKPOINT]` à son démarrage et à sa fin
- Le format est : `[CHECKPOINT] <workflow-name>: <action>` ou `[ERROR] <context>: <message>`
- Les logs sont visibles dans la console du navigateur
- Les logs backend incluent un timestamp ISO

---

## **🔄 Système d'Activités (Parse Server)**
**Nouveau** : Les logs du système d'activités suivent les mêmes règles et ajoutent des checkpoints spécifiques.

### **Checkpoints pour les Activités**
| Checkpoint | Description | Contexte |
|------------|-------------|----------|
| `[CHECKPOINT] activite-created` | Une activité est enregistrée dans `Activite`. | Tous les workflows après `logActivite()`. |
| `[CHECKPOINT] activite-failed` | Échec de l'enregistrement d'une activité. | Gestion des erreurs dans `logActivite()`. |

### **Exemple de Log pour une Activité**
```javascript
// Dans le helper logActivite.js
console.log(`[CHECKPOINT] activite-created { type: ${type}, cibleType: ${cibleType}, cibleId: ${cibleId}, workflow: ${workflow} }`);

// En cas d'erreur
console.error(`[CHECKPOINT] activite-failed { type: ${type}, cibleType: ${cibleType}, cibleId: ${cibleId}, error: ${error.message} }`);
```

### **Format des Logs Backend**
Les logs backend pour les activités suivent ce format :
```
[2026-07-06T14:30:00.000Z] [CHECKPOINT] activite-created { type: "récupération_facture", cibleType: "Facture", cibleId: "facture_123", workflow: "import-invoice" }
[2026-07-06T14:30:01.000Z] [CHECKPOINT] activite-created { type: "envoi_relance", cibleType: "Relance", cibleId: "relance_456", workflow: "send-emails" }
```

---

## **📌 Règles de Logging pour le Système d'Activités**
1. **Toujours logger** : Chaque appel à `logActivite()` doit émettre un `[CHECKPOINT] activite-created` en cas de succès.
2. **Gérer les erreurs** : En cas d'échec, logger un `[CHECKPOINT] activite-failed` avec le détail de l'erreur.
3. **Inclure le contexte** : Les logs doivent inclure `type`, `cibleType`, `cibleId`, et `workflow` pour une traçabilité complète.
4. **Timestamp automatique** : Les logs backend incluent automatiquement un timestamp ISO.

---

## **🔗 Exemples de Logs par Feature**

### **F-001 : Import de données**
```
[CHECKPOINT] import-started
[CHECKPOINT] activite-created { type: "récupération_facture", cibleType: "Facture", cibleId: "facture_123" }
[CHECKPOINT] import-success { count: 10 }
```

### **F-002 : Tableau de bord**
```
[CHECKPOINT] dashboard-loaded
[CHECKPOINT] activite-created { type: "chargement_kpis", cibleType: "Dashboard", cibleId: "global" }
```

### **F-007 : Relances email**
```
[CHECKPOINT] relance-opened
[CHECKPOINT] activite-created { type: "préparation_relance", cibleType: "Relance", cibleId: "relance_456" }
[CHECKPOINT] relance-sent
[CHECKPOINT] activite-created { type: "envoi_relance", cibleType: "Relance", cibleId: "relance_456" }
```

### **F-008 : Blacklist des impayés**
```
[CHECKPOINT] impaye-blacklisted
[CHECKPOINT] activite-created { type: "blacklist_impaye", cibleType: "Impaye", cibleId: "impaye_789" }
[CHECKPOINT] relances-regenerated
[CHECKPOINT] activite-created { type: "régénération_relances_blacklist", cibleType: "Impaye", cibleId: "impaye_789" }
```

---

## **📂 Fichiers Concernés**
- `backend/cloud/utils/logActivite.js` (helper central)
- `backend/cloud/workflows/*/00-master.js` (tous les workflows)
- `frontend/*` (actions utilisateurs)

---

## **🔗 Voir aussi**
- [F-013 : Système d'Activités](../F-013-système-activités.md) (spécification complète)