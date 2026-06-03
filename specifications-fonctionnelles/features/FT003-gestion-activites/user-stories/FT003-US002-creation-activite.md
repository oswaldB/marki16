
+>>> la création d'activité ne peut pas se faire depuis cette page activités supprime cette user story +>>>
# Création d'une activité

En tant que **utilisateur autorisé**
Je veux **créer une nouvelle activité**
Afin de **enregistrer une nouvelle opération**

## Scénarios

  Scénario: Création réussie
    Étant donné que je suis sur la page activités
    Quand je clique sur "Nouvelle activité"
    Et que je remplis tous les champs obligatoires
    Et que je clique sur "Enregistrer"
    Alors la nouvelle activité est créée
    Et elle apparaît dans la liste

  Scénario: Création avec champs manquants
    Étant donné que je suis sur la page de création d'activité
    Quand je laisse un champ obligatoire vide
    Et que je clique sur "Enregistrer"
    Alors un message d'erreur s'affiche
    Et la création est bloquée