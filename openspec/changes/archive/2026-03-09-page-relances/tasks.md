## 1. Installation

- [x] 1.1 `cd frontend && npm install @fullcalendar/vue3 @fullcalendar/daygrid @fullcalendar/interaction` ; vérifier que les packages apparaissent dans `package.json`

## 2. Page `/relances` — Structure et chargement

- [x] 2.1 Créer `frontend/pages/relances.vue` avec : refs `vue` ('tableau'|'calendrier'), `filtreStatut` ('tous'), `filtreSequence` (''), `search` (''), `relances` ([]), `sequences` ([]), `loading` ; au `onMounted` → `charger()` et `chargerSequences()`
- [x] 2.2 Fonction `charger()` : `new $parse.Query('Relance').include('impaye').include('sequence').descending('dateEnvoi').limit(500).find()` ; mapper avec `parseRelance()` ; appliquer `filtreStatut` côté Parse si !== 'tous' ; appliquer `filtreSequence` si défini
- [x] 2.3 Computed `relancesFiltrees` : filtre côté client sur `search` (objet + to insensible à la casse)
- [x] 2.4 Computed `sequenceOptions` : liste des séquences pour le USelect filtre ; charger via `new $parse.Query('Sequence').ascending('nom').limit(200).find()`

## 3. Vue Tableau

- [x] 3.1 **Barre du haut** : toggle vue (deux UButton), USelect `filtreStatut`, USelect `filtreSequence`, UInput `search`
- [x] 3.2 **UTable** avec `v-model:selected`, colonnes dateEnvoi | objet | to | nfacture | statut | actions ; badges statut ; lien nfacture vers `/impayes/:id`
- [x] 3.3 **Actions par statut** : pending → ✏ + 🗑 ; envoyé → 👁 ; échec → ✏ + 🔁
- [x] 3.4 **Barre sélection groupée** : barre flottante bottom avec bouton "Annuler X relances"
- [x] 3.5 **Fonctions** `annulerRelance`, `reessayerRelance`, `annulerGroupe`

## 4. Vue Calendrier

- [x] 4.1 FullCalendar `dayGridMonth`, locale fr, events depuis `relancesFiltrees`, `eventClick` + `dateClick`
- [x] 4.2 Computed `calendarOptions` avec events colorés par statut
- [x] 4.3 Panneau latéral `jourSelectionne` avec liste des relances du jour et actions

## 5. Drawer — Modifier / Voir une relance

- [x] 5.1 UModal avec champs dateEnvoi (type date), to, cc, objet, corps (Toast UI Editor)
- [x] 5.2 Mode lecture seule si `statut === 'envoyé'` (champs `disabled`)
- [x] 5.3 Bouton Enregistrer : set tous les champs + `getInstance().getHTML()` pour corps, save, recharger
