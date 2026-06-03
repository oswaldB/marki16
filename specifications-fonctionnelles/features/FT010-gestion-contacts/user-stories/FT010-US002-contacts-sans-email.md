# Gestion des contacts sans email

En tant que **utilisateur**
Je veux **identifier et gérer les contacts sans adresse email**
Afin de **compléter les informations manquantes**

## Scénarios

  Scénario: Liste des contacts sans email
    Étant donné que je suis sur la page contacts/sans-email
    Quand la page se charge
    Alors seuls les contacts sans email s'affichent

  Scénario: Ajout d'un email
    Étant donné qu'un contact n'a pas d'email
    Quand je clique sur "Ajouter email"
    Et que je saisis une adresse valide
    Alors l'email est enregistré
    Et le contact disparaît de la liste