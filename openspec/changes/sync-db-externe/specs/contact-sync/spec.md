## ADDED Requirements

### Requirement: Synchronisation horaire des contacts
Le système SHALL synchroniser les contacts depuis la base PostgreSQL externe toutes les heures via un Parse Cloud Job nommé `syncContacts`.

#### Scenario: Nouveau contact détecté
- **WHEN** un contact existe en DB externe mais pas dans Parse (`externe_id` absent)
- **THEN** le système crée un objet `Contact` avec `source: db_externe` et `externe_id` égal à l'identifiant de la DB externe

#### Scenario: Contact existant mis à jour
- **WHEN** un contact existe déjà dans Parse avec le même `externe_id`
- **THEN** le système met à jour les champs nom, téléphone, type, société — mais NE met à jour email et téléphone que si ces champs sont vides dans Parse

#### Scenario: DB externe indisponible
- **WHEN** la connexion PostgreSQL échoue (timeout ou erreur réseau)
- **THEN** le job loggue l'erreur avec `console.error` et se termine sans exception non gérée

### Requirement: Contacts db_externe non modifiables
Les contacts avec `source: db_externe` SHALL être considérés comme en lecture seule dans Marki16 ; toute modification doit passer par la DB Analyse immo puis une resynchronisation.

#### Scenario: Tentative de modification d'un contact db_externe
- **WHEN** une Cloud Function tente de modifier un contact `source: db_externe`
- **THEN** la modification est bloquée avec une erreur explicite, sauf pour les champs internes à Marki16 (ex. séquence associée)
