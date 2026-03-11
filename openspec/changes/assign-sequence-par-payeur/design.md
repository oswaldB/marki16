## Architecture

Aucun changement backend. Tout se passe côté frontend :

1. `impayes.vue` — ajout d'un bouton sur chaque ligne de groupe dans la vue "par payeur"
2. Nouveau composant `DrawerAssignSequence.vue` — drawer Naive UI (ou `USlideover` Nuxt UI) réutilisable

## Composant DrawerAssignSequence

**Props :**
- `open` (Boolean) — contrôle l'ouverture (v-model)
- `payeur` (String) — nom du payeur affiché en titre
- `impayes` (Array) — liste des impayés du groupe (objets plain avec `_parse`, `objectId`, `nfacture`, `reste_a_payer`, `sequenceNom`, `sequenceId`)
- `sequences` (Array) — liste des objets Parse `Sequence` disponibles

**Émits :**
- `update:open`
- `assigned` — après attribution réussie (pour recharger la liste parente)

**État interne :**
- `selection` — Set des `objectId` cochés (initialisé avec tous les objectId à l'ouverture)
- `sequenceChoisie` — id de la séquence sélectionnée
- `assigning` — booléen loading

## UI du Drawer

```
┌─────────────────────────────────────────┐
│  Attribuer une séquence                  [×]
│  Jean Dupont · 4 impayés                │
├─────────────────────────────────────────┤
│  Séquence                               │
│  [ Choisir une séquence...        ▼ ]   │
├─────────────────────────────────────────┤
│  Impayés (4)          [Tout cocher]     │
│  ☑  FAC-2024-001  1 250,00 €  ─── sans séquence   │
│  ☑  FAC-2024-002    890,00 €  ── Relance standard  │
│  ☑  FAC-2024-003  2 100,00 €  ─── sans séquence   │
│  ☐  FAC-2024-004    450,00 €  ─── Relance urgente  │
├─────────────────────────────────────────┤
│           [Annuler]  [Attribuer (3)]    │
└─────────────────────────────────────────┘
```

- Les impayés déjà dans une séquence affichent le nom en badge `sky` ; ceux sans séquence affichent "—"
- Le bouton "Attribuer" indique le nombre d'impayés sélectionnés entre parenthèses
- "Tout cocher" / "Tout décocher" toggle global

## Intégration dans impayes.vue

Dans le slot `#title-cell` de la vue par payeur, sur les lignes groupées, ajouter un bouton à droite :

```vue
<UButton
  v-if="row.getIsGrouped()"
  size="xs"
  variant="soft"
  color="sky"
  icon="i-heroicons-queue-list"
  @click.stop="ouvrirDrawerAssignation(row)"
>
  Attribuer séquence
</UButton>
```

État dans `impayes.vue` :
- `drawerAssignOpen` (Boolean)
- `drawerAssignPayeur` (String)
- `drawerAssignImpayes` (Array)

`ouvrirDrawerAssignation(row)` extrait `row.getLeafRows().map(r => r.original)` et peuple l'état.

## Logique d'attribution

Identique à l'existant dans `assignerSequence()` :
1. Pour chaque impayé sélectionné : supprimer les `Relance` pending via `$parse.Query`
2. Créer les nouvelles `Relance` à partir des emails de la séquence (délai J+N)
3. `impaye._parse.set('sequence', seqObj)` + `.save()`
4. Émettre `assigned` → le parent rappelle `chargerTout()`
