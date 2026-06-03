# Création de campagne de relance

En tant que **utilisateur**
Je veux **créer une nouvelle campagne de relance**
Afin de **automatiser le suivi des impayés**

## Scénarios

  Scénario: Création de campagne
    Étant donné que je suis sur la page relances
    Quand je clique sur "Nouvelle campagne"
    Et que je configure les paramètres (cible, timing, message)
    Et que je sauvegarde
    Alors la campagne est créée
    Et elle est prête à être lancée

  Scénario: Test de campagne
    Étant donné que j'ai créé une campagne
    Quand je clique sur "Tester"
    Alors un email de test est envoyé
    Et je peux vérifier le rendu