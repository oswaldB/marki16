## 1. Backend — Cloud Functions

- [x] 1.1 Ajouter le helper `isCallerAdmin(request)` dans `cloud/main.js` : interroge `_Role` avec `useMasterKey`, retourne `true` si l'utilisateur est dans le rôle `admin`
- [x] 1.2 Ajouter `Parse.Cloud.define('checkAdminRole', ...)` : retourne `true`/`false` (utilisé par le middleware frontend)
- [x] 1.3 Ajouter `Parse.Cloud.define('listUsers', ...)` : liste tous les `_User` avec `useMasterKey`, enrichit chaque entrée avec `isAdmin` (requête sur `_Role`), retourne tableau `[{ id, username, email, createdAt, isAdmin }]`
- [x] 1.4 Ajouter `Parse.Cloud.define('createUser', ...)` : vérifie admin, crée un `Parse.User` avec `email`/`password`/`username = email`, option `makeAdmin` pour ajouter au rôle `admin`
- [x] 1.5 Ajouter `Parse.Cloud.define('deleteUser', ...)` : vérifie admin, détruit l'utilisateur via `useMasterKey`, empêche l'auto-suppression (`request.user.id !== userId`)
- [x] 1.6 Ajouter `Parse.Cloud.define('updateUserPassword', ...)` : vérifie admin, récupère l'utilisateur, appelle `user.setPassword(newPassword)`, sauvegarde avec `useMasterKey`
- [x] 1.7 Ajouter `Parse.Cloud.define('setAdminRole', ...)` : vérifie admin, ajoute ou retire l'utilisateur du rôle `admin` selon le paramètre `makeAdmin: boolean`, empêche l'auto-rétrogradation

## 2. Backend — Rôle initial

- [x] 2.1 Documenter dans `README` ou commentaire `cloud/main.js` : comment créer le rôle `admin` au premier déploiement (via Parse Dashboard ou script de seed)

## 3. Frontend — Middleware admin

- [x] 3.1 Créer `frontend/app/middleware/admin.ts` : appelle `Parse.Cloud.run('checkAdminRole')`, redirige vers `/` si retour `false` ou erreur

## 4. Frontend — Écran utilisateurs

- [x] 4.1 Refaire `frontend/app/pages/settings/users.vue` :
  - `definePageMeta({ middleware: 'admin' })`
  - `onMounted` → `Parse.Cloud.run('listUsers')` → stocker dans `users`
  - Tableau Nuxt UI (`UTable`) avec colonnes : Email, Rôle (badge), Créé le, Actions
- [x] 4.2 Ajouter le bouton "Nouvel utilisateur" en header → ouvre modale création
- [x] 4.3 Modale création : champs email + mot de passe + checkbox "Administrateur" → appel `createUser` → refresh liste
- [x] 4.4 Modale changement de mot de passe : nouveau mot de passe + confirmation → appel `updateUserPassword`
- [x] 4.5 Toggle admin (bouton shield dans Actions) : appel `setAdminRole` avec `makeAdmin: !user.isAdmin` → refresh ligne
- [x] 4.6 Modale suppression : texte de confirmation + bouton rouge → appel `deleteUser` → retrait de la liste
- [x] 4.7 Gestion des états loading / erreur sur chaque action (notification Nuxt UI)
- [x] 4.8 Désactiver les actions "supprimer" et "rétrograder" sur le compte de l'utilisateur courant (auto-protection UI)
