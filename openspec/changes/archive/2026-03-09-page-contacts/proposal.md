## Why

La page `/contacts` n'affiche actuellement que le bouton "Synchroniser" — il est impossible de consulter, filtrer ou gérer les contacts depuis l'interface. Sans cette page, les utilisateurs ne peuvent pas vérifier les coordonnées des payeurs, identifier les contacts sans email (bloquant pour les relances) ni créer manuellement un contact.

## What Changes

- Compléter `frontend/pages/contacts.vue` : tableau des contacts avec filtres (source, type, recherche textuelle), colonnes nom / email / téléphone / type / source / nb impayés
- Ajouter un onglet ou une vue dédiée `/contacts` avec filtre rapide "sans email" (badge compteur)
- Drawer latéral de détail/édition d'un contact (`source: upload` → éditable ; `source: db_externe` → lecture seule)
- Afficher le nombre d'impayés liés à chaque contact dans le tableau
- Bouton "Nouveau contact" pour créer un contact manuel (source: upload)
- Conserver le bouton "Synchroniser" existant en header

## Capabilities

### Modified Capabilities

- `contacts-list`: Tableau complet des contacts avec filtres, compteur impayés, badges source/type

### New Capabilities

- `contact-detail-drawer`: Drawer de détail/édition d'un contact avec liste de ses impayés liés
- `contact-create`: Formulaire de création manuelle d'un contact (source: upload)

## Impact

- **Frontend uniquement** : réécriture de `frontend/pages/contacts.vue`
- **Aucune modification backend** : les données Contact et Impaye sont déjà dans Parse
- **UX** : filtres en header, tableau paginé, indicateur "sans email" en badge rouge
