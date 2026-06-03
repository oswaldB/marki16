# Espace client

- **Objectif** : Fournir un espace dédié aux clients pour consulter leurs informations
- **Périmètre** : 
  - Page espace/[id].vue (espace client générique)
  - Page espace/[contactId].vue (espace par contact)
  - Page espace/[contactId]/impaye/index.vue (liste des impayés du client)
  - Page espace/[contactId]/impaye/[impayeId].vue (détail d'un impayé)
  - Inclut : Accès sécurisé, visualisation des données, téléchargement de documents
  - Exclut : La gestion administrative des impayés
- **Contraintes** : 
  - Authentification client nécessaire
  - Personnalisation par client
  - Accès limité aux données du client uniquement
- **Dépendances** : 
  - FT001 (Authentification) pour l'accès
  - FT010 (Gestion des contacts) pour l'association
  - FT012 (Gestion des impayés) pour les données affichées