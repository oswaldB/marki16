# Options Dynamiques - Documentation

## Overview

Ce système permet de gérer dynamiquement les options des selects dans l'application, en les synchronisant automatiquement avec les valeurs réelles présentes dans la base de données Parse.

## Architecture

### 1. Backend (Parse Cloud Code)

**Fichiers principaux :**
- `backend/cloud/jobs/updateDynamicOptions.js` - Job principal de mise à jour
- `backend/cloud/logger.js` - Logger utilitaire
- `backend/cloud/main.js` - Intégration du job

**Fonctionnement :**
1. Un job Cloud Code (`updateDynamicOptions`) tourne toutes les heures à HH:03
2. Il analyse les tables Parse pour extraire les valeurs distinctes des champs
3. Il sauvegarde ces valeurs dans une table `OptionsDynamiques`

**Types d'options gérés :**
- `statut_impaye` - Statuts des impayés (impaye, en cours, payé, etc.)
- `statut_relance` - Statuts des relances (pending, envoyé, échec, annulé)
- `statut_dossier` - Statuts des dossiers
- `payeur_type` - Types de payeurs

### 2. Frontend (Nuxt 3)

**Fichiers principaux :**
- `frontend/app/composables/useDynamicOptions.js` - Composable pour récupérer les options
- Composants mis à jour :
  - `frontend/app/pages/impayes/[id].vue` - Select de statut d'impayé
  - `frontend/app/pages/relances.vue` - Select de statut de relance

**Fonctionnement :**
1. Le composable `useDynamicOptions` fournit une interface unifiée
2. Les options sont récupérées depuis la table `OptionsDynamiques`
3. Un cache local (localStorage) évite les requêtes répétées
4. Des valeurs par défaut sont disponibles en cas d'échec

## Structure de la table OptionsDynamiques

```javascript
{
  objectId: String,      // ID Parse
  type: String,          // Type d'option (ex: 'statut_impaye')
  valeurs: Array,         // Liste des valeurs distinctes
  createdAt: Date,        // Date de création
  updatedAt: Date         // Date de dernière mise à jour
}
```

## Utilisation

### Dans un composant Vue

```javascript
import { useDynamicOptions } from '~/composables/useDynamicOptions'

const { getOptions } = useDynamicOptions()

// Récupérer les options
const statutOptions = ref([])
onMounted(async () => {
  statutOptions.value = await getOptions('statut_impaye')
})
```

### Dans un template

```vue
<USelect
  v-model="statut"
  :items="statutOptions"
  placeholder="Sélectionner un statut..."
/>
```

## Planification

Le job est configuré pour s'exécuter toutes les heures à la 3ème minute (HH:03) via la configuration Parse :

```javascript
Parse.Cloud.startJob("updateDynamicOptions", { schedule: "0 3 * * * *" });
```

## Cache

Les options sont mises en cache côté client dans le localStorage avec une clé du format :
```
dynamicOptions_{type}
```

**Méthodes de cache disponibles :**
- `invalidateCache(type)` - Invalide le cache pour un type spécifique
- `invalidateAllCache()` - Invalide tout le cache des options

## Valeurs par défaut

En cas d'échec de récupération, des valeurs par défaut sont fournies pour les types connus.

## Extensibilité

Pour ajouter un nouveau type d'options dynamiques :

1. **Backend** : Ajouter un appel à `updateStatutOptions` dans le job
2. **Frontend** : Ajouter une entrée dans `getDefaultOptions` du composable
3. **Utilisation** : Utiliser le nouveau type avec `getOptions('nouveau_type')`

## Déploiement

1. Déployer le code Cloud Code sur Parse Server
2. Créer la table `OptionsDynamiques` dans la console Parse
3. Exécuter manuellement le job une première fois pour l'initialiser
4. Configurer la planification horaire

## Monitoring

Les logs du job sont disponibles dans la console Parse sous "Jobs" > "updateDynamicOptions".

## Performance

- Le job s'exécute en quelques secondes pour des bases de données de taille moyenne
- Le cache client réduit les requêtes réseau à zéro après le premier chargement
- Les requêtes utilisent `distinct()` pour minimiser la charge sur la base de données

## Sécurité

- Toutes les opérations utilisent `useMasterKey: true` pour garantir l'accès
- Les données sont validées avant sauvegarde
- Le cache client est isolé par type pour éviter les conflits

## Exemple de données

Pour `statut_impaye`, la table pourrait contenir :
```json
{
  "type": "statut_impaye",
  "valeurs": ["impaye", "en cours", "payé", "annulé"],
  "createdAt": "2024-01-15T14:03:27.345Z",
  "updatedAt": "2024-01-15T14:03:27.345Z"
}
```

## Résolution de problèmes

**Problème : Les options ne se mettent pas à jour**
- Vérifier que le job s'exécute correctement dans la console Parse
- Vérifier les logs pour les erreurs
- Invalider manuellement le cache avec `invalidateCache('statut_impaye')`

**Problème : Valeurs manquantes**
- Vérifier que les données existent dans la table source
- Exécuter manuellement le job pour forcer la mise à jour
- Vérifier que le champ est correctement spécifié dans le job

## Roadmap

- [x] Implémentation initiale
- [x] Intégration dans les composants existants
- [x] Système de cache
- [x] Valeurs par défaut
- [ ] Interface d'administration pour gérer manuellement les options
- [ ] Webhooks pour mise à jour en temps réel
- [ ] Validation des données plus avancée
