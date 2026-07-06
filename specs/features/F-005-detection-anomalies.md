# F-005 : Détection anomalies

**Personas** : Analyste financier, Responsable commercial  
**Contexte** : Le système doit automatiquement identifier les clients et factures à risque.

## User Stories

### US-005-1
En tant qu'analyste financier  
Je veux voir une liste des clients à risque détectés automatiquement  
Afin de prioriser les actions de recouvrement.

### US-005-2
En tant qu'analyste financier  
Je veux comprendre pourquoi un client est signalé à risque  
Afin d'évaluer la pertinence de l'alerte.

### US-005-3
En tant que responsable commercial  
Je veux recevoir des alertes sur les clients dépassant 90 jours de retard  
Afin d'agir rapidement sur les créances douteuses.

## Critères d'acceptation

- Une section "Alertes" sur le dashboard liste les clients à risque
- Les critères de détection : DSO > 60 jours, montant impayé > 10k€, retard > 90 jours
- Chaque alerte affiche : nom client, motif de l'alerte, montant concerné
- Un badge indique la sévérité ( critique / warning / info )
- Un clic sur une alerte ouvre la fiche client
- Un log `[CHECKPOINT] alert-generated` est émis pour chaque alerte affichée
- Le système recalcule les alertes après chaque import
- Un bouton "Ignorer" permet de masquer une alerte (avec raison)

---

## **🔄 Système d'Activités (Parse Server)**
**Nouveau** : Chaque action de détection ou gestion d'alerte est tracée dans la table `Activite`.

### **Activités Loggées**

| Type | Acteur | Cible | Workflow | Description |
|------|--------|-------|----------|-------------|
| `détection_risques` | `marki` | `Alerte` | `detecter-risques` | Détection automatique des clients à risque. |
| `affichage_alertes` | `marki` ou `user_id` | `Alerte` | `afficher-alertes` | Affichage de la liste des alertes. |
| `ignorer_alerte` | `user_id` | `Alerte` | `ignorer-alerte` | Une alerte est ignorée par un utilisateur. |
| `réactivation_alerte` | `user_id` | `Alerte` | - | Une alerte ignorée est réactivée. |

### **Exemple de Log**
```javascript
// Dans le workflow `detecter-risques`
const { logActivite } = require('../../utils/logActivite');

// Après détection d'une alerte pour un client
await logActivite({
  type: 'détection_risques',
  acteur: null, // marki
  cibleType: 'Alerte',
  cibleId: alerte.id,
  metadata: {
    clientId: client.id,
    clientNom: client.get('nom'),
    motif: 'DSO > 60 jours',
    sévérité: 'critique',
    montant: 15000,
    critères: { dso: 75, montantImpayé: 15000, retardMax: 90 }
  },
  workflow: 'detecter-risques',
  isSystem: true,
});

// Dans le workflow `ignorer-alerte`
await logActivite({
  type: 'ignorer_alerte',
  acteur: Parse.User.currentUser,
  cibleType: 'Alerte',
  cibleId: alerte.id,
  metadata: {
    raison: 'Client en arrangement de paiement',
    clientId: alerte.get('client').id
  },
  workflow: 'ignorer-alerte',
  isSystem: false,
});
```

### **Checkpoints Associés**
- `[CHECKPOINT] alert-generated` → Alerte générée.
- `[CHECKPOINT] alerts-displayed` → Alertes affichées.
- `[CHECKPOINT] alert-ignored` → Alerte ignorée.
- **Nouveau** : `[CHECKPOINT] activite-created` → Une activité est enregistrée dans `Activite`.

---

## **📌 Intégration avec le Système d'Activités**
- **Où ?** : Dans `backend/cloud/workflows/dashboard/detecter-risques/00-master.js`, `afficher-alertes/00-master.js`, etc.
- **Quand ?** : Après chaque détection, affichage, ou action sur une alerte.
- **Pourquoi ?** : Traçabilité des alertes pour analyse des risques et optimisation des règles.

---

## **🔗 Voir aussi**
- [F-013 : Système d'Activités](../F-013-système-activités.md) (spécification complète)