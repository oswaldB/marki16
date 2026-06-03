# Validation des données importées

En tant que **utilisateur**
Je veux **valider les données avant import**
Afin de **éviter les erreurs dans la base de données**

## Scénarios

  Scénario: Prévisualisation avant import
    Étant donné que j'ai sélectionné un fichier
    Quand je clique sur "Prévisualiser"
    Alors les premières lignes s'affichent
    Et je peux vérifier le mapping

  Scénario: Correction des erreurs
    Étant donné que la prévisualisation montre des erreurs
    Quand je corrige le mapping
    Alors les erreurs sont résolues
    Et je peux procéder à l'import


+>>> a mettre à jour une fois la description de la feature mise à jour<<<+