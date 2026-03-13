## Why

Le layout actuel affiche une sidebar de 256px en permanence. Sur mobile, cette sidebar écrase la zone de contenu et force l'utilisateur à scroller horizontalement, rendant l'application inutilisable sur téléphone. Un dock fixe en bas d'écran est le pattern natif attendu sur mobile : les icônes de navigation sont accessibles au pouce, le contenu occupe tout l'écran.

## What Changes

- Sur mobile (`< lg`), la sidebar est masquée et un dock de navigation apparaît en bas de l'écran
- Le dock affiche les 5 liens principaux (Dashboard, Impayés, Contacts, Séquences, Relances) sous forme d'icônes + libellés courts
- Les liens Paramètres (SMTP, Utilisateurs) et Import PDF sont accessibles via un bouton "Plus" dans le dock qui ouvre un drawer ou un menu
- Le contenu principal ajoute un padding-bottom sur mobile pour ne pas être masqué par le dock
- Sur desktop (`>= lg`), le layout reste inchangé (sidebar + header)

## Capabilities

### New Capabilities

- `mobile-dock`: Barre de navigation fixe en bas d'écran sur mobile, avec icônes et libellés courts pour les routes principales

### Modified Capabilities

- `default-layout`: Le layout `default.vue` gère désormais deux modes d'affichage — sidebar sur desktop, dock sur mobile — via des classes Tailwind responsive

## Impact

- **Frontend** : `frontend/layouts/default.vue` — ajout du dock, masquage conditionnel de la sidebar
- **Pas de nouveau composant requis** : tout peut tenir dans `default.vue` avec des classes responsive et un état `showMore` pour le menu "Plus"
- **Aucun impact backend, stores ou routes**
