# Correction d'un élément

En tant que **utilisateur autorisé**
Je veux **corriger un élément problématique**
Afin de **résoudre les anomalies**

## Scénarios

  Scénario: Correction réussie
    Étant donné que j'ai sélectionné un élément à corriger
    Quand je modifie les informations nécessaires
    Et que je sauvegarde les changements
    Alors l'élément est marqué comme corrigé
    Et il disparaît de la liste

  Scénario: Annulation de la correction
    Étant donné que je suis en train de corriger un élément
    Quand je clique sur "Annuler"
    Alors les modifications sont abandonnées
    Et je reviens à la liste