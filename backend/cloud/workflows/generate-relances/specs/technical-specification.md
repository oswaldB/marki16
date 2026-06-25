# Spécification Technique - Workflow Génération des Relances

## Sommaire
1. [Modèles de Données](#modèles-de-données)
2. [Fonctionnement du Script](#fonctionnement-du-script)

---

## Modèles de Données

### Commande cURL pour récupérer les schémas

```bash
# Récupération de tous les schémas
curl -X GET "https://dev.markidiags.com/api/parse/schemas" \
  -H "X-Parse-Application-Id: adti-marki" \
  -H "X-Parse-Master-Key: e2f4e4e89056af61dd95a71226fa0e51917313e09b68aca8bf434e5eb9bd8aa9"

# Récupération d'un schéma spécifique
curl -X GET "https://dev.markidiags.com/api/parse/schemas/{ClassName}" \
  -H "X-Parse-Application-Id: adti-marki" \
  -H "X-Parse-Master-Key: e2f4e4e89056af61dd95a71226fa0e51917313e09b68aca8bf434e5eb9bd8aa9"
```

### 1. Classe `Impaye`

**Description** : Représente une facture impayée

**Champs principaux** :
```javascript
{
  "objectId": String,
  "nfacture": Number,
  "reference": String,
  "date_piece": Date,
  "date_echeance": Date,
  "total_ht": Number,
  "total_ttc": Number,
  "montant_total": Number,
  "reste_a_payer": Number,
  "facture_soldee": Boolean,
  "payeur_nom": String,
  "payeur_prenom": String,
  "payeur_email": String,
  "payeur_telephone": String,
  "payeur_civilite": String,
  "payeur_type": String,
  "payeur": Pointer(Contact),
  "contact_relance": Pointer(Contact),
  "sequence": Pointer(Sequence),
  "adresse_bien": String,
  "ville": String,
  "code_postal": String,
  "numero_dossier": Number,
  "id_dossier": String,
  "url_pdf": String, // Chemin dans le SFTP pour la facture
  "ref_piece": String,
  "commentaire_piece": String,
  "apporteur_nom": String,
  "apporteur_prenom": String,
  "apporteur_email": String,
  "apporteur_telephone": String,
  "apporteur_civilite": String,
  "apporteur_societe": String,
  "proprietaire_nom": String,
  "proprietaire_prenom": String,
  "proprietaire_email": String,
  "proprietaire_telephone": String,
  "proprietaire_civilite": String,
  "donneur_ordre_nom": String,
  "donneur_ordre_prenom": String,
  "donneur_ordre_email": String,
  "donneur_ordre_telephone": String,
  "donneur_ordre_civilite": String
}
```

### 2. Classe `Contact`

**Description** : Représente un contact

**Champs** :
```javascript
{
  "objectId": String,
  "nom": String,
  "prenom": String,
  "email": String,
  "telephone": String,
  "civilite": String,
  "type_personne": String,
  "isBlacklisted": Boolean,
  "nb_impayes": Number
}
```

### 3. Classe `Sequence`

**Description** : Représente une séquence de relances

**Champs** :
```javascript
{
  "objectId": String,
  "nom": String,
  "type": String,
  "publiee": Boolean,
  "validation_obligatoire": Boolean,
  "attribution_automatique": Boolean,
  "lien_paiement": String,
  "emails": [
    {
      "email_index": Number,
      "delai": Number,
      "objet": String,
      "corps": String,
      "smtp": String,
      "to": String,
      "cc": String,
      "frequence": String,
      "scenarios": [
        {
          "format": String, // "single" ou "multiple"
          "active": Boolean,
          "objet": String,
          "corps": String,
          "smtp": String // ID du profil SMTP pour ce scénario
        }
      ]
    }
  ]
}
```

### 4. Classe `Relance`

**Description** : Représente une relance générée

**Champs** :
```javascript
{
  "objectId": String,
  "statut": String,
  "manuelle": Boolean,
  "valide": Boolean,
  "objet": String,
  "corps": String,
  "dateEnvoi": Date,
  "envoye_le": Date,
  "contact": Pointer(Contact),
  "sequence": Pointer(Sequence),
  "smtpProfil": Pointer(SmtpProfile),
  "email_index": Number,
  "scenario": String,
  "impayes": Array,
  "cc": String,
  "erreur_count": Number,
  "erreur_message": String
}
```

### 5. Classe `SmtpProfile`

**Description** : Profil SMTP pour l'envoi d'emails

**Champs** :
```javascript
{
  "objectId": String,
  "nom": String,
  "host": String,
  "port": Number,
  "username": String,
  "password": String,
  "email_from": String,
  "signature_html": String
}
```

### 6. Classe `LienPaiement`

**Description** : Lien de paiement pour les relances

**Champs** :
```javascript
{
  "objectId": String,
  "nom": String,
  "url": String // URL de paiement avec template de variables
}
```


## Fonctionnement du Script

### Architecture

Le workflow est une seule méga fonction qui intègre toutes les étapes dans l'ordre suivant :

### Étapes Détaillées

#### Étape 1 : Récupération des impayés avec séquence

**Requête Parse** :
```javascript
const Impaye = Parse.Object.extend("Impaye");
const impayeQuery = new Parse.Query(Impaye);
impayeQuery.equalTo("facture_soldee", false);
impayeQuery.greaterThan("reste_a_payer", 0);
impayeQuery.exists("sequence");
impayeQuery.include(["sequence", "contact_relance", "payeur"]);
impayeQuery.limit(999999);
const impayesAvecSequence = await impayeQuery.find({ useMasterKey: true });
```

#### Étape 2 : Filtrage des impayés sans relance, des séquences de type relance, exclusion des contacts blacklistés et exclusion des contacts sans email

**Logique** :

Cette étape applique quatre filtres successifs :
1. Conservation des impayés avec des séquences de type "relances"
2. Exclusion des contacts blacklistés (via le champ `isBlacklisted` de la classe `Contact`)
3. Exclusion des impayés déjà associés à une relance envoyée
4. Exclusion des impayés dont le contact de relance n'a pas d'adresse email (les relances ne sont générées que pour les contacts disposant d'un email valide)

```javascript
// Filtre 1 : Ne garder que les impayés dont la séquence est de type "relances"
const impayesAvecSequenceRelance = impayesAvecSequence.filter(
    (impaye) => {
        const sequence = impaye.get("sequence");
        return sequence && sequence.get("type") === "relances";
    }
);

// Filtre 1.5 : Exclure les contacts blacklistés
const impayesSansContactsBlacklistes = impayesAvecSequenceRelance.filter(
    (impaye) => {
        let contact = impaye.get("contact_relance");
        if (!contact) {
            contact = impaye.get("payeur");
        }
        // Si aucun contact trouvé, on conserve l'impayé (sera filtré plus tard)
        // Sinon, on exclut si le contact est blacklisté
        return !contact || contact.get("isBlacklisted") !== true;
    }
);

// Filtre 2 : Récupérer les impayés déjà associés à une relance envoyée
const Relance = Parse.Object.extend("Relance");
const relanceQuery = new Parse.Query(Relance);
relanceQuery.limit(999999);
relanceQuery.equalTo("manuelle", false);
relanceQuery.exists("dateEnvoi");
const relances = await relanceQuery.find({ useMasterKey: true });

const impayesAvecRelanceIds = new Set();
for (const relance of relances) {
    const impayesArray = relance.get("impayes");
    if (impayesArray && Array.isArray(impayesArray)) {
        for (const impaye of impayesArray) {
            impayesAvecRelanceIds.add(impaye.id || impaye.objectId);
        }
    }
}

// Filtre 2bis : Exclure les impayés dont le contact de relance n'a pas d'email
// Une relance ne peut être générée que si le contact destinataire possède une adresse email.
// La vérification se fait sur l'objet Contact (champ `email`) et non sur les champs
// dénormalisés de l'Impaye.
function contactHasEmail(impaye) {
    let contact = impaye.get("contact_relance");
    if (!contact) {
        contact = impaye.get("payeur");
    }

    // Pas de contact identifiable : on ne peut pas générer de relance
    if (!contact) {
        return false;
    }

    const email = contact.get("email");
    if (typeof email !== "string") {
        return false;
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail.length === 0) {
        return false;
    }

    // Validation minimale : présence d'un @ avec une partie locale et un domaine non vides
    const atIndex = trimmedEmail.indexOf("@");
    if (atIndex <= 0 || atIndex === trimmedEmail.length - 1) {
        return false;
    }

    return true;
}

// Filtre final : exclure les impayés déjà relancés ET ceux dont le contact n'a pas d'email
const impayesSansRelance = impayesSansContactsBlacklistes.filter(
    (impaye) => !impayesAvecRelanceIds.has(impaye.id) && contactHasEmail(impaye)
);
```

#### Étape 3 : Regroupement des impayés par payeur

**Logique** :
```javascript
const groupedByContactSequence = new Map();

for (const impaye of impayesSansRelance) {
    // Utiliser contact_relance si disponible, sinon utiliser payeur
    let contact = impaye.get("contact_relance");
    if (!contact) {
        contact = impaye.get("payeur");
    }
    
    const sequence = impaye.get("sequence");

    if (!contact || !sequence) continue;

    const key = `${contact.id}_${sequence.id}`;
    if (!groupedByContactSequence.has(key)) {
        groupedByContactSequence.set(key, { contact, sequence, impayes: [] });
    }
    groupedByContactSequence.get(key).impayes.push(impaye);
}
```

#### Étape 4 : Détermination du scénario (single vs multiple) et création des relances

**Logique de détermination entre scénario `single` et `multiple`** :

La détermination est automatique et basée sur le nombre d'impayés dans le groupe :

```javascript
// Détermination automatique du scénario selon le nombre d'impayés
// - 1 impayé → single
// - 2+ impayés → multiple
const nombreImpayes = impayes.length;
const scenarioType = nombreImpayes === 1 ? "single" : "multiple";

// Rechercher le scénario correspondant dans la configuration
const scenarioActif = scenarios.find(s => s.format === scenarioType && s.active);

if (!scenarioActif) {
    // Aucun scénario correspondant actif, ignorer ce groupe
    continue;
}
```

**Règles de détermination** :

| Nombre d'impayés | Scénario sélectionné | Description |
|------------------|----------------------|-------------|
| 1 | `single` | Email personnalisé pour une facture unique |
| 2 ou plus | `multiple` | Email pour relancer plusieurs factures |

**Important** :
- Le système détermine automatiquement le type de scénario en fonction du nombre d'impayés
- Il recherche ensuite dans la configuration de la séquence un scénario actif correspondant au format déterminé
- Si aucun scénario actif n'existe pour le format déterminé, le groupe est ignoré
- Une seule relance est générée par groupe (pas de génération multiple)

**Pour chaque groupe et chaque email de la séquence** :

```javascript
// Calcul de la date d'envoi
let dateEcheance = null;
for (const impaye of impayes) {
    const impayeDateEcheance = impaye.get("date_echeance");
    if (impayeDateEcheance) {
        if (!dateEcheance || impayeDateEcheance < dateEcheance) {
            dateEcheance = impayeDateEcheance;
        }
    }
}

if (!dateEcheance) dateEcheance = new Date();
const maintenant = new Date();
if (dateEcheance < maintenant) dateEcheance = maintenant;

let delai = emailConfig.delai || 0;
if (!delai && fullSequence.get("delai")) delai = fullSequence.get("delai");

const dateEnvoi = new Date(dateEcheance);
dateEnvoi.setDate(dateEnvoi.getDate() + (delai || 0));

// smtpProfil depuis sequence.emails[].scenarios[].smtp uniquement
let smtpId = null;
const activeScenario = emailConfig.scenarios?.find(s => s.format === scenarioType && s.active);
if (activeScenario && activeScenario.smtp) {
    smtpId = activeScenario.smtp;
}

if (smtpId) {
    const SmtpProfile = Parse.Object.extend("SmtpProfile");
    const smtpProfileObj = SmtpProfile.createWithoutData(smtpId);
    relance.set("smtpProfil", smtpProfileObj);
}

// Vérifier si relance existe déjà et a été envoyée
const existingRelanceQuery = new Parse.Query(Relance);
existingRelanceQuery.equalTo("contact", contact);
existingRelanceQuery.equalTo("sequence", sequence);
existingRelanceQuery.equalTo("email_index", emailIndex);
existingRelanceQuery.containedIn("impayes", impayes.map(i => i.id));
existingRelanceQuery.equalTo("manuelle", false);
existingRelanceQuery.exists("dateEnvoi");

if ((await existingRelanceQuery.first({ useMasterKey: true }))) continue;
```

#### Étape 5 : Génération avec Ollama (mistral-large-3:675b-cloud)

**Configuration** :
```javascript
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || "https://ollama.com/api";
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
const OLLAMA_MODEL = "mistral-large-3:675b-cloud";
const USE_OLLAMA = true
```

**Format de sortie YAML** :

Le LLM génère sa réponse au format YAML (plus permissif avec les caractères de contrôle et les sauts de ligne), qui est ensuite converti en objet JavaScript pour le traitement interne.

Dépendance requise : `js-yaml` (déjà présent dans le projet)

```javascript
const yaml = require('js-yaml');

function parseLLMResponse(content) {
    // Extraire le bloc YAML de la réponse
    const yamlMatch = content.match(/---\n([\s\S]*?)\n---/) || 
                      content.match(/```yaml\n([\s\S]*?)```/) ||
                      content.match(/^(objet:|corps:)/m) ? [null, content] : null;
    
    if (!yamlMatch) {
        throw new Error("Format YAML non trouvé dans la réponse");
    }
    
    const yamlContent = yamlMatch[1] || content;
    
    // Parser le YAML en objet JavaScript
    const parsed = yaml.load(yamlContent);
    
    // Vérifier la structure attendue
    if (!parsed.objet || !parsed.corps) {
        throw new Error("La réponse doit contenir les champs 'objet' et 'corps'");
    }
    
    return {
        objet: parsed.objet,
        corps: parsed.corps
    };
}
```


**Exemple de réponse attendue** :

```yaml
objet: Votre relance de facture - Action requise
corps: |
  <p>Bonjour,</p>
  
  <p>Nous vous rappelons que la facture n°1234 d'un montant de <strong>1 500,00 €</strong>
  est en attente de réglement depuis le 15/06/2024.</p>
  
  <p><a href="[[lien_pdf]]">Télécharger la facture PDF</a></p>
```

**Prompt complet** (voir `configuration/prompts/relance-email-prompt.txt`) :

> **⚠️ Précision sur le chemin** : Le fichier de prompt est situé dans le dossier racine du projet (`/home/ubuntu/prod/adti/configuration/prompts/relance-email-prompt.txt`).

```javascript
const PROMPT_FILE = "/home/ubuntu/prod/adti/configuration/prompts/relance-email-prompt.txt";
const promptTemplate = fs.readFileSync(PROMPT_FILE, "utf-8");

const objetTemplate = scenarioActif?.objet || emailConfig.objet || "";
const corpsTemplate = scenarioActif?.corps || emailConfig.corps || "";
const impayesJson = JSON.stringify(impayes);
const historyJson = JSON.stringify(history);
const contactJson = JSON.stringify(contact);

const prompt = promptTemplate
    .replace(/{{objetTemplate}}/g, objetTemplate)
    .replace(/{{corpsTemplate}}/g, corpsTemplate)
    .replace(/{{impayesJson}}/g, impayesJson)
    .replace(/{{historyJson}}/g, historyJson)
    .replace(/{{emailIndex}}/g, emailIndex)
    .replace(/{{contactJson}}/g, contactJson)
    .replace(/{{scenarioType}}/g, scenarioType);
```

> **Note** : Le prompt est externalisé dans `/home/ubuntu/prod/adti/configuration/prompts/relance-email-prompt.txt` (racine du projet). Voir ce fichier pour le contenu complet des règles de génération.

**Construction de impayesJson** :
Tous les champs suivants de la classe `Impaye` doivent être inclus dans le JSON envoyé au LLM pour permettre une personnalisation complète des emails :

```javascript
const impayesData = impayes.map(i => ({
    // Identifiants
    id: i.id,
    nfacture: i.get("nfacture"),
    reference: i.get("reference"),
    ref_piece: i.get("ref_piece"),
    numero_dossier: i.get("numero_dossier"),
    id_dossier: i.get("id_dossier"),
    
    // Dates
    date_piece: i.get("date_piece"),
    date_echeance: i.get("date_echeance"),
    
    // Montants
    total_ht: i.get("total_ht"),
    total_ttc: i.get("total_ttc"),
    montant_total: i.get("montant_total"),
    reste_a_payer: i.get("reste_a_payer"),
    
    // Statut
    facture_soldee: i.get("facture_soldee"),
    
    // Commentaire
    commentaire_piece: i.get("commentaire_piece"),
    
    // Payeur (informations dénormalisées)
    payeur_nom: i.get("payeur_nom"),
    payeur_prenom: i.get("payeur_prenom"),
    payeur_email: i.get("payeur_email"),
    payeur_telephone: i.get("payeur_telephone"),
    payeur_civilite: i.get("payeur_civilite"),
    payeur_type: i.get("payeur_type"),
    
    // Bien immobilier
    adresse_bien: i.get("adresse_bien"),
    ville: i.get("ville"),
    code_postal: i.get("code_postal"),
    
    // Document
    url_pdf: i.get("url_pdf"),
    
    // Apporteur
    apporteur_nom: i.get("apporteur_nom"),
    apporteur_prenom: i.get("apporteur_prenom"),
    apporteur_email: i.get("apporteur_email"),
    apporteur_telephone: i.get("apporteur_telephone"),
    apporteur_civilite: i.get("apporteur_civilite"),
    apporteur_societe: i.get("apporteur_societe"),
    
    // Propriétaire
    proprietaire_nom: i.get("proprietaire_nom"),
    proprietaire_prenom: i.get("proprietaire_prenom"),
    proprietaire_email: i.get("proprietaire_email"),
    proprietaire_telephone: i.get("proprietaire_telephone"),
    proprietaire_civilite: i.get("proprietaire_civilite"),
    
    // Donneur d'ordre
    donneur_ordre_nom: i.get("donneur_ordre_nom"),
    donneur_ordre_prenom: i.get("donneur_ordre_prenom"),
    donneur_ordre_email: i.get("donneur_ordre_email"),
    donneur_ordre_telephone: i.get("donneur_ordre_telephone"),
    donneur_ordre_civilite: i.get("donneur_ordre_civilite")
}));
```

**Construction de historyJson** :
- Récupérer les relances déjà envoyées pour ce contact et ces impayés
- **La récupération doit être faite avant chaque génération d'email** (à l'intérieur de la boucle des emails) pour inclure les relances précédemment créées dans la même séquence
- Limiter à 10 pour éviter un prompt trop long
- Inclure tous les champs pertinents
- Filtrer par séquence pour n'avoir que l'historique de la séquence courante



---

#### Étape 6 : Remplacement des variables `[[lien_pdf]]` et `[[lien_espace]]`

**Description** : Après la génération du contenu par Ollama, remplacer les placeholders `[[lien_pdf]]` et `[[lien_espace]]` par les URLs des écrans de redirection.

**Logique** :
```javascript
const frontendUrl = process.env.FRONTEND_URL || "https://adti.markidiags.com";

// Remplacer [[lien_pdf]] par l'URL de l'écran de redirection PDF
// Structure: /redirect-pdf/{impayeId}
// Le premier impayé du groupe est utilisé pour le lien PDF
if (impayes.length > 0) {
    const lienPdf = `${frontendUrl}/redirect-pdf/${impayes[0].id}`;
    objetFinal = objetFinal.split("[[lien_pdf]]").join(lienPdf);
    corpsFinal = corpsFinal.split("[[lien_pdf]]").join(lienPdf);
}

// Remplacer [[lien_espace]] par l'URL de l'écran de redirection espace client
// Structure: /redirect-espace/{contactId}
const lienEspace = `${frontendUrl}/redirect-espace/${contact.id}`;
objetFinal = objetFinal.split("[[lien_espace]]").join(lienEspace);
corpsFinal = corpsFinal.split("[[lien_espace]]").join(lienEspace);
```

**Notes** :
- Les URLs pointent vers les pages de redirection intermédiaires (sans token)


---

#### Étape 7 : Sauvegarde des relances avec tous les champs

**Champs sauvegardés** :
```javascript
relance.set("contact", contact);
relance.set("sequence", sequence);
relance.set("email_index", emailIndex);
relance.set("impayes", impayes.map(i => i));
relance.set("scenario", scenarioType);
relance.set("valide", !validationObligatoire);
relance.set("manuelle", false);
relance.set("smtpProfil", smtpProfileObj);
relance.set("dateEnvoi", dateEnvoi);
relance.set("objet", objetFinal);
relance.set("corps", corpsFinal);
relance.set("statut", "pret pour envoi");

await relance.save(null, { useMasterKey: true });
```

---

## Logs et Monitoring

### Emplacement des logs

Les logs du workflow sont stockés dans le dossier dédié du workflow :

```
backend/cloud/workflows/generate-relances/logs/
```

**Format des logs :**
- Préfixe identifiant : `[INFO][contactId][email_index]` pour les opérations Ollama
- `[GENERATE-RELANCES]` pour les logs généraux du workflow

**Types de logs générés :**

| Catégorie | Contenu |
|-----------|---------|
| Démarrage | Nombre d'impayés trouvés, groupes à traiter |
| Ollama | Durée d'appel API, taille du prompt/réponse, erreurs |
| Création | Nombre de relances créées, IDs des contacts traités |
| Erreurs | Messages d'erreur détaillés avec contexte |

**Configuration des logs Ollama détaillée :**
- Timestamp de début/fin
- Durée totale de l'opération
- Modèle utilisé
- Taille du prompt et de la réponse
- Status HTTP de l'API
- Aperçu des templates et résultats (200 premiers caractères)
- Messages d'erreur complets en cas d'échec (timeout, réseau, parsing)
