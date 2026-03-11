## Why

Marki16 est utilisé par plusieurs collaborateurs. Actuellement, aucun écran ne permet à un administrateur de créer, modifier ou supprimer des comptes utilisateurs — la gestion doit se faire manuellement via le Dashboard Parse. Il manque également un mécanisme de protection des routes admin (ex. `/settings/users`) pour empêcher un utilisateur standard d'y accéder.

## What Changes

- Implémentation complète de l'écran `/settings/users` (remplace le placeholder actuel)
- Tableau de tous les utilisateurs (nom, email, rôle, date de création)
- Création d'un utilisateur avec email + mot de passe temporaire (admin uniquement)
- Changement de mot de passe d'un utilisateur existant (admin uniquement)
- Suppression d'un utilisateur avec confirmation (admin uniquement)
- Promotion / rétrogradation d'un utilisateur en admin
- Middleware `admin.ts` qui protège `/settings/users` (redirection vers `/` si non-admin)
- Cloud Functions backend : `listUsers`, `createUser`, `deleteUser`, `updateUserPassword`, `setAdminRole`

## Capabilities

### New Capabilities

- `user-list`: Lister tous les utilisateurs Parse depuis le frontend (via Cloud Function masterKey)
- `user-create`: Créer un utilisateur (email + mot de passe) depuis l'écran admin
- `user-delete`: Supprimer un utilisateur avec modale de confirmation
- `user-password-update`: Changer le mot de passe d'un utilisateur sans connaître l'ancien
- `user-admin-toggle`: Promouvoir ou rétrograder un utilisateur via le rôle Parse `admin`
- `admin-middleware`: Middleware Nuxt `admin.ts` qui bloque les non-admins sur les routes `/settings/*`

### Modified Capabilities

- `settings/users.vue` : remplacement du placeholder par l'écran complet

## Impact

- **Backend** : `cloud/main.js` — ajout de 5 Cloud Functions avec `useMasterKey`
- **Frontend** : `pages/settings/users.vue` refait entièrement, nouveau middleware `middleware/admin.ts`
- **Parse** : utilisation du système de rôles natif `Parse.Role` (`admin`)
- **Dépendances** : aucune nouvelle dépendance
