# F-001 : Import de données

**Personas** : Analyste financier  
**Contexte** : L'analyste doit pouvoir charger des fichiers de factures pour les analyser dans l'application.

## User Stories

### US-001-1
En tant qu'analyste financier  
Je veux uploader un fichier CSV ou Excel contenant les factures  
Afin d'alimenter la base de données pour analyse.

### US-001-2
En tant qu'analyste financier  
Je veux voir un aperçu des données importées avant validation  
Afin de vérifier que le mapping des colonnes est correct.

### US-001-3
En tant qu'analyste financier  
Je veux être notifié des erreurs de format ou de données manquantes  
Afin de corriger mon fichier source.

## Critères d'acceptation

- Un bouton "Importer" est visible sur la page d'accueil
- Le système accepte les formats .csv, .xlsx, .xls
- Un modal d'aperçu affiche les 10 premières lignes avec mapping des colonnes
- Un log `[CHECKPOINT] import-started` est émis au début du traitement
- Un log `[CHECKPOINT] import-success` est émis avec le nombre de lignes importées
- Un log `[CHECKPOINT] import-error` est émis en cas d'erreur avec le détail
- Un toast de succès s'affiche avec le nombre de factures importées
- Un message d'erreur clair s'affiche si le format est invalide

---

## **🔄 Système d'Activités (Parse Server)**
**Nouveau** : Chaque action d'import est tracée dans la table `Activite` pour un suivi complet.

### **Activités Loggées**

| Type | Acteur | Cible | Workflow | Description |
|------|--------|-------|----------|-------------|
| `récupération_facture` | `marki` | `Facture` | `import-invoice` | Une facture est importée depuis un fichier externe. |
| `mise_à_jour_facture` | `marki` | `Facture` | `import-invoice` | Une facture existante est mise à jour. |

### **Exemple de Log**
```javascript
// Dans le workflow `import-invoice`
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

### **Checkpoints Associés**
- `[CHECKPOINT] import-started` → Début de l'import.
- `[CHECKPOINT] import-success` → Import réussi (nombre de lignes).
- `[CHECKPOINT] import-error` → Erreur d'import (détail).
- **Nouveau** : `[CHECKPOINT] activite-created` → Une activité est enregistrée dans `Activite`.

---

## **📌 Intégration avec le Système d'Activités**
- **Où ?** : Dans `backend/cloud/workflows/import-invoice/00-master.js`.
- **Quand ?** : Après chaque import ou mise à jour de facture.
- **Pourquoi ?** : Traçabilité complète des imports pour audit et analyse.

---

## **🔗 Voir aussi**
- [F-013 : Système d'Activités](../F-013-système-activités.md) (spécification complète)