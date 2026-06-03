# Import de données

- **Objectif** : Permettre l'import massif de données depuis des fichiers externes
- **Périmètre** : 
  - Page import.vue
  - Upload de fichiers (CSV, Excel, etc.)
  - Validation et traitement des données
  - Mapping des champs
  - Inclut : Interface d'import, validation, rapport d'import
  - Exclut : L'export des données
- **Contraintes** : 
  - Gestion des erreurs de format
  - Limite de taille des fichiers
  - Correspondance avec le schéma de données existant
- **Dépendances** : 
  - Backend pour le traitement des fichiers
  - Toutes les features concernées par les données importées