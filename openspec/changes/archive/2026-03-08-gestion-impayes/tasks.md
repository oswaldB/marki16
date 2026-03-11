## 1. Frontend — Page `/impayes`

- [x] 1.1 Créer `frontend/pages/impayes.vue` avec la barre du haut : titre "Impayés", bouton `+ Importer` (→ `/import`), onglets `[Unitaire] [Par payeur] [Par contact]`, champ recherche, filtres Séquence et Statut
- [x] 1.2 **Vue unitaire** : query Parse `Impaye` avec `include(['sequence'])` (les données interlocuteurs sont à plat), limite 50 ; `NDataTable` avec colonnes par défaut : ☐, N° Facture (`nfacture`), N° Dossier (`numero_dossier`), Adresse (`adresse_bien` + `code_postal` + `ville`), Payeur (`payeur_nom`), Retard (calculé), Reste à payer (`reste_a_payer`), Date intervention (`date_debut_mission`), Séquence (`sequence.get('nom')`), Actions
- [x] 1.3 Retard = `Math.floor((today - date_piece) / 86400000)` jours ; rouge (`text-red-600`) si > 30j, orange (`text-orange-500`) si > 7j
- [x] 1.4 Colonne Actions : bouton 📄 ouvre `ImpayeDrawerPdf` ; menu ≡ (`NDropdown`) : "Voir le détail" (→ `/impayes/${id}`), "Assigner une séquence" (NModal avec NSelect des séquences), "Marquer payé" (`impaye.set('statut', 'payé'); impaye.save()`)
- [x] 1.5 Sélection groupée : barre flottante en bas visible si `checkedRowKeys.length > 0`, boutons "Assigner une séquence" et "Marquer payé" (boucle `impaye.set(...).save()` sur chaque sélectionné)
- [x] 1.6 Bouton sélecteur de colonnes (`NCheckboxGroup`) pour afficher/masquer les colonnes optionnelles : Référence (`reference`), Réf externe (`reference_externe`), Statut dossier (`statut_dossier`), Total HT (`total_ht`), Total TTC (`total_ttc`), Apporteur (`apporteur_nom`), Commentaire (`commentaire_piece`), Lot/Étage/Porte (`numero_lot`/`etage`/`porte`), Date pièce (`date_piece`)
- [x] 1.7 **Vue par payeur** : grouper les impayés par `payeur_nom` en mémoire après fetch, afficher avec `NCollapse` (un panel par payeur : nb factures, total `reste_a_payer`, séquence commune si uniforme, tableau des factures avec `nfacture`, `reste_a_payer`, retard, actions)
- [x] 1.8 **Vue par contact** : construire un index `{ nom → { propres: [], apporteur: [] } }` en parcourant `payeur_nom` et `apporteur_nom`, afficher avec `NCollapse` "Ses propres impayés" et "Apporteur d'affaire pour"
- [x] 1.9 Pagination : `NPagination` en bas de page, 50 lignes par page (offset via `query.skip()`)

## 2. Frontend — Composant `ImpayeDrawerPdf`

- [x] 2.1 Créer `frontend/components/ImpayeDrawerPdf.vue` : `NDrawer` avec props `show` (Boolean) et `impayelId` (String)
- [x] 2.2 Afficher un `<iframe>` pointant sur `/api/pdf/${impayelId}` (proxied via Nuxt vers le backend port 1555)
- [x] 2.3 Bouton "Télécharger" : `<a :href="\`/api/pdf/${impayelId}\`" download>` vers le même endpoint
- [x] 2.4 Afficher `NSpin` pendant le chargement ; si le PDF est introuvable (iframe `error`), afficher un message d'erreur

## 3. Frontend — Page `/impayes/[id]`

- [x] 3.1 Créer `frontend/pages/impayes/[id].vue` : au `onMounted`, query `Impaye` par `objectId` avec `include(['sequence'])` + query séparée `Relance` avec `equalTo('impaye', impayelPtr)`, triées `dateEnvoi` ASC
- [x] 3.2 **Header** : lien `← Retour` (→ `/impayes`), titre `${nfacture} — ${numero_dossier}`, `NSelect` pour statut (`impaye/en cours/payé`) qui appelle `impaye.set('statut', val); impaye.save()`, bouton `📄 Voir PDF` (ouvre `ImpayeDrawerPdf`)
- [x] 3.3 **Section FACTURE** : `nfacture`, `ref_piece`, `date_piece` (formatée), retard calculé (coloré), `total_ht` (€), `total_ttc` (€), `reste_a_payer` (€), `commentaire_piece`
- [x] 3.4 **Section BIEN** : `adresse_bien`, `entree`, `escalier`, `etage`, `porte`, `numero_lot`, `code_postal` + `ville`
- [x] 3.5 **Section DOSSIER** : `numero_dossier`, `reference`, `reference_externe`, `statut_dossier`, `date_debut_mission` (formatée), `employe_intervention`
- [x] 3.6 **Section INTERLOCUTEURS** : afficher un bloc par rôle uniquement si `xxx_nom` est non null. Chaque bloc : nom, email, téléphone. Pour Payeur et Apporteur : si `payeur_type_personne = 'M'` (entreprise), afficher aussi `payeur_contact_nom` / `payeur_contact_email` comme contact associé. Badge `payeur_type` sur le bloc Payeur.
  - Rôles : Payeur, Apporteur, Propriétaire, Locataire entrant, Locataire sortant, Acquéreur, Donneur d'ordre, Notaire, Syndic
- [x] 3.7 **Section SÉQUENCE** : si `sequence` non null → `sequence.get('nom')` + boutons [Changer] et [Retirer] ; [Changer] ouvre `NSelect` des séquences disponibles (query `Sequence`) → destroy relances `pending` + `Parse.Object.saveAll()` nouvelles relances + `impaye.set('sequence', seq); impaye.save()` ; [Retirer] → destroy relances `pending` + `impaye.unset('sequence'); impaye.save()`. Si `sequence === null` → "Aucune séquence assignée" + bouton [Assigner]
- [x] 3.8 **Section RELANCES** : `NDataTable` colonnes : Date envoi (`dateEnvoi`) | Objet | Statut (badge coloré) | ✋ si `manuelle` | Actions (✏ → `RelanceDrawer` mode `edit`, 🗑 → `relance.destroy()` seulement si `statut === 'pending'`). Bouton `+ Créer une relance` (ouvre `RelanceDrawer` mode `create`)
- [x] 3.9 **Section HISTORIQUE** : timeline verticale construite à partir de `createdAt` de l'impayé (événement "Impayé créé") et des relances (événement par relance : date + objet + statut), triée par date DESC

## 4. Frontend — Composant `RelanceDrawer`

- [x] 4.1 Créer `frontend/components/RelanceDrawer.vue` avec props : `show` (Boolean), `mode: 'create' | 'edit'`, `relance` (objet Parse, optionnel), `impayelId` (String)
- [x] 4.2 Champs : Date envoi (`NDatePicker`, valeur timestamp), Objet (`NInput`), Corps (`NInput` type `textarea`)
- [x] 4.3 En mode `create` : `NSelect` "Insérer une variable" avec options `[[nfacture]]`, `[[reste_a_payer]]`, `[[payeur_nom]]`, `[[payeur_email]]`, `[[date_piece]]` — sélection insère la variable à la fin du champ Objet
- [x] 4.4 Soumission mode `create` : créer un pointer `Impaye` via `Parse.Object.extend('Impaye').createWithoutData(impayelId)`, puis `new Parse.Object('Relance').set({ impaye: ptr, dateEnvoi, objet, corps, statut: 'pending', manuelle: true }).save()` ; émettre `success`
- [x] 4.5 Soumission mode `edit` : `relance.set({ dateEnvoi, objet, corps, manuelle: true }).save()` ; émettre `success`
- [x] 4.6 Bouton "Annuler" ferme le drawer (`emit('update:show', false)`) sans action

## 5. Navigation

- [x] 5.1 Dans `frontend/layouts/default.vue`, ajouter le lien "Impayés" (icône `i-heroicons-exclamation-circle`) pointant vers `/impayes` dans la sidebar, entre "Import" et "Contacts"
