# F-008 : Blacklist des Impayés

**Contexte** : Les agents doivent pouvoir exclure certains impayés des processus de relances automatiques et manuelles (litiges, arrangements, factures contestées).

## User Stories

### US-008-1
En tant qu'agent de recouvrement  
Je veux marquer un impayé comme "blacklisté"  
Afin de suspendre temporairement les relances sur cette facture.

### US-008-2
En tant que responsable commercial  
Je veux voir la liste de tous les impayés blacklistés  
Afin d'avoir une vision des factures en suspension.

### US-008-3
En tant qu'agent de recouvrement  
Je veux retirer un impayé de la blacklist  
Afin de reprendre les relances une fois le litige résolu.

### US-008-4
En tant qu'agent de recouvrement  
Je veux ajouter un motif de blacklist  
Afin de documenter la raison de la suspension (litige, arrangement, etc.).

### US-008-5
En tant que responsable commercial  
Je veux qu'un impayé blacklisté soit automatiquement exclu des générations de relances multiples  
Afin d'éviter d'envoyer des relances sur des factures en litige.

### US-008-6
En tant qu'agent de recouvrement  
Je veux voir visuellement sur la fiche facture qu'un impayé est blacklisté  
Afin d'être informé du statut avant toute action manuelle.

### US-008-7
En tant que responsable commercial  
Je veux que les relances soient régénérées automatiquement lors d'un blacklist/unblacklist  
Afin que les emails planifiés reflètent immédiatement le nouveau statut de l'impayé.

## Critères d'acceptation

- Un bouton "Suspendre les relances" est présent sur la fiche facture/impayé
- Un slideover s'ouvre avec un champ obligatoire "Motif" (texte libre ou prédéfini)
- La date de blacklist est automatiquement enregistrée
- Un badge "Relances suspendues" apparaît sur la fiche avec le motif
- Un log `[CHECKPOINT] impaye-blacklisted` est émis avec l'ID impayé et le motif
- Un log `[CHECKPOINT] impaye-unblacklisted` est émis lors du retrait
- **Lors d'un blacklist** : les relances futures sont régénérées pour exclure cet impayé (si des relances existent en brouillon pour ce contact, elles sont regénérées sans cet impayé)
- **Lors d'un unblacklist** : une relance est regénérée si les critères sont remplis (impayé non soldé, séquence active, etc.)
- Les impayés blacklistés sont exclus du workflow `generate-relances`
- Les impayés blacklistés sont exclus du workflow `generate-suivi`
- Les impayés blacklistés ne peuvent pas être inclus dans une relance manuelle
- Une section "Impayés blacklistés" est accessible depuis le tableau de bord
- La durée moyenne de blacklist est calculée (date blacklist → date déblacklist ou aujourd'hui)

---

## **🔄 Système d'Activités (Parse Server)**
**Nouveau** : Chaque action de blacklist/unblacklist est tracée dans la table `Activite`.

### **Activités Loggées**

| Type | Acteur | Cible | Workflow | Description |
|------|--------|-------|----------|-------------|
| `blacklist_impaye` | `user_id` | `Impaye` | `toggle-blacklist-impaye` | Mise en blacklist d'un impayé. |
| `unblacklist_impaye` | `user_id` | `Impaye` | `toggle-blacklist-impaye` | Retrait de la blacklist. |
| `régénération_relances_blacklist` | `marki` | `Impaye` | `regenerate-relances-contact` | Régénération des relances après blacklist/unblacklist. |

### **Exemple de Log**
```javascript
// Dans le workflow `toggle-blacklist-impaye` (blacklist)
const { logActivite } = require('../../utils/logActivite');

// Après mise en blacklist
await logActivite({
  type: 'blacklist_impaye',
  acteur: Parse.User.currentUser,
  cibleType: 'Impaye',
  cibleId: impaye.id,
  metadata: {
    motifType: 'litige',
    motifDetail: 'Litige commercial avec le client concernant les montants facturés',
    payeurId: impaye.get('payeur').id,
    montant: impaye.get('reste_a_payer')
  },
  statutAvant: 'relances_actives',
  statutApres: 'relances_suspendues',
  workflow: 'toggle-blacklist-impaye',
  isSystem: false,
});

// Dans le workflow `toggle-blacklist-impaye` (unblacklist)
await logActivite({
  type: 'unblacklist_impaye',
  acteur: Parse.User.currentUser,
  cibleType: 'Impaye',
  cibleId: impaye.id,
  metadata: {
    payeurId: impaye.get('payeur').id,
    montant: impaye.get('reste_a_payer')
  },
  statutAvant: 'relances_suspendues',
  statutApres: 'relances_actives',
  workflow: 'toggle-blacklist-impaye',
  isSystem: false,
});

// Dans le workflow `regenerate-relances-contact` (après blacklist/unblacklist)
await logActivite({
  type: 'régénération_relances_blacklist',
  acteur: null, // marki
  cibleType: 'Impaye',
  cibleId: impaye.id,
  metadata: {
    action: 'exclusion', // ou 'inclusion'
    contactId: contact.id,
    nombreRelancesRegénérées: 5
  },
  workflow: 'regenerate-relances-contact',
  isSystem: true,
});
```

### **Checkpoints Associés**
- `[CHECKPOINT] impaye-blacklisted` → Impayé blacklisté.
- `[CHECKPOINT] impaye-unblacklisted` → Impayé déblacklisté.
- `[CHECKPOINT] relances-regenerated` → Relances régénérées après blacklist/unblacklist.
- **Nouveau** : `[CHECKPOINT] activite-created` → Une activité est enregistrée dans `Activite`.

---

## **📌 Intégration avec le Système d'Activités**
- **Où ?** : Dans `backend/cloud/workflows/toggle-blacklist-impaye/00-master.js` et `regenerate-relances-contact/00-master.js`.
- **Quand ?** : Après chaque action de blacklist/unblacklist ou régénération de relances.
- **Pourquoi ?** : Traçabilité des suspensions et réactivations pour audit et conformité.

---

## **🔗 Voir aussi**
- [F-013 : Système d'Activités](../F-013-système-activités.md) (spécification complète)