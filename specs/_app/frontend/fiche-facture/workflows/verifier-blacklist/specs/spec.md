# Workflow Frontend: verifier-blacklist

**Écran** : fiche-facture
**Type** : Frontend lié
**Feature** : F-008 Blacklist des Impayés

## Description

Vérifie si un impayé est blacklisté avant d'autoriser certaines actions (comme envoyer une relance manuelle).

## Entrées

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `impayeId` | string | oui | ID de l'impayé à vérifier |

## Sorties

| Donnée | Type | Description |
|--------|------|-------------|
| `isBlacklisted` | boolean | Statut blacklist |
| `motif` | string | Motif si blacklisté |
| `motifType` | string | Type de motif |

---

## Spécification JSDoc

```javascript
/**
 * @workflow verifier-blacklist
 * @screen fiche-facture
 * @description Vérifie si un impayé est blacklisté
 *
 * @param {Object} params
 * @param {string} params.impayeId - ID de l'impayé
 *
 * @returns {Promise<{isBlacklisted: boolean, motif?: string, motifType?: string}>}
 *
 * @checkpoint verifier-blacklist-start
 * @checkpoint verifier-blacklist-blacklisted
 * @checkpoint verifier-blacklist-not-blacklisted
 * @checkpoint verifier-blacklist-error
 */

async function verifierBlacklist({ impayeId }) {
  // Implementation
}
```

## Exemple d'utilisation

```javascript
// Avant d'ouvrir le modal de relance
const { isBlacklisted, motif } = await verifierBlacklist({ impayeId })

if (isBlacklisted) {
  // Afficher alerte et bloquer
  showError(`Impossible de relancer : ${motif}`)
  return
}

// Ouvrir modal relance
openRelanceModal()
```

## Règles métier

- Vérifie d'abord dans le store local (cache)
- Si pas en cache, fait une requête Parse
- Retourne immédiatement si impayeId invalide
