## Pourquoi

Les séquences définissent des séries d'emails de relance (objet, corps, délai J+N, profil SMTP), mais il n'existe actuellement aucun mécanisme pour :
1. Créer les objets `Relance` dans Parse quand une séquence est assignée à un impayé
2. Envoyer ces relances au bon moment via SMTP
3. Annuler proprement les relances si la séquence change, est supprimée, ou si l'impayé est payé

Sans ce moteur, les séquences sont des templates inertes — l'application ne peut pas automatiser les relances.

## Quoi

### Backend

- **Cloud function `assignerSequence`** : assigne (ou retire) une séquence à un impayé. Annule toutes les relances `pending` existantes. Crée de nouvelles relances (une par email de la séquence) avec `date_prevue = date assignation + email.delai jours`.

- **Cloud job `envoyerRelances`** : cron horaire qui cherche les relances `pending` dont `date_prevue <= maintenant`, envoie chaque email via SMTP (nodemailer), substitue les variables `[[variable]]` avec les vraies valeurs de l'impayé, met à jour le statut (`envoyé` ou `échec`).

- **Helper `substituerVariables(template, impaye)`** : remplace `[[nfacture]]`, `[[payeur_nom]]`, etc. avec les valeurs réelles de l'objet Parse Impaye.

- **Hooks Parse** :
  - `beforeDelete('Sequence')` : annule les relances `pending` liées à cette séquence
  - `afterSave('Impaye')` : si le statut passe à `payé`, annule toutes les relances `pending` de cet impayé

- **Installation nodemailer** : pour l'envoi SMTP dans le Cloud Job

### Frontend

- **`impayes/[id].vue`** : remplace le direct `impaye.set('sequence').save()` par `$parse.Cloud.run('assignerSequence', { impayelId, sequenceId })` ; affiche la liste des relances créées (date, objet, statut).

## Ce qui ne change pas

- Le modèle `Relance` s'appuie sur Parse (pas de migration Mongo) — schéma implicite
- Les templates corps/objet sont stockés bruts (non substitués) dans `Relance` et substitués à l'envoi
- Le frontend affiche les relances en lecture seule sur la page impayé (modification possible via RelanceDrawer existant pour les relances manuelles)
