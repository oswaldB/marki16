# F-011 : Configuration des Séquences de Relances

**Personas** : Responsable commercial, Administrateur  
**Contexte** : Les entreprises doivent pouvoir configurer leurs propres séquences de relances (J+15, J+30, J+45) avec des templates d'emails personnalisés pour chaque niveau.

## User Stories

### US-011-1
En tant que responsable commercial  
Je veux créer une nouvelle séquence de relances  
Afin d'ajouter un niveau de relance supplémentaire.

### US-011-2
En tant que responsable commercial  
Je veux définir le délai (en jours) d'une séquence  
Afin de contrôler quand la relance sera générée.

### US-011-3
En tant que responsable commercial  
Je veux personnaliser le template d'email pour chaque séquence  
Afin d'adapter le ton selon l'ancienneté de l'impayé.

### US-011-4
En tant que responsable commercial  
Je veux activer/désactiver une séquence  
Afin de suspendre temporairement un niveau de relance.

### US-011-5
En tant que responsable commercial  
Je veux voir la liste de toutes les séquences configurées  
Afin d'avoir une vue d'ensemble de ma politique de recouvrement.

### US-011-6
En tant que responsable commercial  
Je veux réorganiser l'ordre des séquences  
Afin de modifier la progression des niveaux de relance.

## Critères d'acceptation

- Une page "Configuration > Séquences de relances" est accessible
- Le formulaire de création inclut : nom, type, niveau, délai en jours, templates
- Les templates supportent les variables ({{contact_nom}}, {{montant_total}}, etc.)
- Un éditeur WYSIWYG est disponible pour le template de corps
- Les séquences peuvent être activées/désactivées individuellement
- Un aperçu du rendu email est disponible avant sauvegarde
- Un log `[CHECKPOINT] sequence-created` est émis à la création
- Un log `[CHECKPOINT] sequence-updated` est émis à la modification
- Un log `[CHECKPOINT] sequence-deleted` est émis à la suppression

---

## **🔄 Système d'Activités (Parse Server)**
**Nouveau** : Chaque action de configuration de séquence est tracée dans la table `Activite`.

### **Activités Loggées**

| Type | Acteur | Cible | Workflow | Description |
|------|--------|-------|----------|-------------|
| `création_séquence` | `user_id` | `SéquenceRelance` | - | Création d'une nouvelle séquence de relances. |
| `mise_à_jour_séquence` | `user_id` | `SéquenceRelance` | - | Mise à jour d'une séquence existante. |
| `suppression_séquence` | `user_id` | `SéquenceRelance` | - | Suppression d'une séquence. |
| `activation_séquence` | `user_id` | `SéquenceRelance` | - | Activation ou désactivation d'une séquence. |

### **Exemple de Log**
```javascript
// Après création d'une séquence
const { logActivite } = require('../../utils/logActivite');

await logActivite({
  type: 'création_séquence',
  acteur: Parse.User.currentUser,
  cibleType: 'SéquenceRelance',
  cibleId: sequence.id,
  metadata: {
    nom: sequence.get('nom'),
    type: sequence.get('type'),
    niveau: sequence.get('niveau'),
    delaiJours: sequence.get('delaiJours'),
    estActive: sequence.get('estActive')
  },
  workflow: 'configuration-séquences',
  isSystem: false,
});

// Après mise à jour d'une séquence
await logActivite({
  type: 'mise_à_jour_séquence',
  acteur: Parse.User.currentUser,
  cibleType: 'SéquenceRelance',
  cibleId: sequence.id,
  metadata: {
    champsModifiés: ['templateSujet', 'templateCorps'],
    ancienDelai: ancienDelai,
    nouveauDelai: sequence.get('delaiJours')
  },
  workflow: 'configuration-séquences',
  isSystem: false,
});

// Après suppression d'une séquence
await logActivite({
  type: 'suppression_séquence',
  acteur: Parse.User.currentUser,
  cibleType: 'SéquenceRelance',
  cibleId: sequenceId,
  metadata: {
    nom: sequenceNom,
    niveau: sequenceNiveau
  },
  workflow: 'configuration-séquences',
  isSystem: false,
});
```

### **Checkpoints Associés**
- `[CHECKPOINT] sequence-created` → Séquence créée.
- `[CHECKPOINT] sequence-updated` → Séquence mise à jour.
- `[CHECKPOINT] sequence-deleted` → Séquence supprimée.
- **Nouveau** : `[CHECKPOINT] activite-created` → Une activité est enregistrée dans `Activite`.

---

## **📌 Intégration avec le Système d'Activités**
- **Où ?** : Dans les fonctions de gestion des séquences (création, mise à jour, suppression).
- **Quand ?** : Après chaque modification d'une séquence.
- **Pourquoi ?** : Traçabilité des configurations pour audit et historique des changements.

---

## **🔗 Voir aussi**
- [F-013 : Système d'Activités](../F-013-système-activités.md) (spécification complète)