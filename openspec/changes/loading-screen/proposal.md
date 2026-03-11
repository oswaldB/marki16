## Why

Au premier chargement de l'application, Parse SDK s'initialise côté client et vérifie l'état d'authentification avant d'afficher le contenu. Ce délai produit un écran blanc ou un rendu incomplet qui dégrade l'expérience utilisateur, surtout sur des connexions lentes ou des machines moins puissantes.

## What Changes

- Ajout d'un écran de chargement plein-écran dans `app.vue` qui s'affiche le temps que Parse SDK s'initialise et que la vérification d'authentification (`fetchCurrentUser`) se termine
- L'overlay disparaît proprement une fois le contenu prêt, avec une transition douce
- Le layout et les pages ne sont rendus qu'une fois l'état `loading` résolu — évite tout flash de contenu non authentifié

## Capabilities

### New Capabilities

- `app-loading-screen`: Overlay de chargement affiché au démarrage de l'application, masqué dès que l'initialisation est terminée

### Modified Capabilities

- `app-init`: `app.vue` gère désormais un état `isLoading` qui orchestre l'affichage conditionnel du layout

## Impact

- **Frontend** : `app.vue` — ajout d'un état réactif et d'un overlay de chargement ; aucune dépendance supplémentaire
- **Performance perçue** : amélioration significative — l'utilisateur voit un indicateur de chargement plutôt qu'un écran blanc
