## 1. Config Nuxt — Pinia module manquant

- [x] 1.1 Dans `frontend/nuxt.config.ts`, ajouter `'@pinia/nuxt'` à la liste `modules` (après `'@nuxt/ui'`)

## 2. Fix `services.vue` — Composants Naive UI → Nuxt UI

- [x] 2.1 Dans `frontend/pages/services.vue`, remplacer `<NCard>` par `<UCard>` (2 occurrences)
- [x] 2.2 Remplacer `<NTag :type="tagType(...)">` par `<UBadge :color="tagType(...)">` — adapter `tagType()` pour retourner les couleurs Nuxt UI (`'success'` → `'green'`, `'error'` → `'red'`, `'default'` → `'neutral'`)
- [x] 2.3 Remplacer `<NButton type="primary">` par `<UButton color="primary">`

## 3. Fix `impayes.vue` — UDropdown → UDropdownMenu

- [x] 3.1 Dans `frontend/pages/impayes.vue`, remplacer toutes les occurrences de `<UDropdown` par `<UDropdownMenu` (2 occurrences dans le template)
- [x] 3.2 Adapter la fonction `menuItems()` : Nuxt UI v4 `UDropdownMenu` attend un tableau plat `[{ label, icon, onSelect }]` — remplacer `click:` par `onSelect:` et supprimer le tableau imbriqué `[[...]]`

## 4. Fix `relances.vue` — Import lazy de @toast-ui/vue-editor et FullCalendar

- [x] 4.1 Supprimer les imports statiques `import FullCalendar ...` et `import { Editor } from '@toast-ui/vue-editor'` en haut du `<script setup>`
- [x] 4.2 Déclarer `FullCalendar` et `Editor` via `defineAsyncComponent(() => import(...))` dans le script setup
- [x] 4.3 Dans le template, envelopper `<FullCalendar>` et `<Editor>` dans `<ClientOnly>` avec un fallback (slot `#fallback`) affichant un squelette ou un texte de chargement
- [ ] 4.4 Vérifier que la page `/relances` charge sans erreur console après redémarrage du serveur Nuxt dev

## 5. Fix dashboard `index.vue` — Guard session Parse avant requête Relance

- [x] 5.1 Dans `frontend/pages/index.vue`, dans la fonction `chargerRelancesJour()`, ajouter en début de fonction : `if (!$parse.User.current()) return` pour éviter la requête si la session n'est pas prête
- [ ] 5.2 Si l'erreur "Permission denied" persiste après le fix 5.1, documenter qu'il faut activer "Requires Authentication" sur la classe `Relance` dans le Parse Dashboard (accès `/parse/dashboard`)

## 6. Pages stubs manquantes

- [x] 6.1 Créer `frontend/pages/settings/users.vue` — page stub avec titre "Gestion des utilisateurs" et message "Cette page est en cours de développement."
- [x] 6.2 Créer `frontend/pages/contacts/sans-email.vue` — page stub avec titre "Contacts sans email" et message "Cette page est en cours de développement."

## 7. Vérification finale

- [x] 7.1 Redémarrer le serveur Nuxt dev (`./stop.sh && ./start.sh`)
- [ ] 7.2 Naviguer sur toutes les pages et vérifier l'absence d'erreurs critiques en console :
  - `/` — pas d'erreur "Permission denied"
  - `/impayes` — pas de warning `UDropdown`
  - `/relances` — page accessible, pas d'erreur module
  - `/services` — pas de warning `NCard`/`NTag`/`NButton`
  - `/settings/users` — page accessible (stub)
  - `/contacts/sans-email` — page accessible (stub)
  - Toutes les pages — pas de warning `No match found for /settings/users`
