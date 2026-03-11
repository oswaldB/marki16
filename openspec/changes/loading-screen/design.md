## Context

Marki16 est une app Nuxt 3 avec authentification Parse. Au démarrage, `plugins/parse.client.js` initialise le SDK Parse côté client, puis `app.vue` appelle `authStore.fetchCurrentUser()` dans `onMounted`. Le middleware `auth.global.ts` redirige vers `/login` si non authentifié.

Le problème : entre le premier rendu et la fin de `fetchCurrentUser()`, le layout et les pages s'affichent brièvement sans données, voire avec un flash de contenu non authentifié. L'utilisateur voit un écran blanc ou une interface incomplète pendant ce délai.

## Goals / Non-Goals

**Goals:**
- Afficher un écran de chargement plein-écran dès que l'app démarre, avant le rendu du layout
- Masquer cet écran une fois `fetchCurrentUser()` résolu (succès ou échec)
- Transition douce (fade-out) pour éviter un saut brutal
- Cohérence visuelle avec l'identité Marki (couleurs sky/blanc)

**Non-Goals:**
- Barre de progression pour les transitions de routes (ce serait `<NuxtLoadingIndicator>`, un sujet distinct)
- Skeleton screens par page
- Loading screen statique HTML (avant hydratation Nuxt) — complexité inutile pour ce cas

## Decisions

### 1. Overlay Vue dans `app.vue` (pas de loading HTML statique)

**Choix** : Un `<div>` conditionnel dans `app.vue` avec `v-if="isLoading"` qui s'affiche en `position: fixed` au-dessus du layout.

**Rationale** : La lenteur observée vient de l'initialisation client-side (après hydratation), pas du SSR. Un loading HTML statique résoudrait un problème différent. Un overlay Vue est plus simple, facile à styler, et s'intègre naturellement avec le store Pinia.

**Alternative écartée** : `app/loading.vue` (Nuxt built-in) — prévu pour le chargement des routes, pas pour l'init globale.

### 2. État `isLoading` dans `app.vue`, piloté par `authStore`

**Choix** : `app.vue` déclare un `ref<boolean> isLoading = true`. `fetchCurrentUser()` est attendu avec `await`. Une fois résolu, `isLoading` passe à `false`.

**Rationale** : Centraliser la logique d'init dans `app.vue` où elle existe déjà. Pas besoin d'un store dédié pour un état aussi simple.

### 3. Transition CSS fade-out

**Choix** : `<Transition name="fade">` Nuxt/Vue native avec `opacity` en CSS. Durée 300 ms.

**Rationale** : Suffisant, sans dépendance externe. Le fondu évite le saut visuel abrupt.

### 4. Visuel de l'écran de chargement

- Fond blanc
- Logo Marki centré (`/marki-logo.png`)
- Spinner animé en dessous (CSS pur, couleur `sky-500`)
- Texte "Chargement…" en gris clair

## Risks / Trade-offs

- Si `fetchCurrentUser()` échoue silencieusement ou ne se résout jamais, l'écran de chargement resterait bloqué → mitigation : `try/finally` pour garantir que `isLoading` passe à `false` dans tous les cas.
- Le middleware `auth.global.ts` s'exécute avant `onMounted` — pas de conflit, car le middleware vérifie `Parse.User.current()` (synchrone, lit le cache local) tandis que `fetchCurrentUser()` valide côté serveur.
