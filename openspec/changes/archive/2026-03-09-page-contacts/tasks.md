## 1. Structure de base et chargement

- [x] 1.1 Réécrire `frontend/pages/contacts.vue` : state (contacts, total, loading, page), query Parse paginée (limit 50, skip), appel au montage
- [x] 1.2 Ajouter le compteur "sans email" : query séparée `doesNotExist('email')`, badge rouge en header
- [x] 1.3 Calculer `nb_impayes` par contact affiché : query `Impaye` avec `containedIn('payeur', contacts)`, grouper par contact objectId côté JS

## 2. Filtres

- [x] 2.1 Ajouter `UInput` recherche avec debounce 300ms → `q.matches('nom', regex)`, relance la query à chaque changement
- [x] 2.2 Ajouter `USelect` source (Tous / db_externe / upload) → `q.equalTo('source', ...)`
- [x] 2.3 Ajouter `USelect` type (Tous / Propriétaire / Locataire sortant / Locataire entrant / Apporteur) → `q.equalTo('type', ...)`
- [x] 2.4 Filtre rapide "sans email" : clic sur le badge → toggle `filtreSansEmail` → `q.doesNotExist('email')`, reset page à 0

## 3. Tableau

- [x] 3.1 Définir les colonnes UTable : nom (cliquable), email (badge rouge si absent), téléphone, type (UBadge), source (UBadge coloré), nb_impayes, actions
- [x] 3.2 Ajouter la pagination : boutons Précédent / Suivant, affichage "X–Y sur Z"

## 4. Drawer détail/édition

- [x] 4.1 Ouvrir le drawer au clic sur une ligne ou sur le bouton crayon : charger le contact complet + ses impayés liés (query Impaye par payeur pointer, limit 20)
- [x] 4.2 Afficher les champs nom / email / téléphone / type en lecture seule si `source === 'db_externe'` + UAlert d'information
- [x] 4.3 Rendre les champs éditables (UInput/USelect) si `source === 'upload'`, bouton "Enregistrer" qui appelle `contact.set(...).save()`
- [x] 4.4 Lister les impayés liés dans le drawer : nfacture, reste_a_payer formaté €, UBadge statut, lien `NuxtLink` vers `/impayes/[id]`
- [x] 4.5 Bouton "Supprimer" (source: upload uniquement) : vérifier nb impayés liés → UAlert avertissement si > 0, confirmation puis `contact.destroy()`

## 5. Modal de création

- [x] 5.1 Bouton "Nouveau contact" en header → ouvre `UModal` avec formulaire : nom* (obligatoire), email, téléphone, type (USelect)
- [x] 5.2 Validation : nom requis, toast d'erreur si absent. Créer le contact avec `source: 'upload'`, fermer le modal, recharger la liste

## 6. Bouton Synchroniser

- [x] 6.1 Conserver le bouton "Synchroniser" existant et son comportement (`$parse.Cloud.run('syncNow')`), avec l'UAlert de résultat
