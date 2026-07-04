# TODO Implémentation F-008 : Blacklist des Impayés

**Date** : 2026-06-30  
**Feature** : F-008 Blacklist des Impayés  
**Dépend de** : F-007 (Relances email), F-010 (Génération relances)

---

## Backend (/backend)

### 1. Validation dans le Store Frontend

**Où** : `/frontend/app/stores/blacklistImpayeStore.js`

**Quoi** : Validation du motif avant sauvegarde côté frontend uniquement :

```javascript
async blacklistImpaye(impayeId, motifType, motifDetail) {
  // Validation FRONTEND obligatoire
  if (!motifType && !motifDetail) {
    throw new Error('Motif de blacklist obligatoire')
  }
  
  const { $parse } = useNuxtApp()
  const Impaye = $parse.Object.extend('Impaye')
  const impaye = await new Parse.Query(Impaye).get(impayeId)
  
  // Auto-set champs
  impaye.set('isBlacklisted', true)
  impaye.set('blacklistedAt', new Date())
  impaye.set('blacklistMotifType', motifType)
  impaye.set('blacklistMotif', motifDetail)
  
  // Sauvegarde directe - pas de hook backend
  await impaye.save()
  
  // Suite : régénération des relances
}
```

**Pourquoi** : Validation frontend pour UX immédiate (feedback instantané). Pas de validation backend requise.

**⚠️ NE PAS FAIRE** : 
- Ne PAS créer de hook `beforeSave` backend
- Ne PAS créer de Cloud Function de validation
- La logique métier reste dans le store frontend uniquement

---

### 2. Workflow Backend `regenerate-relances-contact`

**Où** : `/backend/cloud/workflows/regenerate-relances-contact/index.js` (format mega function, pas une simple Cloud Function)

**Format** : Mega function comme `generate-relances/index.js` avec checkpoints détaillés :

**Quoi** :
```javascript
/**
 * @workflow regenerate-relances-contact
 * @description Régénère les relances d'un contact après blacklist/unblacklist
 *
 * @checkpoint regenerate-start
 * @checkpoint regenerate-brouillons-loaded
 * @checkpoint regenerate-brouillons-deleted  
 * @checkpoint regenerate-generation-start
 * @checkpoint regenerate-generation-end
 * @checkpoint regenerate-completed
 * @checkpoint regenerate-error
 */

async function regenerateRelancesContact(contactId, excludeImpayeId) {
  // 1. CHECKPOINT: regenerate-start
  
  // 2. Récupérer relances brouillons du contact
  const Relance = Parse.Object.extend('Relance')
  const query = new Parse.Query(Relance)
  query.equalTo('contact', { __type: 'Pointer', className: 'Contact', objectId: contactId })
  // ⚠️ VÉRIFIER l'orthographe exact du statut dans la base (envoyee/envoyée/sent)
  query.notEqualTo('statut', 'envoyee') 
  query.doesNotExist('dateEnvoi')
  
  const brouillons = await query.find({ useMasterKey: true })
  // CHECKPOINT: regenerate-brouillons-loaded
  
  // 3. Supprimer les brouillons
  if (brouillons.length > 0) {
    await Parse.Object.destroyAll(brouillons, { useMasterKey: true })
  }
  // CHECKPOINT: regenerate-brouillons-deleted
  
  // 4. Appeler la logique generate-relances pour ce contact uniquement
  // (inclure/exclure l'impaye selon excludeImpayeId)
  // CHECKPOINT: regenerate-generation-start
  
  // ... logique de génération ...
  
  // CHECKPOINT: regenerate-generation-end
  // CHECKPOINT: regenerate-completed
}

Parse.Cloud.define("regenerateRelancesContact", async (request) => {
  const { contactId, excludeImpayeId } = request.params
  return await regenerateRelancesContact(contactId, excludeImpayeId)
})
```

**Pourquoi** : La régénération doit être atomique côté serveur pour éviter les race conditions si l'utilisateur clique rapidement.

**⚠️ NE PAS FAIRE** :
- Ne PAS appeler `destroyAll` sans `useMasterKey` (les relances peuvent avoir des ACL restrictives)
- Ne PAS oublier de filtrer sur `doesNotExist('dateEnvoi')` pour ne pas toucher aux relances envoyées
- Ne PAS recréer les relances si aucun impayé éligible (retourner createdCount: 0)
- Ne PAS oublier de vérifier l'orthographe exact du statut ('envoyee' vs 'envoyée' vs autre)

---

### 3. Mise à jour du workflow `generate-relances`

**Où** : `/backend/cloud/workflows/generate-relances/index.js`

**Quoi** : Ajouter le filtre 1.6 après le filtre des contacts blacklistés :

```javascript
// Après Filtre 1.5 (exclusion contacts blacklistés)
// Filtre 1.6 : Exclusion des impayés blacklistés
const impayesSansBlacklistes = impayesSansContactsBlacklistes.filter((impaye) => {
    return impaye.get("isBlacklisted") !== true;
});

logger.info(
    `Filtre 1.6 (exclusion impayés blacklistés): ${impayesSansBlacklistes.length}/${impayesSansContactsBlacklistes.length}`,
);
```

**Pourquoi** : Les impayés blacklistés ne doivent jamais apparaître dans les relances automatiques.

**⚠️ NE PAS FAIRE** : Ne PAS mettre ce filtre AVANT le filtre des contacts blacklistés - l'ordre compte pour les logs et la lisibilité.

---

### 4. Mise à jour du workflow `generate-suivi`

**Où** : `/backend/cloud/workflows/generate-suivi/index.js`

**Quoi** : Dans la boucle de regroupement par contact, ajouter :

```javascript
for (const impaye of impayes) {
    // Skip si l'impayé est blacklisté
    if (impaye.get("isBlacklisted") === true) continue;
    
    // ... suite du traitement
}
```

**Pourquoi** : Les suivis doivent aussi respecter la blacklist des impayés.

---

## Frontend (/frontend)

### 5. Store `blacklistImpayeStore`

**Où** : `/frontend/app/stores/blacklistImpayeStore.js` (créer)

**Quoi** : Store Pinia avec :
- `fetchBlacklistedImpayes()` - Charger depuis Parse
- `blacklistImpaye(impayeId, motifType, motifDetail)` - Blacklister + régénérer
- `unblacklistImpaye(impayeId)` - Déblacklister + régénérer
- `isBlacklisted(impayeId)` - Getter pour vérifier statut

**Pourquoi** : Centraliser la logique métier et la gestion du cache.

**⚠️ NE PAS FAIRE** :
- Ne PAS oublier d'appeler `regenerateRelancesForContact` après chaque changement de statut
- Ne PAS mettre la logique de régénération dans les composants Vue
- Ne PAS oublier d'invalider le cache (`lastFetched = null`) après modification
- Ne PAS faire deux appels réseau séparés (save impaye + régénération) sans gestion d'erreur - si la régénération échoue, l'impayé est déjà blacklisté, il faut gérer ce cas

---

### 6. Composant `SlideoverBlacklistImpaye`

**Où** : `/frontend/app/components/impaye/SlideoverBlacklistImpaye.vue` (créer)

**Quoi** :
- Props : `impaye`, `isOpen`
- Emit : `close`, `success`
- Formulaire avec select pour `motifType` (6 options) + textarea pour détail
- Validation : motifType obligatoire
- Appel au store `blacklistImpayeStore.blacklistImpaye()`

**Pourquoi** : Slideover (panneau latéral) comme demandé, pas de modal.

**⚠️ NE PAS FAIRE** :
- Ne PAS utiliser un modal (`<dialog>` ou lib modal) - DOIT être un slideover
- Ne PAS fermer le slideover avant confirmation de succès
- Ne PAS oublier le spinner/état "saving" sur le bouton Confirmer

---

### 7. Composant `BadgeBlacklist`

**Où** : `/frontend/app/components/impaye/BadgeBlacklist.vue` (créer)

**Quoi** :
- Props : `impaye`
- Affiche : "Relances actives" (vert) ou "🚫 Relances suspendues" (rouge) avec motif
- Tooltip au survol avec date et utilisateur

**Pourquoi** : Composant réutilisable sur fiche facture et liste.

**⚠️ NE PAS FAIRE** : Ne PAS faire de requête Parse dans ce composant - il doit utiliser le store ou recevoir l'impaye en prop.

---

### 8. Mise à jour de la fiche facture

**Où** : `/frontend/app/pages/fiche-facture/[id].vue` ou équivalent

**Quoi** :
- Importer et afficher `BadgeBlacklist`
- Bouton conditionnel : "Suspendre" si non blacklisté / "Réactiver" si blacklisté
- Au clic : ouvrir `SlideoverBlacklistImpaye` ou confirmation directe pour déblacklist

**Pourquoi** : Point d'entrée utilisateur pour la feature.

**⚠️ NE PAS FAIRE** :
- Ne PAS afficher le bouton "Relancer" si l'impayé est blacklisté (ou griser avec tooltip)
- Ne PAS oublier de rafraîchir les données après fermeture du slideover

---

### 9. Mise à jour de la liste des relances (si applicable)

**Où** : `/frontend/app/components/relances/RelanceList.vue` ou équivalent

**Quoi** : Si une relance est affichée alors que son impayé vient d'être blacklisté, la retirer de la liste ou marquer comme obsolète.

**Pourquoi** : Cohérence UI temps réel.

**⚠️ NE PAS FAIRE** : Ne PAS supprimer automatiquement - préférer un re-fetch du store relances après une action de blacklist.

---

### 10. Dashboard - Vue liste des blacklistés

**Où** : `/frontend/app/pages/dashboard.vue` (ajouter section) ou nouvelle route

**Quoi** :
- Nouvelle section ou onglet "Impayés suspendus"
- Tableau avec colonnes : Facture, Client, Montant, Motif, Depuis, Actions
- Filtres par motif type
- Bouton "Réactiver" par ligne

**Pourquoi** : US-008-2 (voir liste des blacklistés).

**⚠️ NE PAS FAIRE** :
- Ne PAS charger tous les impayés et filtrer côté client - utiliser `query.equalTo('isBlacklisted', true)`
- Ne PAS afficher les impayés soldés blacklistés (vérifier `facture_soldee`)

---

## Ordre d'implémentation recommandé

1. **Backend** : Hook `beforeSave` (sécurité d'abord)
2. **Backend** : Mise à jour `generate-relances` (filtre 1.6)
3. **Backend** : Cloud Function `regenerateRelancesForContact`
4. **Frontend** : Store `blacklistImpayeStore`
5. **Frontend** : Composant `BadgeBlacklist`
6. **Frontend** : Composant `SlideoverBlacklistImpaye`
7. **Frontend** : Intégration fiche facture
8. **Frontend** : Vue dashboard liste blacklistés

---

## Tests à prévoir

### Scénarios critiques

| Scénario | Attendu |
|----------|---------|
| Blacklist impayé avec relance existante | Relance brouillon supprimée, nouvelle générée sans cet impayé |
| Unblacklist impayé | Relance régénérée avec cet impayé inclus |
| Blacklist sans motif | Erreur validation, pas de sauvegarde |
| Relance manuelle sur impayé blacklisté | Blocage avec message explicatif |
| Generate-relances avec impayé blacklisté | Impayé exclu du groupement |
| Double-clic rapide sur "Suspendre" | Une seule action effectuée (debounce) |

---

## Risques et mitigations

| Risque | Mitigation |
|--------|------------|
| Race condition si blacklist + generate-relances simultanés | `regenerateRelancesForContact` est atomique côté serveur |
| Perdre l'historique des relances envoyées | Ne jamais toucher aux relances avec `dateEnvoi` |
| UX cassée si régénération lente | Spinner + message "Régénération des relances en cours..." |
| Incoherence si rollback échoue | Transaction Parse ou gestion d'erreur avec état de compensation |

---

## Checklist avant merge

- [ ] Hook `beforeSave` testé avec motif manquant
- [ ] Filtre 1.6 présent dans `generate-relances`
- [ ] Cloud Function `regenerateRelancesForContact` protégée (auth)
- [ ] Store invalide bien le cache après modification
- [ ] Slideover utilisé (pas modal)
- [ ] Badge visible et cliquable (tooltip)
- [ ] Liste dashboard paginée et filtrée côté serveur
- [ ] Logs `[CHECKPOINT]` présents pour chaque action
