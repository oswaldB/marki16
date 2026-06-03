# Redirection vers PDF

En tant que **système**
Je veux **rediriger vers un document PDF**
Afin de **permettre le téléchargement direct**

## Scénarios

  Scénario: Génération et téléchargement
    Étant donné qu'un utilisateur accède à redirect-pdf/[id]
    Quand le PDF est généré
    Alors le téléchargement commence automatiquement
    Et l'utilisateur reçoit le document

  Scénario: PDF introuvable
    Étant donné qu'un ID de PDF n'existe pas
    Quand un utilisateur accède à la redirection
    Alors une page d'erreur s'affiche
    Et il est invité à vérifier le lien