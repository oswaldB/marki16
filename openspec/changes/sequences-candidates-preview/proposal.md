## Why

Dans la page `sequences/[id]`, la section "Règles d'attribution" affiche déjà un aperçu live du nombre d'impayés concernés (`apercuConcernes`) et exclus. Cependant, ce chiffre reste abstrait : l'utilisateur ne peut pas voir *quels* impayés correspondent aux règles sans quitter la page. Le lien "Voir les X impayés" existant pointe vers `/impayes?sequence=id`, ce qui filtre les impayés *déjà assignés* à cette séquence — pas les candidats potentiels qui matchent les règles mais ne sont pas encore assignés. Il manque donc une façon d'inspecter directement la liste des candidats depuis la page de configuration de la séquence.

## What Changes

- Remplacement (ou complément) du lien "Voir les X impayés" par un bouton qui ouvre un **drawer** affichant la liste détaillée des impayés candidats correspondant aux règles d'attribution actuelles
- Le drawer liste chaque impayé avec : numéro de facture, payeur, montant restant, statut, et séquence actuellement assignée (le cas échéant)
- Bouton d'action rapide par ligne pour naviguer vers la fiche de l'impayé (`/impayes/[id]`)
- Le drawer se met à jour en temps réel quand les règles changent (debounce 600 ms, comme le calcul existant)

## Capabilities

### New Capabilities

- `sequences-candidates-drawer` : Affichage en drawer de la liste paginée des impayés candidats matchant les règles d'attribution, accessible depuis le bouton "Voir les X impayés" dans la section règles

### Modified Capabilities

- `sequences-apercu-live` : L'aperçu live existant conserve les compteurs mais le lien devient un bouton ouvrant le drawer plutôt qu'une navigation vers `/impayes`

## Impact

- **Frontend** : `frontend/app/pages/sequences/[id].vue` — ajout d'un `UDrawer` de candidats + conversion du `NuxtLink` en `UButton` + fonction `chargerCandidats()`
- **Données** : Aucune modification de schéma — utilise la même logique de requête que `calculerApercu()`, mais avec `.find()` au lieu de `.count()`
- **Backend** : Aucun changement
