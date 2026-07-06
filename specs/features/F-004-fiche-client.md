# F-004 : Fiche client

**Personas** : Analyste financier, Responsable commercial  
**Contexte** : Les utilisateurs doivent pouvoir analyser le détail d'un client et son historique.

## User Stories

### US-004-1
En tant que responsable commercial  
Je veux voir les informations d'un client (nom, adresse, contact)  
Afin de préparer une relance personnalisée.

### US-004-2
En tant qu'analyste financier  
Je veux voir l'historique des factures d'un client avec leur statut  
Afin d'analyser son comportement de paiement.

### US-004-3
En tant que responsable commercial  
Je veux voir le solde débiteur total du client  
Afin d'évaluer l'exposition au risque.

### US-004-4
En tant qu'analyste financier  
Je veux voir le nombre de jours moyens de retard de ce client  
Afin d'identifier les mauvais payeurs.

## Critères d'acceptation

- La fiche client affiche : nom, adresse, email, téléphone
- Une section "Solde débiteur" montre le montant total impayé
- Une section "Score client" affiche un indicateur (A/B/C/D) basé sur l'historique
- Un tableau liste les factures du client (20 dernières par défaut)
- Un bouton "Voir toutes les factures" filtre la liste globale sur ce client
- Un bouton "Relancer" permet d'envoyer un email de relance
- Un log `[CHECKPOINT] client-loaded` est émis avec l'ID client
- Un historique visuel montre la tendance des retards de paiement

---

## **🔄 Système d'Activités (Parse Server)**
**Nouveau** : Chaque action sur la fiche client est tracée dans la table `Activite`.

### **Activités Loggées**

| Type | Acteur | Cible | Workflow | Description |
|------|--------|-------|----------|-------------|
| `chargement_client` | `marki` ou `user_id` | `Client` | `charger-client` | Chargement des informations d'un client. |
| `chargement_historique` | `marki` ou `user_id` | `Client` | `charger-historique` | Chargement de l'historique des factures d'un client. |
| `calcul_score` | `marki` | `Client` | `calculer-score` | Calcul du score (A/B/C/D) pour un client. |
| `affichage_solde` | `marki` | `Client` | `afficher-solde` | Calcul et affichage du solde débiteur. |
| `consultation_fiche_client` | `user_id` | `Client` | - | Consultation de la fiche client par un utilisateur. |

### **Exemple de Log**
```javascript
// Dans le workflow `charger-client`
const { logActivite } = require('../../utils/logActivite');

// Après chargement des infos du client
await logActivite({
  type: 'chargement_client',
  acteur: Parse.User.currentUser,
  cibleType: 'Client',
  cibleId: client.id,
  metadata: {
    nom: client.get('nom'),
    nombreFactures: client.get('factures')?.length || 0
  },
  workflow: 'charger-client',
  isSystem: false,
});

// Dans le workflow `calculer-score`
await logActivite({
  type: 'calcul_score',
  acteur: null, // marki
  cibleType: 'Client',
  cibleId: client.id,
  metadata: {
    score: 'B',
    critères: { dso: 45, montantTotal: 50000, retardMoyen: 15 }
  },
  workflow: 'calculer-score',
  isSystem: true,
});
```

### **Checkpoints Associés**
- `[CHECKPOINT] client-loaded` → Client chargé avec succès.
- `[CHECKPOINT] client-history-loaded` → Historique chargé.
- `[CHECKPOINT] client-score-calculated` → Score calculé.
- **Nouveau** : `[CHECKPOINT] activite-created` → Une activité est enregistrée dans `Activite`.

---

## **📌 Intégration avec le Système d'Activités**
- **Où ?** : Dans `backend/cloud/workflows/fiche-client/charger-client/00-master.js`, `charger-historique/00-master.js`, etc.
- **Quand ?** : Après chaque chargement ou calcul lié à un client.
- **Pourquoi ?** : Traçabilité des consultations et analyses pour audit et optimisation.

---

## **🔗 Voir aussi**
- [F-013 : Système d'Activités](../F-013-système-activités.md) (spécification complète)