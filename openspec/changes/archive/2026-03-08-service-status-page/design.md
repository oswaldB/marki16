## Context

Marki16 tourne sur Express + Parse Server (port 1555) avec un endpoint `/healthy` déjà exposé pour les health checks. Le frontend est Nuxt 3 avec Naive UI. Toutes les routes sont protégées par `middleware/auth.ts` qui redirige vers `/login` si l'utilisateur n'est pas authentifié.

Le frontend proxie `/api` vers le backend via `nuxt.config.ts`. L'URL du Parse Server est disponible dans `runtimeConfig.public`.

## Goals / Non-Goals

**Goals :**
- Page `/services` visible sans login
- Vérifier que Parse Server répond (HTTP GET `/healthy`)
- Vérifier que Parse Cloud fonctionne (appel d'une Cloud Function `ping`)
- Bouton "Tester" qui relance les deux vérifications et affiche les résultats

**Non-Goals :**
- Monitoring continu ou polling automatique
- Vérification d'autres services (MongoDB, FTP, Ollama, SMTP)
- Alertes ou notifications

## Decisions

### 1. Cloud Function `ping` pour tester Parse Cloud

**Choix** : Ajouter une Cloud Function `ping` dans `cloud/main.js` qui retourne simplement `{ ok: true, ts: new Date() }`.

**Rationale** : Le moyen le plus direct de valider que Parse Cloud est opérationnel est d'appeler une fonction réelle. Pas besoin d'une route Express supplémentaire — `Parse.Cloud.run('ping')` côté client suffit.

```js
Parse.Cloud.define('ping', async () => {
  return { ok: true, ts: new Date() };
});
```

### 2. Test Parse Server via fetch sur `/healthy`

**Choix** : Côté client, faire un `fetch` vers `/api/healthy` (proxié par Nuxt vers le backend port 1555).

**Rationale** : L'endpoint `/healthy` existe déjà dans `server.js`. Le proxy Nuxt (`/api` → `:1555`) évite les problèmes CORS. Pas de modification backend nécessaire.

**Réponse attendue** : HTTP 200, corps quelconque → statut `ok`.

### 3. Page Vue sans authentification

**Choix** : Ajouter `definePageMeta({ auth: false })` dans la page et exclure `/services` du middleware `auth.ts`.

**Rationale** : La page de statut doit être accessible pour un monitoring externe ou avant login. Le middleware Nuxt vérifie déjà une propriété `auth` dans les meta pour les exclusions.

**Structure de la page :**
- Deux cartes (ou lignes) : une pour Parse Server, une pour Parse Cloud
- Chaque carte affiche : nom du service, statut (badge vert/rouge/gris), temps de réponse (ms), message d'erreur si échec
- Bouton "Tester les services" en haut → déclenche les deux checks en parallèle
- État `loading` pendant les checks (spinner sur le bouton)
- Les checks s'exécutent automatiquement au montage de la page

### 4. Gestion des états de statut

| État | Badge | Description |
|---|---|---|
| `idle` | Gris | Pas encore testé |
| `checking` | Gris + spinner | Test en cours |
| `ok` | Vert | Service opérationnel |
| `error` | Rouge | Service inaccessible ou erreur |

## Risks / Trade-offs

- **Exposition publique** : La page ne révèle que l'état opérationnel (ok/error), pas de données métier. Risque minimal.
- **CORS** : En passant par le proxy Nuxt (`/api/healthy`), on évite le problème. Si le proxy est mal configuré, le test Parse Server échouera côté client en développement — acceptable, c'est précisément ce qu'on veut détecter.
- **Parse Cloud depuis une page publique** : `Parse.Cloud.run('ping')` utilise la JavaScript Key, qui est déjà exposée côté client dans toute l'app. Pas de nouvelle surface d'attaque.

## Migration Plan

1. Ajouter la Cloud Function `ping` dans `cloud/main.js`
2. Créer `frontend/pages/services.vue`
3. Mettre à jour `middleware/auth.ts` pour exclure `/services`
