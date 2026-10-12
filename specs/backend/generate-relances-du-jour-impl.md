# Implémentation technique – `generate-relances-du-jour`

> Cloud Function Parse (méga-fonction) de génération quotidienne des relances.
> Exécutée tous les jours à **17h00** (Paris).  
> Seule la relance théoriquement due ce jour est générée ; tous les autres contacts sont ignorés.

---

## 1. Nature du livrable

Il s'agit d'une **méga-fonction Parse Cloud Code** : un module Node.js enregistré via `Parse.Cloud.define` et également exporté pour être appelé programmatiquement (cron, test, Cloud Function manuelle).

```
Parse.Cloud.define("generateRelancesDuJour", async (request) => { ... })
```

**Fichier livré :** `backend/cloud/workflows/generate-relances-du-jour/index.js`

---

## 2. Data model impacté

Les schémas ci-dessous sont ceux de la base de production (inspection via Parse Server `/schemas`).

### 2.1 `Impaye`

| Champ | Type | Rôle dans la méga-fonction |
|---|---|---|
| `objectId` | String | Identifiant unique |
| `facture_soldee` | Boolean | Filtré à `false` (impayé actif uniquement) |
| `reste_a_payer` | Number | Filtré `> 0` (impayé actif) |
| `date_echeance` | Date | Base du calcul `dateEnvoiThéorique = date_echeance + delai` |
| `sequence` | Pointer → Sequence | Obligatoire : fournit les templates email par scénario |
| `contact_relance` | Pointer → Contact | Destinataire de la relance |
| `payeur` | Pointer → Contact | Payeur réel (fallback si pas de `contact_relance`) |
| `payeur_type` | String | Valeurs : `"Propriétaire"`, `"Apporteur d'affaire"`, `"Autre"` |
| `apporteur` | Pointer → Contact | Apporteur d'affaires (pour scénarios `broker` / `both`) |
| `isBlacklisted` | Boolean | Exclu si `true` |
| `nfacture` | Number | Numéro de facture (affiché dans le template) |
| `numero_dossier` | Number | Numéro de dossier (affiché dans le template) |
| `adresse_bien`, `ville`, `code_postal` | String | Adresse du bien (template) |
| `total_ttc`, `total_ht` | Number | Montants (template) |

### 2.2 `Sequence`

| Champ | Type | Rôle dans la méga-fonction |
|---|---|---|
| `objectId` | String | Identifiant |
| `type` | String | Filtré à `"relances"` (exclure `"suivi"`) |
| `emails` | Array | Tableau des étapes. Chaque objet contient : `email_index`, `delai`, `scenarios`, `smtp`, `cc`, `to`, `frequence` |
| `validation_obligatoire` | Boolean | Détermine `valide` sur la Relance créée |
| `publiee` | Boolean | Filtré à `true` |

**Structure d'un élément `emails[i]` :**

```json
{
  "email_index": 1,
  "delai": 0,
  "smtp": "",
  "to": "[[payeur_email]]",
  "cc": "",
  "frequence": "hebdomadaire",
  "scenarios": [
    { "format": "single",  "active": true,  "smtp": "YPsNANpWhC", "objet": "...", "corps": "<p>...</p>" },
    { "format": "multiple","active": true,  "smtp": "YPsNANpWhC", "objet": "...", "corps": "<p>...</p>" },
    { "format": "both",    "active": false, "smtp": "",         "objet": "...", "corps": "<p>...</p>" },
    { "format": "broker",  "active": false, "smtp": "",         "objet": "...", "corps": "<p>...</p>" }
  ]
}
```

> `frequence` est ignorée pour le calcul du jour J (uniquement `delai` compte).

### 2.3 `Relance`

| Champ | Type | Rôle dans la méga-fonction |
|---|---|---|
| `objectId` | String | Identifiant (créé par la méga-fonction) |
| `contact` | Pointer → Contact | Destinataire |
| `sequence` | Pointer → Sequence | Séquence utilisée |
| `email_index` | Number | Index de l'étape envoyée (pour calculer le prochain) |
| `impayes` | Array (Pointers) | Liste des impayés liés à cette relance |
| `scenario` | String | Format utilisé : `"single"`, `"multiple"`, `"broker"`, `"both"` |
| `statut` | String | `"pret pour envoi"` (créé par cette fonction) |
| `dateEnvoi` | Date | Fixé à **aujourd'hui 19h00** |
| `objet` | String | Sujet généré par Ollama |
| `corps` | String | Corps HTML généré par Ollama |
| `valide` | Boolean | `!validation_obligatoire` |
| `manuelle` | Boolean | `false` |
| `smtpProfil` | Pointer → SmtpProfile | Résolu depuis `scenarioActif.smtp` via `createWithoutData` |
| `cc` | String | Copié depuis `scenarioActif.cc` |
| `erreur_count` | Number | `0` |

### 2.4 `Contact`

| Champ | Type | Rôle dans la méga-fonction |
|---|---|---|
| `objectId` | String | Identifiant |
| `email` | String | Vérifié non vide et contenant `@` |
| `nom`, `prenom` | String | Dénorm. affichés dans les templates |
| `type_personne` | String | Détermine `isBroker` : `"Apporteur d'affaire"`, `"Apporteur"` |
| `isBlacklisted` | Boolean | Exclu si `true` |
| `civilite` | String | Affichée dans les templates |

### 2.5 `SmtpProfile`

| Champ | Type | Rôle dans la méga-fonction |
|---|---|---|
| `objectId` | String | Référencé par `scenarioActif.smtp` (ex: `"YPsNANpWhC"`) |

> Résolution : `SmtpProfile.createWithoutData(scenarioActif.smtp)` → pointer vers le profil SMTP.

---

## 3. Flux algorithmique

### 3.1 Entrée / Sortie

| | Description |
|---|---|
| **Entrée** | Aucune (cron autonome). Peut être appelée manuellement via `Parse.Cloud.run("generateRelancesDuJour", {}, { useMasterKey: true })`. |
| **Sortie** | `{ success: true, relancesCrees: number, relancesIgnorees: number, contactsIgnores: number, erreurs: number }` |

### 3.2 Algorithme étape par étape

```
1. RÉCUPÉRATION DES IMPAYÉS ACTIFS AVEC SÉQUENCE
   Query Impaye :
     - facture_soldee = false
     - reste_a_payer > 0
     - sequence exists
     - include: sequence, contact_relance, payeur
     - limit: 999999

2. FILTRAGE INITIAL
   Pour chaque impayé :
     a. Séquence.type === "relances" ET Séquence.publiee === true
     b. Contact.isBlacklisted !== true (contact_relance ou payeur)
     c. Impaye.isBlacklisted !== true
     d. Email valide (contact_relance.email ou payeur.email avec @)

3. REGROUPEMENT
   Map: key = contact.id + "_" + sequence.id
   Valeur: { contact, sequence, impayes: [] }
   Tous les impayés du même contact + même séquence sont regroupés.

4. POUR CHAQUE GROUPE (contact, sequence) :

   4a. DATE D'ÉCHÉANCE DE RÉFÉRENCE
       dateEcheanceRef = min(date_echeance de tous les impayés du groupe)
       Si dateEcheanceRef < aujourd'hui (00h00) :
         → dateEcheanceRef = aujourd'hui (00h00)

   4b. PROCHAIN EMAIL_INDEX
       Query Relance :
         - contact = contact.id
         - sequence = sequence.id
         - manuelle = false
         - statut = "Envoyé"
         - order by email_index DESC
         - limit 1
       Si trouvé → prochainIndex = dernier.email_index + 1
       Sinon → prochainIndex = 0

   4c. VÉRIFICATION EXISTENCE DANS SÉQUENCE
       emails = sequence.get("emails") || []
       emailConfig = emails.find(e => e.email_index === prochainIndex)
       Si non trouvé → fin de séquence, ignorer le contact

   4d. CALCUL DATE THÉORIQUE (FILTRE CLÉ)
       delai = emailConfig.delai || 0
       dateEnvoiTheorique = new Date(dateEcheanceRef)
       dateEnvoiTheorique.setDate(dateEnvoiTheorique.getDate() + delai)

   4e. VÉRIFICATION JOUR J (FILTRE CLÉ)
       aujourdhui = new Date(); aujourdhui.setHours(0,0,0,0)
       theoriqueJour = new Date(dateEnvoiTheorique); theoriqueJour.setHours(0,0,0,0)

       Si theoriqueJour !== aujourdhui ET theoriqueJour > aujourdhui :
         → IGNORER le contact (pas son jour)
       Si theoriqueJour < aujourdhui :
         → Vérifier s'il existe une relance "Envoyé" pour cet email_index
            Si oui → déjà rattrapé, ignorer
            Si non → rattrapage : générer quand même (envoi retardé)

   4f. DÉTECTION SCENARIO_TYPE
       Query brokerImpayes :
         - apporteur = contact
         - payeur ≠ contact
         - contact_relance ≠ contact
         - facture_soldee = false
         - reste_a_payer > 0
       isBroker = contact.type_personne === "Apporteur d'affaire"

       Si isBroker ET brokerImpayes.length > 0 :
         → Si impayes (propres).length > 0 → "both"
         → Sinon → "broker"
       Sinon Si impayes.length === 1 → "single"
       Sinon → "multiple"

   4g. SÉLECTION DU SCÉNARIO ACTIF
       scenarioActif = emailConfig.scenarios.find(s => s.format === scenarioType && s.active)
       Si non trouvé :
         → Fallback : "both" → "multiple" → "single"
         → Si toujours pas trouvé → ignorer le contact

   4h. GÉNÉRATION DU CONTENU (Ollama)
       i. Charger prompt : /configuration/prompts/scenarios/relance-{scenarioType}-prompt.txt
       ii. Construire JSON des impayés (buildImpayesJson)
       iii. Construire JSON de l'historique (getHistory : 10 dernières relances envoyées
            pour ce contact/séquence, partageant au moins un impaye.id)
       iv. Construire JSON du contact
       v. Appeler Ollama : POST /api/generate
           { model: "mistral-large-3:675b", prompt, temperature: 0.1 }
       vi. Parser réponse YAML (objet + corps)
       vii. Remplacer placeholders :
             [[lien_pdf]] → FRONTEND_URL/redirect-pdf/{impayes[0].id}
             [[lien_espace]] → FRONTEND_URL/redirect-espace/{contact.id}
       viii. Si Ollama échoue → fallback sur scenarioActif.objet / scenarioActif.corps

   4i. CRÉATION DE LA RELANCE
       const relance = new Relance()
       relance.set("contact", contact)
       relance.set("sequence", sequence)
       relance.set("email_index", prochainIndex)
       relance.set("impayes", impayes)
       relance.set("scenario", scenarioType)
       relance.set("statut", "pret pour envoi")
       relance.set("valide", !sequence.get("validation_obligatoire"))
       relance.set("manuelle", false)
       relance.set("dateEnvoi", new Date().setHours(19,0,0,0))
       relance.set("objet", objetFinal)
       relance.set("corps", corpsFinal)
       relance.set("erreur_count", 0)
       if (scenarioActif.smtp) {
         const smtpPtr = SmtpProfile.createWithoutData(scenarioActif.smtp)
         relance.set("smtpProfil", smtpPtr)
       }
       if (scenarioActif.cc) relance.set("cc", scenarioActif.cc)
       await relance.save(null, { useMasterKey: true })

5. RETOUR
   { success: true, relancesCrees, relancesIgnorees, contactsIgnores, erreurs }
```

## 4. Architecture : une seule méga-fonction linéaire

> Pas de fonctions utilitaires externes ni d'extraction de logique.
> Tout le workflow est contenu dans **une seule fonction `generateRelancesDuJour`** dont les étapes s'enchaînent séquentiellement, sans découpage ni abstraction intermédiaire.

```js
async function generateRelancesDuJour() {
  // 1. Récupération des impayés actifs avec séquence
  // 2. Filtrage initial (blacklist, email, type séquence)
  // 3. Regroupement par (contact.id, sequence.id)
  // 4. Pour chaque groupe :
  //    a. Calcul dateEcheanceRef (min, fallback aujourd'hui)
  //    b. Détermination prochain email_index (historique envoyé)
  //    c. Vérification existence dans sequence.emails
  //    d. Calcul dateEnvoiThéorique (delai)
  //    e. Filtre jour J (=== aujourd'hui)
  //    f. Détection scenarioType (brokerImpayes)
  //    g. Sélection scénario actif + fallback
  //    h. Génération contenu (prompt → Ollama → YAML → placeholders)
  //    i. Création Relance en base
  // 5. Retour des stats
}
```

Les étapes **a. à i.** s'exécutent séquentiellement pour chaque groupe, en bloc, sans factorisation en sous-fonctions.

---

## 5. Tâches de développement

### 5.1 Création du fichier principal

- [ ] Créer `backend/cloud/workflows/generate-relances-du-jour/index.js`
- [ ] Structurer comme méga-fonction : `async function generateRelancesDuJour()` + `Parse.Cloud.define("generateRelancesDuJour", ...)`
- [ ] Exporter le module : `module.exports = generateRelancesDuJour`
- [ ] Implémenter la log de fichier (rotation quotidienne dans `./logs/`)

### 5.2 Récupération des impayés

- [ ] Query `Impaye` avec filtres `facture_soldee=false`, `reste_a_payer>0`, `sequence exists`
- [ ] Include `sequence`, `contact_relance`, `payeur`
- [ ] Filtrer `sequence.type === "relances"` et `sequence.publiee === true`
- [ ] Filtrer contacts/impayés blacklistés
- [ ] Filtrer emails invalides (`contactHasEmail`)

### 5.3 Regroupement et calcul du prochain index

- [ ] Regrouper par `contact.id + sequence.id` (plus de `nfacture`)
- [ ] Calculer `dateEcheanceRef = min(date_echeance)` avec fallback `aujourdhui` si passée
- [ ] Query historique des relances `Envoyé` pour déterminer `prochainIndex`
- [ ] Vérifier existence de `prochainIndex` dans `sequence.emails`

### 5.4 Filtre jour J

- [ ] Calculer `dateEnvoiTheorique = dateEcheanceRef + delai`
- [ ] Comparer avec `aujourdhui` (00h00)
- [ ] Ignorer si dans le futur
- [ ] Gérer le rattrapage si dans le passé mais jamais envoyé

### 5.5 Détection du scénario

- [ ] Implémenter `getBrokerImpayes` (query par `apporteur`)
- [ ] Implémenter `determineScenarioType` avec arbre de décision complet
- [ ] Gérer le fallback de scénario (`both` → `multiple` → `single`) si le format initial n'est pas actif

### 5.6 Génération du contenu

- [ ] Charger le prompt spécifique selon `scenarioType`
- [ ] Construire le JSON des impayés + historique + contact
- [ ] Appeler Ollama avec timeout et gestion d'erreur
- [ ] Parser la réponse YAML (`objet`, `corps`)
- [ ] Fallback sur les templates `scenarioActif.objet` / `scenarioActif.corps` si Ollama échoue
- [ ] Remplacer les placeholders `[[lien_pdf]]` et `[[lien_espace]]`

### 5.7 Création de la Relance

- [ ] Instancier `new Relance()`
- [ ] Résoudre `scenarioActif.smtp` en `Pointer → SmtpProfile` via `createWithoutData`
- [ ] Fixer `dateEnvoi` à aujourd'hui 19h00
- [ ] Fixer `statut = "pret pour envoi"`, `manuelle = false`, `erreur_count = 0`
- [ ] Sauvegarder avec `useMasterKey: true`

### 5.8 Intégration cron

- [ ] Modifier `backend/cron.js` : ajouter `require` + `cron.schedule("0 17 * * *", ...)`
- [ ] Retirer les `require` et `cron.schedule` obsolètes :
  - `cleanupAllRelancesPaidImpayesMaster`
  - `regenerateRelancesWithStatusMaster`
  - `cleanupRelancesBlacklistMaster`
  - `cleanupAllRelancesBlacklistMaster`

### 5.9 Suppression de l'appel dans import-invoice

- [ ] Modifier `backend/cloud/workflows/import-invoice/00-master.js`
- [ ] Retirer l'appel `Parse.Cloud.run("generateRelances", ...)`
- [ ] S'assurer que l'import ne fait plus que : import factures + assign sequences

### 5.10 Tests

- [ ] Test unitaire : contact avec 1 impayé, délai=0 → génère email_index=0
- [ ] Test unitaire : contact avec 3 impayés, délai=0 → génère email_index=0 en scénario "multiple"
- [ ] Test : dateEcheance dans le passé → fallback à aujourd'hui
- [ ] Test : jour J non atteint → contact ignoré, aucune relance créée
- [ ] Test : fin de séquence (prochainIndex hors tableau) → contact ignoré
- [ ] Test : contact apporteur avec brokerImpayes → scénario "broker" ou "both"
- [ ] Test : scénario non actif → fallback correct
- [ ] Test : Ollama indisponible → fallback sur template
- [ ] Test manuel via Parse Dashboard : `Parse.Cloud.run("generateRelancesDuJour", {})`

---

## 6. Dépendances externes

| Dépendance | Utilisation |
|---|---|
| `parse/node` | Parse SDK pour queries et save |
| `fs` | Lecture des fichiers de prompt |
| `path` | Construction des chemins de prompt |
| `js-yaml` | Parsing de la réponse Ollama |
| `fetch` (global) | Appel HTTP à l'API Ollama |
| Prompts `/configuration/prompts/scenarios/relance-{type}-prompt.txt` | Templates pour Ollama |

---

## 7. Variables d'environnement

| Variable | Valeur par défaut | Utilisation |
|---|---|---|
| `FRONTEND_URL` | `https://adti.markidiags.com` | Construction des liens `[[lien_pdf]]` et `[[lien_espace]]` |
| `OLLAMA_API_URL` | — | URL de l'API Ollama |
| `OLLAMA_API_KEY` | — | Clé API Ollama (optionnel) |
| `OLLAMA_MODEL` | `mistral-large-3:675b` | Modèle LLM utilisé |

---

## 8. Livrables attendus

| Fichier | Action |
|---|---|
| `backend/cloud/workflows/generate-relances-du-jour/index.js` | **Créer** – Méga-fonction complète |
| `backend/cloud/workflows/generate-relances-du-jour/logs/` | **Créer** – Répertoire de logs (auto-créé par la fonction) |
| `backend/cron.js` | **Modifier** – Ajouter le cron 17h00, retirer les crons obsolètes |
| `backend/cloud/workflows/import-invoice/00-master.js` | **Modifier** – Retirer l'appel à `generateRelances` |
| `backend/cloud/workflows/generate-relances/index.js` | **Conserver** – Référence pour extraction des utilitaires |
