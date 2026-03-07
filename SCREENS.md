# Marki15 — Specs des écrans

## Navigation & Layout

### Layout default (pages connectées)
```
┌─────────────────────────────────────────────────┐
│  AppSidebar        │  AppHeader                  │
│                    │  ─────────────────────────  │
│  Logo              │  AppBreadcrumb              │
│  ───────────────   │                             │
│  / Dashboard       │  <slot />                   │
│  ↑ Import          │                             │
│  ! Impayés         │                             │
│  @ Contacts        │                             │
│  ≡ Séquences       │                             │
│  ✉ Relances        │                             │
│                    │                             │
│  ───────────────   │                             │
│  ⚙ Paramètres      │                             │
│    └ SMTP          │                             │
│    └ Utilisateurs  │  (admin only)               │
│                    │                             │
│  ───────────────   │                             │
│  Avatar + nom      │                             │
│  Déconnexion       │                             │
└─────────────────────────────────────────────────┘
```
- Sidebar collapsible (icônes seules en mode réduit) via store `ui.ts`
- Layout `auth.vue` pour `/login` : centré, sans sidebar
- Middleware `auth.ts` sur toutes les pages sauf `/login`
- Middleware `admin.ts` sur `/settings/users` uniquement

---

## `/login`

```
┌─────────────────────────────────────────────────┐
│                    Logo                          │
│              ┌─────────────────┐                 │
│              │ Username        │                 │
│              ├─────────────────┤                 │
│              │ Mot de passe    │                 │
│              ├─────────────────┤                 │
│              │  Se connecter   │                 │
│              └─────────────────┘                 │
└─────────────────────────────────────────────────┘
```
- Login via `Parse.User.logIn(username, password)`
- Erreur affichée sous le formulaire
- Redirect vers `/` après login
- Session Parse persistée dans store `auth.ts`

---

## `/` — Dashboard

```
┌─────────────────────────────────────────────────┐
│  Bonjour [username]          Aujourd'hui [date]  │
│                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────┐ │
│  │ Montant  │ │Relances  │ │ Contacts │ │Taux │ │
│  │  total   │ │ du jour  │ │sans email│ │recou│ │
│  │  impayé  │ │          │ │          │ │vrem.│ │
│  │ 142 300€ │ │    12    │ │     5    │ │ 23% │ │
│  └──────────┘ └──────────┘ └──────────┘ └─────┘ │
│                                                  │
│  Impayés par échéance             [Voir tout →]  │
│  ┌─────────────────────────────────────────────┐ │
│  │ Graphique barres (en retard / à venir)      │ │
│  └─────────────────────────────────────────────┘ │
│                                                  │
│  Prochaines relances              [Voir tout →]  │
│  ┌─────────────────────────────────────────────┐ │
│  │ Contact       Objet         Date     Statut │ │
│  └─────────────────────────────────────────────┘ │
│                                                  │
│  Impayés sans séquence            [Voir tout →]  │
│  ┌─────────────────────────────────────────────┐ │
│  │ Facture    Contact    Montant    Échéance   │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```
- Graphique barres : `vue-chartjs`
- Montant total impayé → query Parse `statut = impaye`
- Relances du jour → `date_envoi = today` + `statut = pending`
- Contacts sans email → `email` vide
- Taux recouvrement → `paye / (paye + impaye) * 100`

---

## `/import` — Wizard 3 étapes

> La sync depuis la DB externe est automatique (cron toutes les heures).
> Cet écran est uniquement pour l'upload manuel de PDFs.

### Étape 1 — Upload
```
┌─────────────────────────────────────────────────┐
│  ●──────○──────○                                 │
│  Upload  Parsing  Validation                     │
│                                                  │
│  ┌─────────────────────────────────────────────┐ │
│  │    Glissez vos PDFs ici                     │ │
│  │    Un fichier, plusieurs, ou un dossier     │ │
│  │    [ Parcourir fichiers ]  [ Dossier ]      │ │
│  └─────────────────────────────────────────────┘ │
│  facture-001.pdf  ✓                              │
│  facture-002.pdf  ✓                              │
│                        [ Analyser avec Mistral →]│
└─────────────────────────────────────────────────┘
```
- PDFs stockés localement sur le serveur `/storage/uploads/`
- Extraction texte via `pdf-parse`
- Parsing structuré via Ollama API (`https://ollama.com/api`) + modèle Mistral → JSON

### Étape 2 — Parsing (résultats Mistral, éditables)
```
┌─────────────────────────────────────────────────┐
│  ●──────●──────○                                 │
│                                                  │
│  facture-001.pdf          [ ✓ OK | ⚠ À vérifier]│
│  ┌─────────────────────────────────────────────┐ │
│  │ N° facture   FA-2024-001      [________]    │ │
│  │ Montant      1 200,00 €       [________]    │ │
│  │ Date pièce   01/03/2024       [________]    │ │
│  │ Contact      Martin Pierre    [________]    │ │
│  │ Email        martin@acme.com  [________]    │ │
│  └─────────────────────────────────────────────┘ │
│                        [ ← Retour ] [ Importer →]│
└─────────────────────────────────────────────────┘
```
- Champs non détectés mis en évidence avec `⚠`
- Chaque champ est éditable manuellement avant import

### Étape 3 — Validation
```
┌─────────────────────────────────────────────────┐
│  ●──────●──────●                                 │
│          ✓ Import terminé                        │
│  3  impayés importés                             │
│  2  contacts créés                               │
│  1  contact existant mis à jour                  │
│  2  séquences attribuées automatiquement         │
│  1  impayé sans séquence                         │
│  1  contact sans email                           │
│                                                  │
│  → Voir les impayés sans séquence                │
│  → Voir les contacts sans email                  │
│                    [ Aller aux impayés ]          │
└─────────────────────────────────────────────────┘
```

---

## `/impayes` — Liste des impayés

### Barre du haut
```
┌─────────────────────────────────────────────────┐
│  Impayés                          [ + Importer ] │
│  [ Unitaire ] [ Par payeur ] [ Par contact ]     │
│  🔍 Rechercher...   Séquence [ Toutes ▼ ]        │
│                     Statut   [ Tous ▼ ]          │
└─────────────────────────────────────────────────┘
```

### Vue unitaire — colonnes par défaut
```
☐ │ N° Facture │ N° Dossier │ Adresse du bien │ Payeur │ Retard │ Reste à payer │ Date intervention │ Séquence │ Actions
```
- **Retard** = `aujourd'hui - date_piece` en jours
  - Rouge si > 30j, orange si > 7j
- **Actions** : 📄 (drawer PDF) + ≡ (menu : voir détail, assigner séquence, marquer payé)
- **Sélection groupée** : barre d'actions apparaît en bas (assigner séquence, marquer payé)
- **Sélecteur de colonnes** : bouton pour afficher/masquer les colonnes optionnelles

### Colonnes optionnelles (masquées par défaut)
```
Référence │ Réf externe │ Statut dossier │ Total HT │ Total TTC
Apporteur │ Propriétaire │ Employé │ Commentaire │ Lot/Étage/Porte │ Date pièce
```

### Vue groupée par payeur
```
▼ Martin Pierre                  3 factures — Total : 4 200€
  Séquence : —          [ Assigner séquence ]
  ┌────────────┬──────────┬────────────┬───────┐
  │ Facture    │ Montant  │ Retard     │       │
  │ FA-2024-01 │ 1 200€   │ 47j 🔴    │ 📄 ≡  │
  └────────────┴──────────┴────────────┴───────┘

▶ Dupont André                   1 facture — Total : 800€
```

### Vue groupée par contact
```
▼ Durand Michel (apporteur)      5 factures
  Ses propres impayés (2)        Total : 4 200€
  │ FA-2024-03 │ 3 400€ │ 20/04/2024 │ 📄 ≡ │

  Apporteur d'affaire pour (3)   Total : 6 100€
  │ Facture    │ Payeur   │ Montant  │ Retard │
  │ FA-2024-01 │ Martin P │ 1 200€   │ 47j 🔴 │
```

### Drawer PDF
```
┌──────────────────────────────────┐
│ Facture FA-2024-01          [ ✕ ]│
│  [ ← ] Page 1/2 [ → ]           │
│  ┌────────────────────────────┐  │
│  │   Aperçu PDF               │  │
│  └────────────────────────────┘  │
│  [ Télécharger ]                 │
└──────────────────────────────────┘
```
- Source FTP (sync auto) ou local `/storage/uploads/` (upload manuel)

---

## `/impayes/[id]` — Détail d'un impayé

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Retour      FA-2024-01 — DOS-0042          [ Impayé 🔴 ▼ ]  │
│                                                [ 📄 Voir PDF ]  │
├──────────────────────────────┬──────────────────────────────────┤
│  FACTURE                     │  BIEN                            │
│  N° facture   FA-2024-01     │  12 rue de la Paix               │
│  Réf pièce    REF-001        │  Bât A — Esc 2 — Étage 3         │
│  Date pièce   01/03/2024     │  Porte 12 — Lot 42               │
│  Retard       47 jours 🔴    │  75001 Paris                     │
│  Total HT     1 000€         │                                  │
│  Total TTC    1 200€         │  DOSSIER                         │
│  Reste à payer 1 200€        │  N° dossier   DOS-0042           │
│  Commentaire  ...            │  Référence    REF-EXT-042        │
│                              │  Statut       En cours           │
│                              │  Intervention 01/03/2024         │
│                              │  Employé      Jean Dupont        │
├──────────────────────────────┴──────────────────────────────────┤
│  INTERLOCUTEURS                                                  │
│  ┌─────────────────────────┬─────────────────────────────────┐  │
│  │ Payeur (Propriétaire)   │ Apporteur d'affaire             │  │
│  │ Martin Pierre           │ Durand Michel (Société ABC)     │  │
│  │ martin@email.com        │ durand@abc.com                  │  │
│  │ 06 01 02 03 04          │ 06 05 06 07 08                  │  │
│  ├─────────────────────────┼─────────────────────────────────┤  │
│  │ Propriétaire            │ Locataire entrant               │  │
│  │ Locataire sortant       │ Notaire                         │  │
│  │ Donneur d'ordre         │ Syndic                          │  │
│  └─────────────────────────┴─────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  SÉQUENCE                                                        │
│  Séquence active : Standard Relance    [ Changer ] [ Retirer ]  │
│                                                                  │
│  Prochaines relances :              [ + Créer une relance ]      │
│  ┌──────────────┬──────────────────────────┬──────────┬───────┐  │
│  │ Date envoi   │ Objet                    │ Statut   │       │  │
│  │ 10/04/2024   │ Relance 1 — FA-2024-01   │ En att.  │ ✏ 🗑 │  │
│  │ 20/04/2024   │ Relance 2 — FA-2024-01   │ En att.  │ ✏ 🗑 │  │
│  │ 30/04/2024   │ Mise en demeure ✋ manuel │ En att.  │ ✏ 🗑 │  │
│  └──────────────┴──────────────────────────┴──────────┴───────┘  │
├─────────────────────────────────────────────────────────────────┤
│  HISTORIQUE DES ACTIONS                                          │
│  ● 25/03/2024 — Email envoyé                                     │
│  │  Objet : Relance 1 — Facture FA-2024-01                      │
│  │  À : martin@email.com           [ Voir le message ]          │
│  ● 01/03/2024 — Impayé créé (sync automatique)                  │
│  │  Séquence assignée automatiquement : Standard Relance        │
└─────────────────────────────────────────────────────────────────┘
```

**Statut** (dropdown) : `Impayé → En cours → Payé`
**✋ manuel** : badge sur les relances créées ou modifiées manuellement
**Changer de séquence** : annule les relances `pending` et recrée avec la nouvelle séquence

### Drawer — Modifier une relance
```
┌──────────────────────────────────────┐
│  Modifier la relance            [ ✕ ]│
│  Date d'envoi   [ 10/04/2024 📅 ]   │
│  Objet          [                 ] │
│  ┌──────────────────────────────┐   │
│  │  Toast UI Editor             │   │
│  └──────────────────────────────┘   │
│  [ Annuler ]          [ Enregistrer ]│
└──────────────────────────────────────┘
```

### Drawer — Nouvelle relance manuelle
```
┌──────────────────────────────────────┐
│  Nouvelle relance               [ ✕ ]│
│  Date d'envoi   [ 📅 ]              │
│  Objet          [                 ] │
│  ┌──────────────────────────────┐   │
│  │  Toast UI Editor             │   │
│  │  + VariablePicker [[]]       │   │
│  └──────────────────────────────┘   │
│  [ Annuler ]             [ Créer ]   │
└──────────────────────────────────────┘
```

---

## `/contacts` — Liste des contacts

```
┌─────────────────────────────────────────────────────────────────┐
│  ℹ Les contacts 🔗 Analyse immo ne sont pas modifiables ici.   │
│  Merci de les mettre à jour dans Analyse immo.                  │
│                                    [ 🔄 Synchroniser tous ]     │
├─────────────────────────────────────────────────────────────────┤
│  🔍 Rechercher...        Type [ Tous ▼ ]   [ ⚠ Sans email (5) ] │
├────┬───────────────────┬──────────────────┬─────────┬──────────┬──────────┬───────────────┬─────────┐
│ ☐  │ Nom               │ Email            │ Tél.    │ Type     │ Factures │ Montant total │ Actions │
│ ☐  │ Martin Pierre 🔗  │ martin@email.com │ 06 01.. │ Payeur   │ 3        │ 4 200€        │ ≡       │
│ ☐  │ Dupont André  ✏  │ — ⚠             │ 06 08.. │ Payeur   │ 1        │   800€        │ ≡       │
└────┴───────────────────┴──────────────────┴─────────┴──────────┴──────────┴───────────────┴─────────┘
```
- 🔗 = contact issu d'Analyse immo (non modifiable, `source: db_externe`)
- ✏ = contact issu d'un upload PDF (modifiable, `source: upload`)
- Menu ≡ : contacts `db_externe` → "Voir les impayés" uniquement
- Menu ≡ : contacts `upload` → "Voir les impayés" + "Modifier" (drawer)
- `[ 🔄 Synchroniser tous ]` → `POST /api/contacts/sync`

---

## `/contacts/sans-email`

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠ Contacts sans email                                          │
│  ℹ Les contacts 🔗 doivent être mis à jour dans Analyse immo.  │
│                                    [ 🔄 Synchroniser tous ]     │
├────────────────────┬─────────────┬───────────┬──────────┬───────────────┬─────────┐
│  Nom               │ Tél.        │ Type      │ Factures │ Montant total │ Actions │
│  Dupont André  ✏  │ 06 08 09 10 │ Payeur    │ 1        │    800€       │ ✏       │
│  Leroy Baptiste 🔗│ 06 11 12 13 │ Payeur    │ 3        │  5 400€       │ 🔗      │
│  Société ABC    🔗│ 01 02 03 04 │ Apporteur │ 7        │ 18 200€       │ 🔗      │
├────────────────────┴─────────────┴───────────┴──────────┼───────────────┤
│                                               Total      │ 24 400€       │
└──────────────────────────────────────────────────────────┴───────────────┘
```
- Trié par montant total décroissant par défaut
- ✏ ouvre le drawer de modification directement sur le champ email
- 🔗 → mettre à jour dans Analyse immo puis synchroniser

---

## `/sequences` — Liste des séquences

```
┌─────────────────────────────────────────────────────────────────┐
│  Séquences                              [ + Nouvelle séquence ] │
├──────────────────────────────────────────────────────────────────┤
│  Nom                │ Emails │ Impayés │ Actions │
│  Standard Relance   │ 5      │ 42      │ ✏ 🗑   │
│  Mise en demeure    │ 3      │ 12      │ ✏ 🗑   │
└─────────────────────┴────────┴─────────┴─────────┘
```

---

## `/sequences/[id]` — Édition d'une séquence

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Retour        Standard Relance              [ 💾 Enregistrer]│
├─────────────────────────────────────────────────────────────────┤
│  Nom          [ Standard Relance              ]                  │
│  Lien paiement[ https://pay... ]         [ ✏ Construire ]       │
├─────────────────────────────────────────────────────────────────┤
│  EMAILS DE RELANCE                   [ ✨ Générer par IA ]      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Email 1                          J+ [ 7  ]  [ 🗑 ]     │   │
│  │  Profil SMTP [ contact@société.com ▼ ] [ + Créer ]       │   │
│  │  À    [ [[payeur_email]]                               ] │   │
│  │  CC   [                                                ] │   │
│  │  Objet[ Relance amiable — [[nfacture]]                 ] │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  Toast UI Editor                                   │  │   │
│  │  │  [ [[ ]] Variables ]  [ Demander à ChatGPT ]       │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│  [ + Ajouter un email ]                                          │
├─────────────────────────────────────────────────────────────────┤
│  RÈGLES D'ATTRIBUTION AUTOMATIQUE                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  ✓ payeur_type    est égal à    [ Propriétaire ▼ ]  🗑  │   │
│  │  ✓ reste_a_payer  supérieur à   [ 500 ]             🗑  │   │
│  │  Type : [ Incluant ▼ ]          [ + Ajouter un filtre ]  │   │
│  └──────────────────────────────────────────────────────────┘   │
│  Aperçu live : ✅ 23 impayés concernés   ❌ 19 exclus            │
│  [ Voir les 23 impayés ]                                         │
└─────────────────────────────────────────────────────────────────┘
```

### Drawer — Construire le lien de paiement
```
┌──────────────────────────────────────┐
│  Lien de paiement               [ ✕ ]│
│  [ [[ ]] Copier une variable ]       │
│  [ https://pay.exemple.com?ref=      │
│    [[nfacture]]&montant=             │
│    [[reste_a_payer]]              ]  │
│  Aperçu : https://pay.exemple.com?   │
│  ref=FA-2024-01&montant=1200         │
│  [ Copier le lien ]  [ Enregistrer ] │
└──────────────────────────────────────┘
```

### Popup — Générer par IA (global)
```
┌──────────────────────────────────────────┐
│  ✨ Générer les emails par IA       [ ✕ ]│
│  1. [ 📋 Copier le prompt ]              │
│  2. Ouvrez ChatGPT et collez le prompt  │
│  3. Collez la réponse JSON ici :        │
│     [ textarea ]                         │
│  [ Annuler ]              [ ✓ Valider ] │
└──────────────────────────────────────────┘
```

### Popup — Demander à ChatGPT (par email)
```
┌──────────────────────────────────────────┐
│  ✨ Demander à ChatGPT              [ ✕ ]│
│  1. [ 📋 Copier le prompt ]             │
│     (objectif + emails précédents        │
│      + variables disponibles)            │
│  2. Collez la réponse :                 │
│     [ textarea ]                         │
│  [ Annuler ]  [ ✓ Insérer dans éditeur ]│
└──────────────────────────────────────────┘
```

### Popup — Créer un profil SMTP
```
┌──────────────────────────────────────────┐
│  Nouveau profil SMTP                [ ✕ ]│
│  Nom          [ Mon serveur SMTP    ]    │
│  Host         [ smtp.exemple.com    ]    │
│  Port         [ 587                 ]    │
│  Utilisateur  [ contact@société.com ]    │
│  Mot de passe [ ••••••••            ]    │
│  Nom affiché  [ Service Facturation ]    │
│  Email from   [ contact@société.com ]    │
│  Signature HTML                          │
│  [ Toast UI Editor ]                     │
│  [ Tester la connexion ]                 │
│  [ Annuler ]           [ Enregistrer ]  │
└──────────────────────────────────────────┘
```

---

## `/relances` — Écran des relances

### Barre du haut
```
┌─────────────────────────────────────────────────────────────────┐
│  Relances                                                        │
│  [ 📅 Calendrier ]  [ ☰ Tableau ]                               │
│  Statut [ Tous ▼ ]   Séquence [ Toutes ▼ ]   🔍 Rechercher...  │
└─────────────────────────────────────────────────────────────────┘
```

### Vue Calendrier (FullCalendar)
```
┌─────────────────────────────────────────────────────────────────┐
│  ← Avril 2024 →                                                  │
├──────┬──────┬──────┬──────┬──────┬──────┬──────┐               │
│  Lun │  Mar │  Mer │  Jeu │  Ven │  Sam │  Dim │               │
├──────┼──────┼──────┼──────┼──────┼──────┼──────┤               │
│   1  │   2  │   3  │   4  │   5  │   6  │   7  │               │
│      │ ●2   │      │ ●5   │      │      │      │               │
├──────┼──────┼──────┼──────┼──────┼──────┼──────┤               │
│   8  │   9  │  10  │  11  │  12  │  13  │  14  │               │
│ ●1   │      │ ●3   │      │ ●7   │      │      │               │
└──────┴──────┴──────┴──────┴──────┴──────┴──────┘               │
```
Clic sur un jour → panneau latéral listant les relances du jour avec [ ✏ Modifier ]

### Vue Tableau
```
☐ │ Date envoi │ Objet                   │ Destinataire │ Facture    │ Statut    │ Actions
☐ │ 10/04/2024 │ Relance 1 — FA-2024-01  │ martin@..    │ FA-2024-01 │ En att.   │ ✏ 🗑
☐ │ 12/04/2024 │ Mise en demeure ✋       │ durand@..    │ FA-2024-03 │ En att.   │ ✏ 🗑
  │ 25/03/2024 │ Relance 1 — FA-2024-02  │ leroy@..     │ FA-2024-02 │ ✅ Envoyé │ 👁
  │ 20/03/2024 │ Relance 1 — FA-2024-07  │ martin@..    │ FA-2024-07 │ ❌ Échec  │ ✏ 🔁
```
- ✏ modifier (drawer) — 🗑 supprimer — 👁 voir message envoyé — 🔁 réessayer
- ✋ = relance manuelle
- Sélection groupée → [ 🗑 Supprimer ]

### Drawer — Modifier une relance
```
┌──────────────────────────────────────┐
│  Modifier la relance            [ ✕ ]│
│  Date d'envoi  [ 10/04/2024 📅 ]    │
│  À             [ martin@email.com ]  │
│  CC            [                 ]   │
│  Objet         [ Relance 1...    ]   │
│  [ Toast UI Editor ]                 │
│  [ Annuler ]          [ Enregistrer ]│
└──────────────────────────────────────┘
```

---

## `/settings/smtp` — Profils SMTP

```
┌─────────────────────────────────────────────────────────────────┐
│  Profils SMTP                          [ + Nouveau profil ]     │
├─────────────────────────────────────────────────────────────────┤
│  Nom          │ Host           │ From              │ Actions    │
│  Contact      │ smtp.gmail.com │ contact@soc.com   │ ✏ 🗑      │
│  Juridique    │ smtp.gmail.com │ juridique@soc.com │ ✏ 🗑      │
└───────────────┴────────────────┴───────────────────┴────────────┘
```
- Si aucun profil : bannière invitant à en créer un avant d'éditer une séquence
- Test de connexion → `POST /api/smtp/test`

### Drawer — Créer / Modifier un profil SMTP
```
┌──────────────────────────────────────┐
│  Profil SMTP                    [ ✕ ]│
│  Nom          [ Contact        ]     │
│  Host         [ smtp.gmail.com ]     │
│  Port         [ 587            ]     │
│  Utilisateur  [ contact@soc.com]     │
│  Mot de passe [ ••••••••       ]     │
│  Nom affiché  [ Service Factor.]     │
│  Email from   [ contact@soc.com]     │
│  Signature HTML [ Toast UI Editor ]  │
│  [ 🔌 Tester la connexion ]          │
│  ✅ Connexion réussie                │
│  [ Annuler ]        [ Enregistrer ]  │
└──────────────────────────────────────┘
```

---

## `/settings/users` — Gestion des utilisateurs

> Accessible uniquement si `user.admin === true` (middleware `admin.ts`)

```
┌─────────────────────────────────────────────────────────────────┐
│  Utilisateurs                          [ + Nouvel utilisateur ] │
├───────────────────┬─────────┬──────────────┬────────────────────┤
│  Username         │ Admin   │ Créé le      │ Actions            │
│  jdupont          │ ✅ Oui  │ 01/01/2024   │ ✏ 🗑              │
│  mleroy           │ ❌ Non  │ 15/02/2024   │ ✏ 🗑              │
└───────────────────┴─────────┴──────────────┴────────────────────┘
```

### Drawer — Créer / Modifier un utilisateur
```
┌──────────────────────────────────────┐
│  Utilisateur                    [ ✕ ]│
│  Username     [ jdupont        ]     │
│  Mot de passe [ ••••••••       ]     │
│               (vide = inchangé)      │
│  Admin        [ ☐ ]                  │
│  [ Annuler ]        [ Enregistrer ]  │
└──────────────────────────────────────┘
```
- Impossible de supprimer ou retirer les droits admin de son propre compte
