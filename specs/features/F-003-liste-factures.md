# F-003 : Liste des factures

**Personas** : Analyste financier, Agent de recouvrement  
**Contexte** : Les utilisateurs doivent pouvoir consulter, filtrer et trier toutes les factures.

## User Stories

### US-003-1
En tant qu'agent de recouvrement  
Je veux voir la liste de toutes les factures avec numéro, client, date, montant, statut  
Afin d'identifier les factures impayées.

### US-003-2
En tant qu'analyste financier  
Je veux filtrer par statut (payée, impayée, partiellement payée)  
Afin d'affiner ma vue.

### US-003-3
En tant qu'analyste financier  
Je veux trier par date ou montant (croissant/décroissant)  
Afin de prioriser les analyses.

### US-003-4
En tant qu'agent de recouvrement  
Je veux rechercher une facture par numéro ou nom client  
Afin de trouver rapidement une facture spécifique.

### US-003-5
En tant qu'agent de recouvrement  
Je veux cliquer sur une facture pour voir son détail  
Afin d'accéder aux actions disponibles.

## Critères d'acceptation

- Un tableau paginé affiche les factures (50 par page)
- Les colonnes affichées : N° facture, Client, Date émission, Date échéance, Montant TTC, Statut
- Un badge coloré indique le statut (vert=payée, rouge=impayée, orange=partielle)
- Des champs de filtre par statut et date sont présents au-dessus du tableau
- Une barre de recherche filtre en temps réel sur n° et client
- Un clic sur une ligne redirige vers la fiche facture/client
- Un log `[CHECKPOINT] factures-loaded` est émis avec le nombre de résultats
- Un skeleton loader s'affiche pendant le chargement
- Un message "Aucune facture trouvée" s'affiche si la recherche ne retourne rien

---

## **🔄 Système d'Activités (Parse Server)**
**Nouveau** : Chaque action sur la liste des factures est tracée dans la table `Activite`.

### **Activités Loggées**

| Type | Acteur | Cible | Workflow | Description |
|------|--------|-------|----------|-------------|
| `chargement_factures` | `marki` ou `user_id` | `ListeFactures` | `charger-factures` | Chargement initial de la liste des factures. |
| `filtrage_factures` | `user_id` | `ListeFactures` | `filtrer-statut` | Application d'un filtre (statut, date, etc.). |
| `tri_factures` | `user_id` | `ListeFactures` | `trier-colonnes` | Tri des factures par colonne. |
| `recherche_factures` | `user_id` | `ListeFactures` | `rechercher` | Recherche textuelle sur les factures. |
| `pagination_factures` | `user_id` | `ListeFactures` | `paginer` | Changement de page dans la liste. |

### **Exemple de Log**
```javascript
// Dans le workflow `charger-factures`
const { logActivite } = require('../../utils/logActivite');

// Après chargement des factures
await logActivite({
  type: 'chargement_factures',
  acteur: Parse.User.currentUser, // ou null si système
  cibleType: 'ListeFactures',
  cibleId: 'global',
  metadata: {
    nombreFactures: factures.length,
    filtresAppliqués: { statut: 'impayée', dateDebut: '2026-01-01' },
    page: 1,
    limit: 50
  },
  workflow: 'charger-factures',
  isSystem: false,
});

// Dans le workflow `filtrer-statut`
await logActivite({
  type: 'filtrage_factures',
  acteur: Parse.User.currentUser,
  cibleType: 'ListeFactures',
  cibleId: 'global',
  metadata: { filtre: 'statut', valeur: 'impayée' },
  workflow: 'filtrer-statut',
  isSystem: false,
});
```

### **Checkpoints Associés**
- `[CHECKPOINT] factures-loaded` → Factures chargées avec succès.
- `[CHECKPOINT] factures-filtered` → Filtres appliqués.
- **Nouveau** : `[CHECKPOINT] activite-created` → Une activité est enregistrée dans `Activite`.

---

## **📌 Intégration avec le Système d'Activités**
- **Où ?** : Dans `backend/cloud/workflows/liste-factures/charger-factures/00-master.js`, `filtrer-statut/00-master.js`, etc.
- **Quand ?** : Après chaque chargement, filtrage, tri, ou recherche.
- **Pourquoi ?** : Traçabilité des interactions utilisateurs pour analyse et optimisation.

---

## **🔗 Voir aussi**
- [F-013 : Système d'Activités](../F-013-système-activités.md) (spécification complète)