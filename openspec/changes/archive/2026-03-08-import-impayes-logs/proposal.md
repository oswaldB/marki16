## Why

Le script `syncImpayes` tourne toutes les heures et peut importer des centaines d'impayés et contacts depuis la base PostgreSQL externe. Actuellement, les résultats et erreurs de chaque exécution ne sont pas persistés — si la sync échoue silencieusement ou produit des données incorrectes, il est impossible de diagnostiquer le problème après coup. Une page de logs permet à l'administrateur de surveiller la santé des imports et d'identifier rapidement les anomalies.

## What Changes

- Chaque exécution de `syncImpayes` (cron horaire + déclenchement manuel via `syncNow`) enregistre un document `SyncLog` dans Parse : date, durée, résultat (`success` / `partial` / `error`), nombre d'impayés et contacts créés/mis à jour, liste des erreurs
- Nouvelle page frontend `/import-logs` qui affiche la liste des exécutions sous forme de tableau (date, statut, stats, erreurs)
- Filtre par statut et bouton "Synchroniser maintenant" réutilisé depuis `/contacts`
- Détail d'un log au clic (erreurs complètes)

## Capabilities

### New Capabilities

- `sync-logging` : Persistance de chaque exécution de `syncImpayes` dans la classe Parse `SyncLog` (date, durée, statut, compteurs, erreurs)
- `import-logs-page` : Page `/import-logs` listant l'historique des syncs avec filtrage par statut et affichage du détail des erreurs

### Modified Capabilities

- `impaye-sync` : La fonction `syncImpayes` est modifiée pour enregistrer un `SyncLog` à chaque exécution (succès ou échec)
- `manual-sync-trigger` : La Cloud Function `syncNow` retourne désormais l'`objectId` du `SyncLog` créé

## Impact

- **Backend** : `cloud/jobs/syncImpayes.js` — ajout de l'écriture du `SyncLog` en fin de job ; `cloud/main.js` — aucun changement structurel
- **Données** : création de la classe Parse `SyncLog` (schéma léger, pas de clés étrangères)
- **Frontend** : nouvelle page `frontend/pages/import-logs.vue` ; ajout de la route dans la sidebar
- **Dépendances** : aucune nouvelle dépendance
