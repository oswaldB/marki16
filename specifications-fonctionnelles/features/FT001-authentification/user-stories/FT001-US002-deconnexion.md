# Déconnexion

En tant que **utilisateur connecté**
Je veux **me déconnecter de l'application**
Afin de **terminer ma session en toute sécurité**

## Scénarios

  Scénario: Déconnexion volontaire
    Étant donné que je suis connecté à l'application
    Quand je clique sur le bouton "Se déconnecter"
    Alors ma session est terminée
    Et je suis redirigé vers la page de login
    Et un message de confirmation s'affiche

  Scénario: Session expirée automatiquement
    Étant donné que je suis connecté à l'application
    Quand la durée d'inactivité dépasse le seuil configuré
    Alors ma session est automatiquement terminée
    Et je suis redirigé vers la page de login