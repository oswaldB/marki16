## Context

`frontend/app/pages/sequences/[id].vue` est 1947 lignes. Le projet est Nuxt 3 + Nuxt UI v3 + TailwindCSS + Parse JS SDK. Les composants existants sont dans `frontend/app/components/`. Les composables vont dans `frontend/app/composables/`. Parse est accessible via `useNuxtApp().$parse`.

## Goals / Non-Goals

**Goals:**
- Découper la page en composants et composables sans changer le comportement utilisateur
- Supprimer le code dupliqué (watcher + buildQuery)
- Rendre chaque fichier lisible et maintenable indépendamment

**Non-Goals:**
- Changer le design ou les fonctionnalités
- Migrer vers TypeScript
- Ajouter des tests

## Decisions

### 1. Composables pour la logique, composants pour la vue

**Choix** : Séparer l'état et la logique dans des composables (`use*.js`), et la vue dans des composants (`.vue`).

**Rationale** : Nuxt 3 / Vue 3 Composition API — les composables permettent de partager l'état entre composants siblings (ex : `useIaSequence` a besoin des `emails` de `useSequenceEditor`) via `provide/inject` ou en passant les refs en props.

### 2. Stratégie de communication parent → enfant

**Choix** : La page passe les données aux composants via `props` et écoute leurs `emit`. Les composables sont instanciés dans la page et leurs refs sont passées en props là où nécessaire.

**Rationale** : Évite les imports circulaires entre composables et garde les composants testables isolément.

### 3. `buildImpayeQuery` factorisé dans `useSequenceRules`

**Choix** : Extraire la construction de la requête Parse (switch sur opérateurs) dans une fonction `buildImpayeQuery(groupesRegles)` utilisée par `calculerApercu` et le watcher `showImpayesTable`.

**Rationale** : Corrige la duplication identique actuelle (~100 lignes copiées-collées).

### 4. `watch(showImpayesTable)` dédupliqué

**Choix** : Garder un seul watcher dans `useSequenceRules`, appeler `buildImpayeQuery` dedans.

**Rationale** : Le bug actuel (deux watchers identiques) provoque une double requête inutile à chaque fois que le tableau est affiché.

### 5. `ToggleSwitch.vue` générique

**Choix** : Composant avec `v-model` (booléen) et prop `label` optionnelle.

**Rationale** : Le toggle est copié 3× inline avec exactement le même HTML de 11 lignes. Un composant évite la divergence future.

## Implementation

### Arborescence cible

```
frontend/app/
  components/
    ToggleSwitch.vue                  # toggle ON/OFF générique (v-model Boolean)
    VariablesPicker.vue               # liste de variables cliquables + search
    SequenceEmailCard.vue             # carte d'un email (délai, scénarios, éditeur, vars)
    SequenceRulesSection.vue          # section règles + aperçu + tableau impayés
    DrawerLienPaiement.vue            # drawer CRUD liens de paiement
    ModalIaSequence.vue               # modal génération IA globale
    ModalChatGptEmail.vue             # modal ChatGPT par email
  composables/
    useSequenceEditor.js              # load/save/publish + état principal
    useSequenceRules.js               # règles, buildImpayeQuery, calculerApercu
    useIaSequence.js                  # IA + ChatGPT generation
    useLiensPaiement.js               # CRUD liens de paiement
  pages/
    sequences/
      [id].vue                        # ~100 lignes : mise en page + orchestration
```

### Interface `ToggleSwitch.vue`

```vue
<ToggleSwitch v-model="validationObligatoire" label="Validation obligatoire" />
```
Props : `modelValue: Boolean`, `label?: String`. Emit : `update:modelValue`.

### Interface `VariablesPicker.vue`

```vue
<VariablesPicker
  :variables="allVariables"
  :active-scenario="email.activeScenario"
  :email-key="email._key"
  @copy="onVariableCopied"
  @open-liens="ouvrirLienModal"
/>
```

### Interface `SequenceEmailCard.vue`

```vue
<SequenceEmailCard
  v-for="email in emailsSorted"
  :key="email._key"
  :email="email"
  :smtp-options="smtpOptions"
  :all-variables="allVariables"
  @delete="supprimerEmail"
  @corps-change="updateCorps"
  @open-smtp="showSmtpModal = true"
  @open-chatgpt="openChatGptModal"
/>
```

### Interface `SequenceRulesSection.vue`

```vue
<SequenceRulesSection
  v-model:groupes="groupesRegles"
  v-model:attribution-automatique="attributionAutomatique"
/>
```
La section gère elle-même l'aperçu via `useSequenceRules` instancié en interne.

### `useSequenceEditor.js` — exports

```js
export function useSequenceEditor() {
  // State
  const loading, saving, publishing
  const sequence, nom, publiee
  const emails, smtpProfiles
  // Actions
  async function charger(id) { ... }
  async function sauvegarder() { ... }
  async function togglePublication() { ... }
  function ajouterEmail() { ... }
  function supprimerEmail(key) { ... }
  return { loading, saving, publishing, sequence, nom, publiee, emails, smtpProfiles, charger, sauvegarder, togglePublication, ajouterEmail, supprimerEmail }
}
```

### `useSequenceRules.js` — exports

```js
export function useSequenceRules(parse) {
  const groupesRegles, attributionAutomatique, validationObligatoire
  const apercuConcernes, apercuExclus, impayesConcernes, showImpayesTable
  function buildImpayeQuery(groupes) { /* logique switch unique */ }
  async function calculerApercu() { ... }
  // Un seul watcher sur showImpayesTable
  return { groupesRegles, attributionAutomatique, validationObligatoire, apercuConcernes, apercuExclus, impayesConcernes, showImpayesTable, calculerApercu, buildImpayeQuery, ... }
}
```

### `useIaSequence.js` — exports

```js
export function useIaSequence(emails, allVariables, editorRefs) {
  const showIaModal, iaResponse
  const showChatGptModal, chatGptEmailIdx, chatGptResponse, chatGptTargetFormat
  async function copyPromptIA() { ... }
  function validerIA() { ... }
  function openChatGptModal(idx) { ... }
  async function copyChatGptPrompt(fmt) { ... }
  function insererReponseChatGpt() { ... }
  return { showIaModal, iaResponse, showChatGptModal, chatGptEmailIdx, chatGptResponse, chatGptTargetFormat, copyPromptIA, validerIA, openChatGptModal, copyChatGptPrompt, insererReponseChatGpt }
}
```

### `useLiensPaiement.js` — exports

```js
export function useLiensPaiement(parse) {
  const liensPaiement, showLienModal
  const lienPaiementEdit, nouveauLienNom, editingLienId
  async function chargerLiensPaiement() { ... }
  async function enregistrerNouveauLienPaiement() { ... }
  async function supprimerLienPaiement(id) { ... }
  function ouvrirLienModal() { ... }
  function editerLienPaiement(lien) { ... }
  return { liensPaiement, showLienModal, lienPaiementEdit, nouveauLienNom, editingLienId, chargerLiensPaiement, enregistrerNouveauLienPaiement, supprimerLienPaiement, ouvrirLienModal, editerLienPaiement }
}
```

### Page `[id].vue` résultante (~100 lignes)

```vue
<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <NuxtLink to="/sequences">← Retour</NuxtLink>
      <UInput v-model="nom" ... />
      <UBadge ... />
      <UButton @click="togglePublication">...</UButton>
      <UButton @click="sauvegarder">Enregistrer</UButton>
    </div>

    <ToggleSwitch v-model="validationObligatoire" label="Validation obligatoire" />

    <!-- Emails -->
    <UCard>
      <SequenceEmailCard v-for="email in emailsSorted" ... />
      <UButton @click="ajouterEmail">Ajouter un email</UButton>
    </UCard>

    <!-- Règles -->
    <SequenceRulesSection v-model:groupes="groupesRegles" ... />

    <!-- Drawers / Modals -->
    <DrawerLienPaiement v-model:open="showLienModal" ... />
    <ModalIaSequence v-model:open="showIaModal" ... />
    <ModalChatGptEmail v-model:open="showChatGptModal" ... />
    <SmtpDrawer v-model="showSmtpModal" @saved="onSmtpSaved" />
  </div>
</template>
```

## Risks / Trade-offs

- **editorRefs** : le dictionnaire de refs ToastUI doit rester accessible aux composables IA et à `sauvegarder()`. Solution : `editorRefs` reste dans la page, passé en param aux composables qui en ont besoin.
- **Migration douce** : chaque composant/composable peut être extrait indépendamment, la page restant fonctionnelle à chaque étape. Ordre recommandé : ToggleSwitch → composables → composants.
