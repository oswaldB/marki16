# Identification des clients récalcitrants

En tant que **système**
Je veux **identifier automatiquement les clients récalcitrants**
Afin de **les marquer pour un traitement spécifique**

## Scénarios

  Scénario: Détection automatique
    Étant donné qu'un client a plusieurs impayés
    Quand le seuil de récalcitrance est atteint
    Alors le client est marqué comme récalcitrant
    Et il apparaît dans la liste des récalcitrants

  Scénario: Révision manuelle
    Étant donné que je suis sur la page récalcitrants
    Quand je clique sur "Réviser"
    Alors je peux consulter l'historique du client
    Et confirmer ou infirmer le statut