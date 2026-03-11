## Why

La page d'accueil `/` est un écran de debug (health checks, boutons de test) qui n'apporte aucune valeur métier. Les utilisateurs n'ont aucune vue d'ensemble de l'activité : combien d'impayés en cours, quel montant total, combien de relances planifiées pour aujourd'hui, quelle est la tendance. Le dashboard est la première page vue après connexion — il doit donner une lecture immédiate de la situation.

## What Changes

- Remplacer `frontend/pages/index.vue` par un vrai dashboard avec :
  - **KPI cards** : Impayés actifs, Montant total impayé, Relances du jour, Taux de recouvrement (payé / total)
  - **Graphique** : Répartition des impayés par statut (impayé / en cours / payé) — donut chart via `vue-chartjs`
  - **Graphique** : Montant impayé par mois (6 derniers mois) — bar chart
  - **Tableau "Relances du jour"** : 5 prochaines relances à envoyer aujourd'hui (contact, nfacture, séquence, heure prévue)
  - **Tableau "Impayés récents"** : 5 derniers impayés créés (nfacture, payeur, montant, statut)

## Capabilities

### Modified Capabilities

- `dashboard`: Remplacement de l'écran de debug par un dashboard opérationnel avec KPIs, graphiques et tableaux de raccourcis

## Impact

- **Frontend uniquement** : réécriture de `frontend/pages/index.vue`
- **Dépendances** : `vue-chartjs` et `chart.js` à installer si absents
- **Aucune modification backend** : toutes les données sont dans Parse (Impaye, Relance)
