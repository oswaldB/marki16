# Workflow generate-suivi

## 📋 Description

Ce workflow **autonome** gère la création et la génération des **emails de suivi périodiques** (ex: état d'avancement des règlements tous les 1er du mois) pour les impayés non soldés.

Il est accessible via **Cloud Function** `generateSuivis` et peut être appelé :
- Automatiquement via cron
- Manuellement via API REST (curl, Postman, etc.)
- Directement en CLI

---

## 🎯 Fonctionnalités

| Fonctionnalité | Description |
|--------------|-------------|
| Création des suivis | Crée des objets `Suivi` dans Parse **uniquement si la fréquence correspond à aujourd'hui** |
| Génération du contenu | Génère **obligatoirement** le contenu via **Ollama LLM** (retry jusqu'à succès, **pas de fallback template**) |
| Traitement de la fréquence | Vérifie que **aujourd'hui ≡ fréquence** définie dans l'email de la séquence |
| Mode autonome | Récupère automatiquement toutes les données depuis Parse |

---

## 🏗️ Architecture

```
backend/cloud/workflows/generate-suivi/
├── 00-master.js          # Orchestrateur + Cloud Function
├── 01-createSuivis.js    # Étape 1 : Création des Suivis (avec vérification fréquence)
├── 02-generateSuivis.js  # Étape 2 : Génération du contenu via LLM
└── FONCTIONNEMENT.md     # Cette documentation
```

---

## 📅 Fréquences supportées

| Valeur `frequence` dans sequence.emails[] | Description |
|------------------------------------------|-------------|
| `"quotidien"` | Tous les jours |
| `"1"`, `"15"`, `"28"`... | Le jour du mois correspondant |
| `"lundi"`, `"mardi"`, `"mercredi"`, `"jeudi"`, `"vendredi"`, `"samedi"`, `"dimanche"` | Le jour de la semaine correspondant |
| `"hebdomadaire"` | **Tous les lundis** (équivalent à `"lundi"`) |

---

## 🔄 Flux de données

### Étape 1 (createSuivis)
```
Input: AUCUN paramètre - récupère TOUT depuis Parse
├── Process:
│   ├── Récupère toutes les séquences avec type="suivi" ET publiee=true
│   ├── Pour chaque séquence:
│   │   └── Pour chaque email dans sequence.emails[]:
│   │       ├── Vérifie: aujourd'hui ≡ email.frequence ?
│   │       │   (ex: frequence="1" et aujourd'hui=1er du mois → VALIDE)
│   │       └── Si OUI:
│   │           ├── Pour chaque scénario dans email.scenarios[] WHERE active==true:
│   │           │   ├── Récupère impayés non soldés avec cette séquence
│   │           │   ├── Filtre contacts valides (email, non blacklisté)
│   │           │   ├── Regroupe par payeur
│   │           │   └── Crée/met à jour un Suivi par (payeur, email_index, scénario)
│   └── Vérification Parse finale
└── Output: stats {suivisCreated, suivisUpdated, skipped, ...}
```

### Étape 2 (generateSuivis)
```
Input: AUCUN paramètre - recherche dans Parse les Suivis avec statut "En attente de génération"
├── Process:
│   ├── Récupère tous les Suivis en attente
│   ├── Pour chaque Suivi:
│   │   ├── Récupère l'historique (Relances + Suivis précédents)
│   │   ├── Récupère les impayés
│   │   ├── **Génère le contenu via Ollama LLM** (retry automatique si échec)
│   │   └── Met à jour le Suivi avec objet/corps/statut="Prêt pour envoi"
│   └── Vérification Parse finale
└── Output: stats {processed, errors, retries}
```

---

## 🎪 Structure des séquences de suivi

```json
{
  "type": "suivi",
  "publiee": true,
  "emails": [
    {
      "email_index": 1,
      "frequence": "1",  // ou "hebdomadaire", "lundi", etc.
      "scenarios": [
        {
          "format": "single",
          "active": true,     // Seuls les actifs sont traités
          "objet": "Suivi de vos dossiers - Facture [[nfacture]]...",
          "corps": "<p>Bonjour [[payeur_nom]],...</p>..."
        }
      ]
    }
  ]
}
```

---

## 🚀 Utilisation

### 1. Appel via Cloud Function (API REST)

```bash
curl -X POST https://adti.api.markidiags.com:8445/parse/functions/generateSuivis \
  -H "Content-Type: application/json" \
  -H "X-Parse-Application-Id: adti-marki" \
  -H "X-Parse-Javascript-Key: c8d7e205725c6a06dfb3771a2f739fe861664fc6ef90fbda" \
  -H "X-Parse-Master-Key: e2f4e4e89056af61dd95a71226fa0e51917313e09b68aca8bf434e5eb9bd8aa9" \
  -k \
  -d '{}'
```

**⚠️ Note :** La Cloud Function **n'accepte aucun paramètre**. Elle récupère automatiquement toutes les données nécessaires depuis Parse.

### 2. Exécution CLI directe

```bash
cd /home/ubuntu/prod/adti
node backend/cloud/workflows/generate-suivi/00-master.js
```

### 3. Exécution via cron

```bash
# Exécution quotidienne à 4h
0 4 * * * cd /home/ubuntu/prod/adti && node backend/cloud/workflows/generate-suivi/00-master.js
```

---

## 📊 Logs

### Niveaux de log
- `INFO` : Résumés par étape, vérifications Parse
- `WARN` : Avertissements (scénario inactif, fréquence non valide, etc.)
- `ERROR` : Erreurs bloquantes

### Exemple de logs

```
[INFO] 🚀 DÉBUT: generate-suivi (trigger: cron)
[INFO] Étape 1: 3 séquences de type "suivi" publiées trouvées
[INFO] Étape 1: Séquence ABC, email_index=1 - fréquence "1" VALIDE
[INFO] Étape 1: 15 impayés non soldés trouvés pour séquence ABC
[INFO] Étape 1: 5 Suivis créés
[INFO] Étape 2: 5 Suivis en attente de génération
[INFO] Étape 2: Appel LLM pour Suivi XYZ...
[INFO] Étape 2: Contenu généré par LLM pour Suivi XYZ
[INFO] Étape 2: 5 traités | 0 erreurs
[INFO] ✅ PROCESSUS TERMINÉ AVEC SUCCÈS
[INFO] ⏱️  DURÉE TOTALE: 15.23 secondes
```

---

## 🔧 Configuration

### Variables d'environnement requises

| Variable | Description | Défaut |
|---------|-------------|--------|
| `OLLAMA_API_URL` | URL de l'API Ollama | `https://ollama.com/api` |
| `OLLAMA_API_KEY` | Clé API Ollama | **OBLIGATOIRE** |
| `OLLAMA_MODEL` | Modèle LLM à utiliser | `mistral` |

**⚠️ IMPORTANT :** Le workflow **nécessite** `OLLAMA_API_KEY` pour fonctionner. Sans cette clé, l'étape 2 échouera.

---

## ⚠️ Prérequis

1. **Parse Server** doit être démarré avec `backend/cloud/main.js` chargé
2. **Cloud Function** `generateSuivis` doit être enregistrée (via `require` dans main.js)
3. Les collections Parse suivantes doivent exister :
   - `Impaye`
   - `Suivi` (créée automatiquement)
   - `Sequence`
   - `Contact`
   - `Relance` (pour l'historique)
   - `GenerateSuivisMasterLog` (créée automatiquement pour les logs)

---

## 📈 Métriques

Les logs d'exécution sont sauvegardés dans Parse dans la collection `GenerateSuivisMasterLog` avec :
- `startedAt` : Date de début
- `finishedAt` : Date de fin
- `durationMs` : Durée d'exécution
- `trigger` : Origine de l'appel (cron, cloud-function, cli)
- `status` : success/error
- `stats` : Statistiques détaillées par étape
- `errors` : Liste des erreurs

---

## 🐛 Dépannage

### "0 Suivis créés"
**Cause :** Aucune séquence de type "suivi" avec fréquence valide aujourd'hui.
**Solution :** 
- Vérifier que des séquences avec `type="suivi"` et `publiee=true` existent
- Vérifier que la fréquence correspond à aujourd'hui

### "LLM échoué après 3 tentatives"
**Cause :** L'API Ollama est inaccessible ou la clé est invalide.
**Solution :**
- Vérifier que `OLLAMA_API_KEY` est correcte
- Vérifier que l'API Ollama est accessible
- Vérifier le réseau

### "Invalid function: generateSuivis"
**Cause :** La Cloud Function n'est pas enregistrée.
**Solution :**
- Vérifier que `backend/cloud/main.js` contient `require('./workflows/generate-suivi/00-master')`
- Redémarrer Parse Server

---

## 📝 Historique des versions

| Date | Version | Changements |
|------|---------|------------|
| 2026-01-01 | 1.0.0 | Création initiale du workflow |
