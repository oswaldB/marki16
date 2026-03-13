## 1. Composant `ToggleSwitch.vue`

- [x] 1.1 Créer `frontend/app/components/ToggleSwitch.vue` avec `v-model` booléen et prop `label` optionnelle — HTML identique au toggle existant
- [x] 1.2 Remplacer les 3 toggles inline dans `[id].vue` par `<ToggleSwitch>` (`validationObligatoire`, `attributionAutomatique`, format actif de l'email)

## 2. Composable `useSequenceRules.js` (corrige les bugs de duplication)

- [x] 2.1 Créer `frontend/app/composables/useSequenceRules.js` avec : `groupesRegles`, `attributionAutomatique`, `apercuConcernes`, `apercuExclus`, `impayesConcernes`, `showImpayesTable`
- [x] 2.2 Extraire la logique de construction de requête Parse (switch sur opérateurs) dans `buildImpayeQuery(groupes)` — **une seule implémentation** remplaçant les 3 copies actuelles
- [x] 2.3 Implémenter `calculerApercu()` en utilisant `buildImpayeQuery`
- [x] 2.4 Ajouter **un seul** `watch(showImpayesTable)` (supprimer le duplicata, lignes 1857–1938 dans l'original)
- [x] 2.5 Ajouter le debounce watcher sur `groupesRegles` → `calculerApercu`
- [x] 2.6 Exporter : `{ groupesRegles, attributionAutomatique, validationObligatoire, apercuConcernes, apercuExclus, impayesConcernes, showImpayesTable, calculerApercu, ajouterGroupeRegles, supprimerGroupe, ajouterRegleAuGroupe, supprimerRegle, chargerOptionsPourChamp }`

## 3. Composable `useLiensPaiement.js`

- [x] 3.1 Créer `frontend/app/composables/useLiensPaiement.js` avec : `liensPaiement`, `showLienModal`, `lienPaiementEdit`, `nouveauLienNom`, `editingLienId`, `lienVarsSearch`
- [x] 3.2 Porter les fonctions : `chargerLiensPaiement`, `ouvrirLienModal`, `editerLienPaiement`, `annulerEditionLien`, `supprimerLienPaiement`, `enregistrerNouveauLienPaiement`, `insererVariableEnLien`
- [x] 3.3 Porter le computed `lienPaiementApercu` et `filteredLienVars`

## 4. Composable `useSequenceEditor.js`

- [x] 4.1 Créer `frontend/app/composables/useSequenceEditor.js` avec : `loading`, `saving`, `publishing`, `sequence`, `nom`, `publiee`, `emails`, `smtpProfiles`
- [x] 4.2 Porter `charger(id)` — chargement Parse, migration des formats d'emails, chargement SMTP
- [x] 4.3 Porter `sauvegarder()` — sync editorRefs, save Parse
- [x] 4.4 Porter `togglePublication()`
- [x] 4.5 Porter `ajouterEmail()`, `supprimerEmail(key)`, `toggleEmailVisibility(key)`
- [x] 4.6 Porter les helpers : `getScenario`, `getCurrentCorps`, `updateCorps`, `switchScenario`
- [x] 4.7 Porter les constants : `VARIABLES`, `SCENARIO_FORMATS`, `EXEMPLE_VARS`, `scenarioTabs`, `editorOptions`, `champOptions`, `operateurOptions`
- [x] 4.8 Porter les computeds : `emailsSorted`, `smtpOptions`, `ALL_VARIABLES`, `LIENS_DE_PAIEMENT_VARS`, `filteredVars`
- [x] 4.9 Porter `onSmtpSaved`, `onSmtpChange`

## 5. Composable `useIaSequence.js`

- [x] 5.1 Créer `frontend/app/composables/useIaSequence.js` — accepte `(emails, allVariables, editorRefs)` en paramètre
- [x] 5.2 Porter : `showIaModal`, `iaResponse`, `copyPromptIA`, `validerIA`
- [x] 5.3 Porter : `showChatGptModal`, `chatGptEmailIdx`, `chatGptResponse`, `chatGptTargetFormat`, `openChatGptModal`, `copyChatGptPrompt`, `insererReponseChatGpt`

## 6. Composant `VariablesPicker.vue`

- [x] 6.1 Créer `frontend/app/components/VariablesPicker.vue` — props : `variables` (groupes), `activeScenario`, `emailKey` — emits : `copy(varName)`, `copyPaymentLink(lien)`, `openLiens`
- [x] 6.2 Porter le HTML du bloc variables (search input + grid de groupes + boutons chips)
- [x] 6.3 Masquer le groupe MULTIPLE si `activeScenario === 'single'` (logique actuelle conservée)

## 7. Composant `SequenceEmailCard.vue`

- [x] 7.1 Créer `frontend/app/components/SequenceEmailCard.vue` — props : `email`, `smtpOptions`, `allVariables`, `index` — emits : `delete`, `open-chatgpt`, `open-smtp`
- [x] 7.2 Porter le template `UCard` d'un email (header avec délai + boutons, body collapsible)
- [x] 7.3 Intégrer `ToggleSwitch` pour le toggle "Format actif"
- [x] 7.4 Intégrer `VariablesPicker`
- [x] 7.5 Gérer `editorRef` localement (expose `getInstance()` via `defineExpose` ou emit)

## 8. Composant `SequenceRulesSection.vue`

- [x] 8.1 Créer `frontend/app/components/SequenceRulesSection.vue` — v-model : `groupes` (Array), `attributionAutomatique` (Boolean)
- [x] 8.2 Instancier `useSequenceRules` en interne, recevoir les groupes par v-model
- [x] 8.3 Porter le template : groupes de règles, boutons ajouter groupe/règle/supprimer
- [x] 8.4 Porter l'aperçu live (concernes / exclus / bouton afficher)
- [x] 8.5 Porter le tableau `ImpayesConcernes` (inline dans ce composant, pas besoin de l'extraire)
- [x] 8.6 Intégrer `ToggleSwitch` pour le toggle "Attribution automatique"

## 9. Composant `DrawerLienPaiement.vue`

- [x] 9.1 Créer `frontend/app/components/DrawerLienPaiement.vue` — props : `liensPaiement`, `allVariables` — v-model:open — emits : `updated` (pour rafraîchir le parent)
- [x] 9.2 Porter le template UDrawer complet (liste, CRUD, textarea avec aperçu)
- [x] 9.3 Intégrer `VariablesPicker` (version filtrée sans liens de paiement)

## 10. Composants modals

- [x] 10.1 Créer `frontend/app/components/ModalIaSequence.vue` — v-model:open, props `emailCount` — emits : `validated(emails)`
- [x] 10.2 Porter le template UModal "Générer par IA" (copy prompt + textarea YAML + valider)
- [x] 10.3 Créer `frontend/app/components/ModalChatGptEmail.vue` — v-model:open, props `emailIdx`, `emailsSorted`, `allVariables`, `scenarioTabs` — emits : `insert({ idx, fmt, corps })`
- [x] 10.4 Porter le template UModal "Demander à ChatGPT" (boutons format, textarea réponse)

## 11. Refactor de la page `[id].vue`

- [x] 11.1 Remplacer tout le script par les imports des composables (`useSequenceEditor`, `useSequenceRules`, `useIaSequence`, `useLiensPaiement`)
- [x] 11.2 Remplacer le template par les composants extraits (`SequenceEmailCard`, `SequenceRulesSection`, `DrawerLienPaiement`, `ModalIaSequence`, `ModalChatGptEmail`, `SmtpDrawer`)
- [x] 11.3 Vérifier que `editorRefs` est bien transmis à `useSequenceEditor` (sauvegarder) et `useIaSequence` (validerIA, insererReponseChatGpt)
- [x] 11.4 Vérifier que `onMounted` appelle bien `charger(route.params.id)` et `chargerLiensPaiement()`
- [x] 11.5 Smoke test : charger une séquence, modifier un email, sauvegarder, publier, tester les règles

## 12. Nettoyage

- [x] 12.1 Supprimer les variables et fonctions orphelines dans `[id].vue` (ex : `reglesType`, `savingSmtp`, `copyLienPaiement` inutilisée)
- [x] 12.2 Vérifier qu'aucun `console.log` de debug n'a été ajouté
