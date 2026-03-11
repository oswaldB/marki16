## 1. Backend — Cloud Function `ping`

- [x] 1.1 Dans `backend/cloud/main.js`, ajouter `Parse.Cloud.define('ping', async () => ({ ok: true, ts: new Date() }))` pour permettre le test de Parse Cloud depuis le frontend

## 2. Frontend — Page `/services`

- [x] 2.1 Créer `frontend/pages/services.vue` avec `definePageMeta({ auth: false })` pour exclure la page de l'authentification
- [x] 2.2 Au `onMounted`, déclencher automatiquement les deux checks en parallèle (`Promise.allSettled`) : fetch `/api/healthy` pour Parse Server, `$parse.Cloud.run('ping')` pour Parse Cloud
- [x] 2.3 Afficher deux cartes de statut (Naive UI `NCard`) : une pour Parse Server, une pour Parse Cloud — chacune avec badge coloré (vert/rouge/gris selon état), temps de réponse en ms, et message d'erreur si échec
- [x] 2.4 Ajouter un bouton "Tester les services" qui relance les deux checks en parallèle avec état `loading` (spinner) pendant l'exécution

## 3. Middleware — Exclusion de `/services`

- [x] 3.1 Dans `frontend/middleware/auth.ts`, ajouter `/services` à la liste des routes exclues de la vérification d'authentification (ou vérifier que `definePageMeta({ auth: false })` suffit selon l'implémentation actuelle du middleware)
