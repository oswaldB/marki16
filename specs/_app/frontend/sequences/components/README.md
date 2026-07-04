# Composants de la page /sequences/

Cette documentation référence tous les composants Vue utilisés pour la gestion des séquences de relances et de suivi.

## Composants principaux

| Composant | Description | Fichier source |
|-----------|-------------|----------------|
| [SequenceRulesSection](./SequenceRulesSection.md) | Règles d'attribution automatique | `SequenceRulesSection.vue` |
| [SequenceEmailCard](./SequenceEmailCard.md) | Carte d'édition email (relances) | `SequenceEmailCard.vue` |
| [SequenceSuiviCard](./SequenceSuiviCard.md) | Carte d'édition email (suivi) | `SequenceSuiviCard.vue` |

## Composants utilitaires

| Composant | Description | Fichier source |
|-----------|-------------|----------------|
| [VariablesPicker](./VariablesPicker.md) | Sélection des variables de template | `VariablesPicker.vue` |
| [ToastuiEditor](./ToastuiEditor.md) | Éditeur WYSIWYG | `ToastuiEditor.vue` |
| [ToggleSwitch](./ToggleSwitch.md) | Interrupteur on/off | `ToggleSwitch.vue` |

## Slideovers de test

| Composant | Description | Fichier source |
|-----------|-------------|----------------|
| [SequenceTestSlideover](./SequenceTestSlideover.md) | Test d'une séquence complète | `SequenceTestSlideover.vue` |
| [SingleEmailTestSlideover](./SingleEmailTestSlideover.md) | Test d'un email individuel | `SingleEmailTestSlideover.vue` |
| [SuiviTestSlideover](./SuiviTestSlideover.md) | Test d'un email de suivi | `SuiviTestSlideover.vue` |

## Slideovers d'action

| Composant | Description | Fichier source |
|-----------|-------------|----------------|
| [SlideoverRegenererRelances](./SlideoverRegenererRelances.md) | Régénération des relances | `SlideoverRegenererRelances.vue` |
| [PauseSequenceDrawer](./PauseSequenceDrawer.md) | Mise en pause des relances | `PauseSequenceDrawer.vue` |
| [EmailSelectionSlideover](./EmailSelectionSlideover.md) | Sélection/création d'email | `EmailSelectionSlideover.vue` |

## Modaux

| Composant | Description | Fichier source |
|-----------|-------------|----------------|
| [ModalIaSequence](./ModalIaSequence.md) | Génération IA du contenu | `ModalIaSequence.vue` |

## Dépendances externes

Les composants utilisent :

- **@toast-ui/editor** : Pour l'édition WYSIWYG
- **@fullcalendar** : Pour les vues calendrier (dans RelanceDrawer)
- **Nuxt UI** : Pour les composants de base (UButton, UInput, etc.)
