# Retrait de la liste noire

En tant que **administrateur**
Je veux **retirer un contact de la liste noire**
Afin de **le réintégrer dans les opérations**

## Scénarios

  Scénario: Retrait manuel
    Étant donné qu'un contact est dans la liste noire
    Quand je le sélectionne
    Et que je clique sur "Retirer de la liste noire"
    Alors le contact est retiré
    Et il redevient éligible aux relances

  Scénario: Retrait automatique après durée
    Étant donné qu'un contact a une durée de blacklist définie
    Quand cette durée expire
    Alors le contact est automatiquement retiré
    Et une notification est envoyée