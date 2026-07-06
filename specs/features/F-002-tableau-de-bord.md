# F-002 : Tableau de bord

**Personas** : Analyste financier, Responsable commercial  
**Contexte** : Les utilisateurs ont besoin d'une vue d'ensemble des KPIs d'impayés dès la connexion.

## User Stories

### US-002-1
En tant qu'analyste financier  
Je veux voir le taux d'impayé global (montant impayé / montant total)  
Afin d'évaluer la santé financière du portefeuille client.

### US-002-2
En tant qu'analyste financier  
Je veux voir le DSO moyen (Days Sales Outstanding)  
Afin de mesurer la rapidité de paiement des clients.

### US-002-3
En tant que responsable commercial  
Je veux voir le top 10 des clients débiteurs  
Afin de prioriser mes actions de recouvrement.

### US-002-4
En tant qu'analyste financier  
Je veux voir un graphique d'évolution des impayés sur 12 mois  
Afin d'identifier les tendances.

## Critères d'acceptation

- La page dashboard s'affiche par défaut à la connexion
- La carte "Taux d'impayé" affiche un pourcentage avec indicateur visuel (vert/orange/rouge)
- La carte "DSO moyen" affiche le nombre de jours
- La section "Top 10 débiteurs" liste les clients avec montant décroissant
- Un graphique en barres montre l'évolution mensuelle des impayés
- Un log `[CHECKPOINT] dashboard-loaded` est émis avec les KPIs calculés
- Les données se rafraîchissent automatiquement toutes les 5 minutes
- Un état "empty" s'affiche si aucune donnée n'est importée

---

## **🔄 Système d'Activités (Parse Server)**
**Nouveau** : Chaque action de chargement ou rafraîchissement du tableau de bord est tracée dans la table `Activite`.

### **Activités Loggées**

| Type | Acteur | Cible | Workflow | Description |
|------|--------|-------|----------|-------------|
| `chargement_kpis` | `marki` | `Dashboard` | `charger-kpis` | Chargement des KPIs (taux d'impayé, DSO, etc.). |
| `rafraîchissement_auto` | `marki` | `Dashboard` | `refresh-auto` | Rafraîchissement automatique des données. |
| `chargement_top_débiteurs` | `marki` | `Dashboard` | `charger-top-debiteurs` | Chargement de la liste des top débiteurs. |
| `chargement_graphique` | `marki` | `Dashboard` | `charger-graphique` | Chargement du graphique d'évolution. |

### **Exemple de Log**
```javascript
// Dans le workflow `charger-kpis`
const { logActivite } = require('../../utils/logActivite');

// Après calcul des KPIs
await logActivite({
  type: 'chargement_kpis',
  acteur: null, // marki
  cibleType: 'Dashboard',
  cibleId: 'global',
  metadata: {
    tauxImpayé: 12.5,
    dsoMoyen: 45,
    nombreFactures: 156,
    montantTotal: 1250000
  },
  workflow: 'charger-kpis',
  isSystem: true,
});
```

### **Checkpoints Associés**
- `[CHECKPOINT] dashboard-loaded` → Dashboard chargé avec succès.
- `[CHECKPOINT] kpis-calculated` → KPIs calculés.
- **Nouveau** : `[CHECKPOINT] activite-created` → Une activité est enregistrée dans `Activite`.

---

## **📌 Intégration avec le Système d'Activités**
- **Où ?** : Dans `backend/cloud/workflows/dashboard/charger-kpis/00-master.js` et `refresh-auto/00-master.js`.
- **Quand ?** : Après chaque chargement ou rafraîchissement des données.
- **Pourquoi ?** : Traçabilité des accès et des calculs pour audit et optimisation.

---

## **🔗 Voir aussi**
- [F-013 : Système d'Activités](../F-013-système-activités.md) (spécification complète)