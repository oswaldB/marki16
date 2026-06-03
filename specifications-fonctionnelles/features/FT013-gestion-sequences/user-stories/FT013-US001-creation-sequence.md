# Création d'une séquence

En tant que **administrateur**
Je veux **créer une nouvelle séquence d'actions**
Afin de **automatiser des processus**

## Scénarios

  Scénario: Création de base
    Étant donné que je suis sur la page séquences
    Quand je clique sur "Nouvelle séquence"
    Et que je configure les étapes
    Et que je sauvegarde
    Alors la séquence est créée
    Et prête à être utilisée

  Scénario: Configuration des déclencheurs
    Étant donné que je crée une séquence
    Quand je définis un déclencheur (ex: impayé après 30 jours)
    Alors la séquence se déclenchera automatiquement