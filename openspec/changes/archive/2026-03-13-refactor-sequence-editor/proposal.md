## Why

La page `sequences/[id].vue` fait 1947 lignes (~87 Ko). Elle mélange dans un seul fichier : le chargement/sauvegarde de la séquence, l'édition des emails par scénario, la gestion des règles d'attribution, la génération par IA, la gestion des liens de paiement, et trois modals/drawers. Cela la rend difficile à lire, à déboguer et à faire évoluer.

En plus, deux bugs sont présents :
- Le watcher `watch(showImpayesTable, ...)` est **dupliqué en entier** (lignes 1768 et 1857 — code identique)
- La logique de construction de requête Parse est **copiée-collée** dans `calculerApercu` et dans le watcher dupliqué

## What Changes

### Composants extraits

- **`ToggleSwitch.vue`** — toggle ON/OFF réutilisable (actuellement dupliqué 3× inline : validationObligatoire, attributionAutomatique, format actif de l'email)
- **`SequenceEmailCard.vue`** — carte d'un email : délai, champ `à`, onglets scénario, éditeur ToastUI, variables picker
- **`SequenceRulesSection.vue`** — section complète des règles : groupes de règles, aperçu live, tableau des impayés concernés
- **`DrawerLienPaiement.vue`** — drawer de gestion des liens de paiement (liste, CRUD, variables picker)
- **`ModalIaSequence.vue`** — modal "Générer par IA" (prompt global + YAML)
- **`ModalChatGptEmail.vue`** — modal "Demander à ChatGPT" par email
- **`VariablesPicker.vue`** — sélecteur de variables (réutilisé dans EmailCard et DrawerLienPaiement)

### Composables extraits

- **`useSequenceEditor.js`** — état principal (`nom`, `publiee`, `emails`, `saving`…), `charger()`, `sauvegarder()`, `togglePublication()`
- **`useSequenceRules.js`** — état des règles (`groupesRegles`, `attributionAutomatique`), `calculerApercu()`, `buildImpayeQuery()` (factorise la logique dupliquée), watchers
- **`useIaSequence.js`** — génération par IA (copyPromptIA, validerIA) et ChatGPT (copyChatGptPrompt, insererReponseChatGpt)
- **`useLiensPaiement.js`** — chargement, création, modification, suppression des liens de paiement

### Page résultante

`sequences/[id].vue` se réduit à ~100 lignes : template de mise en page, orchestration des composants, appels aux composables.

## Capabilities

### Modified Capabilities

- `sequence-editor` : même comportement utilisateur exact, code découpé en composants/composables cohérents

## Impact

- **Frontend uniquement** — aucun changement backend ni de schéma de données
- Fichiers créés : ~10 nouveaux fichiers dans `frontend/app/components/` et `frontend/app/composables/`
- Fichier réduit : `frontend/app/pages/sequences/[id].vue` passe de ~1950 à ~100 lignes
- Deux bugs corrigés en passant (watcher dupliqué + logique de requête dupliquée)
