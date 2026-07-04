# Component: ModalIaSequence

**Chemin** : `frontend/app/components/ModalIaSequence.vue`
**Utilisation** : Génération de contenu par IA (ChatGPT)

## Description

Modal permettant de générer le contenu des emails via ChatGPT en copiant un prompt, puis en collant la réponse YAML.

## Props

| Nom | Type | Requis | Description |
|-----|------|--------|-------------|
| `open` | `Boolean` | | État d'ouverture |
| `modelValue` | `String` | | Réponse YAML de ChatGPT |

## Événements

| Nom | Payload | Description |
|-----|---------|-------------|
| `update:open` | `Boolean` | Mise à jour de l'état |
| `update:modelValue` | `String` | Réponse YAML saisie |
| `copyPrompt` | | Demande de copie du prompt |
| `validate` | `yamlResponse` | Validation et remplacement |

## Workflow

1. **Copier le prompt** : Génère un prompt structuré pour ChatGPT
2. **Coller dans ChatGPT** : L'utilisateur va sur chat.openai.com
3. **Copier la réponse YAML** : ChatGPT retourne une structure YAML
4. **Coller la réponse** : Dans le textarea du modal
5. **Valider** : Parse le YAML et remplace les emails

## Format YAML attendu

```yaml
---
- delai: 7
  scenarios:
    - format: single
      objet: "Rappel facture <%= nfacture %>"
      corps: |
        Bonjour <%= payeur_nom %>,
        
        Nous vous rappelons...
    - format: multiple
      objet: "Rappel <%= nb_impayes %> factures"
      corps: |
        Bonjour <%= payeur_nom %>,
        
        Vous avez <%= nb_impayes %> factures...
```

## Génération du prompt

Le prompt inclut :
- Contexte de l'entreprise
- Variables disponibles
- Exemples de ton (amicale, ferme, mise en demeure)
- Structure YAML attendue

## Exemple d'utilisation

```vue
<ModalIaSequence
  v-model:open="showIaModal"
  v-model="iaResponse"
  @copy-prompt="generatePrompt"
  @validate="applyIaResponse"
/>
```
