# Gestion des séquences

- **Objectif** : Définir et exécuter des séquences d'actions automatisées
- **Périmètre** : 
  - Page sequences/index.vue (liste des séquences)
  - Page sequences/[id].vue (détail d'une séquence)
  - Page sequences/relances/[id].vue (séquences de relance)
  - Page sequences/suivi/[id].vue (séquences de suivi)
  - Inclut : Création, configuration, déclenchement, suivi
  - Exclut : La gestion manuelle des actions individuelles
- **Contraintes** : 
  - Déclenchement basé sur des conditions
  - Personnalisation des workflows
  - Gestion des erreurs et reprises
- **Dépendances** : 
  - FT008 (Gestion des relances) pour les actions de relance
  - FT012 (Gestion des impayés) pour les déclencheurs