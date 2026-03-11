## Why

Une analyse automatisée de la console Chrome (rapport du 2026-03-09) a révélé 4 erreurs critiques et plusieurs avertissements bloquants dans l'application. La page `/relances` est complètement inaccessible, le dashboard affiche une erreur silencieuse sur les relances du jour, et un avertissement Vue Router s'affiche sur **toutes** les pages à cause d'un lien cassé dans la sidebar. Sans ces corrections, des fonctionnalités clés sont inutilisables en production.

## What Changes

- Correction de `relances.vue` : résolution du module non chargeable (import `@toast-ui/vue-editor` problématique dans le contexte Vite/Nuxt 4)
- Correction de `impayes.vue` : remplacement de `UDropdown` (supprimé dans Nuxt UI v4) par `UDropdownMenu`
- Correction de `services.vue` : remplacement des composants Naive UI (`NCard`, `NTag`, `NButton`) par leurs équivalents Nuxt UI (`UCard`, `UBadge`, `UButton`) — Naive UI n'est pas installé dans ce projet
- Ajout de `@pinia/nuxt` dans `nuxt.config.ts` modules — actuellement absent malgré son installation, ce qui peut causer des erreurs `useAuthStore()` en production build
- Création de `frontend/pages/settings/users.vue` (page stub) — élimine le warning Vue Router global sur toutes les pages
- Correction de l'erreur "Permission denied" sur la classe `Relance` dans le dashboard — ajuster les CLP Parse ou la logique de requête pour l'utilisateur authentifié
- Création de `frontend/pages/contacts/sans-email.vue` (page stub) — route prévue dans les specs mais manquante (404)

## Capabilities

### Modified Capabilities

- `relances-page` : La page `/relances` redevient fonctionnelle avec tableau et calendrier
- `impayes-list` : Le menu contextuel (dropdown) sur chaque ligne d'impayé redevient fonctionnel
- `services-page` : La page `/services` affiche correctement les états Parse Server et Parse Cloud
- `dashboard` : Le widget "relances du jour" s'affiche sans erreur de permission

### New Capabilities

- `settings-users-page` : Route `/settings/users` accessible (stub, à compléter ultérieurement)
- `contacts-sans-email-page` : Route `/contacts/sans-email` accessible (stub)

## Impact

- **Frontend** : `relances.vue`, `impayes.vue`, `services.vue`, `nuxt.config.ts`, `layouts/default.vue` (suppression lien cassé temporaire si stub non créé)
- **Backend** : Potentiellement `cloud/main.js` pour ajuster les CLP de la classe `Relance`
- **Aucune migration de données** nécessaire
- **Dépendances** : aucune nouvelle — uniquement correction d'utilisation des packages existants
