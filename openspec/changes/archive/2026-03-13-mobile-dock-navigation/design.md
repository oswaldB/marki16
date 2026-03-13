## Context

Marki16 utilise Nuxt 3 avec un layout unique `default.vue`. La navigation est une `<aside>` fixe de 256px. Nuxt UI, TailwindCSS et `@heroicons/vue` sont disponibles. L'application est rendue côté client uniquement (`ssr: false`).

Le dock doit cohabiter avec le layout desktop sans duplication de la liste `navItems`.

## Goals / Non-Goals

**Goals:**
- Dock fixe en bas sur mobile avec les 5 routes principales
- Bouton "Plus" dans le dock pour accéder aux routes secondaires (Import PDF, Logs import, Paramètres)
- Sidebar inchangée sur desktop (`lg:flex`, dock masqué `lg:hidden`)
- Padding-bottom automatique sur le contenu pour ne pas être caché par le dock

**Non-Goals:**
- Animation ou transition du dock
- Persistance du menu "Plus" en localStorage
- Nouveau composant séparé (tout dans `default.vue`)
- Gestion du hamburger menu / overlay sidebar sur mobile

## Decisions

### 1. Classes Tailwind responsive uniquement

**Choix** : Utiliser `hidden lg:flex` sur la sidebar et `flex lg:hidden` sur le dock. Pas de JS pour détecter la taille d'écran.

**Rationale** : TailwindCSS gère le responsive en CSS pur — aucune logique JS, aucun flash au rendu, SSR-safe. Le breakpoint `lg` (1024px) est le seuil naturel pour distinguer tablette paysage / desktop.

### 2. 5 liens principaux + bouton "Plus" pour les secondaires

**Choix** : `dockItems` = Dashboard, Impayés, Contacts, Séquences, Relances. `moreItems` = Import PDF, Logs import, Profils SMTP, Utilisateurs. Un bouton "Plus" (icône `ellipsis-horizontal`) bascule `showMore` pour afficher un menu au-dessus du dock.

**Rationale** : Un dock mobile doit avoir 4-5 items max pour rester lisible. Les routes moins fréquentes passent dans "Plus" sans nécessiter de route dédiée.

### 3. Menu "Plus" en popover inline (pas de drawer)

**Choix** : Quand `showMore = true`, afficher une `<div>` positionnée `absolute bottom-16 right-0` avec les liens secondaires en liste verticale. Clic extérieur ou clic sur un lien ferme le menu.

**Rationale** : Évite d'importer `NDrawer` ou `NPopover` de Naive UI. Un simple `v-if` + `@click.outside` (via directive Vue) est suffisant et léger.

### 4. Padding-bottom du contenu principal

**Choix** : Ajouter `pb-16 lg:pb-0` sur le `<main>` pour compenser la hauteur du dock (64px = `h-16`).

**Rationale** : Sans ce padding, le dernier élément de chaque page serait partiellement caché par le dock sur mobile.

## Risks / Trade-offs

- **Breakpoint lg** : Les tablettes en mode portrait (768px–1023px) verront le dock au lieu de la sidebar. Acceptable pour une v1.
- **Menu "Plus" sans `v-click-outside`** : Nuxt UI n'expose pas cette directive nativement. Alternative : écouter `@click` sur un overlay transparent `fixed inset-0` quand `showMore = true`.

## Migration Plan

1. Modifier `default.vue` : ajouter `hidden lg:flex` sur `<aside>`, ajouter le dock, ajouter `pb-16 lg:pb-0` sur `<main>`
2. Tester sur viewport mobile (375px) et desktop (1280px)
3. Vérifier que l'état actif (lien surligné) fonctionne dans le dock
