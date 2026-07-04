# Page: relances.vue

**Chemin** : `frontend/app/pages/relances.vue`  
**Type** : Page Nuxt 3 (Composition API)  
**Feature** : F-007 Relances email + F-009 Bouton Enregistrer  

## Description

Page de gestion des relances permettant de visualiser, modifier, valider et envoyer des emails de relance aux clients débiteurs. Comprend trois vues : tableau, calendrier et validation.

## Vues disponibles

| Vue | Description | Paramètre URL |
|-----|-------------|---------------|
| `tableau` | Liste tabulaire des relances avec filtrage | `?vue=tableau` (défaut) |
| `calendrier` | Vue calendrier avec événements | `?vue=calendrier` |
| `validation` | Interface de validation des relances | `?vue=validation` |

## Sections principales

### 1. Barre de filtres (commune aux 3 vues)
- Toggle de vue (Tableau / Calendrier / Validation)
- Sélecteur de statut
- Sélecteur de séquence
- Recherche textuelle
- Bouton "Créer des relances"

### 2. Vue Tableau
- Tableau `UTable` avec colonnes triables
- Gestion de la sélection multiple
- Barre d'actions groupées flottante
- Actions par ligne : voir, modifier, annuler, réessayer

### 3. Vue Calendrier
- Composant `FullCalendar` avec événements colorés
- Panneau latéral des relances du jour sélectionné
- Navigation mois/semaine/jour

### 4. Vue Validation (F-009)
**Layout** : 3 colonnes sur desktop

| Colonne | Contenu |
|---------|---------|
| Gauche (1/3) | Liste des relances à valider avec recherche et sélection |
| Centre+Droite (2/3) | Éditeur de la relance sélectionnée |

**Composants de la vue validation :**
- **Header** : Titre, position, boutons Enregistrer/Valider/Actions
- **Infos** : Date d'envoi, Destinataire (À), CC, Objet (lecture seule)
- **Éditeur** : `ToastuiEditor` pour le corps HTML (modifiable)
- **PDFs** : Prévisualisation des factures liées avec `PdfIframe`
- **Alerte** : Message sur la pièce jointe automatique

## État local principal

```javascript
// Vue active
const vue = ref('tableau') // 'tableau' | 'calendrier' | 'validation'

// Données
const relances = ref([])
const relanceCourante = ref(null) // Pour la vue validation
const relanceDrawer = ref(null) // Pour le slideover

// Filtres
const filtreStatut = ref('tous')
const filtreSequence = ref('tous')
const search = ref('')
const validationSearch = ref('')
const modeTriValidation = ref('chronologique') // 'chronologique' | 'destinataire'

// Édition
const editorDrawerRef = ref(null) // Référence ToastUI
const applyToAllFollowing = ref(false)
const originalToValue = ref('')

// États de chargement
const loading = ref(false)
const savingDrawer = ref(false)
const validating = ref(false) // F-009 : distinct de saving
const saving = ref(false)     // F-009 : pour le bouton Enregistrer

// Sélection en masse (validation)
const selectedRelancesForBulk = ref([])
const bulkValidating = ref(false)
```

## Computed importantes

| Computed | Description |
|----------|-------------|
| `relancesAValider` | Relances non validées et non manuelles, avec filtres et tri |
| `relancesFiltrees` | Relances filtrées par recherche textuelle |
| `positionRelanceCourante` | Index + 1 de la relance courante dans la liste |
| `hasUnsavedChanges` | **F-009** : Détecte si des modifications sont non sauvegardées |
| `peutPasser` | Booléen indiquant si on peut passer à la relance suivante |

## Méthodes principales

### Chargement
- `charger()` : Charge les relances depuis Parse avec filtres
- `chargerSequences()` : Charge la liste des séquences pour le filtre

### Actions individuelles
- `annulerRelance(row)` : Annule une relance (statut → 'annulé')
- `reessayerRelance(row)` : Remet une relance en attente
- `ouvrirDrawer(row, readonly)` : Ouvre le slideover de détail

### Actions groupées
- `annulerGroupe()` : Annule les relances sélectionnées
- `validerGroupe()` : Valide les relances sélectionnées

### F-009 : Enregistrement et Validation

#### `enregistrerRelance()`
**Nouveau** - Sauvegarde les modifications sans valider.

```javascript
/**
 * Sauvegarde les modifications de la relance courante
 * sans changer son statut de validation.
 * 
 * @checkpoint relance-saved
 *   Log: [CHECKPOINT] relance-saved { relanceId, userId }
 * 
 * @checkpoint relance-save-failed
 *   Log: [CHECKPOINT] relance-save-failed { relanceId, error, userId }
 * 
 * @emits Toast succès/erreur
 */
async function enregistrerRelance()
```

#### `validerRelanceWorkflow()`
Modifié - Valide ET sauvegarde la relance.

```javascript
/**
 * Valide la relance courante après sauvegarde implicite.
 * 
 * @checkpoint relance-validated
 *   Log: [CHECKPOINT] relance-validated { relanceId }
 * 
 * @emits Passe automatiquement à la relance suivante
 */
async function validerRelanceWorkflow()
```

#### `selectionnerRelancePourValidation(relance)`
Modifié - Gère les modifications non sauvegardées.

```javascript
/**
 * Sélectionne une relance pour la validation.
 * Si des modifications sont en cours, affiche une confirmation.
 * 
 * @param {Object} relance - La relance à sélectionner
 * @emits Modal de confirmation si hasUnsavedChanges
 */
function selectionnerRelancePourValidation(relance)
```

## Gestion des modifications (F-009)

### Détection des changements

```javascript
// Surveille l'éditeur ToastUI et les champs modifiables
const hasUnsavedChanges = computed(() => {
  if (!relanceCourante.value) return false
  
  const currentCorps = editorRef.value?.getInstance().getHTML() 
    || relanceCourante.value.corps
  const originalCorps = relanceCourante.value._parse.get('contenu')
  
  return relanceCourante.value.objet !== relanceCourante.value._parse.get('sujet') ||
         currentCorps !== originalCorps ||
         relanceCourante.value.cc !== relanceCourante.value._parse.get('cc')
})
```

### Modal de confirmation

Affiché lors du changement de relance si `hasUnsavedChanges` :
- **Enregistrer** : Sauvegarde puis change de relance
- **Abandonner** : Change de relance sans sauvegarder
- **Annuler** : Reste sur la relance actuelle

## Checkpoints émis

| Checkpoint | Description | Contexte |
|------------|-------------|----------|
| `relance-saved` | Modifications enregistrées avec succès | `enregistrerRelance()` |
| `relance-save-failed` | Échec de l'enregistrement | `enregistrerRelance()` catch |
| `relance-validated` | Relance validée | `validerRelanceWorkflow()` |
| `relance-validation-failed` | Échec de la validation | `validerRelanceWorkflow()` catch |

## Dépendances

### Composants internes
- `ToastuiEditor` : Éditeur WYSIWYG pour le corps des emails
- `PdfIframe` : Affichage des PDFs des factures
- `RelanceDrawer` (slideover) : Édition détaillée d'une relance

### Stores
- `useBlacklistStore` : Gestion de la blacklist

### Plugins externes
- `@fullcalendar/vue3` : Calendrier (vue calendrier)
- `@fullcalendar/daygrid` : Vue mois du calendrier
- `@fullcalendar/interaction` : Clic sur dates/événements

### API Parse
- `Relance` : Classe principale (query, save)
- `Sequence` : Pour les filtres
- `Cloud.run('triggerImportInvoices')` : Création des relances

## Props de l'éditeur ToastUI

```javascript
{
  height: '400px',
  usageStatistics: false,
  hideModeSwitch: true,
  initialEditType: 'wysiwyg'
}
```

## Événements gérés

| Événement | Handler | Description |
|-----------|---------|-------------|
| `@change` | `relanceCourante.corps = html` | Mise à jour du corps |
| `@update:modelValue` | `toggleBulkSelection` | Sélection multiple |
| `@click` | `selectionnerRelancePourValidation` | Sélection d'une relance |

## Styles spécifiques

```css
/* Scrollbar personnalisée pour le calendrier */
:deep(.fc-daygrid-day-events) {
  overflow-y: auto;
  max-height: 150px;
}
```

## Responsive

| Breakpoint | Comportement |
|------------|--------------|
| `lg` (1024px+) | Vue validation en 3 colonnes |
| `< lg` | Vue validation empilée (liste en haut, éditeur en dessous) |

## Navigation

- **Retour** : Bouton "Retour" dans le header (navigue vers `/sequences`)
- **Détail facture** : Liens dans le tableau vers `/impayes/:id`
