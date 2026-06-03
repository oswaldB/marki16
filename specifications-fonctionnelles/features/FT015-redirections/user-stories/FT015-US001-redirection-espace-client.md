# Redirection vers espace client

En tant que **système**
Je veux **rediriger vers l'espace client**
Afin de **permettre un accès direct depuis des liens externes**

## Scénarios

  Scénario: Redirection valide
    Étant donné qu'un client clique sur un lien valide
    Quand il accède à redirect-espace/[contactId]
    Alors il est redirigé vers son espace client
    Et authentifié automatiquement si nécessaire

  Scénario: Lien invalide
    Étant donné qu'un contactId n'existe pas
    Quand un utilisateur accède à la redirection
    Alors une page d'erreur s'affiche
    Et il est invité à se connecter manuellement