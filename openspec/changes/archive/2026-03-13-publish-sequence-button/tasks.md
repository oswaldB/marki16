## 1. Page détail `/sequences/[id]`

- [x] 1.1 Ajouter `const publiee = ref(false)` et `const publishing = ref(false)` dans la section état du script
- [x] 1.2 Dans `onMounted`, après `sequence.value = seq`, ajouter : `publiee.value = seq.get('publiee') || false`
- [x] 1.3 Ajouter la fonction `togglePublication()` : inverse `publiee.value`, appelle `sequence.value.set('publiee', publiee.value)` puis `await sequence.value.save()`, avec rollback sur erreur
- [x] 1.4 Dans le header (`<div class="flex items-center gap-4">`), ajouter entre l'`UInput` nom et le bouton Enregistrer : un `UBadge` (Brouillon / Publiée) et un `UButton` Publier/Dépublier lié à `togglePublication`

## 2. Page liste `/sequences`

- [x] 2.1 Ajouter `{ accessorKey: 'publiee', header: 'Statut' }` dans le tableau `columns`
- [x] 2.2 Dans le `computed` `rows`, ajouter `publiee: s.get('publiee') || false` à chaque ligne
- [x] 2.3 Ajouter le slot `#publiee-cell` dans `UTable` pour afficher un `UBadge` coloré (success = Publiée, neutral = Brouillon)
