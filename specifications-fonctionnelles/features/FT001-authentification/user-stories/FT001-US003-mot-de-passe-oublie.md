# Mot de passe oublié

En tant que **utilisateur ayant oublié son mot de passe**
Je veux **réinitialiser mon mot de passe**
Afin de **retrouver l'accès à mon compte**

## Scénarios

  Scénario: Demande de réinitialisation
    Étant donné que je suis sur la page de login
    Quand je clique sur "Mot de passe oublié ?"
    Et que je saisis mon adresse email
    Et que je clique sur "Envoyer le lien de réinitialisation"
    Alors un email de réinitialisation est envoyé
    Et un message de confirmation s'affiche

  Scénario: Réinitialisation du mot de passe
    Étant donné que j'ai reçu un email de réinitialisation valide
    Quand je clique sur le lien dans l'email
    Et que je saisis un nouveau mot de passe conforme
    Et que je confirme le nouveau mot de passe
    Alors mon mot de passe est mis à jour
    Et je suis redirigé vers la page de login


+>>> pas du tout. pour le mot de passe oublié, on affiche un message en haut de page en style alert permanent qui demande à prendre contact avec l'administrateur. <<<+