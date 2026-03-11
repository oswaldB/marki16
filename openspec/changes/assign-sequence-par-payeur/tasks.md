## 1. Composant DrawerAssignSequence

- [x] 1.1 Créer `frontend/components/DrawerAssignSequence.vue` avec les props `open`, `payeur`, `impayes`, `sequences` et les emits `update:open`, `assigned`
- [x] 1.2 Implémenter l'état interne : `selection` (Set initialisé avec tous les objectId), `sequenceChoisie`, `assigning`
- [x] 1.3 Ajouter le `USlideover` avec titre "Attribuer une séquence" + sous-titre payeur + nombre d'impayés
- [x] 1.4 Ajouter le `USelect` pour choisir la séquence (options dérivées de la prop `sequences`)
- [x] 1.5 Afficher la liste des impayés avec checkbox par ligne : n° facture, montant formaté, badge séquence actuelle (`sky`) ou "—"
- [x] 1.6 Ajouter le bouton "Tout cocher / Tout décocher" qui toggle la sélection globale
- [x] 1.7 Pied de drawer : bouton "Annuler" et bouton "Attribuer (N)" avec loading state, désactivé si aucune séquence choisie ou sélection vide
- [x] 1.8 Implémenter `attribuer()` : même logique que `assignerSequence()` dans `impayes.vue` — boucle sur les impayés sélectionnés, suppression des relances pending, création des nouvelles relances, sauvegarde de `impaye.sequence`
- [x] 1.9 Émettre `assigned` après succès et fermer le drawer ; afficher un toast "Séquence assignée à N impayés"

## 2. Intégration dans impayes.vue

- [x] 2.1 Importer et enregistrer `DrawerAssignSequence` dans `impayes.vue`
- [x] 2.2 Ajouter les refs d'état : `drawerAssignOpen`, `drawerAssignPayeur`, `drawerAssignImpayes`
- [x] 2.3 Ajouter la fonction `ouvrirDrawerAssignation(row)` qui extrait `row.getLeafRows().map(r => r.original)` et ouvre le drawer
- [x] 2.4 Dans le slot `#title-cell` de la vue par payeur, ajouter un `UButton` "Attribuer séquence" visible sur les lignes de groupe, avec `.stop` sur le clic pour ne pas déclencher le toggle expand
- [x] 2.5 Ajouter `<DrawerAssignSequence>` dans le template avec les props liées et l'écoute de `@assigned="chargerTout"`
- [x] 2.6 Passer la prop `sequences` en liant au ref `sequences` existant dans la page
