# F-009 : Bouton Enregistrer - Vue Validation des Relances

**Personas** : Agent de recouvrement  
**Contexte** : Dans la vue validation des relances, l'agent peut modifier le contenu de l'email (corps, objet) avant validation. Actuellement, seul un bouton "Valider" existe, ce qui valide et sauvegarde en une seule action. L'agent a besoin de pouvoir sauvegarder ses modifications sans valider la relance, notamment pour reprendre plus tard ou faire une pause.

## User Stories

### US-009-1
En tant qu'agent de recouvrement  
Je veux enregistrer les modifications apportées à une relance sans la valider  
Afin de pouvoir reprendre la validation plus tard sans perdre mon travail.

### US-009-2
En tant qu'agent de recouvrement  
Je veux visualiser l'état de sauvegarde de la relance en cours d'édition  
Afin de savoir si mes modifications ont été enregistrées.

### US-009-3
En tant qu'agent de recouvrement  
Je veux recevoir une confirmation visuelle après l'enregistrement  
Afin d'être certain que mes modifications ont bien été sauvegardées.

## Critères d'acceptation

- Un bouton "Enregistrer" est présent dans la vue validation, à côté du bouton "Valider"
- Le bouton "Enregistrer" sauvegarde les modifications (objet, corps, cc) sans changer le statut `valide`
- Un log `[CHECKPOINT] relance-saved` est émis après enregistrement réussi
- Un log `[CHECKPOINT] relance-save-failed` est émis en cas d'erreur
- Un toast de confirmation s'affiche après l'enregistrement : "Modifications enregistrées"
- Le bouton "Enregistrer" passe en état `loading` pendant la sauvegarde
- Les modifications sont persistées dans Parse (champs `sujet`, `contenu`, `cc`)
- La relance reste dans la liste "À valider" après l'enregistrement
- L'éditeur ToastUI reste ouvert après l'enregistrement
- L'utilisateur peut continuer à modifier après l'enregistrement

---

## **🔄 Système d'Activités (Parse Server)**
**Nouveau** : Chaque action d'enregistrement de relance est tracée dans la table `Activite`.

### **Activités Loggées**

| Type | Acteur | Cible | Workflow | Description |
|------|--------|-------|----------|-------------|
| `enregistrement_relance` | `user_id` | `Relance` | - | Enregistrement des modifications d'une relance sans validation. |

### **Exemple de Log**
```javascript
// Dans la fonction `enregistrerRelance()` (frontend ou Cloud Function)
const { logActivite } = require('../../utils/logActivite');

// Après sauvegarde des modifications
await logActivite({
  type: 'enregistrement_relance',
  acteur: Parse.User.currentUser,
  cibleType: 'Relance',
  cibleId: relance.id,
  metadata: {
    champsModifiés: ['sujet', 'contenu', 'cc'],
    sujetAvant: relance.get('sujet'),
    sujetApres: nouveauSujet,
    tailleContenu: nouveauContenu.length
  },
  statutAvant: 'brouillon',
  statutApres: 'brouillon', // inchangé
  isSystem: false,
});
```

### **Checkpoints Associés**
- `[CHECKPOINT] relance-saved` → Relance enregistrée avec succès.
- `[CHECKPOINT] relance-save-failed` → Échec de l'enregistrement.
- **Nouveau** : `[CHECKPOINT] activite-created` → Une activité est enregistrée dans `Activite`.

---

## **📌 Intégration avec le Système d'Activités**
- **Où ?** : Dans la fonction `enregistrerRelance()` du frontend ou dans une Cloud Function dédiée.
- **Quand ?** : Après chaque enregistrement de modifications sur une relance.
- **Pourquoi ?** : Traçabilité des sauvegardes intermédiaires pour audit et reprise d'activité.

---

## **🔗 Voir aussi**
- [F-013 : Système d'Activités](../F-013-système-activités.md) (spécification complète)