## Architecture

### Fichiers modifiés / créés

- `backend/cloud/main.js` — cloud function `assignerSequence` + hooks
- `backend/cloud/jobs/envoyerRelances.js` — cloud job d'envoi
- `backend/server.js` — enregistrement du job + schedule cron
- `frontend/pages/impayes/[id].vue` — appel `assignerSequence` + affichage relances
- `npm install nodemailer` côté backend

---

### Modèle `Relance` (Parse class)

```
Relance {
  impaye:      Pointer<Impaye>
  sequence:    Pointer<Sequence>   // null si relance manuelle
  email_index: Number              // index de l'email dans sequence.emails
  status:      String              // 'pending' | 'envoyé' | 'échec' | 'annulé'
  date_prevue: Date                // date assignation + email.delai jours
  date_envoi:  Date                // rempli à l'envoi réel
  to:          String              // template ex. [[payeur_email]]
  cc:          String
  objet:       String              // template brut, substitué à l'envoi
  corps:       String              // template brut HTML, substitué à l'envoi
  smtp_id:     String              // objectId de SmtpProfile
  manuel:      Boolean             // true si créée manuellement (RelanceDrawer)
  erreur:      String              // message d'erreur si status = 'échec'
}
```

---

### Cloud function `assignerSequence`

```js
Parse.Cloud.define('assignerSequence', async (request) => {
  const { impayelId, sequenceId } = request.params
  // 1. Fetch impayé
  const impaye = await new Parse.Query('Impaye').get(impayelId, { useMasterKey: true })

  // 2. Annuler les relances pending existantes (non manuelles)
  const qOld = new Parse.Query('Relance')
  qOld.equalTo('impaye', impaye)
  qOld.equalTo('status', 'pending')
  qOld.equalTo('manuel', false)
  const oldRelances = await qOld.find({ useMasterKey: true })
  for (const r of oldRelances) r.set('status', 'annulé')
  await Parse.Object.saveAll(oldRelances, { useMasterKey: true })

  // 3. Retirer la séquence si sequenceId est null
  if (!sequenceId) {
    impaye.unset('sequence')
    await impaye.save(null, { useMasterKey: true })
    return { created: 0 }
  }

  // 4. Charger la séquence
  const sequence = await new Parse.Query('Sequence').get(sequenceId, { useMasterKey: true })
  const emailsSeq = sequence.get('emails') || []

  // 5. Date de base = aujourd'hui
  const baseDate = new Date()

  // 6. Créer une Relance par email
  const relances = emailsSeq.map((email, idx) => {
    const r = new Parse.Object('Relance')
    const datePrevue = new Date(baseDate)
    datePrevue.setDate(datePrevue.getDate() + (email.delai || 0))

    r.set('impaye',      impaye)
    r.set('sequence',    sequence)
    r.set('email_index', idx)
    r.set('status',      'pending')
    r.set('date_prevue', datePrevue)
    r.set('to',          email.to   || '')
    r.set('cc',          email.cc   || '')
    r.set('objet',       email.objet || '')
    r.set('corps',       email.corps || '')
    r.set('smtp_id',     email.smtp  || '')
    r.set('manuel',      false)
    return r
  })
  await Parse.Object.saveAll(relances, { useMasterKey: true })

  // 7. Mettre à jour le pointer séquence sur l'impayé
  impaye.set('sequence', sequence)
  await impaye.save(null, { useMasterKey: true })

  return { created: relances.length }
})
```

---

### Helper `substituerVariables`

```js
function substituerVariables(template, impaye) {
  if (!template) return ''
  const d = (date) => date ? new Date(date).toLocaleDateString('fr-FR') : ''
  const vars = {
    nfacture:            impaye.get('nfacture')            || '',
    ref_piece:           impaye.get('ref_piece')           || '',
    date_piece:          d(impaye.get('date_piece')),
    reste_a_payer:       impaye.get('reste_a_payer')       ?? '',
    montant_total:       impaye.get('total_ttc')           ?? '',
    date_echeance:       d(impaye.get('date_echeance')),
    payeur_nom:          impaye.get('payeur_nom')          || '',
    payeur_email:        impaye.get('payeur_email')        || '',
    payeur_telephone:    impaye.get('payeur_telephone')    || '',
    payeur_type:         impaye.get('payeur_type')         || '',
    adresse_bien:        impaye.get('adresse_bien')        || '',
    code_postal:         impaye.get('code_postal')         || '',
    ville:               impaye.get('ville')               || '',
    numero_lot:          impaye.get('numero_lot')          || '',
    numero_dossier:      impaye.get('numero_dossier')      || '',
    employe_intervention: impaye.get('employe_intervention') || '',
    date_debut_mission:  d(impaye.get('date_debut_mission')),
  }
  return template.replace(/\[\[(\w+)\]\]/g, (_, key) => vars[key] ?? `[[${key}]]`)
}
```

---

### Cloud Job `envoyerRelances`

Fichier : `backend/cloud/jobs/envoyerRelances.js`

```js
const nodemailer = require('nodemailer')

module.exports = async function envoyerRelances({ params, message }) {
  const now = new Date()

  // 1. Requête relances dues
  const q = new Parse.Query('Relance')
  q.equalTo('status', 'pending')
  q.lessThanOrEqualTo('date_prevue', now)
  q.include('impaye')
  q.limit(100)
  const relances = await q.find({ useMasterKey: true })

  message(`${relances.length} relance(s) à envoyer`)

  let envoyees = 0, echecs = 0

  for (const relance of relances) {
    const impaye = relance.get('impaye')

    try {
      // 2. Charger profil SMTP
      const smtpId = relance.get('smtp_id')
      if (!smtpId) throw new Error('Aucun profil SMTP configuré')
      const smtp = await new Parse.Query('SmtpProfile').get(smtpId, { useMasterKey: true })

      // 3. Substituer variables
      const to   = substituerVariables(relance.get('to'),   impaye)
      const cc   = substituerVariables(relance.get('cc'),   impaye)
      const objet = substituerVariables(relance.get('objet'), impaye)
      const corps = substituerVariables(relance.get('corps'), impaye)

      if (!to) throw new Error('Destinataire vide après substitution')

      // 4. Envoyer via nodemailer
      const transporter = nodemailer.createTransport({
        host:   smtp.get('host'),
        port:   smtp.get('port') || 587,
        secure: (smtp.get('port') || 587) === 465,
        auth: {
          user: smtp.get('username'),
          pass: smtp.get('password'),
        },
      })

      await transporter.sendMail({
        from:    `"${smtp.get('nom_affiche') || ''}" <${smtp.get('email_from')}>`,
        to,
        cc:      cc || undefined,
        subject: objet,
        html:    corps,
      })

      // 5. Marquer envoyé
      relance.set('status', 'envoyé')
      relance.set('date_envoi', new Date())
      relance.unset('erreur')
      envoyees++
    } catch (err) {
      relance.set('status', 'échec')
      relance.set('erreur', err.message)
      echecs++
    }

    await relance.save(null, { useMasterKey: true })
  }

  return { envoyees, echecs }
}
```

---

### Enregistrement dans `server.js` (cron horaire)

```js
const cron = require('node-cron')
const envoyerRelances = require('./cloud/jobs/envoyerRelances')

// Toutes les heures à HH:00
cron.schedule('0 * * * *', async () => {
  console.log('[cron] envoyerRelances — démarrage')
  try {
    const result = await envoyerRelances({ message: console.log })
    console.log('[cron] envoyerRelances —', result)
  } catch (err) {
    console.error('[cron] envoyerRelances — erreur :', err.message)
  }
})
```

Aussi exposer en Parse Cloud Job pour déclenchement manuel :
```js
Parse.Cloud.job('envoyerRelances', envoyerRelances)
```

---

### Hooks Parse (dans `main.js`)

```js
// Annuler relances si séquence supprimée
Parse.Cloud.beforeDelete('Sequence', async (request) => {
  const q = new Parse.Query('Relance')
  q.equalTo('sequence', request.object)
  q.equalTo('status', 'pending')
  const relances = await q.find({ useMasterKey: true })
  for (const r of relances) r.set('status', 'annulé')
  await Parse.Object.saveAll(relances, { useMasterKey: true })
})

// Annuler relances si impayé payé
Parse.Cloud.afterSave('Impaye', async (request) => {
  const impaye = request.object
  const original = request.original
  if (impaye.get('statut') === 'payé' && original?.get('statut') !== 'payé') {
    const q = new Parse.Query('Relance')
    q.equalTo('impaye', impaye)
    q.equalTo('status', 'pending')
    const relances = await q.find({ useMasterKey: true })
    for (const r of relances) r.set('status', 'annulé')
    await Parse.Object.saveAll(relances, { useMasterKey: true })
  }
})
```

---

### Frontend — `impayes/[id].vue`

**Changement 1 — assignation séquence** : remplacer le code d'assignation directe par :
```js
await $parse.Cloud.run('assignerSequence', {
  impayelId: impaye.value.id,
  sequenceId: selectedSequenceId || null,
})
```

**Changement 2 — afficher les relances** :

Section RELANCES (déjà dans le design de la page impayé, à implémenter ou compléter) :
```js
// Requête lors du chargement
const qR = new $parse.Query('Relance')
qR.equalTo('impaye', impaye.value)
qR.ascending('date_prevue')
qR.limit(50)
relances.value = await qR.find()
```

Tableau des relances :
```
│ Date prévue │ Objet                     │ Statut   │ Actions │
│ 15/03/2026  │ Relance amiable — FA-001  │ pending  │ ✏ 🗑   │
│ 22/03/2026  │ Mise en demeure — FA-001  │ pending  │ ✏ 🗑   │
```

Badges statut :
- `pending` → badge gris "En attente"
- `envoyé`  → badge vert "Envoyé"
- `échec`   → badge rouge "Échec" + tooltip erreur
- `annulé`  → badge orange "Annulé"

**Changement 3 — relances actualisées après assignation** : après `assignerSequence`, recharger les relances via la même requête.
