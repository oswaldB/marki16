# 🚀 Migration vers Nunjucks - Liste des tâches

> **Branche** : `feature/nunjucks-templates`  
> **Objectif** : Remplacer la syntaxe `[[...]]` par Nunjucks `{{ ... }}` pour le templating des emails  
> **Conservation** : L'appel Ollama pour le **parsing de PDF** reste inchangé. Un appel Ollama optionnel peut être conservé **après** Nunjucks pour corriger les incohérences.

---

## 📋 PHASE 1 : PRÉPARATION DE L'ENVIRONNEMENT

### ✅ Backend - Installation de Nunjucks
- [ ] Installer le package Nunjucks
  ```bash
  cd backend
  npm install nunjucks
  ```
- [ ] Vérifier l'installation dans `backend/package.json`

### ✅ Backend - Configuration de base
- [ ] Créer un module utilitaire pour Nunjucks
  **Fichier** : `backend/cloud/utils/nunjucks.js`
  **Contenu** :
  ```javascript
  const nunjucks = require('nunjucks');
  
  // Configuration de l'environnement Nunjucks
  const env = nunjucks.configure({
    autoescape: false, // Désactive l'échappement HTML automatique
    throwOnUndefined: false, // Ne pas planter sur variable manquante
    tags: {
      blockStart: '{%',
      blockEnd: '%}',
      variableStart: '{{',
      variableEnd: '}}',
      commentStart: '{#',
      commentEnd: '#}'
    }
  });
  
  // Filtres personnalisés
  env.addFilter('date', function(date, format) {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    
    const pad = (n) => n.toString().padStart(2, '0');
    
    return format.replace(/YYYY/g, d.getFullYear())
                 .replace(/MM/g, pad(d.getMonth() + 1))
                 .replace(/DD/g, pad(d.getDate()))
                 .replace(/HH/g, pad(d.getHours()))
                 .replace(/mm/g, pad(d.getMinutes()))
                 .replace(/ss/g, pad(d.getSeconds()));
  });
  
  // Filtre pour arrondir
  env.addFilter('round', function(value, decimals = 0) {
    if (typeof value === 'number') {
      const factor = Math.pow(10, decimals);
      return Math.round(value * factor) / factor;
    }
    return value;
  });
  
  // Filtre pour formater un montant en euros
  env.addFilter('euro', function(value) {
    if (typeof value === 'number') {
      return value.toLocaleString('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
    return value;
  });
  
  module.exports = env;
  ```

---

## 📋 PHASE 2 : NOUVELLE SYNTAXE DES TEMPLATES

### 📝 Tableau de correspondance

| Syntaxe actuelle (`[[...]]`) | Syntaxe Nunjucks | Exemple | Complexité |
|---|---|---|---|
| `[[var]]` | `{{ var }}` | `{{ payeur_nom }}` | ⭐ |
| `[[var, date("DD/MM/YYYY")]]` | `{{ var | date("DD/MM/YYYY") }}` | `{{ date_echeance | date("DD/MM/YYYY") }}` | ⭐⭐ |
| `[[loop list]]` ... `[[endloop]]` | `{% for item in list %}` ... `{% endfor %}` | `{% for facture in nfactures_liste %}` ... `{% endfor %}` | ⭐⭐⭐ |
| `[[var.prop]]` | `{{ var.prop }}` ou `{{ var["prop"] }}` | `{{ facture.nfacture }}` | ⭐ |
| `[[Math.round(x)]]` | `{{ x | round }}` | `{{ reste_a_payer | round }}` | ⭐⭐ |
| `[[ if (cond) { +]]` ... `[[ } +]]` | `{% if cond %}` ... `{% endif %}` | `{% if total_impayes > 1000 %}` ... `{% endif %}` | ⭐⭐⭐ |
| `[[var]]` dans URL | `{{ var }}` | `<a href="...?facture={{ nfacture }}">` | ⭐ |

### 📝 Exemple de conversion

**Avant (syntaxe `[[...]]`)** :
```html
Bonjour [[payeur_prenom]] [[payeur_nom]],

Votre facture <strong>n°[[nfacture]]</strong>, d'un montant de <strong>[[montant_total]] €</strong>, 
arivera à échéance le <strong>[[date_echeance, "DD/MM/YYYY"]]</strong>.

[[loop nfactures_liste]]
| [[facture.nfacture]] | [[facture.date_echeance, "DD/MM/YYYY"]] | [[facture.montant_total]] € |
[[endloop]]
```

**Après (syntaxe Nunjucks)** :
```html
Bonjour {{ payeur_prenom }} {{ payeur_nom }},

Votre facture <strong>n°{{ nfacture }}</strong>, d'un montant de <strong>{{ montant_total | euro }}</strong>, 
arivera à échéance le <strong>{{ date_echeance | date("DD/MM/YYYY") }}</strong>.

{% for facture in nfactures_liste %}
| {{ facture.nfacture }} | {{ facture.date_echeance | date("DD/MM/YYYY") }} | {{ facture.montant_total | euro }} |
{% endfor %}
```

---

## 📋 PHASE 3 : MODIFICATION DU BACKEND

### ✅ Étape 1 : Modifier `03-generateContent.js`

**Fichier** : `backend/cloud/workflows/send-sequence-test/03-generateContent.js`

#### Actions :
- [ ] Importer Nunjucks et le module utilitaire
  ```javascript
  const nunjucks = require('nunjucks');
  const { prepareImpayeData, prepareMultipleImpayeData } = require('./template-utils');
  ```

- [ ] **Remplacer** la fonction `buildPrompt()` et `generateEmailContent()` par une fonction de rendu Nunjucks
  ```javascript
  /**
   * Rendu d'un template avec Nunjucks
   */
  function renderTemplate(template, data) {
    const env = require('../../utils/nunjucks');
    
    // Préparer le contexte avec toutes les variables
    const context = {
      ...data,
      // Ajouter les helpers
      Math: Math,
      // Filtres disponibles dans les templates
      date: (d, format) => {
        if (!d) return '';
        const dateObj = new Date(d);
        if (isNaN(dateObj.getTime())) return d;
        return env.filters.date(dateObj, format);
      }
    };
    
    try {
      return env.renderString(template || '', context);
    } catch (error) {
      console.error('Erreur Nunjucks:', error.message);
      // Retourner le template non rendu en cas d'erreur
      return template || '';
    }
  }
  ```

- [ ] **Remplacer** la logique principale (lignes 555-634) :
  ```javascript
  // ANCIEN CODE (à supprimer) :
  // if (USE_OLLAMA) { ... generateEmailContent(prompt) ... }
  
  // NOUVEAU CODE :
  // 1. Rendre le template avec Nunjucks
  let objet = renderTemplate(scenario.objet, impayeData);
  let corps = renderTemplate(scenario.corps, impayeData);
  
  // 2. Appel OPTIONNEL à Ollama pour corriger les incohérences (si USE_OLLAMA_CORRECTION = true)
  if (process.env.USE_OLLAMA_CORRECTION === 'true' && OLLAMA_API_KEY) {
    try {
      const correctionPrompt = `
        Tu es un correcteur d'emails. 
        L'email suivant a été généré automatiquement mais peut contenir des erreurs mineures.
        Corrige UNIQUEMENT les erreurs évidentes (accords, conjugaisons, cohérence) 
        sans changer le contenu, le style ou la structure.
        Retourne UNIQUEMENT le corps HTML corrigé.
        
        Corps à corriger : ${corps}
      `;
      
      const result = await generateEmailContent(correctionPrompt);
      if (result.corps) {
        corps = result.corps;
      }
    } catch (error) {
      // En cas d'erreur, on garde la version Nunjucks
      console.warn('Correction Ollama échouée, utilisation de Nunjucks:', error.message);
    }
  }
  ```

- [ ] **Conserver** l'appel Ollama pour le parsing de PDF dans `server.js` (inchangé)

### ✅ Étape 2 : Adapter la préparation des données

**Fichier** : `backend/cloud/workflows/send-sequence-test/03-generateContent.js`

- [ ] Modifier `prepareImpayeData()` pour s'assurer que les données sont compatibles avec Nunjucks
  - Les objets Date doivent être des objets Date valides
  - Les valeurs null/undefined doivent être gérées
  - Les listes doivent être des tableaux JavaScript natifs

- [ ] S'assurer que les noms de variables correspondent aux templates Nunjucks

### ✅ Étape 3 : Configuration environnement

**Fichier** : `backend/.env`

- [ ] Ajouter les variables :
  ```
  # Nunjucks
  USE_NUNJUCKS=true
  
  # Correction Ollama (optionnelle)
  USE_OLLAMA_CORRECTION=false
  ```

---

## 📋 PHASE 4 : SCRIPT DE MIGRATION DES TEMPLATES EXISTANTS

### ✅ Créer un script de conversion

**Fichier** : `scripts/migrate-templates-to-nunjucks.js`

```javascript
const Parse = require('parse/node');

// Configuration Parse
Parse.initialize(
  process.env.PARSE_APP_ID || 'marki15-app-id',
  process.env.PARSE_JAVASCRIPT_KEY || '',
  process.env.PARSE_MASTER_KEY || 'marki15-master-key'
);
Parse.serverURL = process.env.PARSE_SERVER_URL || 'https://dev.api.markidiags.com/api/parse';

// Fonctions de conversion
function convertTemplate(template) {
  if (!template || typeof template !== 'string') return template;
  
  let result = template;
  
  // 1. Variables simples : [[var]] -> {{ var }}
  result = result.replace(/\[\[([a-zA-Z_][a-zA-Z0-9_]*)\]\]/g, '{{ $1 }}');
  
  // 2. Variables avec propriétés : [[obj.prop]] -> {{ obj.prop }}
  result = result.replace(/\[\[([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)\]\]/g, '{{ $1.$2 }}');
  
  // 3. Dates : [[var, date("format")]] -> {{ var | date("format") }}
  result = result.replace(/\[\[([^,]+),\s*date\("([^"]+)"\)\]\]/g, '{{ $1 | date("$2") }}');
  
  // 4. Boucles : [[loop var]] -> {% for var in var %}
  result = result.replace(/\[\[loop\s+([a-zA-Z_][a-zA-Z0-9_]*)\]\]/g, '{% for $1 in $1 %}');
  
  // 5. Fin de boucle : [[endloop]] -> {% endfor %}
  result = result.replace(/\[\[endloop\]\]/g, '{% endfor %}');
  
  // 6. Conditions : [[ if (cond) { +]] -> {% if cond %}
  result = result.replace(/\[\[\s*if\s*\(([^)]+)\)\s*\{\s*\+\]\]/g, '{% if $1 %}');
  
  // 7. Fin de condition : [[ } +]] -> {% endif %}
  result = result.replace(/\[\[\s*}\s*\+\]\]/g, '{% endif %}');
  
  // 8. Expressions Math : [[Math.round(x)]] -> {{ x | round }}
  result = result.replace(/\[\[Math\.round\(([^)]+)\)\]\]/g, '{{ $1 | round }}');
  
  return result;
}

async function migrateAllSequences() {
  console.log('🔄 Début de la migration des templates...');
  
  const Sequence = Parse.Object.extend('Sequence');
  const query = new Parse.Query(Sequence);
  
  const sequences = await query.find({ useMasterKey: true });
  console.log(`📊 Trouvé ${sequences.length} séquences à migrer`);
  
  let migratedCount = 0;
  let errorCount = 0;
  
  for (const seq of sequences) {
    try {
      const emails = seq.get('emails') || [];
      let modified = false;
      
      const newEmails = emails.map(email => {
        const newEmail = { ...email };
        
        if (email.scenarios) {
          newEmail.scenarios = email.scenarios.map(scenario => {
            const newScenario = { ...scenario };
            
            if (newScenario.objet && newScenario.objet.includes('[[')) {
              newScenario.objet = convertTemplate(newScenario.objet);
              modified = true;
            }
            
            if (newScenario.corps && newScenario.corps.includes('[[')) {
              newScenario.corps = convertTemplate(newScenario.corps);
              modified = true;
            }
            
            return newScenario;
          });
        } else if (email.objet && email.objet.includes('[[')) {
          newEmail.objet = convertTemplate(newEmail.objet);
          modified = true;
        }
        
        if (email.corps && typeof email.corps === 'string' && email.corps.includes('[[')) {
          newEmail.corps = convertTemplate(newEmail.corps);
          modified = true;
        }
        
        return newEmail;
      });
      
      if (modified) {
        seq.set('emails', newEmails);
        await seq.save(null, { useMasterKey: true });
        console.log(`✅ Séquence ${seq.id} migrée`);
        migratedCount++;
      }
    } catch (error) {
      console.error(`❌ Erreur sur séquence ${seq?.id}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`\n📈 Migration terminée:`);
  console.log(`   - Séquences migrées: ${migratedCount}`);
  console.log(`   - Erreurs: ${errorCount}`);
  console.log(`   - Totales: ${sequences.length}`);
}

// Exécuter
migrateAllSequences().catch(console.error);
```

### ✅ Instructions pour exécuter le script
```bash
cd backend
node ../scripts/migrate-templates-to-nunjucks.js
```

---

## 📋 PHASE 5 : MISE À JOUR DU FRONTEND

### ✅ Mettre à jour la documentation

**Fichier** : `frontend/app/composables/useSequenceEditor.js`

- [ ] Modifier la documentation (ligne 4-28) :
  ```javascript
  export const DOCUMENTATION = {
    variables: {
      title: "Variables Disponibles (Syntaxe Nunjucks)",
      description: 
        "Utilisez ces variables dans vos templates d'emails avec la syntaxe Nunjucks.",
      categories: [
        {
          name: "Variables Simples",
          description: "Variables de base pour tous les scénarios",
          example: "{{ nfacture }}, {{ montant_total }}, {{ payeur_nom }}"
        },
        {
          name: "Formatage des dates",
          description: 
            'Utilisez le filtre date: {{ date_echeance | date("DD/MM/YYYY") }}',
          example: '{{ date_piece | date("DD/MM/YYYY") }} affiche 15/01/2026'
        },
        {
          name: "Boucles",
          description: 
            "Utilisez for pour parcourir une collection",
          example: "{% for facture in nfactures_liste %}{{ facture.nfacture }}{% endfor %}"
        },
        {
          name: "Conditions",
          description: 
            "Utilisez if pour les conditions",
          example: "{% if total_impayes > 1000 %}...{% endif %}"
        }
      ]
    },
    promptsAI: {
      title: "Exemples de Templates Nunjucks",
      examples: [
        {
          name: "Email Simple",
          prompt: "Bonjour {{ payeur_nom }}, votre facture {{ nfacture }} de {{ montant_total | euro }} est en retard."
        },
        {
          name: "Email avec Date",
          prompt: 'Facture {{ nfacture }} émise le {{ date_piece | date("DD/MM/YYYY") }}. Échéance: {{ date_echeance | date("DD/MM/YYYY") }}.'
        },
        {
          name: "Email avec Boucle",
          prompt: `{% for facture in nfactures_liste %}
  {{ facture.nfacture }} - {{ facture.montant_total | euro }}
{% endfor %}`
        }
      ]
    }
  };
  ```

### ✅ Mettre à jour les variables disponibles

**Fichier** : `frontend/app/composables/useSequenceEditor.js` (ligne 76-198)

- [ ] Mettre à jour les exemples dans `VARIABLES` si nécessaire

### ✅ Mettre à jour les composants Vue

**Fichiers à vérifier** :
- [ ] `frontend/app/components/VariablesPicker.vue` - Mettre à jour les exemples
- [ ] `frontend/app/components/SequenceEmailCard.vue` - Adapter si besoin
- [ ] `frontend/app/components/DrawerLienPaiement.vue` - Adapter les placeholders

**Exemple de mise à jour** :
```vue
<!-- Avant -->
placeholder="https://paiement.exemple.com?facture=[[nfacture]]&montant=[[reste_a_payer]]"

<!-- Après -->
placeholder="https://paiement.exemple.com?facture={{ nfacture }}&montant={{ reste_a_payer }}"
```

---

## 📋 PHASE 6 : TESTS ET VALIDATION

### ✅ Tests unitaires

- [ ] Créer un fichier de test pour Nunjucks
  **Fichier** : `backend/cloud/workflows/send-sequence-test/tests/nunjucks.test.js`
  
  ```javascript
  const { renderTemplate } = require('../03-generateContent');
  const assert = require('assert');
  
  describe('Nunjucks Template Rendering', () => {
    it('should render simple variables', () => {
      const template = 'Bonjour {{ payeur_nom }}';
      const data = { payeur_nom: 'Dupont' };
      const result = renderTemplate(template, data);
      assert.strictEqual(result, 'Bonjour Dupont');
    });
    
    it('should render date filter', () => {
      const template = 'Date: {{ date_echeance | date("DD/MM/YYYY") }}';
      const data = { date_echeance: '2024-01-15' };
      const result = renderTemplate(template, data);
      assert.strictEqual(result, 'Date: 15/01/2024');
    });
    
    it('should render for loop', () => {
      const template = '{% for f in factures %}{{ f.nfacture }}{% endfor %}';
      const data = { factures: [{ nfacture: 'FA-001' }, { nfacture: 'FA-002' }] };
      const result = renderTemplate(template, data);
      assert.strictEqual(result, 'FA-001FA-002');
    });
    
    it('should handle missing variables', () => {
      const template = 'Hello {{ missing_var }}';
      const data = {};
      const result = renderTemplate(template, data);
      assert.strictEqual(result, 'Hello ');
    });
  });
  ```

### ✅ Tests d'intégration

- [ ] Tester avec une séquence réelle en base
- [ ] Vérifier que les emails générés sont corrects
- [ ] Tester avec plusieurs impayés (boucles)
- [ ] Tester avec des dates formatées
- [ ] Tester l'appel optionnel de correction Ollama

### ✅ Validation manuelle

- [ ] Vérifier 5-10 templates différents
- [ ] Tester les 4 formats : single, multiple, both, broker
- [ ] Valider le rendu HTML (balises, liens, etc.)

---

## 📋 PHASE 7 : DÉPLOIEMENT

### ✅ Préparation
- [ ] Vérifier que tous les tests passent
- [ ] Faire un backup de la base de données
- [ ] Sauvegarder les templates actuels (au cas où)

### ✅ Déploiement
```bash
# Dans backend/
git add .
git commit -m "feat: migrate email templates to Nunjucks"
git push origin feature/nunjucks-templates

# Créer une PR vers main
# Après validation, merger vers main
```

### ✅ Monitoring post-déploiement
- [ ] Surveiller les logs pour détecter les erreurs Nunjucks
- [ ] Vérifier que les emails sont bien envoyés
- [ ] Confirmer que le parsing PDF (Ollama) fonctionne toujours
- [ ] Surveiller les performances (temps de génération)

---

## 🎯 RÉCAPITULATIF DES FICHIERS À MODIFIER

| Fichier | Action | Priorité |
|---------|--------|----------|
| `backend/package.json` | Ajouter dépendance nunjucks | ⭐⭐⭐ |
| `backend/cloud/utils/nunjucks.js` | **Créer** module utilitaire | ⭐⭐⭐ |
| `backend/cloud/workflows/send-sequence-test/03-generateContent.js` | **Modifier** rendu templates | ⭐⭐⭐ |
| `backend/.env` | Ajouter USE_NUNJUCKS, USE_OLLAMA_CORRECTION | ⭐⭐ |
| `scripts/migrate-templates-to-nunjucks.js` | **Créer** script de migration | ⭐⭐ |
| `frontend/app/composables/useSequenceEditor.js` | Mettre à jour documentation | ⭐⭐ |
| `frontend/app/components/VariablesPicker.vue` | Mettre à jour exemples | ⭐ |
| `frontend/app/components/SequenceEmailCard.vue` | Adapter si besoin | ⭐ |
| `frontend/app/components/DrawerLienPaiement.vue` | Adapter placeholder | ⭐ |

---

## ⚡ ORDRE DE TRAVAIL RECOMMANDÉ

1. **Installation** : `npm install nunjucks` dans backend
2. **Création utilitaire** : `backend/cloud/utils/nunjucks.js`
3. **Modification du rendu** : Adapter `03-generateContent.js`
4. **Configuration** : Mettre à jour `.env`
5. **Test unitaire** : Vérifier le rendu avec 1-2 templates manuellement
6. **Script de migration** : Créer et tester le script de conversion
7. **Migration des templates** : Exécuter le script sur la base
8. **Mise à jour frontend** : Documentation et exemples
9. **Tests complets** : Valider toute la chaîne
10. **Déploiement** : Commit, push, merge

---

## 📌 NOTES IMPORTANTES

1. **L'appel Ollama pour le parsing de PDF reste inchangé** dans `server.js` (ligne 371-435)
2. **Un seul appel Ollama optionnel** peut être conservé **après** Nunjucks pour la correction
3. **Pas de coexistence** des deux syntaxes - migration complète vers Nunjucks
4. **Backup obligatoire** avant migration des templates en production
5. **Validation manuelle** recommandée pour les premiers templates

---

## 🎉 CHECKLIST FINALE

- [ ] Tous les templates utilisent la syntaxe Nunjucks
- [ ] Le rendu Nunjucks fonctionne sans erreur
- [ ] L'appel Ollama pour le parsing PDF fonctionne toujours
- [ ] L'appel optionnel de correction Ollama est testé
- [ ] Le frontend affiche la nouvelle documentation
- [ ] Tous les tests passent
- [ ] Déploiement réussi
- [ ] Monitoring : pas d'erreurs en production

---

*Document généré pour la migration vers Nunjucks - Branche: feature/nunjucks-templates*
