# Liste des impayés

En tant que **utilisateur**
Je veux **voir la liste de tous les impayés**
Afin de **suivre le recouvrement**

## Scénarios

  Scénario: Affichage de la liste
    Étant donné que je suis sur la page impayés
    Quand la page se charge
    Alors tous les impayés s'affichent
    Et je peux voir leur statut

  Scénario: Filtre par statut
    Étant donné que je veux voir seulement les impayés en cours
    Quand je sélectionne le filtre "En cours"
    Alors seuls les impayés non résolus s'affichent