# Workflow Frontend: charger-blacklistes

**Écran** : dashboard (section blacklist)
**Type** : Frontend lié
**Feature** : F-008 Blacklist des Impayés

## Description

Charge la liste des impayés blacklistés pour affichage dans le tableau de bord.

## Entrées

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `page` | number | non | Numéro de page (défaut: 1) |
| `limit` | number | non | Éléments par page (défaut: 50) |

## Sorties

| Donnée | Type | Description |
|--------|------|-------------|
| `impayes` | Array | Liste des impayés blacklistés |
| `total` | number | Nombre total |

---

## Spécification JSDoc

```javascript
/**
 * @workflow charger-blacklistes
 * @screen dashboard
 * @description Charge les impayés blacklistés
 *
 * @param {Object} params
 * @param {number} [params.page=1] - Page courante
 * @param {number} [params.limit=50] - Items par page
 *
 * @returns {Promise<{impayes: Parse.Object[], total: number}>}
 *
 * @checkpoint charger-blacklistes-start
 * @checkpoint charger-blacklistes-success
 * @checkpoint charger-blacklistes-empty
 * @checkpoint charger-blacklistes-error
 */

async function chargerBlacklistes({ page = 1, limit = 50 }) {
  // Implementation
}
```

## Colonne du tableau

| Colonne | Source |
|---------|--------|
| N° Facture | `impaye.get('nfacture')` |
| Client | `impaye.get('payeur').get('nom')` |
| Montant | `impaye.get('reste_a_payer')` |
| Motif | `impaye.get('blacklistMotifType')` |
| Depuis | calcul depuis `blacklistedAt` |
| Actions | Voir, Réactiver |
