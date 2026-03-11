## Architecture

Frontend uniquement. Réécriture complète de `frontend/pages/index.vue`. Installation de `vue-chartjs` + `chart.js` pour les graphiques. Toutes les données viennent de Parse via le SDK client.

## Layout

```
┌─────────────────────────────────────────────────────────┐
│  Bonjour — Dashboard                                    │
├──────────┬──────────┬──────────┬──────────┐            │
│ Impayés  │ Montant  │Relances  │  Taux    │  KPI Cards │
│ actifs   │ impayé   │du jour   │recouvr.  │            │
├──────────┴──────────┼──────────┴──────────┤            │
│   Donut (statuts)   │   Bar (mois)        │  Charts    │
├─────────────────────┴─────────────────────┤            │
│  Relances du jour (table 5 lignes max)    │            │
├───────────────────────────────────────────┤            │
│  Impayés récents (table 5 lignes max)     │            │
└───────────────────────────────────────────┘
```

## KPI Cards

4 cards en grille 2×2 (mobile) / 4×1 (desktop) :

| Card | Valeur | Sous-texte |
|---|---|---|
| Impayés actifs | Count(statut ≠ 'payé') | "en cours + impayé" |
| Montant total impayé | Sum(reste_a_payer, statut ≠ 'payé') | formaté € |
| Relances du jour | Count(Relance.statut = 'pending' AND dateEnvoi ≤ today) | "à envoyer" |
| Taux de recouvrement | Count(payé) / Count(total) × 100 | "% des dossiers" |

Chaque card : icône, titre, valeur en grand, sous-texte gris.

## Graphiques (vue-chartjs)

### Donut — Répartition par statut

```js
datasets: [{
  data: [countImpaye, countEnCours, countPaye],
  backgroundColor: ['#f97316', '#3b82f6', '#22c55e'],
}]
labels: ['Impayé', 'En cours', 'Payé']
```

Données : 3 queries `Count` en parallèle sur `Impaye` par statut.

### Bar — Montant impayé par mois (6 derniers mois)

Pour chaque mois M-5 → M :
- Query `Impaye` avec `date_piece >= debut_mois` ET `date_piece < fin_mois`
- Sum de `reste_a_payer` côté JS (limit 500 par mois)

```js
datasets: [{
  label: 'Montant impayé (€)',
  data: [montantM5, montantM4, ..., montantM0],
  backgroundColor: '#3b82f6',
}]
labels: ['Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar']
```

## Tableaux de raccourcis

### Relances du jour

Colonnes : Contact (payeur_nom depuis Impaye), N° Facture, Séquence, Heure prévue

```js
const q = new $parse.Query('Relance')
q.equalTo('statut', 'pending')
q.lessThanOrEqualTo('dateEnvoi', endOfToday)
q.include('impaye')
q.include('sequence')
q.ascending('dateEnvoi')
q.limit(5)
```

### Impayés récents

Colonnes : N° Facture, Payeur, Reste à payer (€), Statut (badge), Lien vers détail

```js
const q = new $parse.Query('Impaye')
q.descending('createdAt')
q.limit(5)
```

## Dépendances

`vue-chartjs` + `chart.js` : installer dans `frontend/` avec `npm install vue-chartjs chart.js`.

Usage dans le composant :
```js
import { Doughnut, Bar } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js'
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)
```

## Helpers

```js
function formatMontant(val) {
  return Number(val || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

function labelsMois() {
  // retourne les 6 derniers mois en labels courts fr-FR
  const mois = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    mois.push(d.toLocaleDateString('fr-FR', { month: 'short' }))
  }
  return mois
}
```

## Chargement

Toutes les queries lancées en parallèle via `Promise.all` au montage. Un `loading` global affiche un skeleton ou message "Chargement…" pendant que les données arrivent.
