# Store: blacklistImpayeStore

**Feature** : F-008 Blacklist des Impayés  
**Type** : Frontend Store (Pinia)
**Fichier** : `stores/blacklistImpayeStore.js`

## Description

Store dédié à la gestion de la blacklist des impayés. Gère le chargement, le filtrage et les actions de blacklist/unblacklist avec régénération automatique des relances.

## State

```javascript
{
  blacklistedImpayes: [],    // Liste des impayés blacklistés (Parse Objects)
  loading: false,             // État de chargement
  error: null,                // Erreur courante
  lastFetched: null,          // Timestamp du dernier fetch
  cacheDuration: 300000       // 5 minutes en ms
}
```

## Getters

### count
```javascript
(state) => state.blacklistedImpayes.length
```
Nombre d'impayés blacklistés.

### isBlacklisted
```javascript
(state) => (impayeId) => {
  return state.blacklistedImpayes.some(i => i.id === impayeId)
}
```
Vérifie si un impayé est blacklisté.

### getByContact
```javascript
(state) => (contactId) => {
  return state.blacklistedImpayes.filter(i => {
    const payeur = i.get('payeur')
    const contactRelance = i.get('contact_relance')
    return (payeur && payeur.id === contactId) || 
           (contactRelance && contactRelance.id === contactId)
  })
}
```
Retourne les impayés blacklistés d'un contact.

### totalMontant
```javascript
(state) => {
  return state.blacklistedImpayes.reduce((sum, i) => {
    return sum + (i.get('reste_a_payer') || 0)
  }, 0)
}
```
Montant total des impayés blacklistés.

### statsByMotif
```javascript
(state) => {
  const stats = {}
  state.blacklistedImpayes.forEach(i => {
    const motif = i.get('blacklistMotifType') || 'autre'
    stats[motif] = (stats[motif] || 0) + 1
  })
  return stats
}
```
Statistiques par type de motif.

### hasValidCache
```javascript
(state) => {
  return state.lastFetched && Date.now() - state.lastFetched < state.cacheDuration
}
```
Vérifie si le cache est valide.

## Actions

### fetchBlacklistedImpayes
```javascript
/**
 * Charge tous les impayés blacklistés depuis Parse
 * @param {boolean} force - Force le rechargement même si cache valide
 * @returns {Promise<Parse.Object[]>}
 */
async fetchBlacklistedImpayes(force = false)
```

**CHECKPOINT**: `blacklist-store-fetch-start`  
**CHECKPOINT**: `blacklist-store-fetch-success`  
**CHECKPOINT**: `blacklist-store-fetch-error`

### blacklistImpaye
```javascript
/**
 * Met un impayé en blacklist et regénère les relances du contact
 * @param {string} impayeId - ID de l'impayé
 * @param {string} motifType - Type de motif
 * @param {string} motifDetail - Détail du motif
 * @returns {Promise<{impaye: Parse.Object, regenerated: boolean}>}
 */
async blacklistImpaye(impayeId, motifType, motifDetail)
```

**CHECKPOINT**: `blacklist-store-blacklist-start`  
**CHECKPOINT**: `blacklist-store-blacklist-saved`  
**CHECKPOINT**: `blacklist-store-regenerate-start`  
**CHECKPOINT**: `blacklist-store-regenerate-success`  
**CHECKPOINT**: `blacklist-store-blacklist-complete`

**Logique** :
1. Récupérer l'impayé
2. Sauvegarder avec `isBlacklisted: true`, `blacklistedAt`, `blacklistMotifType`, `blacklistMotif`
3. Si contact lié, appeler `regenerateRelancesForContact` avec `excludeImpayeId`
4. Invalider le cache
5. Émettre notification succès

### unblacklistImpaye
```javascript
/**
 * Retire un impayé de la blacklist et regénère les relances
 * @param {string} impayeId - ID de l'impayé
 * @returns {Promise<{impaye: Parse.Object, regenerated: boolean}>}
 */
async unblacklistImpaye(impayeId)
```

**CHECKPOINT**: `blacklist-store-unblacklist-start`  
**CHECKPOINT**: `blacklist-store-unblacklist-saved`  
**CHECKPOINT**: `blacklist-store-regenerate-start`  
**CHECKPOINT**: `blacklist-store-regenerate-success`  
**CHECKPOINT**: `blacklist-store-unblacklist-complete`

**Logique** :
1. Récupérer l'impayé
2. Sauvegarder avec `isBlacklisted: false`, `unblacklistedAt`, suppression des champs blacklist
3. Si contact lié, appeler `regenerateRelancesForContact` (sans exclusion)
4. Invalider le cache
5. Émettre notification succès

### toggleBlacklist
```javascript
/**
 * Toggle le statut blacklist d'un impayé
 * @param {string} impayeId - ID de l'impayé
 * @param {Object} options - Options si blacklist
 * @returns {Promise<Object>}
 */
async toggleBlacklist(impayeId, options = {})
```

### getFilteredBlacklisted
```javascript
/**
 * Filtre les impayés blacklistés selon critères
 * @param {string} searchQuery - Recherche texte
 * @param {string} motifFilter - Filtre par type de motif
 * @returns {Parse.Object[]}
 */
getFilteredBlacklisted(searchQuery = '', motifFilter = null)
```

### invalidateCache
```javascript
/**
 * Invalide le cache du store
 */
invalidateCache()
```

## Exemple d'utilisation

```vue
<!-- FicheFacture.vue -->
<template>
  <div>
    <div v-if="isBlacklisted" class="badge badge-error">
      🚫 Relances suspendues - {{ motifType }}
    </div>
    
    <button 
      v-if="!isBlacklisted"
      @click="openBlacklistSlideover"
      class="btn btn-warning"
    >
      🚫 Suspendre les relances
    </button>
    
    <button 
      v-else
      @click="unblacklist"
      class="btn btn-success"
    >
      ▶️ Réactiver les relances
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useBlacklistImpayeStore } from '~/stores/blacklistImpayeStore'

const props = defineProps({
  impaye: Object
})

const blacklistStore = useBlacklistImpayeStore()

const isBlacklisted = computed(() => 
  blacklistStore.isBlacklisted(props.impaye.id)
)

const motifType = computed(() => 
  props.impaye.get('blacklistMotifType')
)

async function openBlacklistSlideover() {
  // Ouvrir slideover avec formulaire
}

async function unblacklist() {
  await blacklistStore.unblacklistImpaye(props.impaye.id)
}
</script>
```

## Dépendances

- **Parse SDK** : Requêtes sur classe Impaye
- **Cloud Function** : `regenerateRelancesForContact`
- **Notifications** : Pour les toasts de succès/erreur
