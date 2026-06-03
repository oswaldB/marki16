# Téléchargement de documents

En tant que **client**
Je veux **télécharger des documents liés à mes impayés**
Afin de **conserver une trace écrite**

## Scénarios

  Scénario: Téléchargement d'un PDF
    Étant donné que je consulte un impayé
    Quand je clique sur "Télécharger le PDF"
    Alors le document est généré
    Et le téléchargement commence

  Scénario: Historique des téléchargements
    Étant donné que je veux consulter mes anciens téléchargements
    Quand j'accède à la section "Mes documents"
    Alors l'historique s'affiche
    Et je peux télécharger à nouveau