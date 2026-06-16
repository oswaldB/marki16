# Migration Nunjucks - Plan d'implémentation technique

> **Branche** : `impl/nunjucks-migration`  
> **Parent** : `feature/nunjucks-templates`  
> **Objectif** : Remplacer la syntaxe `[[...]]` par Nunjucks `{{ ... }}` avec workflow à 2 passes : Nunjucks → Ollama (correction obligatoire)  
> **Date** : 16/06/2026

---

## 🎯 ARCHITECTURE CIBLE

### Workflow de génération (nouveau)

```
TEMPLATE (syntaxe Nunjucks {{ }})
       ↓
[PASSE 2] Rendu Nunjucks avec données (variables remplacées)
       ↓
[PASSE 3] Correction Ollama (OBLIGATOIRE)
       ↓
EMAIL PRÊT À ENVoyer
```

**Important** : Les templates doivent être en syntaxe Nunjucks `{{ }}` **avant** la migration. Pas de conversion automatique.

### Ce qui change

| Élément | Avant (syntaxe [[...]]) | Après (Nunjucks) | Impact |
|---------|------------------------|------------------|--------|
| **Backend** | `buildPrompt()` + Ollama pour tout générer | `renderTemplate()` Nunjucks + Ollama correction | ⭐⭐⭐ |
| **Templates** | `[[var]]`, `[[loop]]`, `[[if]]` | `{{ var }}`, `{% for %}`, `{% if %}` | ⭐⭐⭐ |
| **Frontend** | Documentation `[[...]]` | Documentation Nunjucks | ⭐⭐ |
| **Parsing PDF** | Ollama (inchangé) | Ollama (inchangé) | ⭐ |
| **Variables** | Extraction manuelle dans prompt | Injection directe dans Nunjucks | ⭐⭐ |

---

## 📋 PHASE 3 : MODIFICATION DU BACKEND (DÉTAIL TECHNIQUE)

### Étape 1 : Modifier `03-generateContent.js` - NOUVEAU WORKFLOW

**Fichier** : `backend/cloud/workflows/send-sequence-test/03-generateContent.js`

#### Configuration environnement (ajouter en haut du fichier)

```javascript
// =========================================================================
// CONFIGURATION NUNJUCKS
// =========================================================================
const { renderTemplate } = require('../../utils/nunjucks');
```

#### NOUVELLE FONCTION : Rendu avec workflow à 2 passes

```javascript
/**
 * Génère le contenu d'email avec le nouveau workflow Nunjucks
 * PASSE 2 : Rendu Nunjucks avec les variables
 * PASSE 3 : Correction Ollama (OBLIGATOIRE)
 */
async function generateContentWithNunjucks(scenario, impayeData, isMultiple) {
  // =========================================================================
  // PASSE 2 : Rendu Nunjucks avec les variables
  // =========================================================================
  info(
    `[NUNJUCKS] Rendu du template avec ${Object.keys(impayeData).length} variables`,
    "send-sequence-test",
    "03-generateContent"
  );
  
  let objet = renderTemplate(scenario.objet || "", impayeData);
  let corps = renderTemplate(scenario.corps || "", impayeData);
  
  info(
    `[NUNJUCKS] ✅ Rendu Nunjucks terminé`,
    "send-sequence-test",
    "03-generateContent"
  );
  
  // =========================================================================
  // PASSE 3 : Correction Ollama (OBLIGATOIRE)
  // =========================================================================
  if (USE_OLLAMA && OLLAMA_API_KEY) {
    try {
      info(
        `[OLLAMA CORRECTION] Appel pour correction linguistique...`,
        "send-sequence-test",
        "03-generateContent"
      );
      
      const correctionPrompt = `
        Tu es un correcteur d'emails professionnels.
        L'email suivant a été généré automatiquement avec des variables.
        
        **RÈGLES STRICTES** :
        1. CORRIGE UNIQUEMENT les erreurs grammaticales, d'accords et de conjugaisons
        2. NE MODIFIE PAS le contenu, les variables ({{ ... }}), les liens ou la structure HTML
        3. NE REMPLACE PAS les variables par des valeurs
        4. Conserve TOUT le HTML tel quel
        5. Retourne UNIQUEMENT le texte corrigé, sans explication
        6. Le corps doit être en HTML valide
        
        Corps à corriger :
        ${corps}
      `;
      
      const result = await generateEmailContent(correctionPrompt);
      if (result.corps) {
        corps = result.corps;
        info(
          `[OLLAMA CORRECTION] ✅ Correction appliquée`,
          "send-sequence-test",
          "03-generateContent"
        );
      }
    } catch (error) {
      warn(
        `[OLLAMA CORRECTION] ⚠️ Erreur de correction, utilisation du rendu Nunjucks: ${error.message}`,
        "send-sequence-test",
        "03-generateContent"
      );
    }
  }
  
  return { objet, corps };
}
```

#### MODIFICATION DE LA LOGIQUE PRINCIPALE

**Remplacer le code actuel (lignes 553-634) par :**

```javascript
// =========================================================================
// LOGIQUE PRINCIPALE - NOUVEAU WORKFLOW
// =========================================================================

let objet, corps;

// Utiliser le nouveau workflow Nunjucks + Ollama correction
if (USE_OLLAMA) {
  info(
    `[GENERATE CONTENT] 🚀 Utilisation du workflow Nunjucks + Ollama correction`,
    "send-sequence-test",
    "03-generateContent"
  );
  
  const result = await generateContentWithNunjucks(
    scenario,
    impayeData,
    isMultiple
  );
  objet = result.objet;
  corps = result.corps;
  
  // Si le rendu échoue, fallback vers l'ancien workflow
  if ((!objet || !corps) && USE_OLLAMA) {
    warn(
      `[GENERATE CONTENT] ⚠️ Workflow Nunjucks a échoué, fallback vers Ollama legacy`,
      "send-sequence-test",
      "03-generateContent"
    );
    const prompt = buildPrompt(
      scenario,
      impayesForPrompt,
      [],
      emailIndex
    );
    const result = await generateEmailContent(prompt);
    objet = result.objet || objet || "Relance d'impayé";
    corps = result.corps || corps || "Veuillez régulariser votre situation.";
  }
} 
// Mode fallback sans Ollama
else {
  objet = scenario.objet || "Relance d'impayé";
  corps = scenario.corps || "Veuillez régulariser votre situation.";
  info(
    `[GENERATE CONTENT] ℹ️ Mode fallback (USE_OLLAMA=false)`,
    "send-sequence-test",
    "03-generateContent"
  );
}
```

### Étape 2 : Variables d'environnement

**Fichier** : `backend/.env`

```bash
# ============================================================================
# NUNJUCKS CONFIGURATION
# ============================================================================

# L'appel Ollama pour le parsing de PDF reste ACTIF (inchangé)
# OLLAMA_API_URL, OLLAMA_API_KEY, OLLAMA_MODEL restent identiques

# Pas de USE_NUNJUCKS ou USE_OLLAMA_CORRECTION nécessaire
# Le workflow Nunjucks + correction Ollama est activé dès que USE_OLLAMA=true
```

### Étape 3 : Vérification des dépendances

**Fichier** : `backend/package.json`

Vérifier que `nunjucks` est dans les dépendances :

```json
{
  "dependencies": {
    "nunjucks": "^3.2.4",
    ...
  }
}
```

Si absent : `cd backend && npm install nunjucks`

---

## 🔧 SCRIPT DE CONVERSION DES TEMPLATES EXISTANTS

**À exécuter AVANT de déployer le nouveau workflow**

### Créer : `scripts/convert-templates-to-nunjucks.js`

```javascript
const Parse = require('parse/node');

// Configuration Parse
Parse.initialize(
  process.env.PARSE_APP_ID || 'marki15-app-id',
  process.env.PARSE_JAVASCRIPT_KEY || '',
  process.env.PARSE_MASTER_KEY || 'marki15-master-key'
);
Parse.serverURL = process.env.PARSE_SERVER_URL || 'https://dev.api.markidiags.com/api/parse';

// =========================================================================
// FONCTION DE CONVERSION
// =========================================================================

function convertTemplate(template) {
  if (!template || typeof template !== 'string') return template;
  
  let result = template;
  
  // 1. Variables simples : [[var]] -> {{ var }}
  result = result.replace(/\\[\\[([a-zA-Z_][a-zA-Z0-9_]*)\\]\\]/g, '{{ $1 }}');
  
  // 2. Variables avec propriétés : [[obj.prop]] -> {{ obj.prop }}
  result = result.replace(/\\[\\[([a-zA-Z_][a-zA-Z0-9_]*)\\.([a-zA-Z_][a-zA-Z0-9_]*)\\]\\]/g, '{{ $1.$2 }}');
  
  // 3. Dates : [[var, date("DD/MM/YYYY")]] -> {{ var | date("DD/MM/YYYY") }}
  result = result.replace(/\\[\\[([^,]+),\s*date\("([^"]+)"\)\\]\\]/g, '{{ $1 | date("$2") }}');
  
  // 4. Boucles : [[loop list]] -> {% for item in list %}
  result = result.replace(/\\[\\[loop\s+([a-zA-Z_][a-zA-Z0-9_]*)\\]\\]/g, '{% for $1 in $1 %}');
  
  // 5. Fin de boucle : [[endloop]] -> {% endfor %}
  result = result.replace(/\\[\\[endloop\\]\\]/g, '{% endfor %}');
  
  // 6. Conditions : [[ if (cond) { +]] -> {% if cond %}
  result = result.replace(/\\[\\[\s*if\s*\(([^)]+)\)\s*\{\s*\+\\]\\]/g, '{% if $1 %}');
  
  // 7. Fin de condition : [[ } +]] -> {% endif %}
  result = result.replace(/\\[\\[\s*\}\s*\+\\]\\]/g, '{% endif %}');
  
  // 8. Expressions Math : [[Math.round(x)]] -> {{ x | round }}
  result = result.replace(/\\[\\[Math\\.round\(([^)]+)\)\\]\\]/g, '{{ $1 | round }}');
  
  return result;
}

// =========================================================================
// EXÉCUTION
// =========================================================================

async function main() {
  const dryRun = process.argv.includes('--dry-run') || process.argv.includes('-n');
  const sequenceId = process.argv[2];
  
  console.log(`🚀 Migration des templates vers Nunjucks (dry-run: ${dryRun})\n`);
  
  const Sequence = Parse.Object.extend('Sequence');
  const query = new Parse.Query(Sequence);
  const sequences = sequenceId 
    ? [await query.get(sequenceId, { useMasterKey: true })] 
    : await query.find({ useMasterKey: true });
  
  console.log(`📊 Trouvé ${sequences.length} séquences`);
  
  let totalConversions = 0;
  let modifiedCount = 0;
  let errorCount = 0;
  
  for (const seq of sequences) {
    try {
      console.log(`\n📋 Séquence: ${seq.id}`);
      
      const emails = seq.get('emails') || [];
      let modified = false;
      let conversions = 0;
      
      const newEmails = emails.map(email => {
        const newEmail = { ...email };
        
        if (email.scenarios) {
          newEmail.scenarios = email.scenarios.map(scenario => {
            const newScenario = { ...scenario };
            let scenarioModified = false;
            
            if (newScenario.objet && newScenario.objet.includes('[[')) {
              newScenario.objet = convertTemplate(newScenario.objet);
              console.log(`  → Objet converti`);
              scenarioModified = true;
              conversions++;
            }
            
            if (newScenario.corps && newScenario.corps.includes('[[')) {
              newScenario.corps = convertTemplate(newScenario.corps);
              console.log(`  → Corps converti`);
              scenarioModified = true;
              conversions++;
            }
            
            return newScenario;
          });
          
          if (newEmail.scenarios.some((s, i) => s !== email.scenarios[i])) {
            modified = true;
          }
        } else {
          if (email.objet && email.objet.includes('[[')) {
            newEmail.objet = convertTemplate(email.objet);
            console.log(`  → Objet direct converti`);
            modified = true;
            conversions++;
          }
          
          if (email.corps && typeof email.corps === 'string' && email.corps.includes('[[')) {
            newEmail.corps = convertTemplate(email.corps);
            console.log(`  → Corps direct converti`);
            modified = true;
            conversions++;
          }
        }
        
        return newEmail;
      });
      
      if (!modified) {
        console.log(`  ℹ️ Aucune conversion nécessaire`);
      } else {
        totalConversions += conversions;
        modifiedCount++;
        
        if (!dryRun) {
          seq.set('emails', newEmails);
          await seq.save(null, { useMasterKey: true });
          console.log(`  ✅ ${conversions} conversions appliquées`);
        } else {
          console.log(`  ✅ ${conversions} conversions identifiées (dry-run)`);
        }
      }
    } catch (error) {
      console.error(`❌ Erreur sur ${seq?.id}: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log(`\n📈 Résumé:`);
  console.log(`   - Séquences modifiées: ${modifiedCount}/${sequences.length}`);
  console.log(`   - Conversions totales: ${totalConversions}`);
  console.log(`   - Erreurs: ${errorCount}`);
}

main().catch(console.error);
```

---

## 🧪 TESTS

### Test 1 : Rendu Nunjucks de base

**Fichier** : `backend/cloud/workflows/send-sequence-test/tests/nunjucks.test.js`

```javascript
const { renderTemplate } = require('../03-generateContent');
const assert = require('assert');

describe('Nunjucks Rendering', () => {
  const testData = {
    payeur_nom: 'DUPONT',
    payeur_prenom: 'Jean',
    nfacture: 'FA-2024-001',
    montant_total: 1500.50,
    date_echeance: '2024-06-15',
    reste_a_payer: 1500.50,
    nfactures_liste: [
      { nfacture: 'FA-2024-001', montant_total: 1500.50, date_echeance: '2024-06-15' },
      { nfacture: 'FA-2024-002', montant_total: 2000.00, date_echeance: '2024-06-20' }
    ]
  };

  it('should render simple variables', () => {
    const template = 'Bonjour {{ payeur_prenom }} {{ payeur_nom }}';
    const result = renderTemplate(template, testData);
    assert.strictEqual(result, 'Bonjour Jean DUPONT');
  });

  it('should render date filter', () => {
    const template = 'Échéance: {{ date_echeance | date("DD/MM/YYYY") }}';
    const result = renderTemplate(template, testData);
    assert.strictEqual(result, 'Échéance: 15/06/2024');
  });

  it('should render euro filter', () => {
    const template = 'Montant: {{ montant_total | euro }}';
    const result = renderTemplate(template, testData);
    assert(result.includes('1 500,50 €'));
  });

  it('should render for loop', () => {
    const template = '{% for f in nfactures_liste %}{{ f.nfacture }} {% endfor %}';
    const result = renderTemplate(template, testData);
    assert.strictEqual(result.trim(), 'FA-2024-001 FA-2024-002');
  });

  it('should handle missing variables', () => {
    const template = 'Hello {{ missing_var }}';
    const result = renderTemplate(template, testData);
    assert.strictEqual(result, 'Hello ');
  });
});
```

---

## ✅ CHECKLIST DE VALIDATION

### Avant déploiement

- [ ] `npm install nunjucks` dans backend
- [ ] Vérifier `backend/cloud/utils/nunjucks.js` existe et est correct
- [ ] Modifier `03-generateContent.js` avec le nouveau workflow
- [ ] **Exécuter le script de conversion** : `node ../scripts/convert-templates-to-nunjucks.js --dry-run`
- [ ] **Appliquer la conversion** : `node ../scripts/convert-templates-to-nunjucks.js`
- [ ] Tester avec une séquence en base (1 impayé)
- [ ] Tester avec une séquence en base (plusieurs impayés)

### Post-déploiement

- [ ] Surveiller les logs pour erreurs Nunjucks
- [ ] Vérifier que les emails sont envoyés correctement
- [ ] Confirmer que le parsing PDF (Ollama) fonctionne toujours
- [ ] Confirmer que la correction Ollama est bien appliquée après Nunjucks

---

## 📌 NOTES IMPORTANTES

1. **L'appel Ollama pour le parsing de PDF reste INCHANGÉ** dans `server.js`
2. **Deux appels Ollama distincts** :
   - `server.js` : Parsing PDF → **inchangé**
   - `03-generateContent.js` : Correction après Nunjucks → **OBLIGATOIRE**
3. **Pas de conversion automatique** : Les templates doivent être convertis AVANT le déploiement via le script
4. **Ordre strict** : Nunjucks d'abord, puis Ollama correction **toujours**
5. **Pas de flag optionnel** : Dès que `USE_OLLAMA=true`, le workflow Nunjucks + correction est actif

---

## 🚀 COMMANDES UTILES

```bash
# Installer Nunjucks
cd backend && npm install nunjucks

# Tester la conversion d'une séquence spécifique
node ../scripts/convert-templates-to-nunjucks.js <SEQUENCE_ID> --dry-run

# Convertir toutes les séquences (DRY RUN D'ABORD !)
node ../scripts/convert-templates-to-nunjucks.js --dry-run

# Convertir vraiment toutes les séquences
node ../scripts/convert-templates-to-nunjucks.js

# Lancer les tests
cd backend
npm test
```

---

## 📊 EXEMPLES DE TEMPLATES

### Avant (syntaxe [[...]])

```html
Bonjour [[payeur_civilite]] [[payeur_prenom]] [[payeur_nom]],

Votre facture <strong>n°[[nfacture]]</strong> d'un montant de 
<strong>[[montant_total]] €</strong> arrive à échéance le 
<strong>[[date_echeance, date("DD/MM/YYYY")]]</strong>.

Veuillez régulariser votre situation via :
<a href="https://paiement.exemple.com?facture=[[nfacture]]&montant=[[reste_a_payer]]">
  Paiement en ligne
</a>

[[loop nfactures_liste]]
- Facture: [[facture.nfacture]] - Montant: [[facture.montant_total]] €
  Échéance: [[facture.date_echeance, date("DD/MM/YYYY")]]
[[endloop]]
```

### Après (syntaxe Nunjucks)

```html
Bonjour {{ payeur_civilite }} {{ payeur_prenom }} {{ payeur_nom }},

Votre facture <strong>n°{{ nfacture }}</strong> d'un montant de 
<strong>{{ montant_total | euro }}</strong> arrive à échéance le 
<strong>{{ date_echeance | date("DD/MM/YYYY") }}</strong>.

Veuillez régulariser votre situation via :
<a href="https://paiement.exemple.com?facture={{ nfacture }}&montant={{ reste_a_payer }}">
  Paiement en ligne
</a>

{% for facture in nfactures_liste %}
- Facture: {{ facture.nfacture }} - Montant: {{ facture.montant_total | euro }}
  Échéance: {{ facture.date_echeance | date("DD/MM/YYYY") }}
{% endfor %}
```

---

## 🎯 ORDRE DE TRAVAIL RECOMMANDÉ

1. ✅ **Préparation** : Commit initial avec todo.md (fait)
2. 🔄 **Backend** : Modifier `03-generateContent.js` avec nouveau workflow
3. 🔄 **Conversion** : Exécuter le script sur 1-2 séquences en dry-run
4. 🔄 **Migration** : Convertir toutes les séquences
5. 🔄 **Tests** : Créer et exécuter les tests unitaires
6. 🔄 **Validation** : Vérifier manuellement les emails générés
7. 🔄 **Frontend** : Mettre à jour la documentation
8. 🔄 **Déploiement** : Pousser sur main après tous les tests

---

*Document généré le 16/06/2026 pour la migration Nunjucks - Branche: impl/nunjucks-migration*
