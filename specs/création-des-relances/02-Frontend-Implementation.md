# Frontend Implementation - Création des Relances

## Page Relances

**Fichier** : `/app/pages/relances.vue`

### Structure de la Page

```
Relances Page
├── Header (Titre + Filtres + Bouton)
├── Vue Tableau (par défaut)
├── Vue Calendrier
├── Vue Validation
└── Slideover (pour édition/détails)
```

### Bouton "Créer des relances"

**Localisation** : Ligne 48-51

```vue
<UButton
  icon="i-heroicons-plus-circle"
  color="primary"
  :loading="creatingRelances"
  @click="createRelancesForAllActiveSequences"
>
  Créer des relances
</UButton>
```

**State** :
- `creatingRelances` : Boolean pour afficher le loader
- `relances` : Array des relances affichées

### Fonction de Création

**Fonction** : `createRelancesForAllActiveSequences()` (lignes 550-570)

```javascript
async function createRelancesForAllActiveSequences() {
  creatingRelances.value = true
  try {
    console.log('Début de la création des relances...')
    const response = await $parse.Cloud.run('createRelancesWithTemplates')
    
    console.log('Réponse de la fonction cloud:', response)
    
    toast.add({
      title: 'Succès',
      description: `${response.relancesCrees} relance(s) créée(s), ${response.relancesMisesAJour} mise(s) à jour.`,
      color: 'green'
    })
    await charger()
  } catch (error) {
    console.error('Erreur lors de la création des relances:', error)
    toast.add({ title: 'Erreur', description: error.message || 'Erreur lors de la création des relances.', color: 'red' })
  } finally {
    creatingRelances.value = false
  }
}
```

### Gestion des États

1. **Loading** : `creatingRelances.value = true`
2. **Appel API** : `$parse.Cloud.run('createRelancesWithTemplates')`
3. **Notification** : Toast de succès/erreur
4. **Rechargement** : `await charger()` pour rafraîchir la liste
5. **Fin Loading** : `creatingRelances.value = false`

### Affichage des Relances

**Fonction** : `charger()` (lignes 480-505)

```javascript
async function charger() {
  loading.value = true
  selection.value = []
  try {
    const q = new $parse.Query('Relance')
    q.include('impaye')
    q.include('impayes')
    q.include('contact')
    q.include('sequence')
    q.descending('date_envoi_prevue')
    q.limit(500)
    
    // Filtres selon sélection utilisateur
    if (filtreStatut.value !== 'tous' && filtreStatut.value !== 'non-validees') {
      q.equalTo('statut', filtreStatut.value)
    }
    
    if (filtreStatut.value === 'non-validees') {
      q.equalTo('valide', false)
    }
    
    if (filtreSequence.value && filtreSequence.value !== 'tous') {
      const ptr = $parse.Object.fromJSON({ __type: 'Pointer', className: 'Sequence', objectId: filtreSequence.value })
      q.equalTo('sequence', ptr)
    }
    
    const results = await q.find()
    relances.value = results.map(parseRelance)
  } catch (err) {
    toast.add({ title: 'Erreur chargement', description: err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}
```

### Parsing des Relances

**Fonction** : `parseRelance()` (lignes 400-450)

Transforme un objet Parse Relance en objet JavaScript pour l'affichage :
- Extraction des champs (date, objet, to, cc, corps, statut)
- Gestion des impayés (single ou multiple)
- Récupération des métadonnées
- Détermination du scénario (SINGLE ou MULTIPLE)

### Colonnes du Tableau

**Définition** : `colonnes` (lignes 350-390)

```javascript
const colonnes = [
  { accessorKey: 'dateEnvoi',   header: sortableHeader('Date envoi prévue') },
  { accessorKey: 'objet',       header: sortableHeader('Objet') },
  { accessorKey: 'to',          header: sortableHeader('Destinataire') },
  { accessorKey: 'nfacture',    header: sortableHeader('Facture') },
  { accessorKey: 'statut',      header: sortableHeader('Statut') },
  { accessorKey: 'valide',      header: sortableHeader('Validé') },
  { id: 'actions',             header: ' ', enableSorting: false }
]
```

### Statuts et Couleurs

**Configuration** : `STATUT_CONFIG` (lignes 320-328)

```javascript
const STATUT_CONFIG = {
  pending:   { label: 'En attente', color: 'neutral' },
  'envoyé':  { label: 'Envoyé',     color: 'green'   },
  'échec':   { label: 'Échec',      color: 'red'     },
  'annulé':  { label: 'Annulé',     color: 'orange'  },
  'optimisee': { label: 'Optimisée', color: 'purple' }
}
```

### Actions Disponibles

Selon le statut de la relance :
- **pending** : Bouton annuler (🗑)
- **envoyé** : Bouton voir (👁️)
- **échec** : Bouton réessayer (🔄)
- **Toutes** : Bouton modifier (✏️) si statut permet l'édition

### Validation en Masse

Fonctionnalité pour valider plusieurs relances simultanément :
- Sélection multiple via checkbox
- Bouton "Valider" dans la barre inférieure
- Appel à `validerGroupe()`

### Workflow de Validation

Vue dédiée pour valider les relances une par une :
- Liste des relances non validées
- Affichage des détails (destinataire, objet, corps)
- Boutons "Valider" et "Passer"
- Progression (X/Y)

## Événements et Réactions

### Après Création
1. Toast de confirmation avec le nombre de relances créées
2. Rechargement automatique de la liste
3. Les nouvelles relances apparaissent en haut (tri par date décroissante)
4. Statut initial : `pending` et `valide: false`

### Erreurs Courantes
1. **Aucun impayé avec séquence** : Message "0 relance(s) créée(s)"
2. **Aucun contact valide** : Message "0 relance(s) créée(s)"
3. **Erreur serveur** : Toast rouge avec le message d'erreur

## Tests Frontend

### Scénarios à Tester
1. Création avec des impayés ayant des séquences
2. Création sans impayés éligibles
3. Création avec des contacts sans email
4. Validation individuelle des relances
5. Validation en masse
6. Annulation de relances
7. Réessai après échec

### Points d'Attention
1. Le bouton doit être désactivé pendant le chargement
2. Les notifications doivent être claires et informatives
3. Le rechargement doit être fluide sans perte de filtres
4. Les erreurs doivent être affichées de manière compréhensible
