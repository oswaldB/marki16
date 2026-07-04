# Workflow Frontend: unblacklist-depuis-liste

**Écran** : dashboard (section blacklist)
**Type** : Frontend lié
**Feature** : F-008 Blacklist des Impayés

## Description

Permet de réactiver les relances d'un impayé directement depuis la liste des blacklistés.

## Entrées

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `impayeId` | string | oui | ID de l'impayé à déblacklister |

## Sorties

| Donnée | Type | Description |
|--------|------|-------------|
| `success` | boolean | Succès de l'opération |

---

## Spécification JSDoc

```javascript
/**
 * @workflow unblacklist-depuis-liste
 * @screen dashboard
 * @description Réactive un impayé depuis la liste
 *
 * @param {Object} params
 * @param {string} params.impayeId - ID de l'impayé
 *
 * @returns {Promise<{success: boolean}>}
 *
 * @checkpoint unblacklist-liste-start
 * @checkpoint unblacklist-liste-confirm
 * @checkpoint unblacklist-liste-success
 * @checkpoint unblacklist-liste-error
 */

async function unblacklistDepuisListe({ impayeId }) {
  // Implementation
}
```

## Flux

1. Clic sur bouton "Réactiver" dans la ligne du tableau
2. Confirmation modal : "Réactiver les relances pour cette facture ?"
3. Appel à `toggle-blacklist-impaye` avec action 'unblacklist'
4. Rafraîchir la liste
5. Toast de confirmation
