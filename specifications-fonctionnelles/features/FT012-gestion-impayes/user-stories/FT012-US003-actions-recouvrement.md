# Actions de recouvrement

En tant que **utilisateur**
Je veux **effectuer des actions de recouvrement sur un impayé**
Afin de **résoudre le problème**

## Scénarios

  Scénario: Envoi de relance manuelle
    Étant donné que je consulte un impayé
    Quand je clique sur "Envoyer une relance"
    Alors une relance est envoyée au client
    Et l'action est enregistrée dans l'historique

  Scénario: Ajout d'une note
    Étant donné que je veux documenter une action
    Quand j'ajoute une note à l'impayé
    Alors la note est enregistrée
    Et visible par les autres utilisateurs