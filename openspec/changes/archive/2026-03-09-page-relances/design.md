## Architecture

### Fichiers

- `frontend/pages/relances.vue` — page principale (vue tableau + vue calendrier)

### Dépendances à installer

```bash
cd frontend && npm install @fullcalendar/vue3 @fullcalendar/daygrid @fullcalendar/interaction
```

---

### Requête Parse

```js
const q = new $parse.Query('Relance')
q.include('impaye')   // pour nfacture
q.include('sequence') // pour nom séquence (filtre)
q.descending('dateEnvoi')
q.limit(500)

// Filtres appliqués dynamiquement :
if (filtreStatut !== 'tous') q.equalTo('statut', filtreStatut)
if (filtreSequence) q.equalTo('sequence', seqPtr)
// Recherche libre : pas de full-text Parse → filtrage côté client sur objet + to
```

Les relances sont chargées en une fois (limit 500) et filtrées côté client pour la recherche libre. Rechargement complet à chaque changement de filtre statut/séquence.

---

### Wireframe — Barre du haut

```
┌─────────────────────────────────────────────────────────────┐
│  Relances                                                    │
│  [ 📅 Calendrier ] [ ☰ Tableau ]                            │
│  Statut [ Tous ▼ ]  Séquence [ Toutes ▼ ]  🔍 Rechercher.. │
└─────────────────────────────────────────────────────────────┘
```

---

### Vue Tableau

```
☐ │ Date envoi │ Objet                   │ Dest.     │ Facture   │ Statut   │ Actions
☐ │ 10/04/2024 │ Relance 1 — FA-2024-01  │ m@m.com   │ FA-001    │ En att.  │ ✏ 🗑
  │ 25/03/2024 │ Relance 1 — FA-2024-02  │ l@l.com   │ FA-002    │ ✅ Envoyé│ 👁
  │ 20/03/2024 │ Relance 1 — FA-2024-07  │ m@m.com   │ FA-007    │ ❌ Échec │ ✏ 🔁
```

Colonnes :
- `dateEnvoi` — date prévue formatée `fr-FR`
- `objet` — avec badge ✋ si `manuelle === true`
- `to` — destinataire brut (template `[[payeur_email]]` ou email réel après substitution)
- `nfacture` — via `relance.get('impaye')?.get('nfacture')` (lien vers `/impayes/:id`)
- `statut` — `UBadge` coloré
- `actions` — selon statut (voir Actions par statut)

**Actions par statut :**
- `pending` : ✏ (drawer modifier) + 🗑 (annuler → `statut = 'annulé'`)
- `envoyé`  : 👁 (drawer lecture seule avec corps substitué mock)
- `échec`   : ✏ (drawer modifier) + 🔁 (réessayer → `statut = 'pending'`, `dateEnvoi = maintenant`)
- `annulé`  : aucune action (ligne grisée)

**Sélection groupée :**
- `v-model:selected` sur UTable
- Barre flottante en bas si sélection > 0 : `[ 🗑 Annuler X relances sélectionnées ]`
- Annulation → `statut = 'annulé'` sur toutes (pas de `destroy`)

---

### Vue Calendrier

FullCalendar `dayGridMonth` avec les relances comme events :

```js
const events = computed(() => relancesFiltrees.value.map(r => ({
  id:    r.id,
  title: `${r.get('to')?.split('@')[0] || '?'} — ${r.get('objet')?.slice(0, 20) || ''}`,
  date:  r.get('dateEnvoi'),
  color: statutColor(r.get('statut')),
  extendedProps: { relance: r },
})))
```

Couleurs : `pending` → `#3b82f6` (bleu), `envoyé` → `#22c55e` (vert), `échec` → `#ef4444` (rouge), `annulé` → `#9ca3af` (gris)

Clic sur un event → ouvre un panneau latéral (div fixe à droite) listant les relances du même jour avec actions.

---

### Drawer — Modifier une relance

`UModal` (ou drawer latéral) avec :

```
Date d'envoi  [ 10/04/2024 ]     (UInput type="date")
À             [ martin@email.com ]
CC            [                  ]
Objet         [ Relance 1 — FA-2024-01 ]
Corps         [ Toast UI Editor ]
[ Annuler ]                [ Enregistrer ]
```

Enregistrement : `relance.set({...}).save()` via Parse SDK direct, puis rechargement de la liste.

Corps : `<Editor>` de `@toast-ui/vue-editor` (déjà installé), `initial-value` = `relance.get('corps')`, `getInstance().getHTML()` à la sauvegarde.

---

### Données à plat pour les lignes du tableau

```js
function parseRelance(r) {
  const impaye = r.get('impaye')
  return {
    _parse:    r,
    id:        r.id,
    dateEnvoi: r.get('dateEnvoi'),
    objet:     r.get('objet') || '',
    to:        r.get('to') || '',
    cc:        r.get('cc') || '',
    corps:     r.get('corps') || '',
    statut:    r.get('statut') || 'pending',
    manuelle:  r.get('manuelle') || false,
    nfacture:  impaye?.get('nfacture') || '—',
    impayelId: impaye?.id || null,
    sequenceId: r.get('sequence')?.id || null,
  }
}
```

---

### Helpers statut

```js
const STATUT_CONFIG = {
  pending:  { label: 'En attente', color: 'neutral' },
  'envoyé': { label: 'Envoyé',     color: 'green'   },
  'échec':  { label: 'Échec',      color: 'red'     },
  'annulé': { label: 'Annulé',     color: 'orange'  },
}
```
