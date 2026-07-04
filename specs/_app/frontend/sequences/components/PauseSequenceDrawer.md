# Component: PauseSequenceDrawer

**Chemin** : `frontend/app/components/PauseSequenceDrawer.vue`
**Utilisation** : Mise en pause des relances d'un impayé

## Description

Slideover permettant de mettre temporairement en pause les relances d'un impayé spécifique en décalant leurs dates d'envoi.

## Props

| Nom | Type | Requis | Description |
|-----|------|--------|-------------|
| `modelValue` | `Boolean` | | État d'ouverture |
| `impayelId` | `String` | | ID de l'impayé concerné |

## Événements

| Nom | Payload | Description |
|-----|---------|-------------|
| `update:modelValue` | `Boolean` | Mise à jour de l'état |
| `success` | | Pause appliquée avec succès |

## Options de pause

| Option | Durée | Description |
|--------|-------|-------------|
| `7j` | 7 jours | Pause courte |
| `1m` | 30 jours | Pause d'un mois |
| `custom` | Variable | Date personnalisée |

## Calcul du décalage

```javascript
const joursDecalage = computed(() => {
  if (choix.value === '7j') return 7
  if (choix.value === '1m') return 30
  if (choix.value === 'custom') {
    const today = new Date()
    const cible = new Date(dateCustom.value)
    return Math.round((cible - today) / 86_400_000) // ms → jours
  }
  return 0
})
```

## Action sur les relances

```javascript
// Récupère les relances en attente (statut: 'pending')
const query = new $parse.Query('Relance')
query.equalTo('impaye', impayePtr)
query.equalTo('statut', 'pending')

// Décale chaque dateEnvoi
for (const relance of relances) {
  const date = relance.get('dateEnvoi')
  if (date) {
    const nouvelle = new Date(date)
    nouvelle.setDate(nouvelle.getDate() + joursDecalage)
    relance.set('dateEnvoi', nouvelle)
  }
}
await $parse.Object.saveAll(relances)
```

## Message de confirmation

Affiche le nombre de relances décalées et la durée :
> "3 relances décalées de 7 jours"
