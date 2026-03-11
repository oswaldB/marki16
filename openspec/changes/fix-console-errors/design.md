## Context

Marki16 utilise **Nuxt 4.3 + @nuxt/ui v4.5 + Vite 6**. Le CLAUDE.md mentionne Naive UI mais c'est outdaté — le projet n'utilise pas `naive-ui` (absent de `package.json`). Toutes les pages utilisent les composants Nuxt UI (`UCard`, `UButton`, `UIcon`, etc.).

Le rapport d'erreurs console identifie les problèmes suivants, classés par cause racine.

## Goals / Non-Goals

**Goals:**
- Rendre `/relances` à nouveau accessible (erreur module compilation)
- Éliminer le warning Vue Router global (lien `/settings/users` dans la sidebar)
- Corriger `UDropdown` → `UDropdownMenu` dans `/impayes`
- Corriger les composants Naive UI dans `/services`
- Corriger "Permission denied" sur `Relance` dans le dashboard
- Créer les pages stubs manquantes (`settings/users`, `contacts/sans-email`)

**Non-Goals:**
- Implémenter le contenu complet de `settings/users.vue` (gestion utilisateurs)
- Implémenter le contenu complet de `contacts/sans-email.vue`
- Corriger les ACL de la classe `Sequence` (hors scope, problème distinct)
- Corriger les routes `impayes/[id]` et `sequences/[id]` (scope séparé)

## Decisions

### 1. Fix `relances.vue` : lazy import de `@toast-ui/vue-editor` et FullCalendar

**Problème :** `TypeError: Failed to fetch dynamically imported module` — Vite 6 (Nuxt 4) échoue à transformer `@toast-ui/vue-editor` lors du dynamic import du chunk page. La configuration `optimizeDeps.include` dans `nuxt.config.ts` est insuffisante pour Nuxt 4.

**Choix :** Envelopper `<Editor>` dans un composant `<ClientOnly>` et utiliser `defineAsyncComponent` pour l'import, ce qui retarde l'import à l'exécution côté client et évite le problème de transformation SSR/Vite. FullCalendar est également concerné.

**Alternative écartée :** Remplacer `@toast-ui/vue-editor` par une `<textarea>` simple — trop régressif fonctionnellement pour l'éditeur de corps de mail.

**Alternative écartée :** Ajouter `@toast-ui/vue-editor` au `ssr: false` Vite plugin — non applicable car `ssr: false` est déjà global dans ce projet. Le problème est dans la transformation Vite du chunk.

### 2. Fix `impayes.vue` : `UDropdown` → `UDropdownMenu`

**Problème :** Dans Nuxt UI v4, `UDropdown` a été renommé `UDropdownMenu`. La signature des items change aussi : au lieu d'un tableau de tableaux `[[...]]`, le prop `items` accepte un tableau plat `[...]` avec `type: 'separator'` pour les séparateurs.

**Choix :** Remplacer `<UDropdown :items="menuItems(row)">` par `<UDropdownMenu :items="menuItems(row)">` et adapter la structure de `menuItems()` au format v4 (tableau plat).

### 3. Fix `services.vue` : Naive UI → Nuxt UI

**Problème :** `NCard`, `NTag`, `NButton` sont des composants Naive UI. `naive-ui` n'est pas installé (`package.json` ne le liste pas). La page utilise `layout: false` ce qui est une configuration intentionnelle (page sans sidebar).

**Choix :** Remplacer :
- `NCard` → `UCard`
- `NTag` → `UBadge` (avec la prop `color` mappée depuis `tagType()`)
- `NButton` → `UButton`

Les props et slots Nuxt UI sont équivalents pour cet usage simple.

### 4. Ajout `@pinia/nuxt` dans `nuxt.config.ts`

**Problème :** `@pinia/nuxt` est installé dans `package.json` mais absent de la liste `modules` dans `nuxt.config.ts`. En mode dev Nuxt peut auto-détecter, mais en production build cela peut causer des erreurs `useAuthStore()` dans le layout.

**Choix :** Ajouter `'@pinia/nuxt'` à `modules` dans `nuxt.config.ts`.

### 5. Correction "Permission denied" sur `Relance` dans le dashboard

**Problème :** La fonction `chargerRelancesJour()` dans `index.vue` (ligne 127) lance une `Parse.Query('Relance').find()` qui retourne "Permission denied". Cela peut venir de deux causes :
- (a) La session Parse n'est pas encore établie quand la requête est lancée (race condition au montage)
- (b) La CLP de la classe `Relance` n'autorise pas la lecture pour les utilisateurs authentifiés

**Choix :** Envelopper l'appel dans un `try/catch` silencieux avec une valeur par défaut (`0`) est déjà en place selon le code. Le vrai fix est de s'assurer que `chargerRelancesJour()` est appelée **après** que la session Parse soit prête. Ajouter un guard `if (!$parse.User.current()) return` en début de fonction.

Si l'erreur persiste (CLP), documenter dans les tasks qu'il faut activer "Requires Authentication" sur la classe `Relance` dans le Parse Dashboard.

### 6. Pages stubs : `settings/users.vue` et `contacts/sans-email.vue`

**Choix :** Créer des pages minimales avec un message "En cours de développement". Cela suffit à éliminer les erreurs 404 et le warning Vue Router global sans introduire de fonctionnalité incomplète.

## Risks / Trade-offs

- **`@toast-ui/vue-editor` avec `defineAsyncComponent`** : L'éditeur apparaîtra avec un léger délai au premier rendu du modal. Acceptable (le modal n'est pas ouvert au chargement de la page).
- **CLP Parse** : Si la permission denied vient des CLP et non du timing, le fix guard n'est pas suffisant — un accès au Parse Dashboard sera nécessaire.
- **`UDropdownMenu` API** : Nuxt UI v4 a changé le format des items. Le mapping doit être vérifié sur la doc officielle v4.

## Migration Plan

1. Corriger `nuxt.config.ts` (pinia module)
2. Corriger `services.vue` (composants Naive UI)
3. Corriger `impayes.vue` (UDropdown → UDropdownMenu)
4. Corriger `relances.vue` (import lazy)
5. Corriger `index.vue` guard Parse session
6. Créer `settings/users.vue` et `contacts/sans-email.vue`
7. Redémarrer le serveur Nuxt dev et vérifier console propre
