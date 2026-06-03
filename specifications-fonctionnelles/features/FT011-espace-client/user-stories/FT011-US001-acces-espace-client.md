# Accès à l'espace client

En tant que **client**
Je veux **accéder à mon espace dédié**
Afin de **consulter mes informations personnelles**

## Scénarios

  Scénario: Connexion réussie
    Étant donné que j'ai reçu mes identifiants
    Quand je saisis mon email et mot de passe
    Alors j'accède à mon espace client
    Et je vois mes informations

  Scénario: Accès refusé (identifiants invalides)
    Étant donné que je saisis des identifiants incorrects
    Quand je tente de me connecter
    Alors un message d'erreur s'affiche
    Et je ne peux pas accéder