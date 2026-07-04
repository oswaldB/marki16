# Modèle: Impaye (Parse)

**Classe** : `Impaye`  
**Source** : Import depuis `_GCO__GcoPiece` + `_ADN_DIAG__Dossier` + `_ADN_DIAG__Mission`

## Description

Représente une facture impayée avec ses données de dossier, de mission et de contacts associés.

---

## Champs principaux (Import DB externe)

### Identification

| Champ | Type | Source DB | Description |
|-------|------|-----------|-------------|
| `externe_id` | Number | `nfacture` | ID unique de la facture |
| `nfacture` | Number | `nfacture` | Numéro de facture |
| `ref_piece` | String | `refpiece` | Référence pièce (ex: FA240126 45993) |
| `source` | String | - | Valeur fixe: "db_externe" |

### Dates

| Champ | Type | Source DB | Description |
|-------|------|-----------|-------------|
| `date_piece` | Date | `datepiece` | Date de la facture |
| `date_echeance` | Date | `dateecheance` | Date d'échéance |
| `date_debut_mission` | Date | `dateDebutMission` | Date début de la mission |

### Montants

| Champ | Type | Source DB | Description |
|-------|------|-----------|-------------|
| `total_ht` | Number | `totalhtnet` | Total HT net |
| `total_ttc` | Number | `totalttcnet` | Total TTC net |
| `reste_a_payer` | Number | `resteapayer` | Montant restant dû |
| `facture_soldee` | Boolean | `facturesoldee` | True si facture soldée |

### Dossier

| Champ | Type | Source DB | Description |
|-------|------|-----------|-------------|
| `id_dossier` | String | `idDossier` | ID du dossier |
| `numero_dossier` | String | `numero` | Numéro de dossier |
| `reference` | String | `reference` | Référence dossier |
| `reference_externe` | String | `referenceExterne` | Référence externe |
| `statut_dossier` | String | `_ADN_DIAG__StatutDossier` | Statut du dossier |
| `commentaire_dossier` | String | `commentaire` | Commentaire sur le dossier |
| `commentaire_piece` | String | `commentaire` | Commentaire sur la facture |
| `employe_intervention` | String | `_ADN_RG_Employe` | Nom de l'employé intervenant |

### Mission et Contexte

| Champ | Type | Source DB | Description |
|-------|------|-----------|-------------|
| `cadre_mission` | String | `d.idCadreMission` | Contexte: **AVV** (avant vente), **LOC** (location), **AVTRAV** (avant travaux), **CONSTR** (construction), **LOCSA**, **SUIVI**, etc. |
| `missions` | Array | `_ADN_DIAG__Mission` | Tableau de toutes les missions du dossier (voir structure ci-dessous) |

#### Structure d'une mission dans le tableau `missions`:

```json
[
  {
    "idMission": 12345,
    "idCategorieMission": "A",
    "idTypeMission": "CA",
    "intitule": "Constat Amiante - Avant vente",
    "titreRapport": "Rapport de mission...",
    "dateDebut": "2024-01-15T10:00:00.000Z",
    "dateFin": "2024-01-15T12:00:00.000Z",
    "conclusion": "..."
  }
]
```

**Valeurs typiques:**
- `idCategorieMission` : `A` (Amiante), `C` (Carrez), `T` (Termite), `EDL`, `DPE`, `ELEC`, `GAZ`
- `idTypeMission` : `CA` (constat amiante), `D` (diagnostic), `ET` (état des lieux), `S` (simple), `AVT` (avant vente)

### Adresse du bien

| Champ | Type | Source DB | Description |
|-------|------|-----------|-------------|
| `adresse_bien` | String | Calculée | Adresse complète |
| `code_postal` | String | `codePostal` | Code postal |
| `ville` | String | `ville` | Ville |
| `numero_lot` | String | `numeroLot` | Numéro de lot |
| `etage` | String | `etage` | Étage |
| `entree` | String | `entree` | Entrée |
| `escalier` | String | `escalier` | Escalier |
| `porte` | String | `porte` | Porte |

### Document

| Champ | Type | Source DB | Description |
|-------|------|-----------|-------------|
| `url_pdf` | String | Calculée | Chemin vers le PDF de la facture |

---

## Contacts (Pointers)

| Champ | Type | Description |
|-------|------|-------------|
| `payeur` | Pointer(Contact) | Contact payeur (société) |
| `apporteur` | Pointer(Contact) | Contact apporteur d'affaire |
| `contact_relance` | Pointer(Contact) | Contact par défaut pour les relances |

### Champs dénormalisés (pour affichage rapide)

| Préfixe | Champs |
|---------|--------|
| `payeur_*` | nom, prenom, email, telephone, type_personne, contact_nom, contact_prenom, contact_email |
| `apporteur_*` | nom, prenom, email, telephone, contact_nom, contact_prenom, contact_email |
| `acquereur_*` | nom, prenom, email, telephone |
| `donneur_ordre_*` | nom, prenom, email, telephone |
| `locataire_entrant_*` | nom, prenom, email, telephone |
| `locataire_sortant_*` | nom, prenom, email, telephone |
| `notaire_*` | nom, prenom, email, telephone |
| `proprietaire_*` | nom, prenom, email, telephone, type_personne |
| `syndic_*` | nom, prenom, email, telephone |

| Champ | Type | Description |
|-------|------|-------------|
| `payeur_type` | String | "Propriétaire", "Apporteur d'affaire", ou "Autre" |

---

## Séquence de relance (F-011)

| Champ | Type | Description |
|-------|------|-------------|
| `sequence` | Pointer(SequenceRelance) | Séquence de relance assignée |
| `dateAssignationSequence` | Date | Date d'assignation de la séquence |

---

## Blacklist (F-008)

| Champ | Type | Description |
|-------|------|-------------|
| `isBlacklisted` | Boolean | Impayé exclu des relances |
| `blacklistedAt` | Date | Date de mise en blacklist |
| `blacklistMotif` | String | Raison détaillée |
| `blacklistMotifType` | String | Type prédéfini: "litige", "arrangement", "contestation", "procedure", "annulation", "autre" |
| `blacklistedBy` | Pointer(User) | Utilisateur ayant blacklisté |
| `unblacklistedAt` | Date | Date de retrait de la blacklist |
| `unblacklistedBy` | Pointer(User) | Utilisateur ayant déblacklisté |

### Hooks beforeSave (F-008)

```javascript
Parse.Cloud.beforeSave('Impaye', (request) => {
  const impaye = request.object
  
  // Si mise en blacklist
  if (impaye.dirty('isBlacklisted') && impaye.get('isBlacklisted')) {
    if (!impaye.get('blacklistMotif') && !impaye.get('blacklistMotifType')) {
      throw new Error('Motif de blacklist obligatoire')
    }
    if (!impaye.get('blacklistedAt')) {
      impaye.set('blacklistedAt', new Date())
    }
  }
  
  // Si retrait de blacklist
  if (impaye.dirty('isBlacklisted') && !impaye.get('isBlacklisted')) {
    impaye.set('unblacklistedAt', new Date())
    impaye.unset('blacklistMotif')
    impaye.unset('blacklistMotifType')
  }
})
```

---

## Requêtes typiques

### Impayés non soldés non blacklistés

```javascript
const query = new Parse.Query('Impaye')
query.equalTo('facture_soldee', false)
query.notEqualTo('isBlacklisted', true)
```

### Impayés par cadre mission

```javascript
const query = new Parse.Query('Impaye')
query.equalTo('cadre_mission', 'AVV') // Avant vente
```

### Impayés avec mission Amiante

```javascript
const query = new Parse.Query('Impaye')
query.equalTo('missions.idCategorieMission', 'A')
```

### Impayés blacklistés

```javascript
const query = new Parse.Query('Impaye')
query.equalTo('isBlacklisted', true)
query.descending('blacklistedAt')
```
