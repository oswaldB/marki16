# Rapport d'analyse — Erreurs console par page
**URL analysée :** https://dev.markidiags.com
**Date :** 2026-03-09
**Méthode :** Navigation automatisée Chrome, collecte des messages console

---

## Résumé des problèmes

| Sévérité | Nombre | Pages concernées |
|----------|--------|-----------------|
| 🔴 ERREUR CRITIQUE | 4 | `/`, `/relances`, `/contacts/sans-email`, `/settings/users` |
| 🟡 AVERTISSEMENT GLOBAL | 1 | Toutes les pages (sidebar) |
| 🟠 AVERTISSEMENT PAR PAGE | 3 | `/impayes`, `/impayes/[id]`, `/services` |
| ⚠️ ROUTE NON INDEXÉE | 2 | `/impayes/[id]`, `/sequences/[id]` |

---

## 🔴 Erreurs critiques

### 1. `/` — Dashboard : Permission denied (Parse)

**Type :** `EXCEPTION`
**Source :** `pages/index.vue:127` → fonction `chargerRelancesJour`

```
o2: Permission denied
  at handleError (parse_dist_parse__min__js.js:6474)
  at async chargerRelancesJour (pages/index.vue:127)
  at async Promise.all (index 3)
  at async pages/index.vue:48
```

**Cause probable :** La requête Parse qui charge les relances du jour échoue avec "Permission denied". L'utilisateur n'est peut-être pas connecté (session Parse absente ou expirée), ou la ACL/CLP de la classe `Relance` est trop restrictive.
**Impact :** Le widget "relances du jour" sur le dashboard ne s'affiche pas.

---

### 2. `/relances` — Module Vue non chargeable

**Type :** `ERROR`
**Source :** Vue Router + Nuxt app initialization

```
TypeError: Failed to fetch dynamically imported module:
  https://dev.markidiags.com/_nuxt/pages/relances.vue?t=1773054209762

[Vue Router warn]: uncaught error during route navigation
[Vue Router warn]: Unexpected error when starting the router
[nuxt] error caught during app initialization H3Error: Failed to fetch dynamically imported module
```

**Cause probable :** Le fichier `frontend/pages/relances.vue` contient une erreur de compilation (syntax error, import manquant, composant introuvable) qui empêche Vite de le bundler. Le module est référencé mais ne peut pas être servi.
**Impact :** La page `/relances` est **complètement inaccessible** — elle provoque aussi des erreurs en cascade sur la page suivante visitée.

---

### 3. `/contacts/sans-email` — Route inexistante (404)

**Type :** `ERROR`
**Source :** Vue Router + Nuxt

```
[Vue Router warn]: No match found for location with path "/contacts/sans-email"
[nuxt] error caught during app initialization
H3Error: Page not found: /contacts/sans-email
```

**Cause probable :** Le fichier `frontend/pages/contacts/sans-email.vue` n'existe pas. La route est référencée dans le projet (SCREENS.md) mais pas encore implémentée.
**Impact :** Page 404.

---

### 4. `/settings/users` — Route inexistante (404)

**Type :** `ERROR`
**Source :** Vue Router + Nuxt

```
[Vue Router warn]: No match found for location with path "/settings/users"
[nuxt] error caught during app initialization
H3Error: Page not found: /settings/users
```

**Cause probable :** Le fichier `frontend/pages/settings/users.vue` n'existe pas encore. La route est présente dans la sidebar et dans les specs mais pas implémentée.
**Impact :** Page 404. De plus, ce lien cassé dans la sidebar génère un avertissement Vue Router sur **toutes** les pages (voir ci-dessous).

---

## 🟡 Avertissement global (toutes les pages)

### 5. Sidebar — Lien `/settings/users` sans route correspondante

**Type :** `WARNING`
**Apparaît sur :** `/`, `/impayes`, `/sequences`, `/import-logs`, `/settings/smtp`, `/settings/users`, `/services`

```
[Vue Router warn]: No match found for location with path "/settings/users"
```

**Cause :** La sidebar (layout `default.vue`) contient un `<NuxtLink to="/settings/users">` mais la page n'existe pas. Vue Router génère cet avertissement à chaque rendu du layout.
**Correction :** Créer le fichier `frontend/pages/settings/users.vue` ou retirer temporairement le lien du layout.

---

## 🟠 Avertissements par page

### 6. `/impayes` — Composant `UDropdown` non résolu

**Type :** `WARNING`
**Source :** `<Impayes>` component

```
[Vue warn]: Failed to resolve component: UDropdown
```

**Cause probable :** `UDropdown` est un composant Nuxt UI (`@nuxt/ui`) mais le projet utilise Naive UI. Ce composant n'est pas enregistré. Il y a soit une confusion entre les deux bibliothèques UI, soit un import manquant.
**Impact :** Le dropdown concerné ne s'affiche pas, rendu silencieusement cassé.

---

### 7. `/services` — Composants Naive UI non résolus (`NTag`, `NCard`, `NButton`)

**Type :** `WARNING` (répété plusieurs fois)
**Source :** `<Services>` component

```
[Vue warn]: Failed to resolve component: NTag
[Vue warn]: Failed to resolve component: NCard
[Vue warn]: Failed to resolve component: NButton
```

**Cause probable :** La page `services.vue` utilise les composants Naive UI (`NTag`, `NCard`, `NButton`) avec le préfixe `N*`, mais ces composants ne sont pas auto-importés ou le provider Naive UI n'est pas actif pour ce layout. La page `/services` utilise un layout différent (`name=false`) contrairement aux autres pages qui passent par `NuxtLayout`.
**Impact :** Les composants s'affichent probablement vides/cassés visuellement.

---

---

## ⚠️ Pages de détail — Routes non indexées

### 8. `/impayes/[id]` — Route non reconnue par le router

**Type :** Comportement inattendu
**Fichier :** `frontend/pages/impayes/[id].vue` — **existe** mais non versionné (untracked git)

Lors de la navigation vers `/impayes/eUCwEETKuW` (ID réel récupéré via Parse), la page liste `/impayes` s'affiche à la place du détail. La stack trace des warnings confirme que le composant actif est `<Impayes>` avec `key="/impayes"` et non la page de détail.

**Erreurs observées sur cette URL :**
```
[Vue warn]: Failed to resolve component: UDropdown   (identique à /impayes)
[Vue Router warn]: No match found for location with path "/settings/users"
```

**Cause probable :** Le fichier `impayes/[id].vue` a été créé après le démarrage du serveur Nuxt dev. Le serveur n'a pas redémarré pour indexer la nouvelle route. De plus, `[id].vue` utilise des composants `UButton`, `USelect` (Nuxt UI) qui ne sont pas enregistrés dans ce projet, ce qui provoquerait des erreurs supplémentaires une fois la route activée.

**Impact :** La page de détail d'un impayé est **inaccessible**. Un `npm run dev` depuis zéro indexerait la route, mais les erreurs de composants Nuxt UI persisteraient.

---

### 9. `/sequences/[id]` — Route non vérifiable

**Type :** Non testé (données inaccessibles)
**Fichier :** `frontend/pages/sequences/[id].vue` — **existe** mais non versionné (untracked git)

La liste `/sequences` retourne "Permission denied" (CLP Parse), ce qui n'a pas permis de récupérer un ID valide pour tester la route de détail. Même problème probable que `/impayes/[id]` (route non indexée + composants potentiellement manquants).

---

## Pages sans erreur

| Page | Statut |
|------|--------|
| `/import` | ✅ Aucune erreur |
| `/contacts` | ✅ Aucune erreur |
| `/sequences` | 🟠 "Permission denied" sur le chargement des données (CLP Parse) |
| `/relances` | 🔴 (module non chargeable — voir #2) |
| `/import-logs` | ✅ Aucune erreur propre (warning global sidebar uniquement) |
| `/settings/smtp` | ✅ Aucune erreur (hors warning global sidebar) |

---

## Recommandations par priorité

1. **[P0]** Corriger `pages/relances.vue` — identifier et fixer l'erreur de compilation qui rend la page inaccessible.
2. **[P0]** Investiguer l'erreur "Permission denied" sur le dashboard — vérifier si la session Parse est bien établie et les ACL de la classe `Relance`.
3. **[P1]** Créer `pages/settings/users.vue` (même une page vide) — éliminera le warning global sur toutes les pages.
4. **[P1]** Corriger `UDropdown` dans `/impayes` — remplacer par le composant Naive UI équivalent (`NDropdown`) ou importer `UDropdown` si c'est voulu.
5. **[P1]** Corriger les composants Naive UI dans `/services` — vérifier que la page utilise bien le bon layout et que le provider Naive UI est actif.
6. **[P1]** Redémarrer le serveur Nuxt dev (`npm run dev`) pour indexer `impayes/[id].vue` et `sequences/[id].vue`, puis corriger les composants Nuxt UI (`UButton`, `USelect`) utilisés dans ces pages.
7. **[P1]** Corriger "Permission denied" sur la classe `Sequence` — vérifier les CLP dans le dashboard Parse.
8. **[P2]** Créer `pages/contacts/sans-email.vue` — route prévue dans les specs mais manquante.
