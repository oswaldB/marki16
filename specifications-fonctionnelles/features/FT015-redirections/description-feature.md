# Redirections

- **Objectif** : Gérer les redirections vers des ressources externes ou internes
- **Périmètre** : 
  - Page redirect-espace/[contactId].vue (redirection vers espace client)
  - Page redirect-pdf/[id].vue (redirection vers PDF)
  - Inclut : Génération de liens, redirections sécurisées
  - Exclut : L'affichage des ressources cibles
- **Contraintes** : 
  - Vérification des droits d'accès
  - Journalisation des redirections
  - Sécurité contre les redirections malveillantes
- **Dépendances** : 
  - FT011 (Espace client) pour les redirections espace
  - Backend pour la génération des liens PDF