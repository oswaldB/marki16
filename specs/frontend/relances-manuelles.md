# Relances manuelles — génération de suivis à la main (spécification)

> Page : `/relances-manuelles` → `frontend/app/pages/relances-manuelles.vue`
> Drawer : `frontend/app/components/RelancesManuellesSuiviDrawer.vue`
> Cloud Function : `generateRelancesManuelles` → `backend/cloud/workflows/generate-relances-manuelles/index.js`
> Envoi : `sendSuivis({ suiviIds })` → `backend/cloud/workflows/send-suivi/00-master.js`
> Statut : **implémenté**

---

## 1. Contexte & objectif

Permettre à un utilisateur de constituer des **relances manuelles de suivis** :

1. filtrer les impayés et **grouper par contact** (payeur ou apporteur d'affaires) ;
2. sélectionner les groupes à traiter ;
3. **générer des emails de suivi** immédiatement (template simple, sans IA) ;
4. **éditer** le contenu, **prévoir** une date d'envoi et **envoyer** l'email.

L'objectif est de piloter à la main des relances de type « suivi » sans passer
par les séquences automatiques ni par le cron de génération.

---

## 2. Décisions de conception

| Sujet | Décision |
|---|---|
| Source de la liste | Impayés non soldés (`facture_soldee=false`, `reste_a_payer>0`), **groupés par contact + rôle** |
| Rôles | `payeur` (contact = `contact_relance` sinon `payeur`) et `apporteur` (`apporteur`) |
| Génération | **Template simple** (pas de séquence, pas d'Ollama) |
| Statut initial du suivi | `brouillon` → **jamais envoyé par le cron** avant action humaine |
| Envoi immédiat | `sendSuivis({ suiviIds })` par identifiant (ignore le statut/la date) |
| Planification | Date future → statut basculé en `pret pour envoi` → envoi auto par le cron à échéance |
| Idempotence | **Nouveau `Suivi` à chaque génération** (pas de dédoublonnage) |
| Trace | `Activite` : `generation_manuelle`, `envoi_manuel`, `envoi_manuel_erreur`, `suppression_manuelle` |
| SMTP | Sélecteur dans la barre de filtres (1er profil pré-sélectionné) |

---

## 3. Cycle de vie d'un suivi manuel

```
generateRelancesManuelles
        │
        ▼
   statut = "brouillon"  ────────────►  bouton « Envoyer l'email »
        │                                (sendSuivis par id)
        │  date future                    │
        ▼                                 ▼
 statut = "pret pour envoi"          statut = "Envoyée"
        │                           (ou "Erreur d'envoi")
        ▼
  cron sendSuivis (date <= now)
```

- **Brouillon** : sous contrôle humain, le cron l'ignore.
- **Pret pour envoi** : planifié, `sendSuivis` du cron le prend à échéance.
- **Envoyée / Erreur d'envoi** : résultat d'envoi ; `lastError` conservé en cas d'échec.

### Suppression

Un suivi **non envoyé** (`statut != "Envoyée"` **et** `emailSent != true`) peut être
supprimé depuis le panneau droit (icône corbeille → modale de confirmation).
La suppression est **définitive** et tracée (`suppression_manuelle`).

---

## 4. Filtres disponibles

| Filtre | Champ | Défaut |
|---|---|---|
| Recherche | contact, email, `nfacture`, `adresse_bien` | vide |
| Destinataire | `payeur` / `apporteur` / `both` | `payeur` |
| Séquence | `all` / `none` / id | `all` |
| Statut dossier | valeurs distinctes des impayés | `all` |
| Reste à payer min / max | `reste_a_payer` | vide |
| Retard minimum | jours depuis `date_echeance` | vide |
| Inclure blacklistés | `isBlacklisted` | non |
| Inclure suspendus | `statut_dossier` contient « suspend » | non |
| Inclure sans email | contact sans `email` | non |
| Profil SMTP | `SmtpProfile` | 1er profil |

---

## 5. Backend

### Cloud Function `generateRelancesManuelles`

Paramètres :

```json
{
  "selection": [
    { "contactId": "abc", "role": "payeur|apporteur", "impayeIds": ["i1", "i2"] }
  ],
  "smtpProfilId": "smtp1",
  "trigger": "cloud"
}
```

Exclusions appliquées : contact sans email, contact blacklisté, impayé blacklisté,
impayé soldé, `reste_a_payer <= 0`.

Retour :

```json
{
  "success": true,
  "suivisCrees": 2,
  "erreurs": [{ "contactId": "abc", "erreur": "…" }],
  "suivis": [{ "id": "s1", "contactId": "abc", "objet": "…", "corps": "…", "impayes": [] }]
}
```

Champs posés sur le `Suivi` : `contact`, `impayes`, `manuelle=true`, `valide=true`,
`statut="brouillon"`, `objet`, `corps`, `dateEnvoi=now`, `scenario`, `smtpProfil`,
`role_contact`, `trigger`, `erreur_count=0`.

### Cloud Function `supprimerRelanceManuelle`

Paramètres : `{ "suiviId": "s1", "trigger": "cloud" }`

Refus (côté serveur, avec `useMasterKey`) :

- suivi introuvable → `OBJECT_NOT_FOUND` ;
- `manuelle != true` → `OPERATION_FORBIDDEN` ;
- `statut == "Envoyée"` ou `emailSent == true` → `OPERATION_FORBIDDEN`.

Sinon : destruction du `Suivi`, puis trace `createActivite("suivi", "suppression_manuelle", …)`.
Retour : `{ success: true, suiviId }`.

### Template simple

`buildSuiviTemplate(contact, impayes, role)` produit l'objet et un corps HTML contenant :

- le tableau des factures (n° facture, échéance, bien, reste à payer) ;
- le lien vers chaque facture (`/redirect-pdf/:impayeId`) ;
- le total restant dû ;
- le lien espace client (`/redirect-espace/:contactId`).

Aucune pièce jointe PDF n'est ajoutée (comportement `send-suivi`).

### Trace d'activité

Helper partagé `backend/cloud/utils/activite.js` → `createActivite(...)`.
Utilisé à la génération et à l'envoi (succès/erreur) pour les suivis `manuelle=true`.

---

## 6. Frontend

### Organisation de l'écran — coupure verticale

La page est découpée en **deux panneaux côte à côte** (`grid lg:grid-cols-2`, empilés sous `lg`) :

- **Panneau gauche — sélection des contacts**
  - **barre de filtres en haut de la colonne** : recherche + sélecteur de profil SMTP +
    bouton **« Filtres »** (avec badge du nombre de filtres actifs) ;
  - les **filtres avancés sont affichés par défaut** dans une carte repliable juste en dessous
    (destinataire, séquence, statut dossier, RAP min/max, retard min, blacklistés/suspendus/sans email) ;
  - `UAlert` d'avertissement si aucun profil SMTP n'est choisi ;
  - barre de sélection (« Tout sélectionner » / « Aucun » / compteur + montant sélectionné)
    et bouton **« Générer les emails »** ;
  - tableau des groupes (contact + rôle, nb factures + retard max, reste dû, accès aux factures),
    en-tête collant et défilement interne (`max-h-[60vh]`).
- **Panneau droit — emails de suivi générés**
  - en-tête avec compteur et filtre de statut ;
  - `date` de planification + **« Tout planifier »** + **« Tout envoyer »** ;
  - tableau (statut, destinataire + email + objet + nb factures, date prévue, actions éditer/envoyer/**supprimer**),
    en-tête collant et défilement interne (`max-h-[60vh]`) ;
  - l'icône **corbeille** n'est proposée que sur les relances **non envoyées** et ouvre une
    modale de confirmation (destinataire, objet, nb factures, avertissement d'irréversibilité).

Les deux panneaux défilent indépendamment, ce qui permet de composer la vague à gauche
et d'éditer/envoyer à droite sans perdre la sélection de vue.

### Composants

- `relances-manuelles.vue` : les deux panneaux décrits ci-dessus + slideovers + modale de suppression.
- `RelancesManuellesSuiviDrawer.vue` : édition date/CC/objet/corps (ToastuiEditor),
  `Enregistrer / Prévoir`, `Envoyer l'email`.

---

## 7. Points d'exploitation

- La nouvelle Cloud Function nécessite un **redémarrage de Parse Server** pour être chargée.
- L'envoi groupé (`sendSuivis`) est **synchrone** (SMTP + copie IMAP par email) :
  prévoir des lots raisonnables.
- Un suivi planifié est envoyé par le **cron `sendSuivis`** (horaire) dès que
  `dateEnvoi <= now`.
