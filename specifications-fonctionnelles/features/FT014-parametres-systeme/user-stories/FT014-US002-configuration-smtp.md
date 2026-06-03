# Configuration SMTP

En tant que **administrateur**
Je veux **configurer les paramètres SMTP**
Afin de **permettre l'envoi d'emails**

## Scénarios

  Scénario: Configuration initiale
    Étant donné que je suis dans les paramètres SMTP
    Quand je saisis les informations du serveur (hôte, port, identifiants)
    Et que je teste la connexion
    Alors la configuration est validée
    Et sauvegardée

  Scénario: Test de configuration
    Étant donné que j'ai configuré SMTP
    Quand je clique sur "Tester la configuration"
    Alors un email de test est envoyé
    Et je reçois une confirmation

  Scénario: Modification de la configuration
    Étant donné que SMTP est déjà configuré
    Quand je modifie un paramètre
    Et que je sauvegarde
    Alors la nouvelle configuration est active