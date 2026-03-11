## Why

Les impayés sont au cœur de Marki16 : sans un écran de liste et de détail fonctionnel, il est impossible de suivre les factures, d'assigner des séquences de relance ou de consulter l'historique des actions. La sync depuis la DB externe est en place ; il faut maintenant exposer les données de façon exploitable.

## What Changes

- Création de la page `/impayes` : liste avec 3 vues (unitaire, par payeur, par contact), filtres, recherche, sélection groupée et drawer PDF
- Création de la page `/impayes/[id]` : détail complet (facture, bien, dossier, interlocuteurs, séquence, relances, historique)
- Toutes les opérations métier (changer statut, assigner/retirer séquence, créer/modifier/supprimer relance) sont faites directement depuis le frontend via le SDK Parse JS — pas de Cloud Functions nécessaires
- Ajout de la route `/impayes` dans la sidebar

## Capabilities

### New Capabilities

- `impayes-list`: Liste paginée des impayés avec vue unitaire (tableau), vue par payeur (groupée) et vue par contact (groupée). Filtres par séquence et statut, recherche full-text, sélection groupée (assigner séquence, marquer payé), drawer PDF.
- `impaye-detail`: Page détail d'un impayé affichant toutes les informations (facture, bien, dossier, interlocuteurs), gestion de la séquence active (assigner, changer, retirer), liste des relances planifiées avec modification/suppression, et historique chronologique des actions.
- `relance-management`: Depuis le détail d'un impayé — créer une relance manuelle, modifier date/objet/corps, supprimer une relance `pending`. Le changement de séquence annule les relances `pending` et recrée le planning.

### Modified Capabilities

- `sidebar-nav`: Ajout du lien `Impayés` (icône `!`) dans la navigation

## Impact

- **Frontend** : nouvelles pages `pages/impayes.vue` et `pages/impayes/[id].vue`, composants `ImpayeDrawerPdf.vue`, `RelanceDrawer.vue`
- **Pas de changement backend** : toutes les mutations passent par le SDK Parse JS directement depuis le frontend
- **Données** : lecture/écriture des classes `Impaye`, `Contact`, `Sequence`, `Relance` (déjà créées par la sync)
