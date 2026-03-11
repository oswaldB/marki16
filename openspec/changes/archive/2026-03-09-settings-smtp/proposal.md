## Pourquoi

Les profils SMTP sont utilisés par les séquences pour envoyer les relances. Actuellement, on peut en créer depuis le drawer inline dans `/sequences/[id]`, mais il n'existe pas de page dédiée pour les gérer (liste, modifier, supprimer, tester la connexion).

Sans cette page, l'utilisateur ne peut pas vérifier quels profils existent, corriger une configuration incorrecte, ou tester une connexion avant de l'utiliser dans une séquence.

## Quoi

### Page `/settings/smtp`

- **Liste UTable** : Nom | Host | From | Actions (✏ modifier, 🗑 supprimer)
- **Bouton `+ Nouveau profil`** → ouvre un drawer de création
- **Bannière vide** : si aucun profil, message invitant à en créer un
- **Drawer Créer / Modifier** : tous les champs (Nom, Host, Port, Utilisateur, Mot de passe, Nom affiché, Email from, Signature HTML via Toast UI Editor)
- **Bouton `🔌 Tester la connexion`** : appelle `POST /api/smtp/test` côté backend (nodemailer verify), affiche ✅ ou ❌
- **Suppression** : confirmation UModal, vérifier si des séquences utilisent ce profil (avertissement)

### Backend

- Endpoint `POST /api/smtp/test` dans `server.js` : reçoit les credentials, tente `transporter.verify()` via nodemailer, retourne `{ ok: true }` ou `{ ok: false, error: "..." }`

## Ce qui ne change pas

- Le modèle `SmtpProfile` (Parse class) reste identique : `nom`, `host`, `port`, `username`, `password`, `nom_affiche`, `email_from`, `signature_html`
- La popup SMTP inline dans `/sequences/[id]` reste fonctionnelle pour la création rapide
