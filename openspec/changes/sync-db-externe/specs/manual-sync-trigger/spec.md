## ADDED Requirements

### Requirement: Déclenchement manuel de la synchronisation
Le système SHALL exposer une Cloud Function `syncNow` permettant de déclencher immédiatement une synchronisation contacts + impayés depuis le frontend.

#### Scenario: Sync déclenchée avec succès
- **WHEN** un utilisateur authentifié appelle la Cloud Function `syncNow`
- **THEN** les jobs `syncContacts` et `syncImpayes` s'exécutent séquentiellement et retournent un objet résumé `{ contactsSynced, impayes Synced, errors }`

#### Scenario: Sync déjà en cours
- **WHEN** `syncNow` est appelée alors qu'une sync est déjà en cours
- **THEN** la fonction retourne immédiatement `{ alreadyRunning: true }` sans lancer une deuxième exécution

#### Scenario: Utilisateur non authentifié
- **WHEN** un appel à `syncNow` est fait sans session Parse valide
- **THEN** la Cloud Function retourne une erreur d'autorisation

### Requirement: Bouton de synchronisation dans l'interface contacts
Le frontend SHALL afficher un bouton "Synchroniser tous" sur la page `/contacts` qui appelle `syncNow` et affiche le résultat.

#### Scenario: Feedback visuel pendant la sync
- **WHEN** l'utilisateur clique sur "Synchroniser tous"
- **THEN** le bouton passe en état chargement jusqu'à la fin de la Cloud Function, puis une notification de succès ou d'erreur est affichée
