# Page: sequences.vue

**Chemin** : `frontend/app/pages/sequences.vue`  
**Type** : Page Nuxt 3 (Composition API)  
**Feature** : F-011 Configuration des séquences de relances  

## Description

Page de configuration des séquences de relances et de suivi. Permet de créer, modifier, réorganiser et supprimer les séquences qui définissent les niveaux de relance (J+15, J+30, etc.) et leurs templates d'email.

## Sections principales

### 1. Header de page
- Titre : "Configuration des séquences"
- Sous-titre : "Gérez les niveaux de relance et leurs templates d'email"
- Bouton d'action principal : "+ Nouvelle séquence"

### 2. Tableau des séquences

**Colonnes :**
| Colonne | Description | Actions |
|---------|-------------|---------|
| Ordre | Handle de drag & drop pour réorganiser | - |
| Niveau | Numéro du niveau (1, 2, 3...) | - |
| Nom | Nom de la séquence | Édition inline |
| Type | Badge "Relances" ou "Suivi" | - |
| Délai | J+X (ex: J+15) | - |
| Statut | Toggle actif/pause | Activation/désactivation |
| Actions | Boutons éditer/supprimer | Ouverture slideover |

**Comportements :**
- Drag & drop pour réorganiser l'ordre des séquences
- Click sur une ligne ouvre le slideover d'édition
- Toggle pour activer/désactiver sans ouvrir le slideover

### 3. Slideover de création/édition

**Onglets :**
- **Informations** : Nom, type, niveau, délai, description
- **Template** : Objet et corps de l'email avec éditeur WYSIWYG
- **Aperçu** : Rendu du template avec données fictives

### 4. Modal de confirmation de suppression
- Affiché avant suppression d'une séquence
- Avertissement si des relances utilisent cette séquence

## État local principal

```javascript
// Données
const sequences = ref([])
const sequenceCourante = ref(null) // Pour le slideover

// États UI
const slideoverOpen = ref(false)
const activeTab = ref('informations') // 'informations' | 'template' | 'apercu'
const isCreating = ref(false)

// Formulaire
const form = reactive({
  nom: '',
  type: 'relances', // 'relances' | 'suivi'
  niveau: 1,
  delaiJours: 15,
  templateSujet: '',
  templateCorps: '',
  estActive: true,
  description: ''
})

// Éditeur
const editorRef = ref(null)
const previewData = ref({
  contact_nom: 'Dupont SARL',
  montant_total: '12,500.00',
  nb_factures: '3',
  date_jour: new Date().toLocaleDateString('fr-FR')
})

// États de chargement
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const reordering = ref(false)
```

## Computed importantes

| Computed | Description |
|----------|-------------|
| `sequencesByType` | Séquences groupées par type (relances/suivi) |
| `sequencesOrdonnees` | Séquences triées par niveau |
| `canSave` | Formulaire valide (tous les champs requis remplis) |
| `hasChanges` | Formulaire modifié par rapport à l'original |
| `previewSujet` | Rendu du sujet avec variables fictives |
| `previewCorps` | Rendu du corps avec variables fictives |
| `relancesUsingSequence` | Nombre de relances utilisant cette séquence |

## Méthodes principales

### Chargement
- `charger()` : Charge les séquences depuis Parse
- `chargerStats()` : Charge le nombre de relances par séquence

### CRUD
- `ouvrirCreation()` : Ouvre le slideover en mode création
- `ouvrirEdition(sequence)` : Ouvre le slideover en mode édition
- `sauvegarder()` : Crée ou met à jour la séquence
- `fermerSlideover()` : Ferme le slideover (avec confirmation si changements)
- `confirmerSuppression(sequence)` : Ouvre modal de confirmation
- `supprimer()` : Supprime la séquence

### Réorganisation
- `reordonner(sequencesReordonnees)` : Met à jour l'ordre/niveau des séquences
- `deplacer(sequence, direction)` : Déplace une séquence d'un niveau (haut/bas)

### Aperçu
- `genererApercu()` : Génère l'aperçu avec les variables
- `restaurerTemplateParDefaut()` : Réinitialise au template par défaut

## Checkpoints émis

| Checkpoint | Description | Contexte |
|------------|-------------|----------|
| `sequence-created` | Séquence créée avec succès | `sauvegarder()` création |
| `sequence-updated` | Séquence modifiée avec succès | `sauvegarder()` édition |
| `sequence-deleted` | Séquence supprimée | `supprimer()` |
| `sequence-reordered` | Ordre des séquences modifié | `reordonner()` |
| `sequence-form-opened` | Slideover ouvert | `ouvrirCreation/Edition()` |
| `sequence-form-closed` | Slideover fermé | `fermerSlideover()` |
| `sequence-preview-generated` | Aperçu généré | `genererApercu()` |

## Dépendances

### Composants internes
- `ToastuiEditor` : Éditeur WYSIWYG pour le template
- `SortableTable` : Tableau avec drag & drop (ou `@vueuse/sortable`)
- `USlideover` : Slideover Nuxt UI
- `UModal` : Modal de confirmation

### Stores
- `useSequenceRelanceStore` : Store des séquences (F-011)

### API Parse
- `SequenceRelance` : Classe Parse pour les séquences
- `Relance` : Pour vérifier les dépendances avant suppression

## Variables de template disponibles

Affichées dans l'éditeur sous forme de chips cliquables :
- `{{contact_nom}}` - Nom du contact
- `{{contact_email}}` - Email du contact  
- `{{montant_total}}` - Montant total dû
- `{{nb_factures}}` - Nombre de factures
- `{{date_jour}}` - Date du jour
- `{{date_echeance_ancienne}}` - Plus ancienne échéance
- `{{liste_factures}}` - Tableau HTML des factures

## Templates par défaut

### Relance niveau 1 (J+15)
```javascript
const templateParDefautNiveau1 = {
  sujet: 'Rappel : {{nb_factures}} facture(s) en attente - {{contact_nom}}',
  corps: `<p>Bonjour {{contact_nom}},</p>

<p>Nous espérons que vous allez bien.</p>

<p>Nous vous écrivons pour vous rappeler amicalement que <strong>{{nb_factures}} facture(s)</strong> restent en attente de règlement pour un montant total de <strong>{{montant_total}} €</strong>.</p>

<p>Le détail des factures concernées :</p>

{{liste_factures}}

<p>Si vous avez déjà effectué le règlement, merci de ne pas tenir compte de ce message.</p>

<p>Dans le cas contraire, nous vous serions reconnaissants de bien vouloir procéder au paiement dans les plus brefs délais.</p>

<p>Nous restons à votre disposition pour toute question.</p>

<p>Cordialement,<br>
Le service comptable</p>`
}
```

## Validation du formulaire

| Champ | Règle | Message d'erreur |
|-------|-------|------------------|
| nom | Requis, min 3 caractères | "Le nom est requis (min 3 caractères)" |
| type | Requis | "Le type est requis" |
| niveau | Requis, nombre > 0 | "Le niveau doit être un nombre positif" |
| delaiJours | Requis, nombre > 0 | "Le délai doit être un nombre positif" |
| templateSujet | Requis | "L'objet de l'email est requis" |
| templateCorps | Requis, min 50 caractères | "Le corps de l'email est trop court" |

## Responsive

| Breakpoint | Comportement |
|------------|--------------|
| `lg` (1024px+) | Tableau complet, slideover large (600px) |
| `< lg` | Tableau scrollable horizontal, slideover pleine largeur |

## Navigation

- **Retour** : Bouton retour vers le dashboard
- **Relances** : Lien vers `/relances` dans le header

## Notes

- Le niveau d'une séquence est automatiquement recalculé lors de la réorganisation
- Une séquence utilisée par des relances ne peut pas être supprimée (seulement désactivée)
- Le type d'une séquence (relances/suivi) ne peut pas être modifié après création
