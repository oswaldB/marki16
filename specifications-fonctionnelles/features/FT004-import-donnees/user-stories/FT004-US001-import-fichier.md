# Import de fichier

En tant que **utilisateur autorisé**
Je veux **importer des données depuis un fichier**
Afin de **mettre à jour la base de données en masse**

## Scénarios

  Scénario: Import réussi
    Étant donné que j'ai un fichier valide
    Quand je sélectionne le fichier
    Et que je configure le mapping des champs
    Et que je lance l'import
    Alors les données sont importées
    Et un rapport d'import est généré

  Scénario: Fichier invalide
    Étant donné que j'ai un fichier au format incorrect
    Quand je tente de l'importer
    Alors un message d'erreur s'affiche
    Et l'import est annulé


+>>> met toi à jour avec la description de cette feature ../description.md