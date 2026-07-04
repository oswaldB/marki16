# Workflow Frontend: afficher-badge-blacklist

**Écran** : fiche-facture
**Type** : Frontend lié
**Feature** : F-008 Blacklist des Impayés

## Description

Affiche le badge de statut blacklist sur la fiche d'un impayé avec le style approprié.

## Entrées

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `impaye` | Parse.Object | oui | L'objet impayé |

## Sorties

| Donnée | Type | Description |
|--------|------|-------------|
| `badge` | HTMLElement | Badge rendu |

---

## Spécification JSDoc

```javascript
/**
 * @workflow afficher-badge-blacklist
 * @screen fiche-facture
 * @description Affiche le badge de statut blacklist
 *
 * @param {Object} params
 * @param {Parse.Object} params.impaye - L'impayé à afficher
 *
 * @returns {HTMLElement} Le badge rendu
 *
 * @checkpoint badge-blacklist-active
 * @checkpoint badge-blacklist-suspended
 */

function afficherBadgeBlacklist({ impaye }) {
  // Implementation
}
```

## États du badge

| Statut | Label | Classe CSS |
|--------|-------|------------|
| Non blacklisté | "Relances actives" | `badge badge-success` |
| Blacklisté | "🚫 Relances suspendues" | `badge badge-error` |

## Infobulle

Au survol du badge blacklisté :
- Motif : "Litige commercial"
- Date : "Blacklisté le 24/06/2025"
- Par : "par Jean Dupont"
