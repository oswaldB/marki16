# Store: relanceHistoryStore (Pinia)

**Chemin** : `frontend/app/stores/relanceHistoryStore.js`  
**Feature** : F-012  

## Description

Store Pinia pour l'historique et les statistiques des relances.

## State

```javascript
{
  historique: [],         // Liste des relances historisées
  stats: null,            // Statistiques globales
  filtres: {
    dateDebut: null,
    dateFin: null,
    clientId: null,
    sequenceId: null,
    statut: null
  },
  pagination: {
    page: 1,
    limit: 50,
    total: 0
  },
  loading: false,
  exporting: false
}
```

## Getters

| Nom | Type | Description |
|-----|------|-------------|
| `totalRelances` | Number | Total des relances |
| `tauxEnvoi` | Number | % de relances envoyées |
| `montantTotal` | Number | Montant total relancé |
| `statsBySequence` | Array | Stats par séquence |
| `statsByMonth` | Array | Stats par mois |

## Actions

### Chargement

| Action | Paramètres | Description |
|--------|-----------|-------------|
| `fetchHistorique` | `params` | Charge l'historique avec filtres |
| `fetchStats` | `periode` | Charge les statistiques |

### Export

| Action | Paramètres | Description |
|--------|-----------|-------------|
| `exportCSV` | | Exporte en CSV |
| `exportPDF` | | Exporte en PDF |

### Filtres

| Action | Paramètres | Description |
|--------|-----------|-------------|
| `setFiltres` | `filtres` | Applique des filtres |
| `resetFiltres` | | Réinitialise les filtres |

## Format des stats

```javascript
{
  total: 156,
  envoyees: 142,
  validees: 8,
  enAttente: 4,
  annulees: 2,
  tauxEnvoi: 91,
  montantTotal: 1250340.50,
  parSequence: [
    { nom: 'Relance J+15', count: 87, montant: 650000 },
    { nom: 'Relance J+30', count: 45, montant: 420000 }
  ],
  parMois: [
    { mois: '2024-06', count: 45 },
    { mois: '2024-05', count: 52 }
  ]
}
```
