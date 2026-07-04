# Component: ToggleSwitch

**Chemin** : `frontend/app/components/ToggleSwitch.vue`
**Utilisation** : Interrupteur on/off stylisé avec labels

## Description

Composant de toggle switch personnalisé avec indicateurs visuels ON/OFF et animation de glissement.

## Props

| Nom | Type | Requis | Description |
|-----|------|--------|-------------|
| `modelValue` | `Boolean` | ✓ | État du toggle (true = ON) |

## Événements

| Nom | Payload | Description |
|-----|---------|-------------|
| `update:modelValue` | `Boolean` | Changement d'état |

## Styles

- **ON** : Fond vert (`bg-green-500`), curseur à droite, label "ON"
- **OFF** : Fond gris (`bg-gray-300`), curseur à gauche, label "OFF"
- Taille : `h-6 w-11` (44px x 24px)
- Curseur : `h-4 w-4` avec ombre

## Accessibilité

- Bouton natif avec `type="button"`
- Support du focus avec `focus:outline-none`
- Transitions fluides sur les couleurs et positions

## Exemple d'utilisation

```vue
<ToggleSwitch v-model="estActive" />
<ToggleSwitch 
  :model-value="scenario.active" 
  @update:model-value="scenario.active = $event"
/>
```

## Utilisé dans

- Activation/désactivation des scénarios d'email
- Toggle d'attribution automatique
- Activation des formats d'email
