## Context

Marki16 tourne sur Express + Parse Server. Parse Server gère nativement les utilisateurs via `Parse.User` et les rôles via `Parse.Role`. L'écran `/settings/users` existe déjà mais n'affiche qu'un placeholder. Le frontend est en Nuxt 3 avec Nuxt UI (composants `UTable`, `UButton`, `UModal`, etc.).

## Goals / Non-Goals

**Goals:**
- Lister, créer, supprimer des utilisateurs Parse depuis une interface admin
- Changer le mot de passe d'un utilisateur (sans connaître l'ancien)
- Gérer le rôle `admin` (promotion / rétrogradation)
- Protéger `/settings/users` via un middleware Nuxt qui vérifie le rôle `admin`

**Non-Goals:**
- Gestion des sessions / tokens (Parse le fait nativement)
- Invitation par email (pas d'SMTP dédié à l'onboarding)
- Permissions granulaires par ressource (ACL Parse non couverte ici)
- Audit log des actions admin

## Decisions

### 1. Cloud Functions avec masterKey pour lister et modifier les utilisateurs

**Choix** : 5 Cloud Functions (`listUsers`, `createUser`, `deleteUser`, `updateUserPassword`, `setAdminRole`) toutes appelées avec `useMasterKey: true` côté backend.

**Rationale** : La classe `_User` Parse est protégée par défaut — un utilisateur ne peut pas lire les autres. `masterKey` est la seule façon de lire/modifier tous les utilisateurs sans modifier les CLPs. Les Cloud Functions permettent de centraliser l'autorisation (vérifier que l'appelant est admin) avant d'agir.

**Alternative écartée** : modifier les CLPs de `_User` pour permettre la lecture publique — trop permissif.

### 2. Rôle Parse natif `admin`

**Choix** : Utiliser `Parse.Role` avec le nom `admin`. Un utilisateur est admin s'il est membre de ce rôle.

**Rationale** : Parse gère nativement les rôles avec `Parse.Role`. Pas besoin d'un champ custom `isAdmin` sur `_User`. La vérification côté backend : `const adminRole = await new Parse.Query(Parse.Role).equalTo('name', 'admin').first({ useMasterKey: true }); const users = adminRole.getUsers(); const isAdmin = await new Parse.Query(users).equalTo('objectId', request.user.id).find(...)`.

**Alternative écartée** : champ `isAdmin: Boolean` sur `_User` — plus simple mais ne tire pas parti du système de rôles Parse, et ne permet pas d'étendre à d'autres rôles plus tard.

### 3. Middleware Nuxt `admin.ts` (non global)

**Choix** : Middleware nommé `admin` (non global — ne s'applique que sur les pages qui le déclarent via `definePageMeta({ middleware: 'admin' })`). Il vérifie si l'utilisateur courant est membre du rôle `admin` en interrogeant la Cloud Function `isAdmin` (ou via `Parse.Query` sur `_Role`).

**Rationale** : Le middleware global `auth.global.ts` gère déjà l'authentification. Un middleware dédié et non global pour l'admin évite une requête Parse à chaque navigation. Seul `/settings/users` le déclare pour l'instant — extensible facilement.

### 4. UX — Modale unique réutilisable

**Choix** : Une seule modale dans `users.vue` avec un état (`mode: 'create' | 'edit-password' | 'delete'`) pour les trois actions destructives.

**Rationale** : Évite la multiplication des composants pour ce premier écran. La modale est simple (formulaire à 2 champs max). Cohérent avec `smtp.vue` qui suit le même pattern.

## Architecture

### Backend — Cloud Functions (`cloud/main.js`)

```
listUsers()
  → Parse.Query(_User).find({ useMasterKey })
  → retourne [{id, username, email, createdAt, isAdmin}]

createUser(email, password)
  → vérifie que l'appelant est admin
  → new Parse.User().signUp(... { useMasterKey })
  → ajoute au rôle 'admin' si demandé

deleteUser(userId)
  → vérifie que l'appelant est admin
  → new Parse.User({ id: userId }).destroy({ useMasterKey })

updateUserPassword(userId, newPassword)
  → vérifie que l'appelant est admin
  → user.setPassword(newPassword); user.save(null, { useMasterKey })

setAdminRole(userId, makeAdmin: boolean)
  → vérifie que l'appelant est admin
  → adminRole.getUsers().add(user) ou .remove(user)
  → adminRole.save({ useMasterKey })
```

Helper partagé `isCallerAdmin(request)` : requête sur `_Role` avec `useMasterKey`.

### Frontend — `pages/settings/users.vue`

```
- definePageMeta({ middleware: 'admin' })
- onMounted → Parse.Cloud.run('listUsers') → tableau
- Colonnes : Nom/Email | Rôle (badge Admin / Utilisateur) | Créé le | Actions
- Actions : Changer MDP (icône clé) | Toggle admin (icône shield) | Supprimer (icône poubelle)
- Bouton header : "Nouvel utilisateur" → modale création
- Modale création : champs email + mot de passe + checkbox "Administrateur"
- Modale MDP : champs nouveau mot de passe (+ confirmation)
- Modale suppression : confirmation texte
```

### Middleware — `middleware/admin.ts`

```typescript
export default defineNuxtRouteMiddleware(async (to) => {
  const { $parse } = useNuxtApp()
  const currentUser = $parse.User.current()
  if (!currentUser) return navigateTo('/login')

  // Vérifier le rôle admin via Cloud Function légère
  const adminOk = await $parse.Cloud.run('checkAdminRole')
  if (!adminOk) return navigateTo('/')
})
```

Cloud Function `checkAdminRole` : retourne `true`/`false` selon si l'appelant est dans le rôle `admin`.

## Risks / Trade-offs

- **Premier admin** : Le premier compte créé directement dans Parse Dashboard n'est pas automatiquement dans le rôle `admin`. Il faudra le faire manuellement via le Dashboard ou un script de seed au premier déploiement.
- **Sécurité** : Les Cloud Functions vérifient que l'appelant est admin, mais le middleware frontend est contournable côté client — la sécurité réelle est au niveau du backend (Cloud Functions).
- **Changement de mot de passe** : Parse nécessite un `sessionToken` ou `masterKey` pour changer le mot de passe. On utilise `masterKey` côté Cloud Function — acceptable car la vérification admin est faite avant.

## Migration Plan

1. Ajouter les Cloud Functions dans `cloud/main.js`
2. Créer manuellement le rôle `admin` dans Parse Dashboard et y ajouter le premier utilisateur
3. Créer `middleware/admin.ts`
4. Refaire `pages/settings/users.vue`
5. Vérifier que la navigation `/settings/users` est bien protégée
