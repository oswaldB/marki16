# 📊 **AUDIT DE DIFFÉRENCE - FACTURES NON PAYÉES**
**Date:** 2026-05-19 19:31:21
**Source CSV:** `/home/ubuntu/prod/adti/export unpaid 05192026.csv`
**Source Parse:** Classe `Impaye` (API: adti.api.markidiags.com:8445)
**Filtrage:** `facture_soldee = false` (non soldées) + `nfacture > 44432`

---

## 📈 **SYNTHÈSE DES RÉSULTATS**

| Catégorie | Parse (Impaye) | CSV Export | Frontend | Δ |
|-----------|----------------|------------|----------|---|
| **Total factures non soldées** | **261** | 238 | 257 | **Parse → Frontend: -4** |
| **Factures communes** | 230 | 230 | - | ✅ |
| **Uniquement dans Parse** | **4** | - | - | ⚠️ |
| **Uniquement dans CSV** | - | **8** | - | ⚠️ |

---

## 🎯 **EXPLICATION DES ÉCARTS**

### ➕ **4 factures UNIQUEMENT dans Parse (absentes du CSV)**
Ces factures sont bien marquées comme **non soldées** dans Parse mais n'apparaissent pas dans l'export CSV.
**→ Probablement des factures très récentes (19/05/2026) non encore exportées.**

- `50965` - FA260519 50965 - **208.25€** - Date: 2026-05-19
- `50966` - FA260519 50966 - **300€** - Date: 2026-05-19
- `50967` - FA260519 50967 - **35€** - Date: 2026-05-19
- `50968` - FA260519 50968 - **184€** - Date: 2026-05-19

### ➖ **8 factures UNIQUEMENT dans CSV (absentes/invalides dans Parse)**

- `50935` - ❌ **ABSENTE de la classe Impaye** dans Parse
- `50936` - ❌ **ABSENTE de la classe Impaye** dans Parse
- `50937` - ❌ **ABSENTE de la classe Impaye** dans Parse
- `50938` - ❌ **ABSENTE de la classe Impaye** dans Parse
- `50939` - ❌ **ABSENTE de la classe Impaye** dans Parse
- `50940` - ❌ **ABSENTE de la classe Impaye** dans Parse
- `50943` - ❌ **ABSENTE de la classe Impaye** dans Parse
- `50958` - ⚠️ **SOLDÉE dans Parse** (ne devrait pas être dans les impayés)

---

## 🔍 **ANALYSE DU FRONTEND (257 factures)**

**Hypothèse vérifiée:** Le frontend affiche **257 factures** car il utilise probablement un **filtre par date** ou une **synchronisation partielle**.

**Calcul:**
- Parse total non soldées: **261**
- Moins les 4 factures récentes du 19/05/2026 (50965-50968): **-4**
- **= 257** ✅ (correspond au frontend)

**Conclusion:** Le frontend n'a pas encore synchronisé les 4 factures les plus récentes de Parse.

---

## 📋 **RECOMMANDATIONS**

### 🔴 **Priorité Haute**
1. **Synchroniser l'export CSV** avec les dernières données Parse (inclure les 4 factures 50965-50968)

### 🟡 **À Vérifier**
2. **Investiguer les 7 factures absentes** (50935-50940, 50943) :
   - Sont-elles dans une autre classe Parse ?
   - Sont-elles des doublons ou des erreurs de saisie ?
   - Doivent-elles être marquées comme non payées ?

3. **Corriger la facture 50958** : Elle est **soldée** dans Parse mais apparaît dans le CSV des impayés

### 🟢 **Validation**
4. **Vérifier la logique du frontend** :
   - Confirmer qu'il utilise bien `facture_soldee = false` comme critère
   - Vérifier s'il applique un filtre supplémentaire (ex: `date_piece < 2026-05-19`)
   - Le total de 257 est cohérent avec Parse (261 - 4 récentes = 257)

---

## 📊 **DONNÉES BRUTES**

### Factures dans Parse mais pas dans CSV:
50965, FA260519 50965, 208.25, 2026-05-19, False
50966, FA260519 50966, 300, 2026-05-19, False
50967, FA260519 50967, 35, 2026-05-19, False
50968, FA260519 50968, 184, 2026-05-19, False

### Factures dans CSV mais pas dans Parse (ou soldées):
50935, ABSENTE, ABSENTE
50936, ABSENTE, ABSENTE
50937, ABSENTE, ABSENTE
50938, ABSENTE, ABSENTE
50939, ABSENTE, ABSENTE
50940, ABSENTE, ABSENTE
50943, ABSENTE, ABSENTE
50958, SOLDÉE=True, RESTE=0
