## Context

La page `/sequences/[id]` est un éditeur de séquence. Le header contient déjà un bouton "Enregistrer" (`sauvegarder()`). Le composant utilise `sequence.value` (Parse Object) chargé au `onMounted`. Le frontend est en Nuxt 3 avec Nuxt UI v3 et TailwindCSS.

## Goals / Non-Goals

**Goals:**
- Ajouter un bouton Publier/Dépublier dans le header de `/sequences/[id]`
- Persister `sequence.publiee` dans Parse au clic
- Afficher un badge d'état (Brouillon / Publiée) visible dans le header et dans la liste
- Préserver le flow existant : le bouton Enregistrer reste indépendant

**Non-Goals:**
- Bloquer l'assignation d'une séquence non publiée (hors scope)
- Validation des emails avant publication
- Gestion des droits (admin seulement pour publier)

## Decisions

### 1. Publication indépendante du bouton Enregistrer

**Choix** : Le clic sur "Publier" effectue un `save()` immédiat du seul champ `publiee`, sans toucher aux autres champs. Le bouton "Enregistrer" conserve son comportement existant.

**Rationale** : Séparer les deux actions évite de sauvegarder des modifications partielles non voulues au moment de la publication. L'utilisateur peut publier la dernière version sauvegardée sans risque.

### 2. Champ `publiee` booléen simple

**Choix** : `Boolean`, défaut `false` (non publiée). Pas d'historique, pas de timestamp de publication.

**Rationale** : Simple et suffisant. Un timestamp (`publiee_le`) pourrait être ajouté dans un change ultérieur si nécessaire.

### 3. Badge dans le header, pas une bascule toggle

**Choix** : Deux états du bouton : quand `publiee = false` → bouton primaire "Publier" (vert) ; quand `publiee = true` → bouton outline "Dépublier" (gris). Un badge statique (`Brouillon` / `Publiée`) est affiché à côté du nom.

**Rationale** : Le toggle (switch) serait ambigu — l'utilisateur doit avoir une intention claire pour publier/dépublier. Un bouton avec libellé explicite est plus sûr.

### 4. Badge dans la liste `/sequences`

**Choix** : Ajout d'une colonne ou d'un badge inline dans chaque ligne de la liste, en lisant `sequence.get('publiee')`.

**Rationale** : Permet de voir en un coup d'œil quelles séquences sont opérationnelles sans ouvrir chaque détail.

## Implementation

### `frontend/app/pages/sequences/[id].vue`

**Header** (ligne ~5-18) — ajouter après le `UInput` nom et avant le bouton Enregistrer :

```vue
<!-- Badge statut -->
<UBadge :color="publiee ? 'success' : 'neutral'" variant="subtle" class="shrink-0">
  {{ publiee ? 'Publiée' : 'Brouillon' }}
</UBadge>

<!-- Bouton Publier / Dépublier -->
<UButton
  :icon="publiee ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
  :color="publiee ? 'neutral' : 'success'"
  :variant="publiee ? 'outline' : 'solid'"
  :loading="publishing"
  @click="togglePublication"
>
  {{ publiee ? 'Dépublier' : 'Publier' }}
</UButton>
```

**State** — dans `const` déclarations :
```js
const publiee = ref(false)
const publishing = ref(false)
```

**Chargement** — dans `onMounted` après assignation `sequence.value = seq` :
```js
publiee.value = seq.get('publiee') || false
```

**Action** :
```js
async function togglePublication() {
  publishing.value = true
  try {
    publiee.value = !publiee.value
    sequence.value.set('publiee', publiee.value)
    await sequence.value.save()
    toast.add({ title: publiee.value ? 'Séquence publiée' : 'Séquence dépubliée', color: 'success' })
  } catch (e) {
    publiee.value = !publiee.value // rollback
    toast.add({ title: 'Erreur', description: e.message, color: 'error' })
  } finally {
    publishing.value = false
  }
}
```

### `frontend/app/pages/sequences/index.vue`

Dans le rendu de chaque séquence, ajouter un `UBadge` :
```vue
<UBadge :color="seq.get('publiee') ? 'success' : 'neutral'" variant="subtle" size="sm">
  {{ seq.get('publiee') ? 'Publiée' : 'Brouillon' }}
</UBadge>
```

## Risks / Trade-offs

- **Race condition** : si l'utilisateur clique "Enregistrer" puis "Publier" rapidement, deux `save()` simultanés peuvent se chevaucher. Mitigation : les deux boutons ont un état `loading` qui les désactive pendant le save.
- **Pas de validation** : une séquence sans emails peut être publiée. Acceptable pour l'instant — la validation est hors scope.
