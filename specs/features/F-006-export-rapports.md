# F-006 : Export rapports

**Personas** : Analyste financier, Responsable commercial  
**Contexte** : Les utilisateurs doivent pouvoir exporter les analyses au format PDF ou Excel.

## User Stories

### US-006-1
En tant qu'analyste financier  
Je veux exporter le tableau de bord au format PDF  
Afin de l'insérer dans un rapport de direction.

### US-006-2
En tant qu'analyste financier  
Je veux exporter la liste des factures filtrées au format Excel  
Afin de faire des analyses complémentaires.

### US-006-3
En tant que responsable commercial  
Je veux exporter la liste des clients à risque  
Afin de la partager avec l'équipe recouvrement.

## Critères d'acceptation

- Un bouton "Exporter" est présent sur chaque écran avec données
- Le format PDF génère un rapport formaté avec logo et date
- Le format Excel contient les données brutes avec filtres activables
- Un modal permet de choisir le format et le nom du fichier
- Le fichier se télécharge automatiquement après génération
- Un log `[CHECKPOINT] export-started` est émis avec le format choisi
- Un log `[CHECKPOINT] export-success` est émis avec la taille du fichier
- Un toast confirme la réussite de l'export

---

## **🔄 Système d'Activités (Parse Server)**
**Nouveau** : Chaque action d'export est tracée dans la table `Activite`.

### **Activités Loggées**

| Type | Acteur | Cible | Workflow | Description |
|------|--------|-------|----------|-------------|
| `préparation_export` | `user_id` | `Export` | `preparer-export` | Préparation des données pour export. |
| `génération_pdf` | `marki` ou `user_id` | `Export` | `generer-pdf` | Génération d'un rapport PDF. |
| `génération_excel` | `marki` ou `user_id` | `Export` | `generer-excel` | Génération d'un fichier Excel. |
| `téléchargement_export` | `user_id` | `Export` | `telecharger` | Téléchargement du fichier généré. |

### **Exemple de Log**
```javascript
// Dans le workflow `preparer-export`
const { logActivite } = require('../../utils/logActivite');

// Après préparation des données
await logActivite({
  type: 'préparation_export',
  acteur: Parse.User.currentUser,
  cibleType: 'Export',
  cibleId: exportId,
  metadata: {
    format: 'pdf',
    écranSource: 'dashboard',
    nombreLignes: 156,
    filtres: { période: 'mois', statut: 'impayée' }
  },
  workflow: 'preparer-export',
  isSystem: false,
});

// Dans le workflow `generer-pdf`
await logActivite({
  type: 'génération_pdf',
  acteur: null, // marki (si backend) ou user_id (si frontend)
  cibleType: 'Export',
  cibleId: exportId,
  metadata: {
    tailleFichier: 1024, // en Ko
    pages: 3,
    nomFichier: 'rapport-impayés-juin-2026.pdf'
  },
  workflow: 'generer-pdf',
  isSystem: true,
});

// Dans le workflow `telecharger`
await logActivite({
  type: 'téléchargement_export',
  acteur: Parse.User.currentUser,
  cibleType: 'Export',
  cibleId: exportId,
  metadata: {
    nomFichier: 'rapport-impayés-juin-2026.pdf',
    tailleFichier: 1024
  },
  workflow: 'telecharger',
  isSystem: false,
});
```

### **Checkpoints Associés**
- `[CHECKPOINT] export-started` → Début de l'export.
- `[CHECKPOINT] export-success` → Export réussi.
- `[CHECKPOINT] export-downloaded` → Fichier téléchargé.
- **Nouveau** : `[CHECKPOINT] activite-created` → Une activité est enregistrée dans `Activite`.

---

## **📌 Intégration avec le Système d'Activités**
- **Où ?** : Dans `backend/cloud/workflows/preparer-export/00-master.js`, `generer-pdf/00-master.js`, etc.
- **Quand ?** : Après chaque étape de l'export (préparation, génération, téléchargement).
- **Pourquoi ?** : Traçabilité des exports pour audit et analyse des usages.

---

## **🔗 Voir aussi**
- [F-013 : Système d'Activités](../F-013-système-activités.md) (spécification complète)