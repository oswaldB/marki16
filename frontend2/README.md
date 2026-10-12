# frontend2/.workshop/templates

Structure des écrans de la migration Marki (frontend2).

## Organisation

Chaque écran dispose de son propre dossier contenant :

```
templates/
├── {screen-name}/
│   ├── index.html           # Page HTML5 complète (boilerplate)
│   ├── main.js              # Alpine.data + import workflows ESM
│   └── workflows/
│       └── init.js          # Workflow d'initialisation par défaut
```

## Liste des écrans (20)

| # | Écran | Description |
|---|-------|-------------|
| 1 | `login` | Authentification utilisateur |
| 2 | `dashboard` | Tableau de bord principal |
| 3 | `contacts` | Liste des contacts |
| 4 | `contacts-sans-email` | Contacts sans adresse email |
| 5 | `impayes` | Liste des impayés |
| 6 | `impayes-suspendus` | Impayés suspendus |
| 7 | `impayes-detail` | Détail d'un impayé |
| 8 | `relances` | Suivi des relances |
| 9 | `relances-manuelles` | Relances manuelles |
| 10 | `sequences` | Séquences de relance |
| 11 | `sequences-relance-detail` | Détail d'une séquence |
| 12 | `settings-smtp` | Paramètres SMTP |
| 13 | `settings-utilisateurs` | Gestion des utilisateurs |
| 14 | `blacklist` | Liste noire |
| 15 | `recalcitrants` | Clients récalcitrants |
| 16 | `activites` | Journal d'activités |
| 17 | `audit` | Audit des actions |
| 18 | `a-corriger` | Éléments à corriger |
| 19 | `portail-client` | Portail client |
| 20 | `portail-mission` | Portail mission |

## Conventions

### HTML (`index.html`)
- `lang="fr"`, charset UTF-8, viewport responsive
- CDN Tailwind CSS, Parse SDK, FontAwesome 6
- `Parse.initialize()` avec les valeurs du projet
- `<div id="app" x-data="{ScreenName}Page">` (camelCase)
- `<script type="module" src="./main.js"></script>`
- Chaque bouton doit avoir un `id` unique au format `btn-{action}`

### JS (`main.js`)
- Import Alpine.js en ESM depuis le CDN
- Registre des workflows dans `window.workflows`
- `Alpine.data('{screenName}Page', () => ({ ... }))`
- Méthodes standard : `init()`, `loadInitialData()`, `runWorkflow(name, params)`
- `Alpine.start()` à la fin

### Workflow (`workflows/init.js`)
- `console.log('init.js loaded')` en début de fichier
- `export async function execute(context, params)`
- Parse est global (pas d'import ESM)
- Pas de `fetch` natif pour Parse : utiliser le SDK Parse

## Assets partagés

- `../../assets/css/shared.css` — styles globaux (+ `[x-cloak]`)
- `../../assets/img/marki-logo.png` — logo Marki

## Parse Config (projet)

```js
Parse.initialize('adti-marki', 'c8d7e205725c6a06dfb3771a2f739fe861664fc6ef90fbda');
Parse.serverURL = 'https://adti.markidiags.com/api/parse';
```
