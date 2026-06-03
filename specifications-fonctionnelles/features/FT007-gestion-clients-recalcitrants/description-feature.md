# Gestion des clients récalcitrants

- **Objectif** : Identifier et gérer les clients avec un historique de non-paiement ou de comportement problématique
- **Périmètre** : 
  - Page recalcitrants.vue
  - Identification automatique des clients récalcitrants
  - Historique des incidents
  - Actions spécifiques pour ces clients
  - Inclut : Détection, classification, gestion
  - Exclut : La gestion des impayés courants (voir FT012)
- **Contraintes** : 
  - Critères de classification clairs
  - Escalade automatique possible
  - Intégration avec le système de scoring
- **Dépendances** : 
  - FT012 (Gestion des impayés) pour l'historique
  - FT008 (Gestion des relances) pour les actions