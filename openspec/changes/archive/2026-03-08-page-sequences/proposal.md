## Why

Les séquences de relance sont le moteur de Marki16 : elles définissent quels emails envoyer, à quel délai, avec quel profil SMTP. Sans interface pour les créer et les éditer, il est impossible de configurer les relances automatiques. La page `/impayes/[id]` peut déjà assigner une séquence, mais la gestion des séquences elles-mêmes est absente.

## What Changes

- Création de `/sequences` : liste des séquences avec nombre d'emails, nombre d'impayés associés, actions créer/supprimer
- Création de `/sequences/[id]` : éditeur complet — nom, emails de relance (délai J+N, profil SMTP, destinataire, objet, corps), règles d'attribution automatique avec aperçu live
- Toutes les opérations via SDK Parse JS directement depuis le frontend

## Capabilities

### New Capabilities

- `sequences-list`: Liste paginée des séquences avec compteurs (emails, impayés assignés) et actions (créer, supprimer).
- `sequence-editor`: Éditeur de séquence — nom, liste d'emails ordonnés (J+N, SMTP, to, cc, objet, corps textarea), règles d'attribution automatique (champ/opérateur/valeur), aperçu live du nombre d'impayés concernés.

### Modified Capabilities

- `sidebar-nav`: Ajout du lien actif `Séquences` dans la navigation (déjà présent dans la sidebar)

## Impact

- **Frontend** : nouvelles pages `pages/sequences.vue` et `pages/sequences/[id].vue`
- **Pas de changement backend** : toutes les opérations (CRUD séquences) passent par le SDK Parse JS directement
- **Données** : lecture/écriture de la classe `Sequence` (`nom`, `emails: Array`, `regles: Array`)
