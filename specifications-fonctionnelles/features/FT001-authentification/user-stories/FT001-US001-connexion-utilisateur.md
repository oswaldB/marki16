# Connexion utilisateur

En tant que **utilisateur autorisé**
Je veux **me connecter à l'application**
Afin de **accéder à mes fonctionnalités et données**

## Scénarios

  Scénario: Connexion avec identifiants valides
    Étant donné que je suis sur la page de login
    Quand je saisis un email valide et un mot de passe correct
    Et que je clique sur le bouton "Se connecter"
    Alors je suis redirigé vers le tableau de bord
    Et ma session est active

  Scénario: Connexion avec identifiants invalides
    Étant donné que je suis sur la page de login
    Quand je saisis un email valide et un mot de passe incorrect
    Et que je clique sur le bouton "Se connecter"
    Alors un message d'erreur s'affiche
    Et je reste sur la page de login

  Scénario: Champ obligatoire non rempli
    Étant donné que je suis sur la page de login
    Quand je laisse le champ email vide
    Et que je clique sur le bouton "Se connecter"
    Alors un message d'erreur s'affiche
    Et la soumission est bloquée