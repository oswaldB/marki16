# Détail d'un impayé

En tant que **utilisateur**
Je veux **consulter les détails d'un impayé spécifique**
Afin de **comprendre la situation et agir**

## Scénarios

  Scénario: Consultation des détails
    Étant donné que je suis sur la liste des impayés
    Quand je clique sur un impayé
    Alors ses détails complets s'affichent
    Et je vois l'historique des actions

  Scénario: Mise à jour du statut
    Étant donné que je consulte un impayé
    Quand je modifie son statut
    Et que je sauvegarde
    Alors le statut est mis à jour
    Et l'impayé disparaît de la liste si résolu