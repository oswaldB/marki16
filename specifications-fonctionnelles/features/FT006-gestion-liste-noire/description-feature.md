# Gestion de la liste noire

- **Objectif** : Maintenir une liste des contacts ou clients exclus des opérations
- **Périmètre** : 
  - Page blacklist.vue
  - Ajout/suppression de la liste noire
  - Historique des modifications
  - Recherche et filtrage
  - Inclut : Gestion complète de la blacklist
  - Exclut : La gestion des contacts actifs
- **Contraintes** : 
  - Justification obligatoire pour l'ajout
  - Durée de blacklist configurable
  - Impact sur les autres modules (relances, etc.)
- **Dépendances** : 
  - FT010 (Gestion des contacts) pour la sélection
  - FT008 (Gestion des relances) pour l'exclusion