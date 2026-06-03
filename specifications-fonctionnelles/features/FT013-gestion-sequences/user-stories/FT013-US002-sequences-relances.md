# Séquences de relance

En tant que **utilisateur**
Je veux **gérer les séquences spécifiques aux relances**
Afin de **automatiser le suivi des impayés**

## Scénarios

  Scénario: Configuration d'une séquence de relance
    Étant donné que je crée une séquence
    Quand je sélectionne le type "Relance"
    Alors je peux configurer les étapes de relance
    Et les délais entre chaque étape

  Scénario: Suivi de l'exécution
    Étant donné qu'une séquence de relance est active
    Quand je consulte son statut
    Alors je vois les étapes exécutées
    Et les prochaines étapes planifiées