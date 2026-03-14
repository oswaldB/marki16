## ADDED Requirements

### Requirement: Bouton d'attribution sur la page impayé
La page `/impayes/[id]` SHALL afficher un bouton "Attribuer un email de relances par défaut" dans la zone des actions ou de la séquence. Si un `relanceContact` est déjà défini, le bouton SHALL afficher le nom et l'email du contact actuel à côté.

#### Scenario: Bouton visible sans relanceContact
- **WHEN** l'utilisateur consulte la page détail d'un impayé sans `relanceContact`
- **THEN** le bouton "Attribuer un email de relances par défaut" est affiché sans label de contact courant

#### Scenario: Bouton visible avec relanceContact existant
- **WHEN** l'utilisateur consulte la page détail d'un impayé ayant un `relanceContact`
- **THEN** le bouton affiche le nom et l'email du `relanceContact` en indicateur visuel

### Requirement: Slideover d'attribution
Un clic sur le bouton SHALL ouvrir un slideover intitulé "Attribuer un email de relances par défaut" avec deux modes : sélection d'un contact existant et création d'un nouveau contact.

#### Scenario: Ouverture du slideover
- **WHEN** l'utilisateur clique sur le bouton "Attribuer un email de relances par défaut"
- **THEN** un slideover s'ouvre avec un champ de recherche de contact et un formulaire de création

#### Scenario: Recherche de contact existant
- **WHEN** l'utilisateur saisit au moins 2 caractères dans le champ de recherche
- **THEN** le système affiche une liste de contacts (max 20) correspondant au nom ou à l'email saisi

#### Scenario: Sélection d'un contact existant
- **WHEN** l'utilisateur clique sur un contact dans la liste des résultats
- **THEN** ce contact est mis en surbrillance comme contact sélectionné et le bouton de confirmation est activé

#### Scenario: Création d'un nouveau contact
- **WHEN** l'utilisateur remplit les champs nom et email dans la section "Nouveau contact" et clique sur "Créer et attribuer"
- **THEN** un nouveau contact (source `relance`) est créé et automatiquement attribué

#### Scenario: Validation du formulaire création
- **WHEN** l'utilisateur tente de créer un contact sans email valide
- **THEN** un message d'erreur est affiché et la soumission est bloquée

### Requirement: Cloud Function attribuerRelanceContact
Le backend SHALL exposer une Cloud Function `attribuerRelanceContact` qui accepte `impayelId` + (`contactId` OU `{ nom, email }`) et exécute l'attribution.

#### Scenario: Attribution avec contact existant
- **WHEN** `attribuerRelanceContact` est appelée avec `impayelId` et `contactId`
- **THEN** l'impayé est mis à jour avec `relanceContact` pointant vers ce contact et la fonction retourne le contact

#### Scenario: Attribution avec nouveau contact
- **WHEN** `attribuerRelanceContact` est appelée avec `impayelId` et `{ nom, email }`
- **THEN** un nouveau Contact (source `relance`) est créé, l'impayé est mis à jour avec ce contact, et la fonction retourne le contact créé

#### Scenario: Paramètres invalides
- **WHEN** `attribuerRelanceContact` est appelée sans `impayelId` ou sans `contactId` ni `nom`/`email`
- **THEN** une erreur explicite est levée

### Requirement: Mise à jour des relances pending
Après attribution du `relanceContact`, toutes les relances `pending` de l'impayé SHALL voir leur champ `to` recalculé avec le nouvel email.

#### Scenario: Relances pending mises à jour
- **WHEN** `attribuerRelanceContact` s'exécute avec succès
- **THEN** toutes les relances `statut: 'pending'` de l'impayé ont leur champ `to` recalculé en utilisant l'email du nouveau `relanceContact`

#### Scenario: Relances envoyées non modifiées
- **WHEN** `attribuerRelanceContact` s'exécute avec succès
- **THEN** les relances avec `statut: 'envoyé'` ou `statut: 'annulé'` ne sont pas modifiées

### Requirement: Priorité de relanceContact dans construireDestinataires
La fonction `construireDestinataires` SHALL utiliser `relanceContact.email` en lieu et place de `payeur_email` / `payeur_contact_email` lorsque l'impayé a un `relanceContact` avec un email défini.

#### Scenario: Résolution [[payeur_email]] avec relanceContact
- **WHEN** un impayé a un `relanceContact` avec email et que le template contient `[[payeur_email]]`
- **THEN** `[[payeur_email]]` est remplacé par l'email du `relanceContact`

#### Scenario: Fallback sur payeur_email sans relanceContact
- **WHEN** un impayé n'a pas de `relanceContact` et que le template contient `[[payeur_email]]`
- **THEN** `[[payeur_email]]` est remplacé par `payeur_email` et/ou `payeur_contact_email` comme actuellement

### Requirement: Levée du blocage email dans assignerSequence
`assignerSequence` SHALL accepter l'attribution d'une séquence si l'impayé a un `relanceContact` avec email, même si `payeur_email` est vide.

#### Scenario: Séquence assignée via relanceContact
- **WHEN** `assignerSequence` est appelée pour un impayé sans `payeur_email` mais avec un `relanceContact` ayant un email
- **THEN** la séquence est assignée et les relances sont créées avec le `to` issu du `relanceContact`

#### Scenario: Blocage maintenu sans email ni relanceContact
- **WHEN** `assignerSequence` est appelée pour un impayé sans `payeur_email` et sans `relanceContact`
- **THEN** une erreur est levée indiquant qu'aucun email de relances n'est disponible
