# Component: SlideoverRegenererRelances

**Chemin** : `frontend/app/components/SlideoverRegenererRelances.vue`
**Utilisation** : Régénération des relances d'une séquence

## Description

Slideover permettant de régénérer les relances d'une séquence avec options pour réinitialiser les dates et inclure les relances déjà envoyées.

## Props

| Nom | Type | Requis | Description |
|-----|------|--------|-------------|
| `open` | `Boolean` | ✓ | État d'ouverture |
| `sequence` | `Object` | ✓ | Séquence à régénérer |

## Événements

| Nom | Payload | Description |
|-----|---------|-------------|
| `update:open` | `Boolean` | Mise à jour de l'état |
| `confirmed` | `{ resetDates, includeSent }` | Confirmation avec options |

## Options de régénération

### Dates des relances

| Option | Description |
|--------|-------------|
| `resetDates: false` | Garder les dates existantes |
| `resetDates: true` | Repartir de 0 avec de nouvelles dates |

### Périmètre

| Option | Description |
|--------|-------------|
| `includeSent: false` | Seulement les relances non envoyées |
| `includeSent: true` | Toute la séquence (y compris envoyées) |

## Utilisation

```vue
<SlideoverRegenererRelances
  v-model:open="showRegenSlideover"
  :sequence="currentSequence"
  @confirmed="onRegenererConfirmed"
/>
```

## Logique de régénération

Généralement appelée via une Cloud Function ou une action store :

```javascript
async function onRegenererConfirmed(options) {
  await $parse.Cloud.run('regenerateRelances', {
    sequenceId: sequence.id,
    resetDates: options.resetDates,
    includeSent: options.includeSent
  })
}
```

## États du bouton

- `loading: true` pendant la confirmation
- Désactivé si aucune option n'est sélectionnée
