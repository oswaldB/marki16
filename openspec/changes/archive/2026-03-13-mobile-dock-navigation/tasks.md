## 1. Masquer la sidebar sur mobile

- [ ] 1.1 Ajouter `hidden lg:flex` sur la balise `<aside>` dans `frontend/layouts/default.vue` (remplace l'attribut `class` existant qui ne contient pas de responsive)

## 2. Ajouter le dock mobile

- [ ] 2.1 Définir `dockItems` dans `<script setup>` : les 5 routes principales (Dashboard, Impayés, Contacts, Séquences, Relances) avec icône et libellé court
- [ ] 2.2 Définir `moreItems` dans `<script setup>` : routes secondaires (Import PDF, Logs import, Profils SMTP, Utilisateurs)
- [ ] 2.3 Ajouter `const showMore = ref(false)` pour piloter l'affichage du menu secondaire
- [ ] 2.4 Créer le bloc `<nav>` du dock sous le `<div class="flex-1 ...">` (avant la fermeture du `<div>` racine), avec `class="flex lg:hidden fixed bottom-0 inset-x-0 h-16 bg-white border-t border-gray-200 z-50"`
- [ ] 2.5 Dans le dock, rendre `dockItems` : chaque item est un `NuxtLink` avec icône + libellé court, classe active `text-sky-600` vs `text-gray-500`
- [ ] 2.6 Ajouter le bouton "Plus" en dernière position du dock : icône `i-heroicons-ellipsis-horizontal`, bascule `showMore`
- [ ] 2.7 Ajouter le menu `moreItems` (`v-if="showMore"`) positionné `absolute bottom-16 right-0 bg-white shadow-lg rounded-tl-lg border border-gray-200 py-2 min-w-40` avec les liens secondaires en liste

## 3. Fermeture du menu "Plus"

- [ ] 3.1 Ajouter un overlay `<div v-if="showMore" class="fixed inset-0 z-40" @click="showMore = false" />` avant le dock pour fermer le menu au clic extérieur
- [ ] 3.2 S'assurer que cliquer sur un `moreItems` link ferme `showMore` (`@click="showMore = false"` sur chaque lien)

## 4. Padding du contenu principal

- [ ] 4.1 Ajouter `pb-16 lg:pb-0` sur la balise `<main>` pour éviter que le dock ne masque le bas du contenu sur mobile

## 5. Vérification

- [ ] 5.1 Tester visuellement sur viewport 375px : dock visible, sidebar absente, liens actifs surlignés, menu "Plus" fonctionnel
- [ ] 5.2 Tester sur viewport 1280px : sidebar visible, dock absent, layout inchangé
