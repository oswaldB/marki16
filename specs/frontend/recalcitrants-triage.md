# Récalcitrants — Triage en 4 sections (spécification)

> Page concernée : `/recalcitrants` → `frontend/app/pages/recalcitrants.vue`
> Cloud Function actuelle : `getRecalcitrants` → `backend/cloud/workflows/get-recalcitrants/index.js`
> Statut : **à valider** (voir §12 « Ouvert / à valider »)

---

## 1. Contexte & problème

Aujourd'hui la page `/recalcitrants` est **en lecture seule**. Elle liste les contacts
« récalcitrants » calculés à la volée par `getRecalcitrants` :

> Un récalcitrant = contact dont **tous** les impayés sont non soldés
> **ET** qui a reçu **l'intégralité** de la séquence de relances pour chaque groupe
> `(contact, sequence, nfacture)`.

Conséquences :

1. La liste est **plate** : impossible de distinguer un dossier jamais traité d'un dossier
   déjà escaladé.
2. Aucun **état de traitement** n'est persisté : recharger la page perd toute notion
   d'avancement.
3. Le traitement humain (avis commercial, arbitrage direction, passage huissier) se fait
   **hors application**.
4. Une fois la séquence épuisée, le contact **n'est plus relancé** et rien ne permet de le
   réinjecter dans le circuit de relances (cf. `specs/backend/regle-index-sequence-facture-payee.md`,
   options C/D restées « à décider »).

## 2. Objectif

Transformer `/recalcitrants` en **tableau de triage** :

- Ranger chaque contact récalcitrant dans **l'une de 4 sections** (états).
- Rendre explicite le circuit d'escalade : **avis commercial → direction → recommandation → bascule huissier**.
- Permettre la **remise dans les relances** des dossiers qui ne partent pas à l'huissier.
- Tracer chaque changement d'état (historique / activité) et chaque décision.

---

## 3. Les 4 sections (états)

| # | Clé technique | Libellé UI | Signification métier | Qui agit |
|---|---|---|---|---|
| 1 | `a_trier` | **À trier** | Récalcitrant nouvellement détecté, aucune décision prise. **État d'entrée par défaut.** | Commercial / chargé de recouvrement |
| 2 | `remonte_direction` | **Remonté direction — avis commercial** | Le commercial a rendu son avis ; le dossier est remonté à la direction pour arbitrage. | Commercial |
| 3 | `direction_reco` | **Direction — recommandation** | La direction a formulé une recommandation (poursuivre amiablement / contentieux / huissier…). Décision en attente ou en cours d'application. | Direction |
| 4 | `bascule_huissier` | **Bascule à huissier** | Décision prise : le dossier est transféré à l'huissier. **Sort du circuit de relances.** | Direction / recouvrement |

**Progression nominale :**

```
a_trier ──► remonte_direction ──► direction_reco ──► bascule_huissier
   ▲               │                     │
   └── retour arrière possible ──────────┘
```

- `a_trier` est peuplé **automatiquement** par le calcul des récalcitrants.
- `bascule_huissier` est **terminal** (plus de relance, exclusion du calcul des relances).
- Les retours arrière sont autorisés mais **tracés** (motif obligatoire).

### 3.1 Ordre d'affichage

Sections affichées dans l'ordre 1 → 4. Compteur par section. Total = nombre de récalcitrants.

---

## 4. Modèle de données

### 4.1 Nouvelle classe Parse : `TriageRecalcitrant`

**1 enregistrement par contact récalcitrant** (clé unique = `contact`).

| Champ | Type | Obligatoire | Description |
|---|---|---|---|
| `contact` | Pointer → `Contact` | ✅ | Contact récalcitrant. **Unique** (1 triage / contact). |
| `statut` | String | ✅ | `a_trier` \| `remonte_direction` \| `direction_reco` \| `bascule_huissier`. Défaut : `a_trier`. |
| `date_entree` | Date | ✅ | Date de première détection comme récalcitrant. |
| `total_reste_a_payer` | Number | — | Dénormalisé, figé à l'entrée (indicatif). |
| `nombre_impayes` | Number | — | Dénormalisé. |
| `sequences` | Array | — | `[{ id, nom }]` des séquences épuisées. |
| `derniere_relance_le` | Date | — | Dernière relance envoyée au moment de l'entrée. |
| `avis_commercial` | String | — | Texte de l'avis commercial (`favorable` \| `defavorable` \| `reserve` + commentaire libre). |
| `avis_commercial_par` | Pointer → `_User` | — | Auteur de l'avis. |
| `avis_commercial_le` | Date | — | Horodatage. |
| `reco_direction` | String | — | Recommandation : `amiable` \| `contentieux` \| `huissier` \| `abandon` + commentaire. |
| `reco_direction_par` | Pointer → `_User` | — | Auteur. |
| `reco_direction_le` | Date | — | Horodatage. |
| `huissier_nom` | String | — | Étude / huissier saisi. |
| `huissier_reference` | String | — | Référence dossier huissier. |
| `bascule_huissier_le` | Date | — | Date de bascule. |
| `bascule_huissier_par` | Pointer → `_User` | — | Auteur. |
| `remis_en_relance` | Boolean | — | `true` = dossier réinjecté dans les relances. Défaut `false`. |
| `remis_en_relance_le` | Date | — | Horodatage de la remise. |
| `sequence_remise` | Pointer → `Sequence` | — | Séquence cible de la remise (ex. « Recouvrement »). |
| `exclu_relances` | Boolean | — | `true` = ne doit plus être relancé (positionné à la bascule huissier). Défaut `false`. |
| `derniere_action_le` | Date | — | Dernière modification de statut. |
| `commentaire` | String | — | Note libre. |

**Index / contrainte :** un seul `TriageRecalcitrant` par `contact`. Création idempotente
(si un enregistrement existe déjà, on le réutilise).

### 4.2 Champs dénormalisés sur `Contact` (optionnel — affichage rapide)

Pour éviter un join supplémentaire sur la liste :

| Champ | Type | Description |
|---|---|---|
| `triage_statut` | String | Copie du `statut` du triage. |
| `triage_maj_le` | Date | Copie de `derniere_action_le`. |

> Alternative retenue par défaut : **pas** de dénormalisation sur `Contact`, on lit
> `TriageRecalcitrant` via `include("contact")`. À trancher (§12).

### 4.3 Nouveaux statuts de relance ?

Aucun nouveau `statut` de `Relance` n'est requis. La remise en relance crée des `Relance`
avec le statut existant `pret pour envoi`, pris en charge par `send-emails`.

---

## 5. Backend / Cloud Functions

### 5.1 `getRecalcitrants` (modifiée)

**Entrée :** `{ statut?: string, inclureExclus?: boolean }`
**Sortie :** `{ recalcitrants: [...], sections: { a_trier: n, remonte_direction: n, direction_reco: n, bascule_huissier: n }, total }`

Évolutions :

1. Conserver la logique de détection actuelle (étapes 1 → 4) **inchangée**.
2. Charger en une requête les `TriageRecalcitrant` existants pour les contacts détectés.
3. **Créer** en `saveAll` un `TriageRecalcitrant` `a_trier` pour chaque nouveau récalcitrant
   (idempotent — pas de doublon).
4. **Sections** :
   - `bascule_huissier` : **toujours affiché** dans la page (archive), mais exclu du circuit
     de relances.
   - Les contacts dont le triage a `exclu_relances = true` sont **exclus** du calcul de
     génération des relances (impact §7).
5. Ajouter à chaque item retourné le bloc `triage` :

```json
{
  "contact": { "id": "...", "nom": "...", "prenom": "...", "email": "...", "telephone": "..." },
  "impayes": [ ... ],
  "totalResteAPayer": 1234.56,
  "nombreImpayes": 3,
  "sequences": [ { "id": "...", "nom": "..." } ],
  "derniereRelanceDate": "2026-05-12T00:00:00.000Z",
  "triage": {
    "id": "...",
    "statut": "a_trier",
    "avis_commercial": null,
    "reco_direction": null,
    "remis_en_relance": false,
    "exclu_relances": false,
    "derniere_action_le": null
  }
}
```

### 5.2 `setTriageRecalcitrant` (nouvelle)

Change l'état d'un triage et journalise l'action.

**Entrée :**

```json
{
  "contactId": "string",
  "statut": "a_trier | remonte_direction | direction_reco | bascule_huissier",
  "avis_commercial": "string?",
  "reco_direction": "string?",
  "huissier_nom": "string?",
  "huissier_reference": "string?",
  "motif": "string?",           // obligatoire pour un retour arrière ou un abandon
  "commentaire": "string?"
}
```

**Contrôles :**

| Transition | Champs requis |
|---|---|
| `a_trier` → `remonte_direction` | `avis_commercial` |
| `remonte_direction` → `direction_reco` | `reco_direction` |
| `direction_reco` → `bascule_huissier` | `huissier_nom` |
| retour arrière | `motif` |
| `bascule_huissier` → autre | interdit sans `motif` (dé-bascule tracée) |

**Effets :**

- Met à jour le `TriageRecalcitrant` + horodatages + auteur (`request.user`).
- Si `statut = bascule_huissier` → `exclu_relances = true`, `remis_en_relance = false`.
- Journalise via le système d'activité (voir §8).
- Retourne le triage à jour.

### 5.3 `remettreRecalcitrantsEnRelance` (nouvelle)

Réinjecte un ou plusieurs récalcitrants dans le circuit de relances.

**Entrée :**

```json
{
  "contactIds": ["..."],
  "sequenceId": "string?",     // séquence cible ; défaut = séquence "Recouvrement"
  "commentaire": "string?"
}
```

**Traitement :**

1. Refuser tout contact dont le triage est `bascule_huissier` (ou `exclu_relances = true`).
2. Pour chaque contact : récupérer ses impayés actifs (`facture_soldee = false`,
   `reste_a_payer > 0`).
3. Créer une `Relance` **par groupe** `(contact, sequence, nfacture)` — cf. logique
   `generate-relances-du-jour` — avec :
   - `statut = "pret pour envoi"`
   - `sequence` = séquence cible
   - `impayes` = les impayés du groupe
   - `email_index` = index de départ dans la séquence cible (défaut : premier index)
   - `genere_le` = maintenant
4. Positionner sur le triage : `remis_en_relance = true`, `remis_en_relance_le = now`,
   `sequence_remise = sequence cible`, `statut` inchangé (ou option : repasse en `a_trier`).
5. Journaliser l'action.
6. Retourner `{ relancesCreees: n, contactsIgnores: [...] }`.

> **Point d'architecture à valider (§12)** : la remise peut aussi se faire *sans créer de
> relance immédiate*, en posant un flag `remettre_en_relance = true` que
> `generate-relances-du-jour` consomme au prochain passage (plus cohérent avec le CRON).
> Les deux variantes sont décrites ; la variante « flag consommé par le CRON » est
> recommandée pour ne pas court-circuiter les règles de délai/validation.

### 5.4 `generate-relances-du-jour` (modifiée)

- Exclure les impayés dont le contact a un `TriageRecalcitrant` avec `exclu_relances = true`
  (dossiers huissier).
- Prendre en compte les triages `remettre_en_relance = true` : générer la relance selon la
  séquence de remise puis remettre le flag à `false` (`remis_en_relance = true`).

---

## 6. Frontend / UI — `/recalcitrants`

### 6.1 Structure de la page

```
┌──────────────────────────────────────────────────────────────┐
│ Clients récalcitrants            [ Recherche ]   42 total     │
├──────────────────────────────────────────────────────────────┤
│ [À trier 12] [Remonté direction 9] [Direction reco 5] [Huissier 16] │  ← 4 sections
├──────────────────────────────────────────────────────────────┤
│  (contenu de la section active : tableau groupé par contact)  │
└──────────────────────────────────────────────────────────────┘
```

- **Onglets / sections** (pattern existant : `frontend/app/pages/a-corriger.vue` avec tabs)
  OU **4 colonnes kanban** (pattern visuel plus lisible pour un triage).
  → **Décision §12** : onglets (simple, réutilise le tableau groupé) par défaut.
- Chaque section porte : libellé, compteur, couleur.
  - `a_trier` : neutre / ambre
  - `remonte_direction` : sky
  - `direction_reco` : violet
  - `bascule_huissier` : rouge / neutre foncé

### 6.2 Tableau (réutiliser l'existant)

Conserver le tableau groupé par `contact_nom` actuel (`UTable` + `grouping`) et y ajouter :

| Colonne | Source | Note |
|---|---|---|
| Contact | `contact.nom` / `prenom` | existant |
| N° facture / Échéance / Reste à payer / Adresse | `impayes[]` | existant |
| Séquence | `sequences[]` | existant |
| Dernière relance | `derniereRelanceDate` | existant |
| **Statut triage** | `triage.statut` | nouveau badge |
| **Avis commercial** | `triage.avis_commercial` | tronqué + tooltip |
| **Action** | — | bouton primaire contextuel de la section |

### 6.3 Actions par section

| Section | Action primaire | Actions secondaires |
|---|---|---|
| À trier | **Remonter à la direction** (ouvre un formulaire d'avis commercial) | Voir détail, Marquer payé |
| Remonté direction | **Saisir la reco direction** | Modifier l'avis, Retour à trier (motif) |
| Direction reco | **Basculer à huissier** (nom + référence) | Remettre en relance, Retour (motif) |
| Bascule huissier | *Aucune* (terminal) | Voir détail, Dé-basculer (motif), Marquer payé |

Actions de masse : sélection multiple → `Remettre en relance`, `Basculer à huissier`.

### 6.4 Formulaires (modales)

- **Avis commercial** : `avis_commercial` (select `favorable` / `defavorable` / `reserve`)
  + commentaire.
- **Reco direction** : `reco_direction` (select `amiable` / `contentieux` / `huissier` / `abandon`)
  + commentaire.
- **Bascule huissier** : `huissier_nom` (requis), `huissier_reference`, date.
- **Remise en relance** : sélection de la `sequence_remise`, commentaire, confirmation.

Tous les formulaires exigent un `motif` si l'on revient en arrière.

### 6.5 Recherche & filtres

- Recherche globale existante (nom, email, n° facture, adresse) **conservée**.
- Filtres additionnels : montant min, séquence, ancienneté de la dernière relance.

---

## 7. Remise dans les relances — règles

| Situation | Comportement |
|---|---|
| Récalcitrant `a_trier` | Peut être remis en relance (nouvelle séquence de recouvrement). |
| `remonte_direction` / `direction_reco` | Peut être remis en relance, sans attendre la décision. |
| `bascule_huissier` | **Interdit** (le dossier est chez l'huissier) sauf dé-bascule motivée. |
| Dossier remis | `remis_en_relance = true`, séquence cible enregistrée, relance générée (immédiate ou via CRON). |
| Facture payée après remise | Le récalcitrant **sort** de la liste (règle de détection existante : plus d'impayé non soldé). L'enregistrement `TriageRecalcitrant` peut être conservé pour historique. |

Articulation avec `specs/backend/regle-index-sequence-facture-payee.md` :
la remise en relance **incarne l'option D** (séquence de recouvrement dédiée). L'index de
départ dans la séquence cible est un paramètre (défaut : premier index). L'option C (rappel
périodique sur le dernier index) reste une alternative si aucune séquence de recouvrement
n'est créée.

---

## 8. Permissions & journalisation

### 8.1 Permissions

| Action | Rôles |
|---|---|
| Voir la page / les 4 sections | `admin`, `recouvrement`, `commercial` |
| Saisir l'avis commercial | `commercial`, `admin` |
| Saisir la reco direction | `admin`, `direction` |
| Basculer à huissier | `admin`, `direction` |
| Remettre en relance | `admin`, `recouvrement` |

ACL Parse : `TriageRecalcitrant` en lecture pour les rôles ci-dessus, écriture via Cloud
Functions uniquement (pas d'écriture directe client).

### 8.2 Journalisation (système d'activité)

Chaque transition écrit une entrée d'activité (helper `logActivite`, cf. commits
`feat(specs): Ajout du helper logActivite`) :

```json
{
  "type": "triage_recalcitrant",
  "action": "changement_statut",
  "contactId": "...",
  "de": "remonte_direction",
  "vers": "direction_reco",
  "motif": "...",
  "par": "userId",
  "le": "2026-..."
}
```

L'historique complet est affiché dans le détail du contact (timeline).

---

## 9. Règles de passage entre sections

- **Entrée** : uniquement en `a_trier`, automatique, à la première détection.
- **Avancement** : manuel (jamais d'escalade automatique vers huissier).
- **Sortie** : un contact quitte la liste lorsqu'il n'a plus d'impayé non soldé (paiement).
- **Bascule huissier** : positionne `exclu_relances = true`, ce qui le retire de
  `generate-relances-du-jour`.
- **Réapparition** : si un nouveau récalcitrant correspond à un contact déjà trié en
  `bascule_huissier` et toujours exclu, il reste en `bascule_huissier`.

---

## 10. Cas limites

| Cas | Attendu |
|---|---|
| Contact récalcitrant sans email | Affiché, remontée possible, remise en relance bloquée avec message (cf. page « À corriger »). |
| Contact blacklisté | Exclu du calcul (règle existante `isBlacklisted`), donc absent. |
| Plusieurs séquences épuisées | Un seul triage par contact ; les séquences sont listées dans `TriageRecalcitrant.sequences`. |
| Facture soldée entre-temps | Le contact sort de la liste ; le triage reste en base (historique). |
| Retour arrière après bascule huissier | Autorisé, `motif` obligatoire, `exclu_relances` repasse à `false`. |
| Double-clic / concurrence | `setTriageRecalcitrant` vérifie `derniere_action_le` (optimistic lock) et renvoie un conflit si modifié entre-temps. |
| Relance déjà générée pour le groupe | `remettreRecalcitrantsEnRelance` ne crée pas de doublon (`statut in [pending, pret pour envoi, envoyé]`). |

---

## 11. Critères d'acceptation

1. La page `/recalcitrants` présente **4 sections** avec compteurs.
2. Chaque récalcitrant détecté possède **un et un seul** `TriageRecalcitrant`, créé en `a_trier`.
3. Les transitions `a_trier → remonte_direction → direction_reco → bascule_huissier` sont
   possibles via l'UI, avec les champs requis contrôlés côté serveur.
4. `bascule_huissier` exclut le contact de `generate-relances-du-jour`.
5. L'action « Remettre en relance » génère une relance (`pret pour envoi`) pour les impayés
   actifs et marque `remis_en_relance = true`.
6. Chaque changement d'état est journalisé et visible dans l'historique.
7. Aucune écriture directe client sur `TriageRecalcitrant` (Cloud Functions uniquement).
8. Un contact qui paie disparaît de la liste.

---

## 12. Ouvert / à valider

1. **Intitulés exacts des 4 sections** — hypothèse retenue :
   `À trier` · `Remonté direction (avis commercial)` · `Direction (recommandation)` · `Bascule à huissier`.
   Le 4ᵉ état « à trier » est-il bien une section, ou faut-il 4 sections *hors* « à trier » ?
2. **UI** : onglets (défaut) ou kanban 4 colonnes ?
3. **Remise en relance** : création immédiate des `Relance` **ou** flag consommé par le CRON
   `generate-relances-du-jour` ? (recommandé : flag + CRON)
4. **Séquence cible** de la remise : en créer une dédiée « Recouvrement » (option D) ou
   réutiliser la séquence existante avec index forcé (option C) ?
5. **Avis commercial** : valeurs fermées (`favorable` / `defavorable` / `reserve`) + commentaire,
   ou texte libre uniquement ?
6. **Dénormalisation** `triage_statut` sur `Contact` : utile pour la perf ou inutile ?
7. **Rôles** : qui exactement a le droit de basculer à huissier ? (« direction » existe-t-il
   comme rôle Parse ?)
8. **Persistance après paiement** : purge ou conservation du `TriageRecalcitrant` ?
