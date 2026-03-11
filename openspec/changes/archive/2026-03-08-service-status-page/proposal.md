## Why

Il n'existe aucun moyen rapide de vérifier si le backend Parse Server et Parse Cloud fonctionnent correctement sans accéder aux logs serveur ou au Parse Dashboard. Une page de statut publique permet à l'administrateur (ou à un outil de monitoring) de contrôler l'état des services en un coup d'œil, sans avoir besoin de se connecter.

## What Changes

- Nouvelle page frontend `/services` accessible sans authentification (exclue du middleware `auth.ts`)
- La page affiche deux indicateurs de statut : **Parse Server** (health check via `/healthy`) et **Parse Cloud** (appel à une Cloud Function de test)
- Un bouton "Tester" déclenche les deux vérifications et met à jour les indicateurs en temps réel

## Capabilities

### New Capabilities

- `service-status-page` : Page `/services` affichant l'état de Parse Server et Parse Cloud avec test interactif, sans authentification requise

### Modified Capabilities

- `auth-middleware` : Le middleware `auth.ts` est mis à jour pour exclure la route `/services` de la protection par authentification

## Impact

- **Backend** : `cloud/main.js` — ajout d'une Cloud Function `ping` qui retourne `{ ok: true }` (test Parse Cloud)
- **Frontend** : nouvelle page `frontend/pages/services.vue` ; mise à jour du middleware `auth.ts` pour exclure `/services`
- **Dépendances** : aucune nouvelle dépendance
