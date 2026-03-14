## Why

Lorsqu'un impayé n'a pas d'email de contact renseigné (payeur sans email), les relances ne peuvent pas être envoyées. Il faut pouvoir attribuer un email de relances par défaut à un impayé en créant un nouveau contact ou en utilisant un contact existant, et propager ce changement à toutes les relances en attente.

## What Changes

- Ajout d'un bouton "Attribuer un email de relances par défaut" sur la page détail d'un impayé
- Ce bouton ouvre un slideover permettant de :
  - Créer un nouveau contact (nom + email) et l'associer à l'impayé comme destinataire de relances
  - Rechercher et sélectionner un contact existant pour l'utiliser comme destinataire de relances
- Une fois le contact choisi/créé, toutes les relances non envoyées (`pending`) de l'impayé sont mises à jour avec le nouvel email
- La logique de peuplement des relances (lors de l'attribution d'une séquence) tient désormais compte d'un éventuel contact de relances par défaut (`relanceContact`) sur l'impayé

## Capabilities

### New Capabilities

- `attribuer-relance-contact`: Slideover permettant d'attribuer un contact de relances par défaut à un impayé (création ou sélection d'un contact existant), avec propagation de l'email aux relances `pending` et prise en compte lors du peuplement des relances.

### Modified Capabilities

<!-- Aucune spec existante à modifier -->

## Impact

- **Frontend**: `frontend/app/pages/impayes/[id].vue` — ajout du bouton + slideover
- **Backend**: `backend/cloud/main.js` — nouvelle Cloud Function `attribuerRelanceContact` (mise à jour des relances pending + sauvegarde du contact par défaut sur l'impayé)
- **Backend**: logique de peuplement des relances (création des relances lors de l'attribution d'une séquence) — utiliser `impayé.relanceContact.email` si défini, sinon fallback sur le payeur
- **Modèle**: champ `relanceContact` (Pointer vers Contact) ajouté sur la classe `Impaye`
