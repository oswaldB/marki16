# Workflow: enregistrer-relance

**Écran** : relances (vue validation)  
**Type** : Frontend lié  
**Feature** : F-009 Bouton Enregistrer - Vue Validation des Relances  

## Description

Sauvegarde les modifications apportées à une relance (objet, corps, cc) sans changer son statut de validation. Permet à l'agent de reprendre la validation plus tard sans perdre son travail.

## Entrées

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `relance` | ParseObject | oui | L'objet Parse Relance à sauvegarder |
| `editorRef` | Ref | oui | Référence vers l'éditeur ToastUI |

## Données modifiées

| Champ | Type | Description |
|-------|------|-------------|
| `sujet` | String | Objet de l'email |
| `contenu` | String | Corps HTML de l'email |
| `cc` | String | Destinataires en copie |

## Champ NON modifié

| Champ | Raison |
|-------|--------|
| `valide` | Ce workflow ne valide pas la relance, il sauvegarde uniquement |

---

## Spécification JSDoc

```javascript
/**
 * @workflow enregistrer-relance
 * @screen relances (vue validation)
 * @description Sauvegarde les modifications d'une relance sans valider.
 *   Les champs modifiés : sujet, contenu (corps), cc.
 *   Le statut 'valide' reste inchangé.
 *
 * @param {Object} params
 * @param {ParseObject} params.relance - L'objet Relance Parse à sauvegarder
 * @param {Ref} params.editorRef - Référence vers l'instance ToastUI Editor
 *
 * @returns {Promise<{success: boolean, relanceId: string}>}
 *
 * @checkpoint enregistrer-relance-start
 *   Émis au début de la sauvegarde.
 *   Log: [CHECKPOINT] enregistrer-relance:start { relanceId: "..." }
 *   UI: Le bouton passe en état "loading"
 *
 * @checkpoint enregistrer-relance-editor-read
 *   Lecture du contenu HTML depuis l'éditeur ToastUI.
 *   Log: [CHECKPOINT] enregistrer-relance:editor-read { length: number }
 *
 * @checkpoint enregistrer-relance-parse-save
 *   Appel à Parse.Object.save() avec les champs modifiés.
 *   Log: [CHECKPOINT] enregistrer-relance:parse-save { 
 *     sujet: "...",
 *     cc: "...",
 *     contenuLength: number 
 *   }
 *
 * @checkpoint enregistrer-relance-success
 *   Sauvegarde réussie. Toast de confirmation affiché.
 *   Log: [CHECKPOINT] enegistrer-relance:success { 
 *     relanceId: "...",
 *     updatedAt: "..."
 *   }
 *   UI: Toast "Modifications enregistrées" (vert)
 *
 * @checkpoint enregistrer-relance-error
 *   Erreur lors de la sauvegarde. Toast d'erreur affiché.
 *   Log: [CHECKPOINT] enregistrer-relance:error { 
 *     relanceId: "...",
 *     error: "...",
 *     code: "..."
 *   }
 *   UI: Toast "Erreur lors de l'enregistrement" (rouge)
 *
 * @state saving
 *   Le bouton "Enregistrer" affiche un spinner et est désactivé.
 *   Dure pendant toute l'exécution du workflow.
 *
 * @state idle
 *   Le bouton est actif. Affiché quand hasUnsavedChanges est true.
 *
 * @state disabled
 *   Le bouton est grisé. Affiché quand aucune modification n'est détectée.
 */

async function enregistrerRelance({ relance, editorRef }) {
  // Implementation
}
```

---

## Scénarios de test

### Scénario 1 : Enregistrement nominal
**Given** : L'utilisateur est sur la vue validation avec une relance sélectionnée  
**And** : Il a modifié le corps de l'email dans ToastUI  
**When** : Il clique sur le bouton "Enregistrer"  
**Then** :
1. `[CHECKPOINT] enregistrer-relance:start` est émis avec l'ID de la relance
2. Le bouton passe en état `saving` (spinner + texte "Enregistrement...")
3. `[CHECKPOINT] enregistrer-relance:editor-read` est émis avec la longueur du HTML
4. Les champs `sujet`, `contenu`, `cc` sont mis à jour sur l'objet Parse
5. `[CHECKPOINT] enregistrer-relance:parse-save` est émis
6. L'appel `await relance.save()` réussit
7. `[CHECKPOINT] enregistrer-relance:success` est émis avec `updatedAt`
8. Un toast vert "Modifications enregistrées" s'affiche
9. Le bouton revient en état `disabled` (pas de modifications)
10. La relance reste dans la liste "À valider"

### Scénario 2 : Aucune modification détectée
**Given** : L'utilisateur sélectionne une relance  
**And** : Il ne fait aucune modification  
**When** : Le bouton "Enregistrer" est affiché  
**Then** :
1. Le bouton est en état `disabled` (grisé)
2. Le clic est impossible
3. Aucun checkpoint n'est émis

### Scénario 3 : Erreur réseau lors de la sauvegarde
**Given** : L'utilisateur a modifié une relance  
**And** : La connexion réseau est interrompue  
**When** : Il clique sur "Enregistrer"  
**Then** :
1. `[CHECKPOINT] enregistrer-relance:start` est émis
2. `[CHECKPOINT] enregistrer-relance:parse-save` est émis
3. L'appel `await relance.save()` échoue avec une erreur réseau
4. `[CHECKPOINT] enregistrer-relance:error` est émis avec `{ error: "Network error" }`
5. Un toast rouge "Erreur lors de l'enregistrement" s'affiche
6. Le bouton revient en état `idle` (actif, car modifications toujours présentes)
7. Les modifications locales sont conservées

### Scénario 4 : Changement de relance après enregistrement
**Given** : L'utilisateur vient d'enregistrer une relance  
**And** : Le toast de succès est affiché  
**When** : Il clique sur une autre relance dans la liste  
**Then** :
1. `hasUnsavedChanges` retourne `false`
2. Aucune modal de confirmation n'apparaît
3. La nouvelle relance est chargée immédiatement
4. L'éditeur ToastUI se réinitialise avec le contenu de la nouvelle relance

### Scénario 5 : Changement de relance avec modifications non sauvegardées
**Given** : L'utilisateur a modifié une relance sans cliquer "Enregistrer"  
**When** : Il clique sur une autre relance  
**Then** :
1. `hasUnsavedChanges` retourne `true`
2. Une modal de confirmation s'affiche avec 3 options
3. **Si "Enregistrer"** : Le workflow `enregistrer-relance` s'exécute, puis la nouvelle relance est chargée
4. **Si "Abandonner"** : La nouvelle relance est chargée, modifications perdues
5. **Si "Annuler"** : La modal se ferme, on reste sur la relance actuelle

---

## Dépendances

- **Composant** : `ToastuiEditor` (lecture du contenu HTML)
- **API Parse** : `Parse.Object.save()` (persistance)
- **Global** : `useToast()` (notifications)

## Structure de données

### Entrée : Relance (Parse Object)

```javascript
{
  id: "abc123",
  get: (field) => value,
  set: (field, value) => void,
  save: () => Promise
}
```

### Champs modifiables

```typescript
interface RelanceEditableFields {
  sujet: string;      // Objet de l'email
  contenu: string;    // Corps HTML
  cc: string;         // Destinaires en copie
}
```

### Sortie

```typescript
interface EnregistrerRelanceResult {
  success: boolean;
  relanceId: string;
  updatedAt: string;  // ISO date
}
```

---

## UI États et transitions

```
┌─────────────────────────────────────────────┐
│  [Enregistrer] [Valider] [Actions ▼]        │
└─────────────────────────────────────────────┘

        │ clic (si modifications)
        ▼
┌─────────────────────────────────────────────┐
│  [⏳ Enregistrement...] [Valider] [Actions ▼]│  ← saving=true
└─────────────────────────────────────────────┘

        │ await relance.save() success
        ▼
┌─────────────────────────────────────────────┐
│  [Enregistrer] [Valider] [Actions ▼]        │  ← saving=false
│       ↑ disabled (pas de modifs)            │
└─────────────────────────────────────────────┘
        +
   ┌──────────────────┐
   │ ✅ Modifications │  ← Toast vert
   │   enregistrées   │
   └──────────────────┘

        │ OR await relance.save() error
        ▼
┌─────────────────────────────────────────────┐
│  [Enregistrer] [Valider] [Actions ▼]        │  ← saving=false
│       ↑ active (modifs toujours là)         │
└─────────────────────────────────────────────┘
        +
   ┌──────────────────┐
   │ ❌ Erreur        │  ← Toast rouge
   │   Network error  │
   └──────────────────┘
```

---

## Intégration avec le workflow "valider-relance"

Le workflow `valider-relance` (existant) doit être modifié pour :
1. Sauvegarder implicitement avant de valider (appeler le même code que `enregistrer-relance`)
2. Puis marquer `valide = true`
3. Puis sauvegarder à nouveau

```javascript
async function validerRelanceWorkflow() {
  // Étape 1 : Sauvegarder les modifications (même logique qu'enregistrer-relance)
  await sauvegarderModifications() 
  
  // Étape 2 : Valider
  relance.set('valide', true)
  await relance.save()
}
```

Cela garantit que les modifications sont toujours sauvegardées, même si l'agent clique directement sur "Valider".

---

## Logs de debugging

```
[CHECKPOINT] enregistrer-relance:start { relanceId: "abc123" }
[CHECKPOINT] enregistrer-relance:editor-read { length: 1523 }
[CHECKPOINT] enregistrer-relance:parse-save { sujet: "Relance...", cc: "copie@test.com", contenuLength: 1523 }
[CHECKPOINT] enregistrer-relance:success { relanceId: "abc123", updatedAt: "2024-06-30T10:30:00Z" }

// En cas d'erreur :
[CHECKPOINT] enregistrer-relance:error { relanceId: "abc123", error: "Network request failed", code: 100 }
```
