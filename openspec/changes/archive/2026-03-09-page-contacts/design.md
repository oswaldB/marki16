## Architecture

Frontend uniquement. Réécriture de `frontend/pages/contacts.vue`. Aucune modification backend ni cloud functions nécessaires — les données sont déjà disponibles via Parse SDK.

## Composants et Structure

### `frontend/pages/contacts.vue`

**Header**
- Titre "Contacts" + badge compteur total
- Badge rouge "X sans email" cliquable (filtre rapide)
- Bouton "Nouveau contact" (ouvre le drawer de création)
- Bouton "Synchroniser" (existant, conservé)

**Filtres**
- `UInput` recherche (nom, email, téléphone) avec debounce 300ms
- `USelect` source : Tous / db_externe / upload
- `USelect` type : Tous / Propriétaire / Locataire sortant / Locataire entrant / Apporteur

**Tableau (UTable)**

Colonnes :
| Clé | Label | Rendu |
|---|---|---|
| nom | Nom | Texte, cliquable → ouvre drawer |
| email | Email | Texte ou badge rouge "Manquant" si vide |
| telephone | Téléphone | Texte |
| type | Type | Badge neutre |
| source | Source | Badge `db_externe` = bleu, `upload` = violet |
| nb_impayes | Impayés | Compteur (nombre d'Impaye liés) |
| actions | — | Bouton crayon pour ouvrir le drawer |

Pagination : 50 par page via `q.limit` / `q.skip` + boutons Précédent / Suivant.

**Drawer détail/édition**

Déclenché par clic sur une ligne ou le bouton crayon.

Contenu :
- Nom, email, téléphone, type : éditables si `source === 'upload'`, lecture seule sinon
- Badge source + alerte "Contact issu de la synchronisation — modification impossible" si `source === 'db_externe'`
- Section "Impayés liés" : liste des impayés du contact (nfacture, reste_a_payer, statut, date_piece) avec lien vers `/impayes/[id]`
- Bouton "Enregistrer" (visible uniquement si `source === 'upload'`)
- Bouton "Supprimer" rouge (visible uniquement si `source === 'upload'`) avec confirmation

**Modal de création**

Champs : nom* , email, téléphone, type (USelect parmi les 4 types). Source forcée à `upload`.

## Chargement des données

```
// Contacts
const q = new $parse.Query('Contact')
q.ascending('nom')
q.limit(50)
q.skip(page.value * 50)
if (filtreSource) q.equalTo('source', filtreSource)
if (filtreType)   q.equalTo('type', filtreType)
if (recherche)    q.contains('nom', recherche)  // insensible à la casse via regex
contacts.value = await q.find()
total.value    = await q.count()

// Compteur sans email
const qSansEmail = new $parse.Query('Contact')
qSansEmail.doesNotExist('email')
sansEmailCount.value = await qSansEmail.count()

// Nb impayés par contact (chargé en batch pour les contacts affichés)
// Pour chaque page, un Pipeline aggregation n'est pas dispo côté client Parse.
// On fait une seule query Impaye avec containedIn('payeur', contacts)
// puis on compte côté JS en groupant par contact objectId.
const qImp = new $parse.Query('Impaye')
qImp.containedIn('payeur', contacts.value)
qImp.select('payeur')
qImp.limit(1000)
const impayes = await qImp.find()
// Map contactId → count
```

## Filtrage "sans email"

Clic sur le badge rouge → `filtreSource = null`, `filtreSansEmail = true` → la query ajoute `q.doesNotExist('email')`. Un second clic retire le filtre.

## Recherche textuelle

Regex case-insensitive sur le champ `nom` : `q.matches('nom', new RegExp(recherche, 'i'))`. Si besoin d'élargir à l'email : deux queries séparées mergées (ou `Parse.Query.or`).

## Impayés dans le drawer

```
const qDetail = new $parse.Query('Impaye')
qDetail.equalTo('payeur', contactSelectionne.value)
qDetail.descending('date_piece')
qDetail.limit(20)
impayes du contact = await qDetail.find()
```

## Édition et sauvegarde (source: upload uniquement)

```
contact.set('nom', form.nom)
contact.set('email', form.email)
contact.set('telephone', form.telephone)
contact.set('type', form.type)
await contact.save()
```

## Suppression (source: upload uniquement)

Vérifier si le contact a des impayés liés avant de supprimer — afficher un avertissement si oui. Détruire via `contact.destroy()`.

## Création

```
const c = new $parse.Object('Contact')
c.set('nom', form.nom)
c.set('email', form.email || undefined)
c.set('telephone', form.telephone || undefined)
c.set('type', form.type)
c.set('source', 'upload')
await c.save()
```
