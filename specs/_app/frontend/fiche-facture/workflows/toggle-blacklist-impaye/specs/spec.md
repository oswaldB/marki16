# Workflow Frontend: toggle-blacklist-impaye

**Écran** : fiche-facture
**Type** : Frontend lié
**Feature** : F-008 Blacklist des Impayés

## Description

Gère la mise en blacklist et le retrait d'un impayé depuis la fiche facture, avec régénération automatique des relances du contact.

## Entrées

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `impayeId` | string | oui | ID de l'impayé à blacklister/déblacklister |
| `action` | 'blacklist' \| 'unblacklist' | oui | Action à effectuer |
| `motifType` | string | si blacklist | Type de motif (litige, arrangement, etc.) |
| `motifDetail` | string | non | Détail du motif |

## Sorties

| Donnée | Type | Description |
|--------|------|-------------|
| `success` | boolean | Succès de l'opération |
| `impaye` | Impaye | Impayé mis à jour |
| `regenerated` | boolean | Si les relances ont été régénérées |

---

## Spécification JSDoc

```javascript
/**
 * @workflow toggle-blacklist-impaye
 * @screen fiche-facture
 * @description Bascule le statut blacklist d'un impayé et regénère les relances du contact
 *
 * @param {Object} params
 * @param {string} params.impayeId - ID de l'impayé
 * @param {'blacklist'|'unblacklist'} params.action - Action à effectuer
 * @param {string} [params.motifType] - Type de motif (obligatoire si blacklist)
 * @param {string} [params.motifDetail] - Détail du motif
 *
 * @returns {Promise<{success: boolean, impaye: Impaye, regenerated: boolean}>}
 *
 * @checkpoint toggle-blacklist-start
 *   Slideover ouvert, formulaire prêt.
 *   Log: [CHECKPOINT] toggle-blacklist:start {impayeId, action}
 *
 * @checkpoint toggle-blacklist-validate
 *   Validation du formulaire (motif requis pour blacklist).
 *   Log: [CHECKPOINT] toggle-blacklist:validate {valid, errors}
 *
 * @checkpoint toggle-blacklist-save
 *   Sauvegarde Parse en cours.
 *   Log: [CHECKPOINT] toggle-blacklist:save {impayeId, action}
 *
 * @checkpoint toggle-blacklist-success
 *   Sauvegarde réussie, statut mis à jour.
 *   Log: [CHECKPOINT] toggle-blacklist:success {impayeId, isBlacklisted}
 *
 * @checkpoint toggle-blacklist-regenerate-start
 *   Déclenchement de la régénération des relances du contact.
 *   Log: [CHECKPOINT] toggle-blacklist:regenerate-start {contactId}
 *
 * @checkpoint toggle-blacklist-regenerate-success
 *   Régénération terminée avec succès.
 *   Log: [CHECKPOINT] toggle-blacklist:regenerate-success {contactId, deletedCount, createdCount}
 *
 * @checkpoint toggle-blacklist-regenerate-skip
 *   Aucune régénération nécessaire (pas de contact lié).
 *   Log: [CHECKPOINT] toggle-blacklist:regenerate-skip {reason}
 *
 * @checkpoint toggle-blacklist-error
 *   Erreur lors du traitement.
 *   Log: [ERROR] toggle-blacklist:error {message, step}
 *
 * @state slideover-blacklist
 *   Slideover ouvert avec formulaire de motif (types prédéfinis + détail).
 *
 * @state slideover-unblacklist
 *   Slideover de confirmation pour réactiver les relances.
 *
 * @state processing
 *   Spinner sur les boutons, sauvegarde en cours.
 *
 * @state success
 *   Slideover fermé, badge mis à jour, notification toast.
 *
 * @state error
 *   Message d'erreur affiché dans le slideover.
 */

async function toggleBlacklistImpaye({ impayeId, action, motifType, motifDetail }) {
  // Implementation
}
```

---

## Étapes détaillées

### 1. Ouvrir le slideover

**Blacklist** (action: 'blacklist'):
```
┌─────────────────────────────────────────┐
│  Suspendre les relances              [X]│
├─────────────────────────────────────────┤
│                                         │
│  Type de motif *                        │
│  ┌─────────────────────────────────┐  │
│  │ [Sélectionner...              ▼]│  │
│  │  • Litige commercial            │  │
│  │  • Arrangement de paiement      │  │
│  │  • Facture contestée            │  │
│  │  • Procédure judiciaire         │  │
│  │  • Facture en annulation        │  │
│  │  • Autre                        │  │
│  └─────────────────────────────────┘  │
│                                         │
│  Détail (optionnel)                     │
│  ┌─────────────────────────────────┐  │
│  │                                 │  │
│  └─────────────────────────────────┘  │
│                                         │
│  ⚠️ Cet impayé sera exclu des relances  │
│     automatiques et manuelles.          │
│                                         │
│  [Annuler]          [Confirmer]         │
│                                         │
└─────────────────────────────────────────┘
```

**Unblacklist** (action: 'unblacklist'):
```
┌─────────────────────────────────────────┐
│  Réactiver les relances              [X]│
├─────────────────────────────────────────┤
│                                         │
│  ⚠️ Les relances seront régénérées pour  │
│     ce contact si les critères sont      │
│     remplis (impayé non soldé, séquence  │
│     active).                             │
│                                         │
│  [Annuler]          [Confirmer]         │
│                                         │
└─────────────────────────────────────────┘
```

### 2. Valider le formulaire

```javascript
// Validation
const errors = {}
if (action === 'blacklist') {
  if (!motifType) errors.motifType = 'Type de motif obligatoire'
}

if (Object.keys(errors).length > 0) {
  // Afficher erreurs
  return { valid: false, errors }
}
```

**CHECKPOINT**: `toggle-blacklist-validate`

### 3. Sauvegarder l'impayé

```javascript
const Impaye = Parse.Object.extend('Impaye')
const impaye = await new Parse.Query(Impaye).get(impayeId)

if (action === 'blacklist') {
  impaye.set('isBlacklisted', true)
  impaye.set('blacklistedAt', new Date())
  impaye.set('blacklistMotifType', motifType)
  impaye.set('blacklistMotif', motifDetail)
} else {
  impaye.set('isBlacklisted', false)
  impaye.set('unblacklistedAt', new Date())
  impaye.unset('blacklistMotifType')
  impaye.unset('blacklistMotif')
}

await impaye.save()
```

**CHECKPOINT**: `toggle-blacklist-success`

### 4. Régénérer les relances du contact

```javascript
const contactId = impaye.get('contact_relance')?.id || impaye.get('payeur')?.id

if (contactId) {
  // Appel Cloud Function pour régénérer les relances
  const result = await Parse.Cloud.run('regenerateRelancesForContact', {
    contactId,
    excludeImpayeId: action === 'blacklist' ? impayeId : null
  })
} else {
  // Pas de contact lié, pas de régénération nécessaire
}
```

**CHECKPOINT**: `toggle-blacklist-regenerate-start` ou `toggle-blacklist-regenerate-skip`

### 5. Mettre à jour l'UI

- Fermer le slideover
- Mettre à jour le badge sur l'impayé
- Afficher toast de confirmation
- Recharger les relances du contact si visible

---

## Scénarios de test

### Scénario 1 : Blacklist avec succès
**Given** : Un impayé non blacklisté avec un contact lié
**When** : L'utilisateur clique sur "Suspendre les relances", choisit "Litige", confirme
**Then** :
1. `[CHECKPOINT] toggle-blacklist:start` est émis
2. `[CHECKPOINT] toggle-blacklist:validate` avec `{valid: true}`
3. L'impayé est sauvegardé avec `isBlacklisted: true`
4. `[CHECKPOINT] toggle-blacklist:success` est émis
5. `[CHECKPOINT] toggle-blacklist:regenerate-start` est émis avec le contactId
6. Les relances brouillons du contact sont supprimées
7. `[CHECKPOINT] toggle-blacklist:regenerate-success` est émis
8. Le badge "🚫 Relances suspendues" apparaît
9. Toast "Relances suspendues" affiché

### Scénario 2 : Unblacklist avec régénération
**Given** : Un impayé blacklisté avec motif "Litige", contact lié avec impayés non soldés
**When** : L'utilisateur clique sur "Réactiver les relances", confirme
**Then** :
1. L'impayé est sauvegardé avec `isBlacklisted: false`
2. Les champs blacklist sont supprimés
3. `[CHECKPOINT] toggle-blacklist:regenerate-start` est émis
4. Les anciennes relances brouillons sont supprimées
5. De nouvelles relances sont générées incluant cet impayé
6. Toast "Relances réactivées" affiché

### Scénario 3 : Blacklist sans contact lié
**Given** : Un impayé sans contact_relance ni payeur
**When** : L'utilisateur blackliste l'impayé
**Then** :
1. L'impayé est sauvegardé avec `isBlacklisted: true`
2. `[CHECKPOINT] toggle-blacklist:regenerate-skip` est émis avec `{reason: 'no_contact'}`
3. Pas d'appel à regenerateRelancesForContact
4. Toast affiché sans mention de régénération

### Scénario 4 : Validation échouée
**Given** : Formulaire blacklist sans motif type sélectionné
**When** : L'utilisateur clique sur "Confirmer"
**Then** :
1. `[CHECKPOINT] toggle-blacklist:validate` avec `{valid: false, errors: {motifType: '...'}}`
2. Message d'erreur affiché sous le champ
3. Le slideover reste ouvert

---

## Dépendances

- **Parse SDK** : Pour la sauvegarde de l'impayé
- **Cloud Function** : `regenerateRelancesForContact`
- **Store** : `impayeStore` pour rafraîchir les données locales
- **Store** : `relancesStore` pour rafraîchir les relances du contact

## Structure des données

```typescript
interface ToggleBlacklistInput {
  impayeId: string;
  action: 'blacklist' | 'unblacklist';
  motifType?: 'litige' | 'arrangement' | 'contestation' | 'procedure' | 'annulation' | 'autre';
  motifDetail?: string;
}

interface ToggleBlacklistOutput {
  success: boolean;
  impaye: Parse.Object;
  regenerated: boolean;
  deletedRelances?: number;
  createdRelances?: number;
}
```

## UI States

| État | Description | Couleur badge |
|------|-------------|---------------|
| non_blacklisté | Relances actives | Vert |
| blacklisté | Relances suspendues | Rouge |

## Boutons contextuels

**État non blacklisté** :
- Label : "🚫 Suspendre les relances"
- Action : ouvre slideover blacklist

**État blacklisté** :
- Label : "▶️ Réactiver les relances"
- Affiche : "🚫 Relances suspendues - [Motif]"
- Action : ouvre slideover unblacklist
