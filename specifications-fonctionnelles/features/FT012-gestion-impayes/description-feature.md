# Gestion des impayés

- **Objectif** : Suivre et gérer les impayés et le recouvrement
- **Périmètre** : 
  - Page impayes/index.vue (liste des impayés)
  - Page impayes/[id].vue (détail d'un impayé)
  - Page impayes/2/index.vue (version alternative de la liste)
  - Page impayes2/index.vue (module complémentaire)
  - Inclut : Détection, classification, suivi, actions de recouvrement
  - Exclut : La gestion des clients récalcitrants (voir FT007)
- **Contraintes** : 
  - Historique complet des actions
  - Respect des délais légaux
  - Intégration avec les relances automatisées
- **Dépendances** : 
  - FT010 (Gestion des contacts) pour l'association client
  - FT008 (Gestion des relances) pour les actions
  - FT013 (Gestion des séquences) pour l'automatisation