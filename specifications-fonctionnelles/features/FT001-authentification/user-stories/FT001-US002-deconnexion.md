# Déconnexion

En tant que **utilisateur connecté**
Je veux **me déconnecter de l'application**
Afin de **terminer ma session en toute sécurité**

**Note technique :** La déconnexion se fait à partir du web component de la sidebar menu. Pour se déconnecter, on efface en localStorage et sessionStorage les identifiants de connexion et le token sauvegardé sous la clé 'login_token'.

## Scénarios

  Scénario: Déconnexion volontaire
    Étant donné que je suis connecté à l'application
    Quand je clique sur le bouton "Se déconnecter" dans la sidebar menu
    Alors mon token est supprimé de localStorage et sessionStorage
    Et ma session est terminée
    Et je suis redirigé vers la page de login
    Et un message de confirmation s'affiche

  Scénario: Session expirée automatiquement
    Étant donné que je suis connecté à l'application
    Quand la durée d'inactivité dépasse le seuil configuré
    Alors ma session est automatiquement terminée
    Et je suis redirigé vers la page de login