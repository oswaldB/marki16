# Connexion utilisateur

En tant que **utilisateur autorisé**
Je veux **me connecter à l'application**
Afin de **accéder à mes fonctionnalités et données**

**Note technique :** L'identifiant de connexion est un texte libre et pas un email. Le token de login est sauvegardé sous la clé `login_token` en localStorage et sessionStorage.

## Scénarios

  Scénario: Connexion avec identifiants valides
    Étant donné que je suis sur la page de login
    Quand je saisis un identifiant valide et un mot de passe correct
    Et que je clique sur le bouton "Se connecter"
    Alors je suis redirigé vers le tableau de bord
    Et ma session est active
    Et mon token est sauvegardé en localStorage/sessionStorage sous la clé 'login_token'

  Scénario: Connexion avec identifiants invalides
    Étant donné que je suis sur la page de login
    Quand je saisis un identifiant valide et un mot de passe incorrect
    Et que je clique sur le bouton "Se connecter"
    Alors un message d'erreur s'affiche
    Et je reste sur la page de login

  Scénario: Champ obligatoire non rempli
    Étant donné que je suis sur la page de login
    Quand je laisse le champ identifiant vide
    Et que je clique sur le bouton "Se connecter"
    Alors un message d'erreur s'affiche
    Et la soumission est bloquée

  Scénario: Connexion avec token sauvegardé
    Étant donné que j'ai un token valide sauvegardé sous la clé 'login_token' en localStorage ou sessionStorage
    Quand je recharge la page ou ouvre une nouvelle fenêtre
    Alors je suis automatiquement connecté
    Et redirigé vers le tableau de bord