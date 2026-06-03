# Import de données

- **Objectif** : Permettre l'import massif de données depuis des fichiers externes
- **Périmètre** : 
  - Page import.html
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

+>>> il faut tout refaire. ici on veut un import en pdf ou zip avec pdfs qui va ensuite appeler un workflow backend qui permet d'extraire avec ollama model mistral les donnés de la facture ou des factures en pdf pour les mettre dans la base de données table Invoice. <<<+