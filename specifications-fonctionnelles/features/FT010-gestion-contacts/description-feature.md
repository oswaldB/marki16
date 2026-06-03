# Gestion des contacts

- **Objectif** : Gérer la base de données des contacts (clients, prospects, partenaires)
- **Périmètre** : 
  - Page contacts/index.vue (liste principale)
  - Page contacts/sans-email.vue (contacts sans adresse email)
  - Fiche contact détaillée
  - Import/export des contacts
  - Inclut : CRUD complet, segmentation, recherche avancée
  - Exclut : La gestion des impayés (voir FT012)
- **Contraintes** : 
  - Doublons évités
  - Données complètes et validées
  - Respect RGPD
- **Dépendances** : 
  - FT004 (Import de données) pour l'import massif
  - FT011 (Espace client) pour l'accès client
  - FT012 (Gestion des impayés) pour le lien