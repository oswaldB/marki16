## Why

Les séquences sont éditées librement, mais il n'existe pas de concept de "prête à l'emploi" vs "en cours d'édition". Une séquence incomplète (emails sans corps, SMTP non configuré) peut être assignée à des impayés et générer des relances vides ou en échec. Il faut un mécanisme explicite pour indiquer qu'une séquence est validée et opérationnelle.

## What Changes

- Ajout d'un champ `publiee` (booléen, défaut `false`) sur la classe Parse `Sequence`
- Ajout d'un bouton **Publier / Dépublier** dans le header de la page `/sequences/[id]`
- Badge visuel dans la page (`Brouillon` / `Publiée`) reflétant l'état courant
- La séquence est sauvegardée en même temps que le changement de statut (pas de double save nécessaire)
- La liste `/sequences` affiche un badge d'état pour chaque séquence

## Capabilities

### New Capabilities

- `sequence-publish`: Permet de marquer une séquence comme publiée (opérationnelle) ou brouillon depuis la page de détail. Le statut est persisté dans le champ `publiee` du Parse Object `Sequence`.

### Modified Capabilities

- `sequence-list`: La liste des séquences (`/sequences`) affiche désormais le statut publié/brouillon de chaque séquence.

## Impact

- **Frontend** : `frontend/app/pages/sequences/[id].vue` — ajout bouton + badge dans le header ; `frontend/app/pages/sequences/index.vue` — ajout badge dans la liste
- **Données** : champ `publiee: Boolean` sur la classe Parse `Sequence` (créé au premier `save()`)
- **Backend** : aucun changement — le champ est géré côté client via Parse JS SDK
