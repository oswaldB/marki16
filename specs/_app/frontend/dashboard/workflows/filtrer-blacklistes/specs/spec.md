# Workflow Frontend: filtrer-blacklistes

**Écran** : dashboard (section blacklist)
**Type** : Frontend lié
**Feature** : F-008 Blacklist des Impayés

## Description

Filtre la liste des impayés blacklistés par motif ou période.

## Entrées

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `motifType` | string | non | Type de motif à filtrer |
| `dateDebut` | Date | non | Date de début |
| `dateFin` | Date | non | Date de fin |
| `search` | string | non | Recherche texte |

## Sorties

| Donnée | Type | Description |
|--------|------|-------------|
| `filteredImpayes` | Array | Impayés filtrés |

---

## Spécification JSDoc

```javascript
/**
 * @workflow filtrer-blacklistes
 * @screen dashboard
 * @description Filtre les impayés blacklistés
 *
 * @param {Object} filters
 * @param {string} [filters.motifType] - Type de motif
 * @param {Date} [filters.dateDebut] - Date début
 * @param {Date} [filters.dateFin] - Date fin
 * @param {string} [filters.search] - Recherche texte
 *
 * @returns {Parse.Object[]}
 *
 * @checkpoint filtrer-blacklistes-start
 * @checkpoint filtrer-blacklistes-applied
 */

function filtrerBlacklistes(filters) {
  // Implementation
}
```

## Filtres disponibles

- **Motif** : litige, arrangement, contestation, procedure, annulation, autre
- **Période** : Date de blacklist (range)
- **Recherche** : N° facture, nom client
