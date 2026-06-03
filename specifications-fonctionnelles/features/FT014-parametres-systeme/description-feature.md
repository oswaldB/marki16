# Paramètres système

- **Objectif** : Configurer les paramètres globaux de l'application
- **Périmètre** : 
  - Page settings/users.vue (gestion des utilisateurs)
  - Page settings/smtp.vue (configuration SMTP)
  - Inclut : Gestion des comptes, configuration technique, paramètres généraux
  - Exclut : La configuration spécifique aux modules
- **Contraintes** : 
  - Accès restreint aux administrateurs
  - Audit des modifications
  - Sécurité renforcée
- **Dépendances** : 
  - FT001 (Authentification) pour la gestion des accès
  - Tous les modules pour l'application des paramètres