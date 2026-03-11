## 1. Backend — Installation et helper

- [x] 1.1 `cd backend && npm install nodemailer` ; vérifier que `nodemailer` apparaît dans `package.json`
- [x] 1.2 Ajouter la fonction `substituerVariables(template, impaye)` dans `backend/cloud/main.js` (avant les cloud functions) : remplace `[[variable]]` avec les valeurs réelles de l'impayé (voir design.md pour la map complète)

## 2. Backend — Cloud function `assignerSequence`

- [x] 2.1 Ajouter `Parse.Cloud.define('assignerSequence', ...)` dans `backend/cloud/main.js` : récupère l'impayé, annule les relances `pending` non manuelles, crée les nouvelles relances (une par email de la séquence) avec `date_prevue = aujourd'hui + email.delai jours`, met à jour le pointer `sequence` sur l'impayé ; si `sequenceId` est `null`, retire le pointer séquence et retourne `{ created: 0 }`

## 3. Backend — Hooks Parse

- [x] 3.1 Ajouter `Parse.Cloud.beforeDelete('Sequence', ...)` dans `main.js` : cherche toutes les relances `pending` liées à cette séquence et les passe à `annulé`
- [x] 3.2 Ajouter `Parse.Cloud.afterSave('Impaye', ...)` dans `main.js` : si `statut` passe à `payé` (vérifier avec `request.original`), cherche toutes les relances `pending` de cet impayé et les passe à `annulé`

## 4. Backend — Cloud Job `envoyerRelances`

- [x] 4.1 Créer `backend/cloud/jobs/envoyerRelances.js` : query des relances `pending` avec `dateEnvoi <= now` (include `impaye`, limit 100) ; pour chaque relance : charge le `SmtpProfile` par `smtp_id`, substitue les variables dans `to/cc/objet/corps` via `substituerVariables`, envoie via `nodemailer.createTransport(...)`, met à jour `statut` (`envoyé`) ou (`échec` + `erreur`) ; retourne `{ envoyees, echecs }`
- [x] 4.2 Dans `backend/server.js` : require `envoyerRelances` ; enregistrer `cron.schedule('0 * * * *', ...)` qui appelle le job ; enregistrer aussi `Parse.Cloud.job('envoyerRelances', ...)` pour déclenchement manuel depuis le dashboard Parse

## 5. Frontend — Page `impayes/[id].vue`

- [x] 5.1 Dans la section SÉQUENCE de `impayes/[id].vue` : remplacer le code d'assignation directe (`impaye.set('sequence').save()`) par `await $parse.Cloud.run('assignerSequence', { impayelId: impaye.value.id, sequenceId })` ; gérer `:loading` et erreur toast
- [x] 5.2 Dans la section RELANCES de `impayes/[id].vue` : charger les relances au `onMounted` via `new $parse.Query('Relance').equalTo('impaye', impayeObj).ascending('dateEnvoi').limit(200).find()` ; afficher dans un tableau avec colonnes : Date prévue | Objet | Statut (badge coloré) | Actions (déjà implémenté)
- [x] 5.3 Badges statut : `pending` → `UBadge color="neutral"` "En attente" ; `envoyé` → `color="green"` "Envoyé" ; `échec` → `color="red"` "Échec" ; `annulé` → `color="orange"` "Annulé" — ajouté
- [x] 5.4 Après `assignerSequence` (succès), recharger la liste des relances — déjà implémenté via `chargerRelances()`
