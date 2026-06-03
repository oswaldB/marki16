# Actions spécifiques pour récalcitrants

En tant que **utilisateur**
Je veux **appliquer des actions spécifiques aux clients récalcitrants**
Afin de **améliorer le recouvrement**

## Scénarios

  Scénario: Envoi de message personnalisé
    Étant donné que j'ai sélectionné un client récalcitrant
    Quand je choisis d'envoyer un message personnalisé
    Alors un template spécifique est utilisé
    Et le message est envoyé

  Scénario: Escalade vers le supérieur
    Étant donné que j'ai un client récalcitrant
    Quand je clique sur "Escalader"
    Alors une notification est envoyée au responsable
    Et le statut est mis à jour