# Ajout à la liste noire

En tant que **administrateur**
Je veux **ajouter un contact à la liste noire**
Afin de **l'exclure des opérations futures**

## Scénarios

  Scénario: Ajout avec justification
    Étant donné que je suis sur la page blacklist
    Quand je sélectionne un contact
    Et que je saisis une justification
    Et que je clique sur "Ajouter à la liste noire"
    Alors le contact est ajouté
    Et il est exclu des relances automatiques

  Scénario: Ajout sans justification
    Étant donné que je tente d'ajouter un contact
    Quand je ne saisis pas de justification
    Alors un message d'erreur s'affiche
    Et l'ajout est bloqué