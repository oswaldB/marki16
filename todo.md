# Migration Nunjucks - Plan d'implémentation technique

> **Branche** : `impl/nunjucks-migration`  
> **Parent** : `feature/nunjucks-templates`  
> **Objectif** : Remplacer la syntaxe `[[...]]` par Nunjucks `{{ ... }}` avec workflow à 2 passes : Nunjucks → Ollama (correction)  
> ** date** : 16/06/2026

---

## 🎯 ARCHITECTURE CIBLE

### Workflow de génération (nouveau)

```
TEMPLATE (syntaxe [[...]] ou {{ }})
       ↓
[PASSE 1] Conversion automatique [[...]] → {{ }} (si nécessaire)
       ↓
[PASSE 2] Rendu Nunjucks avec données (variables remplacées)
       ↓
[PASSE 3] Correction Ollama (optionnelle, si USE_OLLAMA_CORRECTION=true)
       ↓
EMAIL PRÊT À ENVoyer
```

### Ce qui change

| Élément | Avant (syntaxe [[...]]) | Après (Nunjucks) | Impact |
|---------|------------------------|------------------|--------|
| **Backend** | `buildPrompt()` + Ollama pour tout générer | `renderTemplate()` Nunjucks + Ollama optionnel pour correction | ⭐⭐⭐ |
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
const USE_NUNJUCKS = process.env.USE_NUNJUCKS !== "false"; // true par défaut
const USE_OLLAMA_CORRECTION = process.env.USE_OLLAMA_CORRECTION === "true"; // false par défaut
const { renderTemplate } = require('../../utils/nunjucks');
```

#### NOUVELLE FONCTION : Conversion automatique [[...]] → {{ }}

```javascript
/**
 * Convertit un template de l'ancienne syntaxe [[...]] vers Nunjucks
 * Utilisé pour la rétrocompatibilité pendant la transition
 */
function convertLegacyTemplate(template) {
  if (!template || typeof template !== 'string') return template;
  
  let result = template;
  
  // Variables simples : [[var]] -> {{ var }}
  result = result.replace(/\\[\\[([a-zA-Z_][a-zA-Z0-9_]*)\\]\\]/g, '{{ $1 }}');
  
  // Variables avec propriétés : [[obj.prop]] -> {{ obj.prop }}
  result = result.replace(/\\[\\[([a-zA-Z_][a-zA-Z0-9_]*)\\.([a-zA-Z_][a-zA-Z0-9_]*)\\]\\]/g, '{{ $1.$2 }}');
  
  // Dates : [[var, date("format")]] -> {{ var | date("format") }}
  result = result.replace(/\\[\\[([^,]+),\s*date\("([^"]+)"\)\\]\\]/g, '{{ $1 | date("$2") }}');
  
  // Boucles : [[loop var]] -> {% for var in var %}
  result = result.replace(/\\[\\[loop\s+([a-zA-Z_][a-zA-Z0-9_]*)\\]\\]/g, '{% for $1 in $1 %}');
  
  // Fin de boucle : [[endloop]] -> {% endfor %}
  result = result.replace(/\\[\\[endloop\\]\\]/g, '{% endfor %}');
  
  // Conditions : [[ if (cond) { +]] -> {% if cond %}
  result = result.replace(/\\[\\[\s*if\s*\(([^)]+)\)\s*\{\s*\+\\]\\]/g, '{% if $1 %}');
  
  // Fin de condition : [[ } +]] -> {% endif %}
  result = result.replace(/\\[\\[\s*\}\s*\+\\]\\]/g, '{% endif %}');
  
  // Expressions Math : [[Math.round(x)]] -> {{ x | round }}
  result = result.replace(/\\[\\[Math\\.round\(([^)]+)\)\\]\\]/g, '{{ $1 | round }}');
  
  return result;
}
```

#### NOUVELLE FONCTION : Rendu avec workflow à 2 passes

```javascript
/**
 * Génère le contenu d'email avec le nouveau workflow Nunjucks
 * PASSE 1 : Conversion legacy si nécessaire
 * PASSE 2 : Rendu Nunjucks
 * PASSE 3 : Correction Ollama (optionnelle)
 */
async function generateContentWithNunjucks(scenario, impayeData, isMultiple) {
  // =========================================================================
  // PASSE 1 : Préparation du template
  // =========================================================================
  let objetTemplate = scenario.objet || "";
  let corpsTemplate = scenario.corps || "";
  
  // Conversion automatique si ancienne syntaxe détectée
  if (objetTemplate.includes('[[[') || objetTemplate.includes('[[')) {
    objetTemplate = convertLegacyTemplate(objetTemplate);
  }
  if (corpsTemplate.includes('[[[') || corpsTemplate.includes('[[')) {
    corpsTemplate = convertLegacyTemplate(corpsTemplate);
  }
  
  // =========================================================================
  // PASSE 2 : Rendu Nunjucks avec les variables
  // =========================================================================
  info(
    `[NUNJUCKS] Rendu du template avec ${Object.keys(impayeData).length} variables`,
    "send-sequence-test",
    "03-generateContent"
  );
  
  let objet = renderTemplate(objetTemplate, impayeData);
  let corps = renderTemplate(corpsTemplate, impayeData);
  
  info(
    `[NUNJUCKS] ✅ Rendu Nunjucks terminé`,
    "send-sequence-test",
    "03-generateContent"
  );
  
  // =========================================================================
  // PASSE 3 : Correction Ollama (optionnelle)
  // =========================================================================
  if (USE_OLLAMA && USE_OLLAMA_CORRECTION && OLLAMA_API_KEY) {
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

// Si Nunjucks est activé, utiliser le nouveau workflow
if (USE_NUNJUCKS) {
  info(
    `[GENERATE CONTENT] 🚀 Utilisation du workflow Nunjucks`,
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
  
  // Si Nunjucks échoue et qu'Ollama est activé, tentative de fallback
  if ((!objet || !corps) && USE_OLLAMA) {
    warn(
      `[GENERATE CONTENT] ⚠️ Nunjucks a retourné un résultat vide, fallback vers Ollama`,
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
// Sinon, utiliser l'ancien workflow Ollama (pour rétrocompatibilité)
elif (USE_OLLAMA) {
  info(
    `[GENERATE CONTENT] ➡️ Génération via Ollama (mode legacy)`,
    "send-sequence-test",
    "03-generateContent"
  );
  try {
    const prompt = buildPrompt(
      scenario,
      impayesForPrompt,
      [],
      emailIndex
    );
    const result = await generateEmailContent(prompt);
    objet = result.objet;
    corps = result.corps;
  } catch (ollamaError) {
    error(
      `[GENERATE CONTENT] ❌ Erreur Ollama: ${ollamaError.message}`,
      "send-sequence-test",
      "03-generateContent"
    );
    objet = scenario.objet || "Relance d'impayé";
    corps = scenario.corps || "Veuillez régulariser votre situation.";
  }
} 
// Mode fallback sans rien
else {
  objet = scenario.objet || "Relance d'impayé";
  corps = scenario.corps || "Veuillez régulariser votre situation.";
  info(
    `[GENERATE CONTENT] ℹ️ Mode fallback (ni Nunjucks ni Ollama)`,
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

# Activer Nunjucks pour le rendu des templates
USE_NUNJUCKS=true

# Activer la correction Ollama APRÈS Nunjucks (optionnel)
USE_OLLAMA_CORRECTION=false

# L'appel Ollama pour le parsing de PDF reste ACTIF (inchangé)
# OLLAMA_API_URL, OLLAMA_API_KEY, OLLAMA_MODEL restent identiques
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

### Créer : `scripts/convert-templates-to-nunjucks.js`

```javascript
const Parse = require('parse/node');
const fs = require('fs');
const path = require('path');

// Configuration Parse
Parse.initialize(
  process.env.PARSE_APP_ID || 'marki15-app-id',
  process.env.PARSE_JAVASCRIPT_KEY || '',
  process.env.PARSE_MASTER_KEY || 'marki15-master-key'
);
Parse.serverURL = process.env.PARSE_SERVER_URL || 'https://dev.api.markidiags.com/api/parse';

// =========================================================================
// FONCTIONS DE CONVERSION
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
  
  // 9. Variables dans les URLs
  result = result.replace(/\\[\\[([a-zA-Z_][a-zA-Z0-9_]*)\\]\\]/g, '{{ $1 }}');
  
  return result;
}

// =========================================================================
// FONCTION PRINCIPALE DE MIGRATION
// =========================================================================

async function migrateSequence(seq, dryRun = true) {
  console.log(`\n📋 Séquence: ${seq.id}`);
  
  const emails = seq.get('emails') || [];
  let modified = false;
  let conversions = 0;
  
  const newEmails = emails.map(email => {
    const newEmail = { ...email };
    
    // Convertir les scénarios
    if (email.scenarios) {
      newEmail.scenarios = email.scenarios.map(scenario => {
        const newScenario = { ...scenario };
        let scenarioModified = false;
        
        if (newScenario.objet && newScenario.objet.includes('[[')) {
          const oldObjet = newScenario.objet;
          newScenario.objet = convertTemplate(newScenario.objet);
          if (oldObjet !== newScenario.objet) {
            console.log(`  → Objet converti: "${oldObjet.substring(0, 50)}..."`);
            scenarioModified = true;
            conversions++;
          }
        }
        
        if (newScenario.corps && newScenario.corps.includes('[[')) {
          const oldCorps = newScenario.corps;
          newScenario.corps = convertTemplate(newScenario.corps);
          if (oldCorps !== newScenario.corps) {
            console.log(`  → Corps converti (${oldCorps.length} -> ${newScenario.corps.length} chars)`);
            scenarioModified = true;
            conversions++;
          }
        }
        
        return newScenario;
      });
      
      if (newEmail.scenarios.some(s => s !== email.scenarios.find(s2 => s2.format === s.format))) {
        modified = true;
      }
    }
    // Convertir les champs directs (sans scénarios)
    else {
      if (email.objet && email.objet.includes('[[')) {
        email.objet = convertTemplate(email.objet);
        modified = true;
        conversions++;
        console.log(`  → Objet direct converti`);
      }
      
      if (email.corps && typeof email.corps === 'string' && email.corps.includes('[[')) {
        email.corps = convertTemplate(email.corps);
        modified = true;
        conversions++;
        console.log(`  → Corps direct converti`);
      }
    }
    
    return newEmail;
  });
  
  if (!modified) {
    console.log(`  ℹ️ Aucune conversion nécessaire`);
    return { success: true, modified: false, conversions: 0 };
  }
  
  if (dryRun) {
    console.log(`  ✅ ${conversions} conversions identifiées (mode dry-run)`);
    return { success: true, modified: true, conversions };
  }
  
  try {
    seq.set('emails', newEmails);
    await seq.save(null, { useMasterKey: true });
    console.log(`  ✅ ${conversions} conversions appliquées`);
    return { success: true, modified: true, conversions };
  } catch (error) {
    console.error(`  ❌ Erreur: ${error.message}`);
    return { success: false, modified: false, conversions: 0, error: error.message };
  }
}

// =========================================================================
// EXÉCUTION
// =========================================================================

async function main() {
  const dryRun = process.argv.includes('--dry-run') || process.argv.includes('-n');
  const sequenceId = process.argv[2];
  
  console.log(`🚀 Migration des templates vers Nunjucks (dry-run: ${dryRun})\n`);
  
  if (sequenceId) {
    // Migration d'une seule séquence
    const Sequence = Parse.Object.extend('Sequence');
    const query = new Parse.Query(Sequence);
    const seq = await query.get(sequenceId, { useMasterKey: true });
    await migrateSequence(seq, dryRun);
  } else {
    // Migration de toutes les séquences
    const Sequence = Parse.Object.extend('Sequence');
    const query = new Parse.Query(Sequence);
    const sequences = await query.find({ useMasterKey: true });
    
    console.log(`📊 Trouvé ${sequences.length} séquences`);
    
    let totalConversions = 0;
    let modifiedCount = 0;
    let errorCount = 0;
    
    for (const seq of sequences) {
      try {
        const result = await migrateSequence(seq, dryRun);
        if (result.modified) {
          modifiedCount++;
        }
        totalConversions += result.conversions;
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

  it('should convert legacy syntax automatically', () => {
    const legacyTemplate = 'Bonjour [[payeur_prenom]] [[payeur_nom]]';
    // Après conversion : Bonjour {{ payeur_prenom }} {{ payeur_nom }}
    // Puis rendu : Bonjour Jean DUPONT
    const result = renderTemplate(convertLegacyTemplate(legacyTemplate), testData);
    assert.strictEqual(result, 'Bonjour Jean DUPONT');
  });
});
```

### Test 2 : Intégration complète

1. **Test manuel** : Exécuter `03-generateContent.js` avec `USE_NUNJUCKS=true` et `USE_OLLAMA=false`
   - Vérifier que les emails sont générés avec Nunjucks
   - Vérifier que les variables sont correctement remplacées

2. **Test avec correction** : Exécuter avec `USE_NUNJUCKS=true` et `USE_OLLAMA_CORRECTION=true`
   - Vérifier que la correction Ollama ne casse pas les variables Nunjucks

---

## ✅ CHECKLIST DE VALIDATION

### Avant déploiement

- [ ] `npm install nunjucks` dans backend
- [ ] Vérifier `backend/cloud/utils/nunjucks.js` existe et est correct
- [ ] Modifier `03-generateContent.js` avec le nouveau workflow
- [ ] Ajouter `USE_NUNJUCKS=true` et `USE_OLLAMA_CORRECTION=false` dans `.env`
- [ ] Tester avec une séquence en base (1 impayé)
- [ ] Tester avec une séquence en base (plusieurs impayés)
- [ ] Tester la conversion automatique des templates legacy
- [ ] Tester la correction Ollama (optionnelle)

### Frontend

- [ ] Mettre à jour la documentation dans `useSequenceEditor.js`
- [ ] Mettre à jour les exemples dans `VariablesPicker.vue`
- [ ] Vérifier les placeholders dans `DrawerLienPaiement.vue`

### Post-déploiement

- [ ] Surveiller les logs pour erreurs Nunjucks
- [ ] Vérifier que les emails sont envoyés correctement
- [ ] Confirmer que le parsing PDF (Ollama) fonctionne toujours
- [ ] Vérifier les performances (temps de génération)

---

## 📌 NOTES IMPORTANTES

1. **L'appel Ollama pour le parsing de PDF reste INCHANGÉ** dans `server.js`
2. **Deux appels Ollama distincts** :
   - `server.js` : Parsing PDF → **inchangé**
   - `03-generateContent.js` : Correction après Nunjucks → **optionnel**
3. **Pas de coexistence forcée** : Les templates peuvent être en `[[...]]` (auto-convertis) ou directement en `{{ }}`
4. **Priorité** : Nunjucks d'abord, Ollama en correction seulement
5. **Rétrocompatibilité** : Le mode legacy (Ollama seul) reste disponible via `USE_NUNJUCKS=false`

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

# Activer en production
# Dans backend/.env:
USE_NUNJUCKS=true
USE_OLLAMA_CORRECTION=false  # Commencer sans correction, puis tester
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

1. ✅ **Préparation** : Commit initial avec TODO-NUNJUCKS.md (fait)
2. 🔄 **Backend** : Modifier `03-generateContent.js` avec nouveau workflow
3. 🔄 **Tests** : Créer et exécuter les tests unitaires
4. 🔄 **Conversion** : Tester le script de conversion sur 1-2 séquences
5. 🔄 **Validation** : Vérifier manuellement les emails générés
6. 🔄 **Frontend** : Mettre à jour la documentation
7. 🔄 **Migration** : Convertir toutes les séquences (après validation)
8. 🔄 **Déploiement** : Pousser sur main après tous les tests

---

*Document généré le 16/06/2026 pour la migration Nunjucks - Branche: impl/nunjucks-migration*
