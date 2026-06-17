# Guide Technique - Workflow Génération des Relances

## **Architecture Modulaire (Nœuds Autonomes)**

### Principes Clés
1. **Un nœud = Une fonction** : Chaque nœud du workflow est une fonction JavaScript autonome.
2. **Autonomie** : Chaque nœud est responsable d'une seule tâche et peut être exécuté indépendamment.
3. **Contrats de données** : Chaque nœud a un **format d'entrée (input)** et un **format de sortie (output)** clairement définis.
4. **Chaînage** : La sortie d'un nœud peut être utilisée comme entrée pour le nœud suivant.
5. **Pas d'effets de bord** : Les nœuds ne modifient pas directement les données des autres nœuds (sauf via Parse).

---

## **Structure Générale du Workflow**

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MASTER ORCHESTRATOR (00-master.js)             │
│  - Initialise l'environnement (Parse, logs, stats)                   │
│  - Appelle les nœuds dans l'ordre                                    │
│  - Gère les erreurs et les statistiques globales                    │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  NOEUD 0: CREATE_RELANCES (00-createRelances.js)                      │
│  - Input: {} (interroge Parse directement)                           │
│  - Output: { stats: { processed, created, errors, erreurs } }          │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  NOEUD 1: REPLACE_VARIABLES (01-replaceVariables.js)                  │
│  - Input: {} (interroge Parse directement)                           │
│  - Output: { stats: { processed, updated, errors, erreurs } }          │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  NOEUD 2: GENERATE_RELANCES (02-generateRelances.js)                  │
│  - Input: {} (interroge Parse directement)                           │
│  - Output: { stats: { processed, errors, erreurs } }                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## **Détails des Nœuds**

### **Nœud 0: `createRelances`**
**Fichier** : `00-createRelances.js`

#### **Input**
```javascript
{}
```
*Le nœud interroge directement Parse pour récupérer les données nécessaires.*

#### **Output**
```javascript
{
  stats: {
    processed: number,    // Nombre d'impayés traités
    created: number,     // Nombre de relances créées
    errors: number,      // Nombre d'erreurs
    erreurs: [           // Liste des erreurs détaillées
      {
        impayeId: string,
        groupKey: string,
        erreur: string,
        stack?: string
      }
    ]
  }
}
```

#### **Responsabilités**
1. **Récupérer les impayés** :
   - Query sur `Impaye` avec filtres :
     - `facture_soldee: false`
     - `reste_a_payer > 0`
     - `sequence` existe
   - Inclure : `sequence`, `contact_relance`

2. **Identifier les impayés sans relance** :
   - Query sur `Relance` pour obtenir les IDs des impayés déjà traités.
   - Filtrer les impayés sans relance associée.

3. **Regrouper par contact et séquence** :
   - Créer une `Map` avec clé = `${contact.id}_${sequence.id}`.
   - Chaque groupe contient : `contact`, `sequence`, `impayes[]`.

4. **Créer les relances** :
   - Pour chaque groupe, créer une `Relance` pour chaque `email_index` de la séquence.
   - Peupler tous les champs de la classe `Relance` :
     - `contact`, `sequence`, `email_index`
     - `impayes` (array des impayés du groupe)
     - `statut: "En attente de génération"`
     - `objet: "Génération en cours"`
     - `corps: "Génération en cours"`
     - `valide: !sequence.validation_obligatoire`
     - `manuelle: false`
     - `smtpProfil` (pointer vers le profil SMTP du scénario actif)
     - `scenario: "single" | "multiple"` (selon le nombre d'impayés)
     - `dateEnvoi` (calculée à partir de `dateEcheance + delai`)

#### **Exemple d'utilisation autonome**
```javascript
const { createRelances } = require('./00-createRelances');
const result = await createRelances();
console.log(result.stats); // { processed: 10, created: 5, errors: 0, erreurs: [] }
```

---

### **Nœud 1: `replaceVariables`**
**Fichier** : `01-replaceVariables.js`

#### **Input**
```javascript
{}
```
*Le nœud interroge directement Parse pour récupérer les relances en attente.*

#### **Output**
```javascript
{
  stats: {
    processed: number,    // Nombre de relances traitées
    updated: number,     // Nombre de relances mises à jour
    errors: number,      // Nombre d'erreurs
    erreurs: [           // Liste des erreurs détaillées
      {
        relanceId: string,
        erreur: string,
        stack?: string
      }
    ]
  }
}
```

#### **Responsabilités**
1. **Récupérer les relances en attente** :
   - Query sur `Relance` avec filtre : `statut: "En attente de génération"`
   - Inclure : `sequence`, `contact`, `impayes`

2. **Valider les données** :
   - Vérifier que chaque relance a une `sequence` valide.
   - Skip si la séquence est manquante.

3. **Récupérer les données nécessaires** :
   - Fetch des détails des `impayes` depuis Parse.
   - Fetch de la `sequence` complète.
   - Trouver le `scenario` correspondant à `email_index`.

4. **Remplacer les variables** :
   - Appeler `replaceAllVariables(objet, data)` pour l'objet.
   - Appeler `replaceLoopVariables(corps, data)` pour le corps.
   - `data` contient : `contact`, `sequence`, `impayes`, `scenario`.

5. **Sauvegarder les modifications** :
   - Si des variables ont été remplacées (`hasChanges`):
     - Mettre à jour `relance.objet` et `relance.corps`.
     - Sauvegarder la relance (`relance.save()`).

#### **Exemple d'utilisation autonome**
```javascript
const { replaceVariables } = require('./01-replaceVariables');
const result = await replaceVariables();
console.log(result.stats); // { processed: 5, updated: 3, errors: 0, erreurs: [] }
```

---

### **Nœud 2: `generateRelances`**
**Fichier** : `02-generateRelances.js`

#### **Input**
```javascript
{}
```
*Le nœud interroge directement Parse pour récupérer les relances en attente.*

#### **Output**
```javascript
{
  stats: {
    processed: number,    // Nombre de relances traitées
    errors: number,      // Nombre d'erreurs
    erreurs: [           // Liste des erreurs détaillées
      {
        relanceId: string,
        erreur: string,
        stack?: string
      }
    ]
  }
}
```

#### **Responsabilités**
1. **Récupérer les relances en attente** :
   - Query sur `Relance` avec filtre : `statut: "En attente de génération"`
   - Inclure : `sequence`, `contact`

2. **Valider les données** :
   - Vérifier que chaque relance a une `sequence` valide.
   - Skip si la séquence est manquante.

3. **Récupérer l'historique et les détails** :
   - Query sur `Relance` pour l'historique du contact (relances déjà envoyées).
   - Fetch des détails des `impayes`.
   - Fetch de la `sequence` complète.

4. **Trouver le scénario actif** :
   - Trouver le `scenario` correspondant à `email_index`.
   - Trouver le `activeScenario` (selon `format: "single" | "multiple"`).

5. **Générer le contenu** :
   - **Si `USE_OLLAMA = true`** :
     1. Construire le `prompt` avec `buildPrompt()`.
     2. Appeler `generateEmailContent()` avec logique de retry (max 30 retries, délai 1s).
     3. Vérifier les variables non remplacées (retry jusqu'à 5 fois si nécessaire).
     4. Appliquer la correction orthographique (`correctOrthographe()`).
   - **Si `USE_OLLAMA = false`** :
     1. Utiliser les valeurs par défaut du `activeScenario` :
        - `objet = activeScenario.objet || "Relance..."`
        - `corps = activeScenario.corps || "Veuillez..."`

6. **Sauvegarder la relance** :
   - Mettre à jour `relance.objet` et `relance.corps`.
   - Changer `relance.statut` en `"pret pour envoi"`.
   - Sauvegarder la relance (`relance.save()`).

#### **Exemple d'utilisation autonome**
```javascript
const { generateRelances } = require('./02-generateRelances');
const result = await generateRelances();
console.log(result.stats); // { processed: 5, errors: 0, erreurs: [] }
```

---

## **Orchestrateur Principal (`00-master.js`)**

### **Rôle**
- **Initialiser l'environnement** :
  - Charger les variables d'environnement (`.env`).
  - Initialiser Parse SDK (si non déjà initialisé).
  - Vider les logs (si `trigger !== "test"`).

- **Orchestrer les nœuds** :
  - Appeler les nœuds dans l'ordre : `createRelances` → `replaceVariables` → `generateRelances`.
  - Collecter les statistiques de chaque nœud.

- **Gérer les erreurs** :
  - Capturer les erreurs globales et les ajouter à `stats.errors`.
  - Retourner un statut d'erreur si nécessaire.

- **Exposer les points d'entrée** :
  - **Cloud Function** : `Parse.Cloud.define("generateRelances")`
  - **CLI** : Exécution directe via `node 00-master.js`

### **Modifications Requises pour l'Architecture Modulaire**

#### **1. Structure du `master.js`**
Le `master.js` doit :
- **Importer les nœuds** comme des fonctions autonomes.
- **Appeler chaque nœud** avec ses paramètres d'entrée.
- **Passer les données de sortie** d'un nœud à l'entrée du suivant (si nécessaire).
- **Ne pas dupliquer la logique** des nœuds.

#### **2. Exemple de Code pour `master.js`**
```javascript
// Charger les variables d'environnement
require("dotenv").config({ path: "/home/ubuntu/prod/adti/.env" });

const { info, warn, error } = require("../../utils/logger");
const createRelances = require("./00-createRelances");
const replaceVariables = require("./01-replaceVariables");
const generateRelances = require("./02-generateRelances");

async function generateRelancesMaster({ trigger = "manual" } = {}) {
    const startedAt = new Date();
    const stats = {
        errors: [],
        total: { startedAt: startedAt.toISOString(), finishedAt: null, durationMs: 0 },
        etape0: {},
        etape1: {},
        etape2: {}
    };

    try {
        // ÉTAPE 0: Création des relances
        info(`📧 ÉTAPE 0/3: Création des relances...`);
        const result0 = await createRelances(); // Appel du nœud 0
        stats.etape0 = result0.stats;
        info(`✅ ÉTAPE 0 TERMINÉE: ${result0.stats.processed} traités, ${result0.stats.created} créées`);

        // ÉTAPE 1: Remplacement des variables
        info(`📝 ÉTAPE 1/3: Remplacement des variables...`);
        const result1 = await replaceVariables(); // Appel du nœud 1
        stats.etape1 = result1.stats;
        info(`✅ ÉTAPE 1 TERMINÉE: ${result1.stats.processed} traités, ${result1.stats.updated} mis à jour`);

        // ÉTAPE 2: Génération du contenu
        info(`🤖 ÉTAPE 2/3: Génération du contenu...`);
        const result2 = await generateRelances(); // Appel du nœud 2
        stats.etape2 = result2.stats;
        info(`✅ ÉTAPE 2 TERMINÉE: ${result2.stats.processed} traités`);

        // Fin avec succès
        info(`✅ PROCESSUS TERMINÉ AVEC SUCCÈS`);
    } catch (err) {
        error(`❌ ERREUR DANS LE WORKFLOW: ${err.message}`);
        stats.errors.push({ step: "master", error: err.message, stack: err.stack });
        throw err; // Re-throw pour que l'erreur soit gérée par l'appelant
    }

    const finishedAt = new Date();
    stats.total.finishedAt = finishedAt.toISOString();
    stats.total.durationMs = finishedAt - startedAt;
    info(`⏱️ DURÉE TOTALE: ${((finishedAt - startedAt) / 1000).toFixed(2)} secondes`);

    return { stats };
}

// Cloud Function
Parse.Cloud.define("generateRelances", async (request) => {
    if (!request.master && !request.user) {
        throw new Error("Non autorisé - nécessite masterKey ou utilisateur authentifié");
    }
    return await generateRelancesMaster({ trigger: "cloud-function" });
});

// Exécution CLI
if (require.main === module) {
    generateRelancesMaster({ trigger: "cli" })
        .then((result) => process.exit(result.stats.errors.length > 0 ? 1 : 0))
        .catch((err) => {
            error(`❌ Erreur fatale: ${err.message}`);
            process.exit(1);
        });
}

module.exports = generateRelancesMaster;
```

#### **3. Points Clés pour `master.js`**
- **Ne pas dupliquer la logique** : Chaque nœud est responsable de sa propre logique.
- **Passer les paramètres** : Si un nœud a besoin de données d'un nœud précédent, les passer explicitement.
- **Gérer les erreurs** : Capturer les erreurs de chaque nœud et les ajouter à `stats.errors`.
- **Logs** : Utiliser `info`, `warn`, `error` pour suivre l'exécution.

---

## **Comment Modifier `master.js` pour l'Architecture Modulaire**

### **Étapes à Suivre**

#### **1. Simplifier `master.js`**
- **Supprimer la logique métier** : Tout le code métier doit être dans les nœuds.
- **Conserver uniquement l'orchestration** : Appeler les nœuds dans l'ordre et gérer les erreurs.

#### **2. Exemple de Refactor**
**Avant (monolithique)** :
```javascript
// Dans master.js
async function generateRelancesMaster() {
    // Logique de création des relances (dupliquée)
    const impayes = await queryImpayes();
    const relances = await createRelancesFromImpayes(impayes);
    
    // Logique de remplacement des variables (dupliquée)
    for (const relance of relances) {
        await replaceVariablesInRelance(relance);
    }
    
    // Logique de génération (dupliquée)
    for (const relance of relances) {
        await generateRelanceContent(relance);
    }
}
```

**Après (modulaire)** :
```javascript
// Dans master.js
async function generateRelancesMaster() {
    // Appel des nœuds autonomes
    const result0 = await createRelances(); // Nœud 0
    const result1 = await replaceVariables(); // Nœud 1
    const result2 = await generateRelances(); // Nœud 2
    
    // Aggregation des stats
    return { stats: { etape0: result0.stats, etape1: result1.stats, etape2: result2.stats } };
}
```

#### **3. Adapter les Nœuds**
- **Chaque nœud doit être une fonction autonome** :
  - Exporter une fonction `module.exports = maFonction`.
  - Accepter des paramètres d'entrée (même si vide pour l'instant).
  - Retourner un objet avec `stats`.

- **Exemple pour `00-createRelances.js`** :
```javascript
// Avant : logique intégrée dans master.js
// Après : fonction autonome
async function createRelances() {
    const stats = { processed: 0, created: 0, errors: 0, erreurs: [] };
    // Logique de création des relances
    return { stats };
}
module.exports = createRelances;
```

#### **4. Gérer les Dépendances entre Nœuds**
- **Si un nœud a besoin de données d'un nœud précédent** :
  - Passer les données explicitement via les paramètres.
  - Exemple :
    ```javascript
    // Nœud 0 retourne des données
    const result0 = await createRelances();
    
    // Nœud 1 utilise les données de Nœud 0
    const result1 = await replaceVariables({ relances: result0.relances });
    ```

- **Pour l'instant** : Les nœuds interrogent Parse directement (pas de dépendance explicite).

---

## **Contrats de Données entre Nœuds**

### **Format Standardisé**
Chaque nœud doit respecter ce contrat :

#### **Input**
- **Type** : `Object` (peut être vide `{}` si le nœud interroge Parse directement).
- **Exemple** :
  ```javascript
  // Si un nœud a besoin de données d'un nœud précédent
  {
    relances: Relance[],  // Liste des relances à traiter
    impayes: Impaye[]     // Liste des impayés associés
  }
  ```

#### **Output**
- **Type** : `Object` avec au moins un champ `stats`.
- **Exemple** :
  ```javascript
  {
    stats: {
      processed: number,
      created: number,
      updated: number,
      errors: number,
      erreurs: [{ erreur: string, details?: any }]
    },
    // Optionnel : données à passer au nœud suivant
    relances: Relance[],
    impayes: Impaye[]
  }
  ```

---

## **Exécution et Tests**

### **1. Exécution Complète**
```bash
# Via CLI
node 00-master.js

# Via Cloud Function
Parse.Cloud.run("generateRelances", {}, { useMasterKey: true })
```

### **2. Exécution d'un Nœud Individuel**
```javascript
// Tester le nœud 0 (createRelances)
const createRelances = require('./00-createRelances');
const result = await createRelances();
console.log(result.stats);

// Tester le nœud 1 (replaceVariables)
const replaceVariables = require('./01-replaceVariables');
const result = await replaceVariables();
console.log(result.stats);

// Tester le nœud 2 (generateRelances)
const generateRelances = require('./02-generateRelances');
const result = await generateRelances();
console.log(result.stats);
```

### **3. Scénarios de Test**

#### **Scénario 0: Création de Relances**
- **Input** : Parse avec des `Impaye` ayant des `sequence` mais pas de `Relance`.
- **Expected Output** :
  - Nouvelles `Relance` créées avec `statut: "En attente de génération"`.
  - `objet` et `corps` = "Génération en cours".
- **Logs attendus** :
  - `Étape 0: X impayés avec séquence trouvés`
  - `Relance créée: [id] pour contact [contactId]`

#### **Scénario 1: Remplacement de Variables**
- **Input** : Parse avec des `Relance` en `statut: "En attente de génération"`.
- **Expected Output** :
  - Variables `[[contact.nom]]`, `[[impaye.montant]]` remplacées.
  - `statut` reste `"En attente de génération"` (ou passe à `"pret pour envoi"` si pas de LLM).
- **Logs attendus** :
  - `Variables remplacées pour relance [id]`

#### **Scénario 2: Génération LLM**
- **Input** : Parse avec des `Relance` en `statut: "En attente de génération"`.
- **Config** : `USE_OLLAMA=true`, `OLLAMA_API_KEY` et `OLLAMA_API_URL` définis.
- **Expected Output** :
  - `objet` et `corps` générés par LLM.
  - `statut: "pret pour envoi"`.
- **Logs attendus** :
  - `Génération LLM pour relance [id]`
  - `Correction orthographique appliquée`

#### **Scénario 3: Aucun Travail à Faire**
- **Input** : Parse sans `Impaye` avec `sequence` ou sans `Relance` en attente.
- **Expected Output** :
  - `stats.processed = 0` pour tous les nœuds.
- **Logs attendus** :
  - `Étape 0: 0 impayés avec séquence trouvés`
  - `Étape 1: 0 relances en attente de traitement`

#### **Scénario 4: Données Manquantes**
- **Input** : Parse avec des `Impaye` sans `sequence` ou des `Relance` sans `sequence`.
- **Expected Output** :
  - `stats.erreurs` contient les IDs des objets ignorés.
- **Logs attendus** :
  - `Impayé [id]: pas de contact ou séquence valide, ignoré`
  - `Relance [id]: pas de séquence valide, ignorée`

---

## **Bonnes Pratiques**

### **1. Pour les Nœuds**
- **Une seule responsabilité** : Un nœud = une tâche.
- **Pas d'effets de bord** : Éviter de modifier des données globales.
- **Logs clairs** : Utiliser `info`, `warn`, `error` avec des messages descriptifs.
- **Gestion des erreurs** : Capturer les erreurs et les ajouter à `stats.erreurs`.
- **Documentation** : Commenter le code pour expliquer la logique.

### **2. Pour `master.js`**
- **Orchestration uniquement** : Ne pas dupliquer la logique des nœuds.
- **Gestion des erreurs** : Capturer les erreurs globales et les propager.
- **Logs globaux** : Suivre le début/fin du workflow et la durée.
- **Flexibilité** : Permettre l'exécution via CLI, Cloud Function, ou appel programmatique.

### **3. Pour les Tests**
- **Isoler les nœuds** : Tester chaque nœud indépendamment.
- **Mock Parse** : Utiliser des mocks pour les appels Parse en tests unitaires.
- **Vérifier les contrats** : S'assurer que les inputs/outputs respectent les formats attendus.

---

## **Résumé des Fichiers**

| Fichier | Rôle | Input | Output |
|--------|------|-------|--------|
| `00-master.js` | Orchestrateur | `{ trigger }` | `{ stats }` |
| `00-createRelances.js` | Création des relances | `{}` | `{ stats }` |
| `01-replaceVariables.js` | Remplacement des variables | `{}` | `{ stats }` |
| `02-generateRelances.js` | Génération du contenu | `{}` | `{ stats }` |

---

## **Prochaines Étapes**

1. **Refactoriser `master.js`** : Simplifier pour qu'il ne fasse que de l'orchestration.
2. **Standardiser les nœuds** : S'assurer que chaque nœud :
   - Est une fonction autonome.
   - A un input/output clairement défini.
   - Gère ses propres erreurs.
3. **Ajouter des tests unitaires** : Tester chaque nœud indépendamment.
4. **Documenter les contrats** : Clarifier les formats de données entre nœuds.
5. **Optimiser les requêtes Parse** : Réduire le nombre de requêtes dans chaque nœud.
