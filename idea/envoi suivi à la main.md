# Envoi suivi à la main

> **Statut : implémenté** sous la forme de la page `/relances-manuelles`.
> Voir la spécification détaillée : `specs/frontend/relances-manuelles.md`.

## Contexte
Lors de la gestion des impayés, un utilisateur doit pouvoir déclencher manuellement un envoi
de rappel/suivi directement depuis une vue dédiée.

## Besoin
- **Vue source :** page « Relances manuelles ».
- **Action :** générer puis envoyer des suivis (emails) à des contacts sélectionnés.
- **Objectif :** envoyer un rappel manuel sans dépendre des séquences ni du cron de génération.

## Comportement attendu (implémenté)
1. L'utilisateur filtre les impayés (recherche, rôle payeur/apporteur, séquence, statut
   dossier, reste à payer, retard, blacklist, suspendus, sans email) et choisit un profil SMTP.
2. Les impayés sont **groupés par contact + rôle** ; chaque groupe est sélectionnable.
3. Le bouton **« Générer les emails de suivi — maintenant »** appelle
   `generateRelancesManuelles` et crée des `Suivi` en statut `brouillon` (template simple).
4. Les emails générés apparaissent dans une file. Sur chacun :
   - **éditer** l'objet/CC/corps (éditeur riche) ;
   - **prévoir** une date d'envoi (date future → statut `pret pour envoi`, envoi auto par le cron) ;
   - **envoyer maintenant** via `sendSuivis({ suiviIds })`.
5. Actions groupées : « Tout planifier » et « Tout envoyer ».
6. **Supprimer** une relance générée mais **non envoyée** (cloud function
   `supprimerRelanceManuelle`, garde serveur sur `statut`/`emailSent`) :
   l'email est retiré de la file, la suppression est tracée.
7. Chaque génération, chaque envoi et chaque suppression est tracé dans `Activite`.

## Bénéfices
- Gain de temps : constitution et envoi d'une vague de suivis depuis une vue unique.
- Traçabilité : activités `generation_manuelle`, `envoi_manuel`, `envoi_manuel_erreur`,
  `suppression_manuelle`.
- Contrôle : rien n'est envoyé automatiquement tant que l'utilisateur n'a pas agi
  (statut `brouillon`), tout en permettant la planification.

## Points d'attention
- L'envoi groupé est synchrone (SMTP + copie IMAP) : préférer des lots raisonnables.
- Le template simple n'ajoute pas de PDF en pièce jointe : les liens vers les factures
  et l'espace client sont dans le corps de l'email.
- Un profil SMTP est obligatoire pour la génération.
