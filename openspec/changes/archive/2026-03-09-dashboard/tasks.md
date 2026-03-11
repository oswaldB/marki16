## 1. Dépendances

- [x] 1.1 Installer `vue-chartjs` et `chart.js` dans `frontend/` : `npm install vue-chartjs chart.js`

## 2. KPI Cards

- [x] 2.1 Réécrire `frontend/pages/index.vue` : 4 KPI cards (impayés actifs, montant total, relances du jour, taux recouvrement) avec queries Parse en parallèle au montage
- [x] 2.2 Formater les valeurs : montant en € (`toLocaleString fr-FR`), taux en %, compteurs entiers

## 3. Graphique Donut — statuts

- [x] 3.1 Importer et enregistrer les composants Chart.js nécessaires (ArcElement, Tooltip, Legend)
- [x] 3.2 Afficher le `<Doughnut>` avec les 3 counts par statut (impayé / en cours / payé) et les couleurs orange/bleu/vert

## 4. Graphique Bar — montant par mois

- [x] 4.1 Importer CategoryScale, LinearScale, BarElement pour Chart.js
- [x] 4.2 Calculer les 6 derniers mois : pour chaque mois, query Impaye par date_piece + sum reste_a_payer côté JS
- [x] 4.3 Afficher le `<Bar>` avec les labels de mois fr-FR et les montants

## 5. Tableau "Relances du jour"

- [x] 5.1 Query Relance (statut pending, dateEnvoi ≤ fin de journée, include impaye + sequence, limit 5, ascending dateEnvoi)
- [x] 5.2 Afficher un UTable avec colonnes : Contact, N° Facture, Séquence, Heure prévue

## 6. Tableau "Impayés récents"

- [x] 6.1 Query Impaye (descending createdAt, limit 5)
- [x] 6.2 Afficher un UTable avec colonnes : N° Facture, Payeur, Reste à payer, Statut (UBadge), lien vers `/impayes/[id]`
