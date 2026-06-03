# Gestion des utilisateurs

En tant que **administrateur**
Je veux **gérer les comptes utilisateurs**
Afin de **contrôler l'accès à l'application**

## Scénarios

  Scénario: Création d'un utilisateur
    Étant donné que je suis dans les paramètres utilisateurs
    Quand je clique sur "Ajouter un utilisateur"
    Et que je remplis les informations (nom, email, rôle)
    Et que je sauvegarde
    Alors l'utilisateur est créé
    Et peut se connecter

  Scénario: Modification des permissions
    Étant donné qu'un utilisateur existe
    Quand je modifie son rôle
    Alors ses permissions sont mises à jour
    Et il a accès aux nouvelles fonctionnalités

  Scénario: Désactivation d'un utilisateur
    Étant donné qu'un utilisateur doit être désactivé
    Quand je clique sur "Désactiver"
    Alors l'utilisateur ne peut plus se connecter
    Mais ses données sont conservées