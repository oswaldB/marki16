## Architecture

### Fichiers

- `pages/sequences.vue` — liste des séquences
- `pages/sequences/[id].vue` — éditeur de séquence

### Modèle de données

```
Sequence {
  nom:             String,
  lien_paiement:   String,   // URL avec variables [[nfacture]] etc.
  emails: Array<{
    delai:  Number,          // J+N depuis la date de l'impayé
    smtp:   String,          // objectId du profil SmtpProfile
    to:     String,          // ex. "[[payeur_email]]"
    cc:     String,
    objet:  String,
    corps:  String,
  }>,
  regles: Array<{
    champ:     String,       // "payeur_type" | "reste_a_payer" | "statut" | "statut_dossier"
    operateur: String,       // "egal" | "superieur" | "inferieur" | "contient"
    valeur:    String,
  }>,
  regles_type: String,       // "incluant" | "excluant" — s'applique à TOUTES les règles
}

SmtpProfile {
  nom, host, port, username, password, nom_affiche, email_from, signature_html
}
```

### `/sequences` — Liste

```
┌─────────────────────────────────────────────────────────────────┐
│  Séquences                              [ + Nouvelle séquence ] │
│  Nom                │ Emails │ Impayés │ Actions                │
│  Standard Relance   │ 5      │ 42      │ ✏ 🗑                  │
│  Mise en demeure    │ 3      │ 12      │ ✏ 🗑                  │
└─────────────────────────────────────────────────────────────────┘
```

- Query `Sequence` triée par `nom` ASC, limit 200
- Compteurs impayés : `Promise.all` de `.count()` par séquence (Pointer `sequence`)
- `✏` → `router.push('/sequences/' + seq.id)`
- `+ Nouvelle séquence` → crée un objet `Sequence` vide et navigue vers l'éditeur
- `🗑` → UModal de confirmation (avec avertissement si impayés assignés), puis `sequence.destroy()`

### `/sequences/[id]` — Éditeur

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Retour        Standard Relance              [ 💾 Enregistrer]│
│  Nom          [ Standard Relance              ]                  │
│  Lien paiement[ https://pay... ]         [ ✏ Construire ]       │
├─────────────────────────────────────────────────────────────────┤
│  EMAILS DE RELANCE                   [ ✨ Générer par IA ]      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Email 1                          J+ [ 7  ]  [ 🗑 ]    │    │
│  │  Profil SMTP [ contact@société.com ▼ ] [ + Créer ]      │    │
│  │  À    [ [[payeur_email]]                              ] │    │
│  │  CC   [                                               ] │    │
│  │  Objet[ Relance amiable — [[nfacture]]                ] │    │
│  │  Corps[ textarea (UTextarea)                          ] │    │
│  │        [ [[ ]] Variables ]  [ Demander à ChatGPT ]      │    │
│  └─────────────────────────────────────────────────────────┘    │
│  [ + Ajouter un email ]                                         │
├─────────────────────────────────────────────────────────────────┤
│  RÈGLES D'ATTRIBUTION AUTOMATIQUE                               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  payeur_type    est égal à    [ Propriétaire ]  🗑       │    │
│  │  reste_a_payer  supérieur à   [ 500 ]          🗑        │    │
│  │  Type : [ Incluant ▼ ]        [ + Ajouter un filtre ]   │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ✅ 23 impayés concernés   ❌ 19 exclus                         │
│  [ Voir les 23 impayés ]                                        │
└─────────────────────────────────────────────────────────────────┘
```

### Drawer — Construire le lien de paiement

- UModal avec un UTextarea contenant `lien_paiement`
- Bouton `[ [[ ]] Copier une variable ]` → USelect des variables → insère `[[variable]]` dans le textarea
- Aperçu live : remplace `[[nfacture]]` → `FA-2024-01`, `[[reste_a_payer]]` → `1200` (valeurs d'exemple)
- Boutons : `[ Copier le lien ]` (clipboard) et `[ Enregistrer ]` (ferme + met à jour `lien_paiement`)

### Popup — Générer par IA (global, tous les emails)

- UModal avec :
  1. Bouton `[ 📋 Copier le prompt ]` — génère un prompt textuel décrivant la séquence souhaitée + variables disponibles, le copie dans le clipboard
  2. `<p>Ouvrez ChatGPT et collez le prompt</p>`
  3. `UTextarea` pour coller la réponse JSON
  4. `[ ✓ Valider ]` → `JSON.parse(response)` → remplace `emails` si le format est valide

### Popup — Demander à ChatGPT (par email)

- UModal par email avec :
  1. Bouton `[ 📋 Copier le prompt ]` — contexte : objectif + emails précédents de la séquence + variables disponibles
  2. `UTextarea` pour coller la réponse
  3. `[ ✓ Insérer dans éditeur ]` → copie la réponse dans le champ `corps` de cet email

### Popup — Créer un profil SMTP (inline)

- UModal avec les champs : Nom, Host, Port, Utilisateur, Mot de passe, Nom affiché, Email from, Signature HTML (UTextarea)
- Bouton `[ Tester la connexion ]` → `POST /api/smtp/test` (si endpoint disponible, sinon désactivé)
- `[ Enregistrer ]` → `new $parse.Object('SmtpProfile').set({...}).save()` puis recharge la liste des profils

### Aperçu live des règles

```js
async function calculerApercu() {
  const q = new $parse.Query('Impaye')
  for (const regle of regles.value) {
    if (!regle.champ || regle.valeur === '') continue
    if (regle.operateur === 'egal')      q.equalTo(regle.champ, regle.valeur)
    if (regle.operateur === 'superieur') q.greaterThan(regle.champ, Number(regle.valeur))
    if (regle.operateur === 'inferieur') q.lessThan(regle.champ, Number(regle.valeur))
    if (regle.operateur === 'contient')  q.contains(regle.champ, regle.valeur)
  }
  const total = await new $parse.Query('Impaye').count()  // total sans filtre
  const concernes = await q.count()
  apercuConcernes.value = concernes
  apercuExclus.value = total - concernes
}
```

Watch sur `regles` (deep) avec debounce 600ms. Le `regles_type` (incluant/excluant) est un seul USelect en bas de la section règles, appliqué globalement.

### Logique d'enregistrement

```js
async function sauvegarder() {
  sequence.set('nom', nom.value)
  sequence.set('lien_paiement', lienPaiement.value)
  sequence.set('emails', emails.value)
  sequence.set('regles', regles.value)
  sequence.set('regles_type', reglesType.value)
  await sequence.save()
}
```

### Variables disponibles

```js
const VARIABLES = [
  { groupe: 'PAYEUR',   vars: ['payeur_nom', 'payeur_email', 'payeur_telephone', 'payeur_type'] },
  { groupe: 'FACTURE',  vars: ['nfacture', 'ref_piece', 'date_piece', 'reste_a_payer', 'montant_total', 'date_echeance'] },
  { groupe: 'BIEN',     vars: ['adresse_bien', 'code_postal', 'ville', 'numero_lot'] },
  { groupe: 'DOSSIER',  vars: ['numero_dossier', 'employe_intervention', 'date_debut_mission'] },
]
```

### Popover variables (Corps email)

Le bouton `[ [[ ]] Variables ]` est placé **juste sous le Corps** (Toast UI Editor). Il ouvre un popover ancré en dessous :

```
│  Corps[ Toast UI Editor                              ]  │
│       ──────────────────────────────────────────────    │
│       [ [[ ]] Variables ]  [ 🔗 Lien de paiement ]  [ Demander à ChatGPT ]  │
│       ┌──────────────────────────────────────────┐      │
│       │  🔍 [ Rechercher une variable...        ] │      │
│       │  PAYEUR                                  │      │
│       │  [payeur_nom] [payeur_email]              │      │
│       │  [payeur_telephone] [payeur_type]         │      │
│       │  FACTURE                                  │      │
│       │  [nfacture] [ref_piece] [date_piece]      │      │
│       │  [reste_a_payer] [montant_total]           │      │
│       │  ...                                      │      │
│       │  💡 Clic → copié · collez avec Ctrl+V     │      │
│       └──────────────────────────────────────────┘      │
```

- La search bar filtre les variables en temps réel (sur le nom) ; les groupes sans résultat sont masqués
- Clic sur un chip → `navigator.clipboard.writeText('[[variable]]')` + toast "Copié — collez avec Ctrl+V"
- Le popover se ferme au clic extérieur (v-show + `@click.outside`)
- Bouton `[ 🔗 Lien de paiement ]` (séparé du popover) → copie directement la valeur brute de `lienPaiement` (ex: `https://pay.io?amount=[[montantttc]]`) dans le presse-papier + même toast ; si `lienPaiement` est vide, le bouton est désactivé

Pour lire le contenu à la sauvegarde : `editorRef.value.getInstance().getHTML()`. Le `[[variable]]` reste intact dans le HTML produit — substitué côté serveur à l'envoi.

### Variables dans le drawer Lien de paiement

Dans le drawer "Construire", même liste `VARIABLES` mais comportement différent : le textarea est contrôlé (`ref`), donc on **insère directement** à la position du curseur via `selectionStart`/`selectionEnd` :

```js
function insererVariable(varName, textareaEl) {
  const v = `[[${varName}]]`
  const s = textareaEl.selectionStart
  const e = textareaEl.selectionEnd
  lienPaiementEdit.value = lienPaiementEdit.value.slice(0, s) + v + lienPaiementEdit.value.slice(e)
  nextTick(() => { textareaEl.selectionStart = textareaEl.selectionEnd = s + v.length })
}
```

Le drawer affiche le même popover avec search bar, mais le clic insère dans le textarea au lieu de copier dans le presse-papier.

### Dépendances frontend

- `@toast-ui/vue-editor` à installer (`npm install @toast-ui/vue-editor`)
- Clipboard API native pour les boutons "Copier"
