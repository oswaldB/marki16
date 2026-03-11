## Architecture

### Fichiers

- `frontend/pages/settings/smtp.vue` — page liste + drawer create/edit
- `backend/server.js` — ajout de `POST /api/smtp/test`

---

### Wireframe — Liste

```
┌──────────────────────────────────────────────────────────────┐
│  Profils SMTP                        [ + Nouveau profil ]    │
│  Nom       │ Host           │ From              │ Actions    │
│  Contact   │ smtp.gmail.com │ contact@soc.com   │ ✏ 🗑      │
│  Juridique │ smtp.gmail.com │ juridique@soc.com │ ✏ 🗑      │
└──────────────────────────────────────────────────────────────┘
```

Bannière si vide :
```
┌──────────────────────────────────────────────────────────────┐
│  ℹ Aucun profil SMTP configuré.                              │
│  Créez-en un pour pouvoir envoyer des relances.              │
└──────────────────────────────────────────────────────────────┘
```

---

### Wireframe — Drawer Créer / Modifier

```
┌──────────────────────────────────────┐
│  Profil SMTP                    [ ✕ ]│
│  Nom          [ Contact        ]     │
│  Host         [ smtp.gmail.com ]     │
│  Port         [ 587            ]     │
│  Utilisateur  [ contact@soc.com]     │
│  Mot de passe [ ••••••••       ]     │
│  Nom affiché  [ Service Fact.  ]     │
│  Email from   [ contact@soc.com]     │
│  Signature HTML [ Toast UI Editor ]  │
│                                      │
│  [ 🔌 Tester la connexion ]          │
│  ✅ Connexion réussie                │
│                                      │
│  [ Annuler ]        [ Enregistrer ]  │
└──────────────────────────────────────┘
```

---

### Requêtes Parse

```js
// Chargement
const q = new $parse.Query('SmtpProfile')
q.ascending('nom')
q.limit(100)
profiles = await q.find()

// Création
const p = new $parse.Object('SmtpProfile')
p.set('nom', form.nom)
// ...
await p.save()

// Modification
profile.set('nom', form.nom)
// ...
await profile.save()

// Suppression
await profile.destroy()
```

### Vérification avant suppression

Avant de supprimer, chercher si des séquences utilisent ce `smtp_id` dans leurs emails :
```js
// Les emails de séquence stockent l'objectId dans email.smtp
// Il faut vérifier côté client après chargement des séquences
// → au clic 🗑 : fetch les séquences qui ont email.smtp === profile.id
// Approche simple : on avertit mais on ne bloque pas
```

Note : les `SmtpProfile` sont référencés dans `Relance.smtp_id` (string) et dans `Sequence.emails[].smtp` (string objectId). Une vérification exhaustive n'est pas bloquante — on affiche juste un avertissement si des usages sont détectés.

---

### Endpoint `POST /api/smtp/test`

Dans `backend/server.js`, avant le démarrage async :

```js
app.post('/api/smtp/test', express.json(), async (req, res) => {
  const { host, port, username, password } = req.body
  if (!host || !username || !password) {
    return res.status(400).json({ ok: false, error: 'Champs manquants' })
  }
  try {
    const nodemailer = require('nodemailer')
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port) || 587,
      secure: parseInt(port) === 465,
      auth: { user: username, pass: password },
    })
    await transporter.verify()
    res.json({ ok: true })
  } catch (err) {
    res.json({ ok: false, error: err.message })
  }
})
```

### Appel depuis le frontend

```js
async function testerConnexion() {
  testStatus.value = 'loading'
  try {
    const result = await $fetch('/api/smtp/test', {
      method: 'POST',
      body: { host: form.host, port: form.port, username: form.username, password: form.password },
    })
    testStatus.value = result.ok ? 'ok' : 'error'
    testMessage.value = result.error || ''
  } catch {
    testStatus.value = 'error'
    testMessage.value = 'Erreur réseau'
  }
}
```

---

### Signature HTML (Toast UI Editor)

Champ optionnel. Si non vide, sera inclus dans les emails envoyés (côté backend, à la fin du corps). Utilisé en mode WYSIWYG avec `<Editor>` de `@toast-ui/vue-editor` (déjà installé).

---

### Modal confirmation suppression

```
Supprimer le profil "Contact" ?
⚠ Ce profil est utilisé par X séquence(s).
Les relances planifiées avec ce profil ne pourront plus être envoyées.
[ Annuler ]  [ Supprimer ]
```
