## Why

Dans la vue "par payeur" de `/impayes`, les impayés sont groupés par payeur mais l'attribution d'une séquence se fait impayé par impayé. Quand un payeur a plusieurs factures en attente, l'utilisateur doit répéter l'opération autant de fois — c'est lent et error-prone. Il faut un flux groupé : sélectionner en un clic tous les impayés d'un payeur, ajuster la sélection, choisir une séquence, et attribuer en une seule action.

## What Changes

- Ajout d'un bouton "Attribuer une séquence" sur chaque ligne de groupe payeur dans la vue "par payeur"
- Ce bouton ouvre un **drawer** latéral listant tous les impayés du groupe, pré-cochés, avec indication visuelle de la séquence déjà assignée le cas échéant
- L'utilisateur peut décocher des impayés individuellement, choisir une séquence, puis cliquer "Attribuer"
- L'attribution suit la même logique que l'existant : suppression des relances `pending` + création des nouvelles relances + liaison `impaye.sequence`

## Capabilities

### New Capabilities

- `group-sequence-assignment`: Ouverture d'un drawer depuis une ligne de groupe payeur permettant d'assigner une séquence à N impayés en une seule opération, avec sélection individuelle et visibilité des séquences déjà assignées

### Modified Capabilities

- `impayes-par-payeur-view`: La vue groupée par payeur gagne un bouton d'action par groupe

## Impact

- **Frontend** : `frontend/pages/impayes.vue` — ajout du bouton sur les lignes de groupe + nouveau composant `DrawerAssignSequence.vue`
- **Données** : aucune modification de schéma — utilise les classes Parse existantes (`Impaye`, `Sequence`, `Relance`)
- **Backend** : aucune modification — l'attribution côté client via Parse JS SDK suffit (logique déjà présente dans le modal existant)
