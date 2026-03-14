## Context

Actuellement, `assignerSequence` exige que `impaye.payeur_email` soit renseigné pour créer des relances. Quand le payeur n'a pas d'email (contact `db_externe` sans adresse), il est impossible d'assigner une séquence. La seule solution existante est de modifier directement le contact, ce qui n'est pas toujours possible (contacts `db_externe` en lecture seule).

Il faut donc un mécanisme pour indiquer, au niveau de l'impayé, un email de relances alternatif porté par un contact de référence.

## Goals / Non-Goals

**Goals:**
- Permettre à l'utilisateur d'attribuer un contact de relances par défaut (`relanceContact`) à un impayé depuis la page `/impayes/[id]`
- Ce contact peut être créé à la volée ou sélectionné parmi les contacts existants
- Toutes les relances `pending` existantes de l'impayé sont mises à jour avec le nouvel email (`to`)
- La logique de peuplement des relances (`assignerSequence`, `appliquerReglesAttributionAutomatique`) utilise `relanceContact.email` en priorité sur `payeur_email`

**Non-Goals:**
- Modifier le contact payeur existant
- Gérer plusieurs emails de relances par impayé
- Modifier les relances déjà envoyées (`envoyé`) ou annulées (`annulé`)

## Decisions

### D1 — Pointer `relanceContact` sur `Impaye` (type `Contact`)

Plutôt que de stocker directement un email, on stocke un Pointer vers la classe `Contact` existante. Cela permet :
- D'afficher le nom du contact de relances dans l'UI
- De réutiliser les contacts existants (source `db_externe` ou `upload`)
- Pour la création, on crée un nouveau Contact avec `source: 'relance'` (non-sync, éditable)

Alternative rejetée : stocker un champ `relance_email` string sur `Impaye` — plus simple mais perd le lien avec l'entité Contact et ne permet pas d'afficher le nom.

### D2 — `construireDestinataires` : priorité à `relanceContact`

Lorsqu'un `relanceContact` est défini sur l'impayé, `[[payeur_email]]` est résolu avec `relanceContact.get('email')` au lieu de `payeur_email` / `payeur_contact_email`.

Cela permet à toutes les séquences existantes utilisant `[[payeur_email]]` de bénéficier automatiquement du nouvel email sans modifier les templates.

### D3 — Cloud Function `attribuerRelanceContact`

Paramètres : `impayelId`, et soit `contactId` (contact existant) soit `{ nom, email }` (nouveau contact à créer).

Étapes :
1. Créer le contact si nécessaire (`source: 'relance'`)
2. Sauvegarder `relanceContact` sur l'impayé
3. Mettre à jour le champ `to` de toutes les relances `pending` de l'impayé via `construireDestinataires` (qui lira le nouveau `relanceContact`)
4. Retourner le contact sauvegardé

### D4 — Slideover frontend : deux modes (création / sélection)

Le slideover a deux onglets ou deux sections :
- **Sélectionner un contact existant** : input de recherche textuelle sur `nom` + `email`, affiche une liste de résultats
- **Créer un nouveau contact** : formulaire minimal (nom + email)

Une fois le contact choisi/créé, le frontend appelle `attribuerRelanceContact` puis recharge l'impayé et les relances.

### D5 — Levée du blocage email dans `assignerSequence`

La vérification `if (!impaye.get('payeur_email'))` est étendue : on accepte aussi un `relanceContact` avec email. Le message d'erreur est adapté.

## Risks / Trade-offs

- **Désynchronisation `to` / `relanceContact`** : Si le contact est modifié après attribution, les relances `pending` ne sont PAS automatiquement re-générées. Acceptable pour la v1.
  → Mitigation : afficher clairement l'email actuel dans le slideover ; un futur cron de cohérence pourrait être ajouté.

- **Contact `relance` orphelin** : Si l'utilisateur change plusieurs fois de `relanceContact`, les anciens contacts `source: 'relance'` créés à la volée restent en base.
  → Mitigation : acceptable ; pas de nettoyage automatique en v1.

- **Pagination dans la recherche de contact** : La recherche live utilise `limit: 20`. Pour de larges bases, certains contacts pourraient ne pas apparaître.
  → Mitigation : l'utilisateur peut affiner sa recherche textuelle.
