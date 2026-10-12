# Génération des Relances – Fiche Technique

> Document basé sur l'inspection des schémas Parse et des objets de production (via `curl` sur le Parse Server local, port 1556).

---

## Partie 1 : Fonctionnement Aujourd’hui (constat réel)

### 1.1 Schémas Parse observés

#### Classe `Impaye` (champs utilisés par le workflow)

| Champ | Type | Description |
|---|---|---|
| `objectId` | String | Identifiant Parse |
| `facture_soldee` | Boolean | `false` = impayé actif |
| `reste_a_payer` | Number | Montant restant (**doit être > 0** pour être considéré actif) |
| `date_echeance` | Date | Date d'échéance de la facture |
| `date_piece` | Date | Date de la facture |
| `nfacture` | Number | Numéro de facture |
| `numero_dossier` | Number | Numéro de dossier |
| `reference` | String | Référence |
| `sequence` | Pointer → Sequence | Séquence de relance assignée (**obligatoire** : c'est elle qui fournit les templates email par scénario) |
| `contact_relance` | Pointer → Contact | Contact destinataire de la relance |
| `payeur` | Pointer → Contact | Payeur réel |
| `payeur_type` | String | Valeurs : `"Propriétaire"`, `"Apporteur d'affaire"`, `"Autre"` |
| `payeur_nom`, `payeur_prenom`, `payeur_email` | String | Dénorm. payeur |
| `apporteur` | Pointer → Contact | Apporteur d'affaires |
| `apporteur_nom`, `apporteur_prenom`, `apporteur_email` | String | Dénorm. apporteur |
| `isBlacklisted` | Boolean | `true` = impayé blacklisté |
| `solde` | Boolean | `true` = réglé (redondant avec `facture_soldee`) |
| `adresse_bien`, `ville`, `code_postal` | String | Adresse du bien |
| `total_ttc`, `total_ht` | Number | Montants |

#### Classe `Sequence` (champs utilisés par le workflow)

| Champ | Type | Description |
|---|---|---|
| `objectId` | String | Identifiant |
| `nom` | String | Nom de la séquence |
| `type` | String | `"relances"` ou `"suivi"` |
| `emails` | Array | Tableau des étapes de la séquence |
| `validation_obligatoire` | Boolean | `true` = validation manuelle avant envoi |
| `attribution_automatique` | Boolean | `true` = assignée auto aux nouveaux impayés |
| `publiee` | Boolean | `true` = séquence active |
| `groupes_regles` | Array | Règles d'attribution (filtres) |

**Structure d'un objet dans `emails` :**

```json
{
  "email_index": 1,
  "delai": 0,
  "smtp": "",
  "to": "[[payeur_email]]",
  "cc": "",
  "frequence": "hebdomadaire",
  "scenarios": [
    {
      "format": "single",
      "active": true,
      "smtp": "YPsNANpWhC",
      "cc": "",
      "objet": "...",
      "corps": "<p>...</p>"
    },
    {
      "format": "multiple",
      "active": true,
      "smtp": "YPsNANpWhC",
      "cc": "",
      "objet": "...",
      "corps": "<p>...</p>"
    },
    {
      "format": "both",
      "active": false,
      "smtp": "",
      "cc": "",
      "objet": "...",
      "corps": "<p>...</p>"
    },
    {
      "format": "broker",
      "active": false,
      "smtp": "",
      "cc": "",
      "objet": "...",
      "corps": "<p>...</p>"
    }
  ]
}
```

Observations sur les délais (séquence `"Relances impayés particuliers payeur"`) :

| `email_index` | `delai` (jours) | Fréquence |
|---|---|---|
| 1 | 0 | hebdomadaire |
| 2 | 4 | hebdomadaire |
| 3 | 8 | hebdomadaire |
| 4 | 13 | hebdomadaire |
| 5 | 18 | hebdomadaire |
| 6 | 24 | hebdomadaire |
| 7 | 29 | hebdomadaire |
| 8 | 34 | hebdomadaire |
| 9 | 39 | hebdomadaire |

> Le `delai` est le **nombre de jours à ajouter à `date_echeance`** pour obtenir la `dateEnvoi` théorique.

#### Classe `Relance`

| Champ | Type | Description |
|---|---|---|
| `objectId` | String | Identifiant |
| `contact` | Pointer → Contact | Destinataire |
| `sequence` | Pointer → Sequence | Séquence utilisée |
| `email_index` | Number | Index de l'étape dans `sequence.emails` |
| `impayes` | Array (Pointers) | Liste des impayés liés |
| `scenario` | String | Format utilisé : `"single"`, `"multiple"`, `"broker"`, `"both"` |
| `statut` | String | `"pret pour envoi"`, `"Envoyé"`, `"Erreur d'envoi"`, `"À regénérer"`, `"Contact blacklisté"`, etc. |
| `dateEnvoi` | Date | Date d'envoi prévue |
| `objet` | String | Sujet généré (ou template) |
| `corps` | String | Corps HTML généré (ou template) |
| `valide` | Boolean | `false` si `validation_obligatoire=true` |
| `manuelle` | Boolean | `false` = auto, `true` = manuelle |
| `smtpProfil` | Pointer → SmtpProfile | Profil SMTP d'envoi |
| `cc` | String | Destinataire en copie |
| `erreur_count` | Number | Compteur d'erreurs |
| `lastError` | String | Dernière erreur |

#### Classe `Contact`

| Champ | Type | Description |
|---|---|---|
| `objectId` | String | Identifiant |
| `email` | String | Email (peut être `null` ou vide) |
| `nom`, `prenom` | String | Identité |
| `type_personne` | String | `"Apporteur d'affaire"`, `"Propriétaire"`, etc. |
| `isBlacklisted` | Boolean | `true` = blacklisté |
| `civilite`, `telephone` | String | Coordonnées |

---

### 1.2 Workflows impliqués (fichiers & cron réels)

| Workflow | Fichier | Fréquence | Rôle |
|---|---|---|---|
| **Import Invoice** | `cloud/workflows/import-invoice/00-master.js` | 00h00 (cron) | Importe les factures, assigne les séquences via `assignSequences`, puis appelle `Parse.Cloud.run("generateRelances", ...)` avec les IDs des impayés sans relance. |
| **Generate Relances** | `cloud/workflows/generate-relances/index.js` | Appelé par Import Invoice | Récupère **tous** les impayés non soldés avec séquence `"relances"`, filtre (blacklist, email, relance envoyée), regroupe par `(contact.id, sequence.id, nfacture)` et génère **tous les emails de la séquence** d'un seul coup. Chaque relance a une `dateEnvoi` future calculée comme `date_echeance + delai` (en jours). |
| **Send Emails** | `cloud/workflows/send-emails/00-master.js` | 19h00 (cron, **désactivé actuellement**) | Récupère les relances `statut="pret pour envoi"` **ET** `dateEnvoi <= maintenant`. Vérifie impayés encore non soldés au moment de l'envoi, vérifie blacklists, attache les PDFs, envoie via Nodemailer, marque `"Envoyé"`. |
| **Verify Paid Invoices** | `cloud/workflows/verify-paid-invoices/00-master.js` | Toutes les heures à hh:50 | Vérifie si des impayés ont été réglés et met à jour les flags `solde` / `facture_soldee`. |
| **Cleanup All Relances Paid** | `cloud/workflows/cleanup-all-relances-paid-impayes/index.js` | 17h00 | Parcourt **toutes** les relances. Si un impayé est réglé (`solde=true` ET `facture_soldee=true`) : retire l'impayé de la relance. Si tous réglés → **supprime** la relance. Si reste des impayés → statut `"À regénérer"`. |
| **Regenerate Relances With Status** | `cloud/workflows/regenerate-relances-with-status/index.js` | 17h10 | Trouve les relances `statut="À regénérer"`, les **supprime** et appelle `regenerateRelancesContact(contactId)` pour les recréer. |
| **Cleanup Relances Blacklist** | `cloud/workflows/cleanup-relances-contact-blackliste/index.js` | Toutes les heures (0h) | Supprime les relances dont le contact est blacklisté. |
| **Cleanup All Relances Blacklist** | `cloud/workflows/cleanup-all-relances-contact-blackliste/index.js` | 16h00 | Nettoyage global des relances liées à des contacts blacklistés. |

---

### 1.3 Logique détaillée de `generate-relances` (code réel)

**Étape 1 – Récupération des impayés actifs avec séquence**

> Seuls les impayés actifs (`reste_a_payer > 0`) ayant une séquence assignée sont traités, car c'est la séquence qui fournit les templates email par scénario.

```js
const Impaye = Parse.Object.extend("Impaye");
const impayeQuery = new Parse.Query(Impaye);
impayeQuery.equalTo("facture_soldee", false);
impayeQuery.greaterThan("reste_a_payer", 0);  // IMPAYÉ ACTIF
impayeQuery.exists("sequence");                // SÉQUENCE ASSIGNÉE = templates disponibles
impayeQuery.include(["sequence", "contact_relance", "payeur"]);
impayeQuery.limit(999999);
```

**Étape 2 – Filtres**
1. Séquences de type `"relances"` (`sequence.get("type") === "relances"`)
2. Contacts non blacklistés (`contact.get("isBlacklisted") !== true`)
3. Impayés non blacklistés (`impaye.get("isBlacklisted") !== true`)
4. Exclusion des impayés déjà liés à une relance **envoyée** (`statut` existe, `manuelle=false`, `dateEnvoi` existe)
5. Exclusion des impayés sans email valide (fonction `contactHasEmail` vérifie `@` et non-vide)

**Étape 3 – Regroupement**

```js
const key = `${contact.id}_${sequence.id}_${nfacture}`;
```

Regroupement par **(contact, séquence, nfacture)**. Cela signifie que si un même contact a plusieurs factures différentes (`nfacture` différents), il y aura plusieurs groupes.

**Étape 4 – Pour chaque groupe, boucle sur `sequence.emails`**

Pour chaque `emailConfig` dans `emails` :
- `emailIndex = emailConfig.email_index`
- Recherche du scénario actif (`scenarios.find(s => s.format === scenarioType && s.active)`)
- Vérification qu'aucune relance envoyée n'existe déjà pour ce `(contact, sequence, email_index)`
- **Calcul de `dateEnvoi`** :
  ```js
  dateEcheance = min(impaye.date_echeance) du groupe;
  delai = emailConfig.delai || 0;
  dateEnvoi = new Date(dateEcheance);
  dateEnvoi.setDate(dateEnvoi.getDate() + delai);
  ```
- **Génération du contenu** via Ollama (prompt spécifique au `scenarioType`)
- **Création de la Relance** :
  ```js
  relance.set("statut", "pret pour envoi");
  relance.set("manuelle", false);
  relance.set("valide", !validation_obligatoire);
  relance.set("dateEnvoi", dateEnvoi);
  relance.set("email_index", emailIndex);
  relance.set("scenario", scenarioType);
  relance.set("impayes", impayes);
  relance.set("contact", contact);
  relance.set("sequence", sequenceObj);
  relance.set("objet", objetFinal);
  relance.set("corps", corpsFinal);
  ```

**Étape 5 – Exemple concret observé en base**

Impayé `vbjDtddgKz` :
- `date_echeance` = `2026-08-11`
- `reste_a_payer` = 405
- `facture_soldee` = false

Relances créées le 2026-08-04 :
- `email_index=7`, `delai=29` → `dateEnvoi=2026-09-04` (11 août + 29 j = 9 sept)
- `email_index=8`, `delai=34` → `dateEnvoi=2026-09-09` (11 août + 34 j = 14 sept)
- `email_index=9`, `delai=39` → `dateEnvoi=2026-09-14` (11 août + 39 j = 19 sept)

> Toutes sont stockées en base **immédiatement** avec `statut="pret pour envoi"` et `valide=false` car la séquence a `validation_obligatoire=true`.

---

### 1.4 Problèmes constatés

1. **Relances pré-générées obsolètes** : le contenu (objet, corps) est généré le jour de l'import mais envoyé semaines plus tard. Les données peuvent changer (paiement, nouvelle facture).
2. **Accumulation en base** : la table `Relance` contient des lignes avec `dateEnvoi` dans plusieurs semaines.
3. **Nécessité de workflows de nettoyage** : 4 workflows supplémentaires juste pour gérer les cas où les relances deviennent obsolètes (paiement, blacklist).
4. **Complexité** : la séquence est générée en bloc, avec toutes les étapes (`email_index` 1 à 9), ce qui crée 9 relances par facture.

---

## Partie 2 : Proposition de Simplification – Génération "Juste-à-Temps"

### 2.1 Philosophie

> **Ne générer une relance que le jour même de son envoi potentiel, à 17h.**

On ne calcule et on ne génère que **la relance qui est théoriquement due aujourd'hui** selon le délai de la séquence. Tous les autres contacts sont **ignorés** ce jour-là.

### 2.2 Architecture cible (simplifiée)

| Heure (Paris) | Workflow | Action |
|---|---|---|
| **00h00** | `import-invoice` | Importe les factures, assigne les séquences. **Ne génère plus les relances.** |
| **17h00** | **`generate-relances-du-jour`** *(nouveau)* | Pour chaque contact avec impayé actif , calcule si un email de sa séquence est **dû aujourd'hui** (`date_echeance + delai == aujourd'hui`). Si oui, génère cette **seule relance** avec `dateEnvoi = aujourd'hui 19h`. Statut `"pret pour envoi"`. |
| **19h00** | `send-emails` | Récupère les relances `"pret pour envoi"` avec `dateEnvoi <= maintenant` et les envoie. |

**Workflows supprimés :**
- `cleanup-all-relances-paid-impayes` (17h00)
- `regenerate-relances-with-status` (17h10)
- `cleanup-relances-contact-blackliste` (toutes les heures)
- `cleanup-all-relances-contact-blackliste` (16h00)

### 2.3 Logique du nouveau `generate-relances-du-jour`

> ⚠️ **RÈGLE D'OR : on ne traite PAS tous les contacts avec un impayé.**
> On ne génère une relance que pour les contacts dont le **prochain email de la séquence est théoriquement dû AUJOURD'HUI** (`date_echeance + delai = jour J`).
> Tous les autres sont ignorés ce jour-là.

**Exemple** :
- Impayé échu le 11 août, séquence : email 1 (délai 0 j), email 2 (délai 4 j), email 3 (délai 8 j)...
- **Le 11 août à 17h** : `11/08 + 0 = 11/08` → email 1 est dú → on le génère.
- **Du 12 au 14 août à 17h** : aucun email n'est dú (`11/08 + 4 = 15/08`) → **on ignore complètement ce contact**.
- **Le 15 août à 17h** : `11/08 + 4 = 15/08` → email 2 est dú → on le génère.
- **Du 16 au 18 août** : ignoré.
- **Le 19 août à 17h** : `11/08 + 8 = 19/08` → email 3 est dú → on le génère.
- Si le contact a payé entre-temps, il disparaît du pool d'impayés → aucune relance générée.

**Algorithme détaillé :**

```
1. Récupérer tous les impayés actifs avec séquence "relances"
   - where: { facture_soldee: false, reste_a_payer: { $gt: 0 }, sequence: { $exists: true } }
   - include: sequence, contact_relance, payeur
   - limit: 999999
   - ⚠️ reste_a_payer > 0 = impayé actif | sequence existante = templates email disponibles

2. Filtrer
   - Séquence.type === "relances"
   - Contact.isBlacklisted !== true
   - Impaye.isBlacklisted !== true
   - Impaye avec email valide (contact_relance.email ou payeur.email)

3. Regrouper par (contact.id, sequence.id)
   - Note : on ne regroupe plus par nfacture. Tous les impayés actifs (reste_a_payer > 0)
     d'un même contact avec la même séquence sont regroupés ensemble.
   - La séquence fournit les templates email par scénario (single/multiple/broker/both).

4. Pour chaque groupe (contact, sequence) :

   a. Déterminer la date d'échéance de référence
      - dateEcheanceRef = min(date_echeance de tous les impayés du groupe)
      - Si dateEcheanceRef est dans le passé (avant aujourd'hui) → dateEcheanceRef = aujourd'hui (00h00)
        Cela évite d'envoyer un email avec un délai négatif ou très ancien.
   b. Déterminer le prochain email_index à envoyer
      - Query sur Relance : { contact: contact.id, sequence: sequence.id,
                              manuelle: false, statut: "Envoyé" }
      - Trier par email_index DESC, limit 1
      - Si trouvé → prochainIndex = dernierIndexEnvoye + 1
      - Sinon → prochainIndex = 0 (premier email de la séquence
   c. Vérifier que prochainIndex existe dans sequence.emails
      - emails = sequence.get("emails") || []
      - emailConfig = emails.find(e => e.email_index === prochainIndex)
      - Si pas trouvé → plus d'email dans la séquence, on ignore le contact

   d. Calculer le délai et la date théorique d'envoi (FILTRE CLÉ)
      - delai = emailConfig.delai || 0
      - dateEnvoiTheorique = dateEcheanceRef + delai jours

   e. Vérifier si c'est le jour J (FILTRE CLÉ)
      - Si dateEnvoiTheorique est AUJOURD'HUI (ou passée mais jamais envoyée)
        → ON GÉNÈRE la relance en base (statut "pret pour envoi", dateEnvoi=19h).
          L'envoi effectif est assuré par le workflow send-emails à 19h.
      - Si dateEnvoiTheorique est DANS LE FUTUR
        → ON IGNORE complètement ce contact aujourd'hui.
        Il sera réévalué demain, après-demain, etc., jusqu'à ce que son délai tombe sur le jour J.

   f. Détecter le scenarioType
      - Récupérer les brokerImpayes (impayés où contact est apporteur mais pas payeur)
      - type_personne = contact.get("type_personne")
      - isBroker = type_personne === "Apporteur d'affaire" || "Apporteur" || "apporteur"
      - Si isBroker && brokerImpayes.length > 0 → "both"
      - Sinon si isBroker → "broker"
      - Sinon si impayes.length === 1 → "single"
      - Sinon → "multiple"

   g. Vérifier qu'un scénario actif existe pour ce format
      - scenarioActif = emailConfig.scenarios.find(s => s.format === scenarioType && s.active)
      - Si pas trouvé pour le scenarioType initial :
        → Essayer fallback : si scenarioType était "both", essayer "multiple"
        → Si scenarioType était "broker", essayer "single"
        → Si scenarioType était "multiple", essayer "single"
        → Si toujours pas trouvé → ignorer le contact (aucun template actif)

   h. Générer le contenu
      - Charger le prompt spécifique : /configuration/prompts/scenarios/relance-{scenarioType}-prompt.txt
      - Construire le JSON des impayés (buildImpayesJson)
      - Récupérer l'historique des relances envoyées (getHistory)
      - Appeler Ollama (callOllama) pour générer objet/corps
      - Fallback sur template si Ollama échoue
      - Remplacer placeholders : [[lien_pdf]] et [[lien_espace]]

   i. Créer la Relance
      - contact = contact
      - sequence = sequence
      - email_index = prochainIndex
      - impayes = tous les impayés du groupe
      - scenario = scenarioType
      - statut = "pret pour envoi"
      - valide = !sequence.get("validation_obligatoire")
      - manuelle = false
      - dateEnvoi = aujourd'hui à 19h00 (ou maintenant + 2h)
      - objet = objetFinal
      - corps = corpsFinal
      - smtpProfil = pointer vers scenarioActif.smtp (si fourni)
      - cc = scenarioActif.cc (si fourni)
```

### 2.3 bis – Choix du scénario, regroupement et détails de génération

> Cette section clarifie les points soulevés après relecture du document.

#### A. Changement de regroupement : impact sur les scénarios

| | Aujourd'hui (ancien système) | Cible (nouveau système) |
|---|---|---|
| **Clé de regroupement** | `(contact.id, sequence.id, nfacture)` | `(contact.id, sequence.id)` |
| **Contact avec 3 factures impayées** | 3 groupes distincts → 3 relances `"single"` | 1 groupe regroupé → 1 relance `"multiple"` |
| **Contact avec 1 facture impayée** | 1 groupe → 1 relance `"single"` | 1 groupe → 1 relance `"single"` (inchangé) |

**Confirmé** : ce changement est volontaire. Un contact est relancé **une seule fois par jour, le jour où il doit être relancé**, pour toutes ses factures liées à la même séquence. Le scénario `"multiple"` est conçu pour lister plusieurs factures dans un seul email.

#### B. Champ `frequence` dans `Sequence.emails`

Le champ `frequence` (`"hebdomadaire"`, `"mensuel"`, etc.) existe dans les objets `emails` mais **n'est pas exploité** dans le calcul du jour J pour les relances. Le filtre principal reste :

```
dateEnvoiTheorique = dateEcheanceRef + delai jours
```

> Note : la `frequence` pourrait être utilisée par d'autres types de séquences (ex: `"suivi"`), mais pour les `"relances"` elle est ignorée.

#### C. Résolution du `smtp` en Pointer `SmtpProfile`

Dans les données réelles, chaque scénario a un champ `smtp` (ex: `"YPsNANpWhC"`). Ce string est l'`objectId` d'un `SmtpProfile`. Pour créer le Pointer :

```js
const SmtpProfile = Parse.Object.extend("SmtpProfile");
const smtpProfileObj = SmtpProfile.createWithoutData(scenarioActif.smtp);
relance.set("smtpProfil", smtpProfileObj);
```

> Si `scenarioActif.smtp` est vide ou manquant, le champ `smtpProfil` de la Relance reste `null`. Le workflow `send-emails` doit gérer ce cas (fallback sur un SMTP par défaut ou erreur explicite).

#### D. Récupération des `brokerImpayes` (scénarios `"broker"` et `"both"`)

Un contact de type `"Apporteur d'affaire"` peut être l'apporteur d'une facture sans en être le payeur. Ces impayés sont récupérés ainsi :

```js
const Impaye = Parse.Object.extend("Impaye");
const query = new Parse.Query(Impaye);
query.equalTo("facture_soldee", false);
query.greaterThan("reste_a_payer", 0);
query.equalTo("apporteur", contact);      // Le contact est l'apporteur
query.notEqualTo("payeur", contact);      // Mais PAS le payeur
query.notEqualTo("contact_relance", contact);
query.limit(999999);
const brokerImpayes = await query.find({ useMasterKey: true });
```

**Arbre de décision du `scenarioType`** :

```
isBroker = contact.type_personne === "Apporteur d'affaire"
hasBrokerImpayes = brokerImpayes.length > 0
hasOwnImpayes = impayes.length > 0

if (isBroker && hasBrokerImpayes && hasOwnImpayes) → "both"
else if (isBroker && hasBrokerImpayes)            → "broker"
else if (impayes.length === 1)                     → "single"
else                                               → "multiple"
```

- `"single"` : 1 facture impayée, contact = payeur
- `"multiple"` : N factures impayées, contact = payeur
- `"broker"` : contact est apporteur d'affaires (pas payeur), il a des impayés à relancer en tant qu'apporteur
- `"both"` : contact est à la fois payeur (ses propres impayés) ET apporteur (impayés de ses clients)

#### E. `emailConfig.to` = `"[[payeur_email]]"`

Cette valeur est un **template présent dans le corps du scénario**. Elle est remplacée par la génération Ollama (ou reste telle quelle si le LLM ne la touche pas). Elle **ne détermine pas** le `contact_relance` de la Relance.

Le `contact_relance` est le `contact` utilisé pour le regroupement (celui qui est destinataire de la relance). Le `payeur` est un attribut des impayés liés.

---

### 2.4 Pourquoi cela résout les problèmes

| Problème actuel | Résolution |
|---|---|
| Relances pré-générées obsolètes | On ne génère que la relance du jour. Si une facture est payée à 16h, elle n'apparaît pas à 17h. |
| Accumulation de relances futures | Plus de stockage "à l'avance". La table `Relance` ne contient que des relances prêtes à partir dans 2h max. |
| Workflows de nettoyage complexes | Suppression de 4 workflows. Plus besoin de nettoyer ou régénérer : la relance est créée avec les données du moment. |
| Contenu figé depuis l'import | Le texte Ollama est généré le jour même de l'envoi, avec les impayés actuels du moment. |

### 2.5 Gestion des cas particuliers

| Cas | Comportement actuel | Comportement cible |
|---|---|---|
| **Facture payée entre 17h et 19h** | La relance pré-générée existe. Le `send-emails` vérifie `facture_soldee` au moment de l'envoi et saute si payé. | La relance a été générée à 17h avec les impayés non soldés de 17h. Le `send-emails` garde sa logique de vérification actuelle. |
| **Nouvelle facture importée à 14h** | Attend l'import de minuit pour générer les relances. | L'impayé existe déjà en base à 17h → pris en compte dès le jour même. |
| **Contact blacklisté à 15h** | Cleanup à 16h00 ou toutes les heures supprime ses relances. | À 17h, le contact est exclu du filtre initial → aucune relance générée. |
| **Séquence avec validation obligatoire** | Relance créée avec `valide=false`, attend la validation manuelle. | Identique : générée à 17h avec `valide=false`. Le `send-emails` ne traite que les relances `valide=true` (logique à vérifier/ajouter dans send-emails). |
| **Contact avec plusieurs séquences** | Chaque séquence génère ses propres relances. | Chaque séquence est traitée indépendamment à 17h. |
| **Prochain email_index dépasse la séquence** | Aucune relance générée (plus d'emails). | Identique : si prochainIndex n'existe pas dans `emails`, on ignore le contact. |
| **Relance jamais envoyée (email bloqué)** | `erreur_count` incrémenté, statut `"Erreur d'envoi"`. | À 17h du lendemain, on re-query l'historique : la relance échouée a `statut != "Envoyé"`, donc le prochainIndex n'augmente pas. Le même email est recalculé pour le jour J suivant si toujours dú. |

### 2.6 Modifications concrètes dans le code

#### A. `backend/cron.js`

**Supprimer** :
- `require` et `cron.schedule` de `cleanupAllRelancesPaidImpayesMaster` (17h00)
- `require` et `cron.schedule` de `regenerateRelancesWithStatusMaster` (17h10)
- `require` et `cron.schedule` de `cleanupRelancesBlacklistMaster` (toutes les heures)
- `require` et `cron.schedule` de `cleanupAllRelancesBlacklistMaster` (16h00)

**Ajouter** (à 17h00) :
```js
const generateRelancesDuJourMaster = require("./cloud/workflows/generate-relances-du-jour/index");

cron.schedule(
    "0 17 * * *",
    () => {
        console.log("⏰ [CRON] Déclenchement: generate-relances-du-jour (17h)");
        generateRelancesDuJourMaster({ trigger: "cron" })
            .then((result) => console.log("✅ [CRON] generate-relances-du-jour terminé:", result))
            .catch((error) => console.error("❌ [CRON] Erreur generate-relances-du-jour:", error.message));
    },
    { scheduled: true, timezone: "Europe/Paris" },
);
```

#### B. `cloud/workflows/import-invoice/00-master.js`

**Retirer** l'appel à `Parse.Cloud.run("generateRelances", ...)` dans la section `APPEL WORKFLOW GENERATE-RELANCES`.

L'import se contente de :
1. Importer les factures
2. Assigner les séquences (`assignSequences`)
3. Terminé.

#### C. Nouveau fichier : `cloud/workflows/generate-relances-du-jour/index.js`

Ce fichier reprend la logique de `generate-relances/index.js` avec ces changements :

1. **Regroupement** : par `(contact.id, sequence.id)` uniquement (plus de `nfacture`).
2. **Calcul du prochain `email_index`** :
   ```js
   const relanceQuery = new Parse.Query("Relance");
   relanceQuery.equalTo("contact", contact);
   relanceQuery.equalTo("sequence", sequence);
   relanceQuery.equalTo("manuelle", false);
   relanceQuery.equalTo("statut", "Envoyé"); // SEULEMENT les envoyées
   relanceQuery.descending("email_index");
   relanceQuery.limit(1);
   const lastSent = await relanceQuery.first({ useMasterKey: true });
   const prochainIndex = lastSent ? (lastSent.get("email_index") + 1) : 0;
   ```
3. **Vérification de la date** :
   ```js
   const emailConfig = emails.find(e => e.email_index === prochainIndex);
   if (!emailConfig) return; // fin de séquence
   const delai = emailConfig.delai || 0;
   const dateEnvoiTheorique = new Date(dateEcheanceRef);
   dateEnvoiTheorique.setDate(dateEnvoiTheorique.getDate() + delai);

   const aujourdhui = new Date();
   aujourdhui.setHours(0,0,0,0);
   const theoriqueJour = new Date(dateEnvoiTheorique);
   theoriqueJour.setHours(0,0,0,0);

   if (theoriqueJour.getTime() !== aujourdhui.getTime() && theoriqueJour > aujourdhui) {
       // Pas aujourd'hui et pas dans le passé non plus → ignorer
       return;
   }
   // Si theoriqueJour < aujourdhui ET jamais envoyé → on rattrape (envoi retardé)
   ```
4. **Création unique** : une seule relance par `(contact, sequence)` et par jour.
5. **`dateEnvoi`** : fixée à `aujourdhui 19h00` au lieu de `dateEcheance + delai`.
   ```js
   const dateEnvoi = new Date();
   dateEnvoi.setHours(19, 0, 0, 0);
   ```

#### D. `send-emails/00-master.js`

Aucun changement majeur nécessaire sur la requête principale. S'assurer que le filtre sur `valide` est bien actif :

```js
query.equalTo("statut", "pret pour envoi");
query.lessThanOrEqualTo("dateEnvoi", new Date());
query.equalTo("valide", true); // AJOUTER SI MANQUANT
```

### 2.7 Schéma de séquence journalier (nouveau)

```
00h00  ┌─────────────────────────────────────┐
       │  import-invoice                     │
       │  → Importe les factures             │
       │  → Assigne les séquences            │
       │  → PAS de génération de relances    │
       └─────────────────────────────────────┘

17h00  ┌─────────────────────────────────────┐
       │  generate-relances-du-jour          │
       │  → Parcourt les impayés actifs      │
       │  → Pour chaque contact/séquence :    │
       │    - calcule le prochain email_index │
       │    - vérifie date_echeance + delai   │
       │    - si = aujourd'hui → génère       │
       │    - sinon → IGNORE                 │
       │  → Génère le contenu (Ollama)       │
       │  → Crée la relance (dateEnvoi=19h)  │
       └─────────────────────────────────────┘

19h00  ┌─────────────────────────────────────┐
       │  send-emails                        │
       │  → Récupère relances prêtes         │
       │  → Vérifie impayés toujours dus     │
       │  → Envoie les emails                │
       │  → Marque comme "Envoyé"            │
       └─────────────────────────────────────┘
```

---

## Résumé comparatif

| | Aujourd’hui | Cible |
|---|---|---|
| **Relances stockées** | Toutes les relances futures, dès l'import (ex: 9 relances créées le 4 août pour des envois en septembre) | Seulement la relance du jour, créée à 17h |
| **Workflows cron** | 8 workflows (import, generate, verify-paid, cleanup-paid, regenerate, cleanup-blacklist x2, send-emails, sync-contacts) | 4 workflows (import, generate-du-jour, send-emails, sync-contacts) |
| **Gestion obsolècence** | Cleanup + régénération complexes | Pas besoin, données toujours fraîches |
| **Génération de contenu** | À minuit, pour un envoi dans plusieurs semaines | À 17h, pour un envoi à 19h |
| **Filtre principal** | Tous les impayés avec séquence → génération en bloc | **Uniquement ceux dont `date_echeance + delai = aujourd'hui`** |
| **Simplicité** | Complexe, états intermédiaires, 9 relances par facture | Direct, une relance par contact/séquence/jour |
