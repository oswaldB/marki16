# Création des Relances - Overview

## Contexte

La fonctionnalité de création des relances permet aux utilisateurs de générer automatiquement des emails de relance pour les factures impayées, en suivant des séquences de relance prédéfinies. Cette fonctionnalité est accessible depuis la page `/relances` et utilise des templates configurables pour chaque séquence.

## Objectifs

- Automatiser la création des relances pour les factures impayées
- Suivre des séquences de relance personnalisables
- Permettre la validation manuelle avant envoi
- Historiser toutes les relances créées
- Faciliter le suivi des relances envoyées et leur statut

## Acteurs

- **Utilisateur** : Personne qui déclenche la création des relances et les valide
- **Système** : Gère la création automatique des relances selon les règles configurées
- **Base de données** : Stocke les relances, les impayés et les séquences

## Flux Principal

```mermaid
graph TD
    A[Utilisateur clique sur "Créer des relances"] --> B[Frontend appelle l'API cloud]
    B --> C[Backend récupère les impayés avec séquences]
    C --> D[Backend regroupe les impayés par contact]
    D --> E[Backend crée les relances selon les templates]
    E --> F[Backend sauvegarde les relances en base]
    F --> G[Frontend recharge la liste des relances]
    G --> H[Utilisateur voit les nouvelles relances]
```

## Composants Techniques

- **Frontend** : Page Vue.js/Nuxt dans `/app/pages/relances.vue`
- **Backend** : Fonction cloud Parse `createRelancesWithTemplates`
- **Base de données** : Collections Parse `Relance`, `Impaye`, `Sequence`, `Contact`

## Étapes Détaillées

1. **Déclenchement** : Clic sur le bouton "Créer des relances"
2. **Récupération des données** : Chargement des impayés avec séquences attribuées
3. **Filtrage** : Exclusion des impayés soldés
4. **Regroupement** : Organisation des impayés par contact de relance
5. **Création** : Génération des relances selon les templates de séquence
6. **Sauvegarde** : Persistance des relances en base de données
7. **Affichage** : Mise à jour de l'interface utilisateur

## Statuts des Relances

- `pending` : Relance créée mais non envoyée
- `envoyé` : Relance envoyée avec succès
- `échec` : Échec de l'envoi
- `annulé` : Relance annulée manuellement
- `optimisee` : Relance optimisée

## Validation

Les relances créées automatiquement ont un statut `valide: false` et doivent être validées manuellement avant envoi, sauf si la séquence est configurée pour un envoi automatique.

## Historique

Toutes les actions sur les relances (création, validation, annulation, envoi) sont enregistrées avec des timestamps pour permettre un audit complet.
