## 1. Backend — Cloud Function attribuerRelanceContact

- [x] 1.1 Ajouter la Cloud Function `attribuerRelanceContact` dans `backend/cloud/main.js` : accepte `impayelId` + (`contactId` OU `{ nom, email }`), crée le contact si nécessaire (`source: 'relance'`), sauvegarde `relanceContact` sur l'impayé
- [x] 1.2 Dans `attribuerRelanceContact`, mettre à jour le champ `to` de toutes les relances `pending` de l'impayé (via `construireDestinataires` avec le `relanceContact` déjà positionné sur l'objet impayé en mémoire)

## 2. Backend — Priorité relanceContact dans la logique de peuplement

- [x] 2.1 Modifier `construireDestinataires` pour inclure le fetch du `relanceContact` sur l'impayé (si présent et avec email) et l'utiliser en remplacement de `payeur_email` / `payeur_contact_email` pour `[[payeur_email]]`
- [x] 2.2 Modifier la vérification email dans `assignerSequence` : accepter aussi `relanceContact.email` (après fetch du Pointer) — adapter le message d'erreur
- [x] 2.3 Appliquer la même logique dans `appliquerReglesAttributionAutomatique` (même vérification + même appel `construireDestinataires`)

## 3. Frontend — Bouton et indicateur sur la page impayé

- [x] 3.1 Dans `frontend/app/pages/impayes/[id].vue`, ajouter un bouton "Attribuer un email de relances par défaut" dans la zone séquence/actions
- [x] 3.2 Si `impaye.relanceContact` est défini, afficher son nom et email en indicateur à côté du bouton (charger le Pointer avec `include: ['relanceContact']` dans la requête de fetch)

## 4. Frontend — Slideover d'attribution

- [x] 4.1 Créer le composant slideover (ou l'intégrer inline dans `[id].vue`) avec deux sections : recherche de contact existant et création d'un nouveau contact
- [x] 4.2 Implémenter la recherche live de contacts (min 2 caractères, requête Parse sur `Contact` par `nom` et `email`, limit 20)
- [x] 4.3 Implémenter la sélection d'un contact dans la liste de résultats avec mise en surbrillance
- [x] 4.4 Implémenter le formulaire de création de contact (champs : nom, email) avec validation email côté client
- [x] 4.5 Au clic sur "Confirmer" (contact sélectionné) ou "Créer et attribuer" (nouveau contact), appeler la Cloud Function `attribuerRelanceContact`, fermer le slideover, recharger l'impayé et les relances, afficher un message de succès

## 5. Frontend — Chargement du relanceContact au fetch de l'impayé

- [x] 5.1 Ajouter `include: ['relanceContact']` (ou équivalent Parse JS SDK) dans la requête de chargement de l'impayé dans `[id].vue` pour que le Pointer soit résolu côté client
