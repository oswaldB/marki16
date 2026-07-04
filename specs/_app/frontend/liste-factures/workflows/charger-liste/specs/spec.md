# Workflow: charger-liste

**Écran** : liste-factures  
**Type** : Frontend lié  
**Feature** : F-003 Liste des factures  

## Description

Charge la liste paginée des factures depuis l'API backend et gère les états d'affichage (loading, empty, error, nominal).

## Entrées

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `page` | number | non | Numéro de page (défaut: 1) |
| `limit` | number | non | Éléments par page (défaut: 50) |

## Sorties

| Donnée | Type | Description |
|--------|------|-------------|
| `factures` | Array<Facture> | Liste des factures chargées |
| `total` | number | Nombre total de factures |
| `pages` | number | Nombre total de pages |

## États UI gérés

- `loading` : Skeleton loader pendant le fetch
- `empty` : Message "Aucune facture trouvée"
- `error` : Message d'erreur avec bouton retry
- `nominal` : Tableau affiché avec données

---

## Spécification JSDoc

```javascript
/**
 * @workflow charger-liste
 * @screen liste-factures
 * @description Charge la liste paginée des factures depuis l'API
 *
 * @param {Object} params
 * @param {number} [params.page=1] - Numéro de page demandée
 * @param {number} [params.limit=50] - Nombre d'éléments par page
 *
 * @returns {Promise<{factures: Facture[], total: number, pages: number}>}
 *
 * @checkpoint charger-liste-start
 *   Émis au début du chargement. UI passe en état "loading".
 *   Log: [CHECKPOINT] charger-liste:start {page, limit}
 *
 * @checkpoint charger-liste-api-called
 *   Appel API effectué. Attente de la réponse.
 *   Log: [CHECKPOINT] charger-liste:api-called {endpoint, params}
 *
 * @checkpoint charger-liste-success
 *   Données reçues avec succès. UI passe en état "nominal" ou "empty".
 *   Log: [CHECKPOINT] charger-liste:success {count, total, durationMs}
 *
 * @checkpoint charger-liste-empty
 *   Aucune donnée retournée. UI passe en état "empty".
 *   Log: [CHECKPOINT] charger-liste:empty {page}
 *
 * @checkpoint charger-liste-error
 *   Erreur lors du chargement. UI passe en état "error".
 *   Log: [ERROR] charger-liste:error {message, statusCode}
 *
 * @checkpoint charger-liste-retry
 *   L'utilisateur clique sur "Réessayer". Relance le workflow.
 *   Log: [CHECKPOINT] charger-liste:retry {attempt}
 *
 * @state loading
 *   Affiche skeleton rows dans le tableau. Désactive les contrôles.
 *
 * @state nominal
 *   Affiche les données dans le tableau avec pagination.
 *
 * @state empty
 *   Affiche message "Aucune facture trouvée" avec CTA importer.
 *
 * @state error
 *   Affiche message d'erreur avec bouton "Réessayer".
 */

async function chargerListe({ page = 1, limit = 50 } = {}) {
  // Implementation
}
```

---

## Scénarios de test

### Scénario 1 : Chargement nominal
**Given** : L'utilisateur ouvre la page liste-factures  
**When** : Le workflow démarre avec les paramètres par défaut  
**Then** :
1. `[CHECKPOINT] charger-liste:start` est émis
2. L'UI affiche le skeleton loader
3. `[CHECKPOINT] charger-liste:api-called` est émis
4. L'API retourne 124 factures
5. `[CHECKPOINT] charger-liste:success` est émis avec `{count: 50, total: 124}`
6. L'UI affiche le tableau avec les 50 premières factures
7. La pagination montre "1-50 sur 124"

### Scénario 2 : Liste vide
**Given** : Aucune facture n'est importée dans l'application  
**When** : L'utilisateur ouvre la page liste-factures  
**Then** :
1. `[CHECKPOINT] charger-liste:start` est émis
2. L'API retourne un tableau vide
3. `[CHECKPOINT] charger-liste:empty` est émis
4. L'UI affiche l'état "empty" avec message et CTA

### Scénario 3 : Erreur API
**Given** : L'API est indisponible (erreur 500)  
**When** : L'utilisateur ouvre la page liste-factures  
**Then** :
1. `[CHECKPOINT] charger-liste:start` est émis
2. L'appel API échoue
3. `[ERROR] charger-liste:error` est émis avec `{message: "...", statusCode: 500}`
4. L'UI affiche l'état "error" avec message et bouton "Réessayer"
4. L'utilisateur clique sur "Réessayer"
5. `[CHECKPOINT] charger-liste:retry` est émis avec `{attempt: 2}`
6. Le workflow redémarre depuis l'étape 1

---

## Dépendances

- **API Endpoint** : `GET /api/factures?page={page}&limit={limit}`
- **Global** : `logger` (pour les checkpoints)
- **Global** : `notifications` (pour les erreurs)

## Structure de données

```typescript
interface Facture {
  id: string;
  numero: string;
  client_nom: string;
  date_emission: string;  // ISO date
  date_echeance: string;  // ISO date
  montant_ttc: number;
  statut: 'payee' | 'impayee' | 'partielle';
}
```
