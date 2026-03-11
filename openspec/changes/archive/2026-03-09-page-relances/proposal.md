## Pourquoi

La page `/relances` est le tableau de bord opérationnel des emails de relance. Elle permet à l'utilisateur de visualiser toutes les relances planifiées et envoyées, de les modifier avant envoi, de relancer les échecs, et d'avoir une vue calendrier pour anticiper la charge hebdomadaire.

Sans cette page, les relances créées automatiquement par les séquences ne sont visibles que dans le détail de chaque impayé — il n'existe pas de vue globale.

## Quoi

### Page `/relances`

- **Deux vues** : Tableau (défaut) et Calendrier (FullCalendar)
- **Filtres** : Statut (Tous / En attente / Envoyé / Échec / Annulé), Séquence, Recherche libre (sur objet et destinataire)
- **Vue Tableau** : UTable avec sélection multiple, actions par ligne (✏ modifier, 🗑 supprimer, 👁 voir, 🔁 réessayer), suppression groupée
- **Vue Calendrier** : FullCalendar mois, points colorés par jour, clic → panneau latéral des relances du jour
- **Drawer Modifier** : dateEnvoi, to, cc, objet, corps (Toast UI Editor), enregistrer via Parse SDK
- **Action Réessayer** (statut `échec`) : remet `statut = 'pending'` + `dateEnvoi = maintenant` → sera pris par le prochain cron

## Ce qui ne change pas

- Le modèle `Relance` n'est pas modifié (champs `dateEnvoi`, `statut`, `objet`, `corps`, `to`, `cc`, `manuelle`, `impaye`, `sequence`)
- Le composant `RelanceDrawer` existant (`components/RelanceDrawer.vue`) sera réutilisé ou remplacé par un drawer inline plus complet avec Toast UI Editor
- L'envoi réel reste côté backend (cloud job `envoyerRelances`)
