## 1. Backend — Endpoint test SMTP

- [x] 1.1 Dans `backend/server.js`, ajouter `app.post('/api/smtp/test', express.json(), ...)` : reçoit `{ host, port, username, password }`, crée un `nodemailer.createTransport(...)`, appelle `transporter.verify()`, retourne `{ ok: true }` ou `{ ok: false, error: "..." }` ; placer avant le bloc `(async () => { ... })()`

## 2. Frontend — Page `/settings/smtp`

- [x] 2.1 Créer `frontend/pages/settings/smtp.vue` (créer le dossier `settings/` si nécessaire) : au `onMounted`, charger les profils via `new $parse.Query('SmtpProfile').ascending('nom').limit(100).find()` ; refs `profiles`, `loading`
- [x] 2.2 **Header** : titre "Profils SMTP" + bouton `[ + Nouveau profil ]` qui ouvre le drawer en mode création
- [x] 2.3 **UTable** colonnes : Nom | Host | Email from | Actions (bouton ✏ → ouvre drawer édition, bouton 🗑 → ouvre modal confirmation) ; si `profiles.length === 0` : `UAlert` info "Aucun profil SMTP configuré. Créez-en un pour pouvoir envoyer des relances."
- [x] 2.4 **Modal confirmation suppression** : `UModal` avec nom du profil + avertissement si des séquences l'utilisent (check `Sequence.emails[].smtp === profile.id`) ; bouton Supprimer → `profile.destroy()` + recharger

## 3. Frontend — Drawer Créer / Modifier

- [x] 3.1 **UModal** v-model `showDrawer` avec titre dynamique ("Nouveau profil SMTP" / "Modifier le profil") ; champs : `nom`, `host`, `port`, `username`, `password`, `nom_affiche`, `email_from`, `signature_html` (Toast UI Editor)
- [x] 3.2 **Bouton `🔌 Tester la connexion`** : `$fetch('/api/smtp/test', ...)` ; afficher `✅ Connexion réussie` ou `❌ <message erreur>` ; état `testStatus`
- [x] 3.3 **Bouton Enregistrer** : création ou édition selon `modeEdition` ; `getInstance().getHTML()` pour signature ; toast succès/erreur, fermer drawer, recharger liste
