# F-012 : Historique et Suivi des Relances

**Personas** : Agent de recouvrement, Responsable commercial, Analyste financier  
**Contexte** : Les utilisateurs doivent pouvoir consulter l'historique complet des relances envoyées, suivre leur efficacité, et avoir une traçabilité complète des actions de recouvrement.

## User Stories

### US-012-1
En tant qu'agent de recouvrement  
Je veux consulter l'historique des relances envoyées à un client  
Afin de connaître le nombre de relances déjà effectuées.

### US-012-2
En tant que responsable commercial  
Je veux voir un tableau de bord des relances avec taux d'ouverture  
Afin d'évaluer l'efficacité de mes campagnes de recouvrement.

### US-012-3
En tant qu'analyste financier  
Je veux exporter l'historique des relances  
Afin d'analyser les tendances et délais de paiement.

### US-012-4
En tant qu'agent de recouvrement  
Je veux filtrer l'historique par période, par client ou par séquence  
Afin de retrouver rapidement une relance spécifique.

### US-012-5
En tant qu'agent de recouvrement  
Je veux voir le statut d'une relance (en attente, validée, envoyée, échouée)  
Afin de savoir si un client a bien reçu le message.

### US-012-6
En tant que responsable commercial  
Je veux voir les statistiques de relances par séquence  
Afin d'optimiser mes templates et délais.

## Critères d'acceptation

- Une page "Relances > Historique" liste toutes les relances créées
- Les filtres disponibles : période, client, séquence, statut (valide/envoyée/échouée)
- La vue détail d'une relance montre : contenu, destinataire, date, statut
- Une timeline des relances est visible sur la fiche client
- Les statistiques incluent : taux d'envoi, répartition par séquence, délai moyen
- Un log `[CHECKPOINT] relance-viewed` est émis à la consultation du détail
- Un log `[CHECKPOINT] relance-history-filtered` est émis à l'application de filtres

---

## **🔄 Système d'Activités (Parse Server)**
**Nouveau** : Chaque action de consultation ou export de l'historique est tracée dans la table `Activite`.

### **Activités Loggées**

| Type | Acteur | Cible | Workflow | Description |
|------|--------|-------|----------|-------------|
| `consultation_historique` | `user_id` | `HistoriqueRelances` | - | Consultation de l'historique des relances. |
| `filtrage_historique` | `user_id` | `HistoriqueRelances` | - | Application de filtres sur l'historique. |
| `export_historique` | `user_id` | `HistoriqueRelances` | - | Export de l'historique (CSV/PDF). |
| `consultation_détail_relance` | `user_id` | `Relance` | - | Consultation du détail d'une relance. |

### **Exemple de Log**
```javascript
// Après consultation de l'historique
const { logActivite } = require('../../utils/logActivite');

await logActivite({
  type: 'consultation_historique',
  acteur: Parse.User.currentUser,
  cibleType: 'HistoriqueRelances',
  cibleId: 'global',
  metadata: {
    nombreRelances: relances.length,
    filtresAppliqués: { période: 'mois', clientId: 'client_123' }
  },
  workflow: 'historique-relances',
  isSystem: false,
});

// Après application de filtres
await logActivite({
  type: 'filtrage_historique',
  acteur: Parse.User.currentUser,
  cibleType: 'HistoriqueRelances',
  cibleId: 'global',
  metadata: {
    filtres: { période: '2026-06', statut: 'envoyée', séquenceId: 'seq_1' }
  },
  workflow: 'historique-relances',
  isSystem: false,
});

// Après export de l'historique
await logActivite({
  type: 'export_historique',
  acteur: Parse.User.currentUser,
  cibleType: 'HistoriqueRelances',
  cibleId: 'export_' + Date.now(),
  metadata: {
    format: 'csv',
    nombreLignes: 156,
    nomFichier: 'historique-relances-juin-2026.csv'
  },
  workflow: 'export-historique',
  isSystem: false,
});
```

### **Checkpoints Associés**
- `[CHECKPOINT] relance-viewed` → Détail d'une relance consulté.
- `[CHECKPOINT] relance-history-filtered` → Filtres appliqués sur l'historique.
- `[CHECKPOINT] relance-history-exported` → Historique exporté.
- **Nouveau** : `[CHECKPOINT] activite-created` → Une activité est enregistrée dans `Activite`.

---

## **📌 Intégration avec le Système d'Activités**
- **Où ?** : Dans les fonctions de gestion de l'historique (consultation, filtrage, export).
- **Quand ?** : Après chaque action sur l'historique des relances.
- **Pourquoi ?** : Traçabilité des consultations pour audit et analyse des usages.

---

## **🔗 Voir aussi**
- [F-013 : Système d'Activités](../F-013-système-activités.md) (spécification complète)