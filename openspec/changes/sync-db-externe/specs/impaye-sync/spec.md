## ADDED Requirements

### Requirement: Synchronisation horaire des impayés
Le système SHALL synchroniser les factures impayées depuis la base PostgreSQL externe toutes les heures via un Parse Cloud Job nommé `syncImpayes`.

#### Scenario: Nouvel impayé détecté
- **WHEN** une facture existe en DB externe mais pas dans Parse (`externe_id` absent)
- **THEN** le système crée un objet `Impaye` avec `source: db_externe`, `statut: impayé` et `externe_id` égal à l'identifiant externe

#### Scenario: Impayé existant mis à jour
- **WHEN** une facture existe déjà dans Parse avec le même `externe_id`
- **THEN** le système met à jour les champs montants, dates, adresse, employé — mais NE modifie PAS le `statut` si celui-ci a été changé manuellement dans Marki16 (`statut !== 'impayé'`)

#### Scenario: Lien vers le contact payeur
- **WHEN** un impayé est créé ou mis à jour
- **THEN** le champ `payeur` est rempli avec un pointeur vers le `Contact` correspondant (trouvé via `externe_id` du contact)

#### Scenario: DB externe indisponible
- **WHEN** la connexion PostgreSQL échoue
- **THEN** le job loggue l'erreur et se termine sans exception non gérée ; les données existantes ne sont pas modifiées

### Requirement: Upsert idempotent sur externe_id
Le système SHALL garantir qu'une re-synchronisation du même impayé ne crée pas de doublon.

#### Scenario: Re-synchronisation d'un impayé déjà présent
- **WHEN** le job tourne deux fois de suite sur les mêmes données
- **THEN** aucun doublon n'est créé dans la collection `Impaye`
