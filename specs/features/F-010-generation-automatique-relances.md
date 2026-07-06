# F-010 : Génération Automatique des Relances

**Personas** : Agent de recouvrement, Responsable commercial  
**Contexte** : Les relances doivent être générées automatiquement à partir des impayés selon des règles métier et des séquences configurées (J+15, J+30, etc.).

## User Stories

### US-010-1
En tant qu'agent de recouvrement  
Je veux que le système génère automatiquement les relances à effectuer  
Afin de ne pas avoir à les créer manuellement une par une.

### US-010-2
En tant que responsable commercial  
Je veux configurer les seuils de génération des relances (J+X)  
Afin d'adapter la cadence aux pratiques de mon entreprise.

### US-010-3
En tant qu'agent de recouvrement  
Je veux voir un récapitulatif des relances générées  
Afin de savoir combien de clients vont être relancés aujourd'hui.

### US-010-4
En tant qu'agent de recouvrement  
Je veux que les impayés déjà relancés récemment soient exclus  
Afin d'éviter de spammer les clients.

### US-010-5
En tant qu'agent de recouvrement  
Je veux que les contacts et impayés blacklistés soient exclus  
Afin de respecter les litiges et arrangements en cours.

## Critères d'acceptation

- Le workflow `generate-relances` s'exécute quotidiement ou sur demande
- Seuls les impayés avec séquence de type "relances" sont concernés
- Les impayés déjà relancés dans le délai de la séquence sont exclus
- Les contacts blacklistés sont exclus
- Les impayés blacklistés sont exclus
- Les impayés sans email valide sont exclus
- Une relance est créée par contact (regroupement des impayés)
- Le sujet et corps sont générés à partir du template de la séquence
- Un log `[CHECKPOINT] relances-generated` est émis avec le nombre créé
- Un log `[CHECKPOINT] relances-generation-failed` est émis en cas d'erreur
- Les relances générées ont le statut `valide: false` (à valider)

---

## **🔄 Système d'Activités (Parse Server)**
**Nouveau** : Chaque action de génération de relances est tracée dans la table `Activite`.

### **Activités Loggées**

| Type | Acteur | Cible | Workflow | Description |
|------|--------|-------|----------|-------------|
| `génération_relances` | `marki` | `Relance` | `generate-relances` | Génération automatique d'une relance pour un contact. |
| `exclusion_blacklistés` | `marki` | `Relance` | `generate-relances` | Exclusion des impayés blacklistés lors de la génération. |

### **Exemple de Log**
```javascript
// Dans le workflow `generate-relances` (pour chaque relance générée)
const { logActivite } = require('../../utils/logActivite');

// Après création d'une relance pour un contact
await logActivite({
  type: 'génération_relances',
  acteur: null, // marki
  cibleType: 'Relance',
  cibleId: relance.id,
  metadata: {
    contactId: contact.id,
    contactNom: contact.get('nom'),
    nombreFactures: impayes.length,
    montantTotal: montantTotal,
    séquenceId: sequence.id,
    niveau: sequence.get('niveau')
  },
  workflow: 'generate-relances',
  isSystem: true,
});

// Après exclusion des impayés blacklistés
await logActivite({
  type: 'exclusion_blacklistés',
  acteur: null, // marki
  cibleType: 'Relance',
  cibleId: 'batch_generation',
  metadata: {
    nombreExclus: impayesBlacklistés.length,
    contactId: contact.id
  },
  workflow: 'generate-relances',
  isSystem: true,
});
```

### **Checkpoints Associés**
- `[CHECKPOINT] relances-generated` → Relances générées avec succès.
- `[CHECKPOINT] relances-generation-failed` → Échec de la génération.
- **Nouveau** : `[CHECKPOINT] activite-created` → Une activité est enregistrée dans `Activite`.

---

## **📌 Intégration avec le Système d'Activités**
- **Où ?** : Dans `backend/cloud/workflows/generate-relances/00-master.js`.
- **Quand ?** : Après chaque génération de relance ou exclusion de blacklistés.
- **Pourquoi ?** : Traçabilité des générations pour audit et analyse de l'efficacité des séquences.

---

## **🔗 Voir aussi**
- [F-013 : Système d'Activités](../F-013-système-activités.md) (spécification complète)