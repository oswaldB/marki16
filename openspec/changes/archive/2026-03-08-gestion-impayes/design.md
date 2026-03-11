## Architecture

### Frontend

- `pages/impayes.vue` — page liste, gère l'état des 3 vues via un `ref` `activeView` (`unitaire` | `payeur` | `contact`)
- `pages/impayes/[id].vue` — page détail, charge l'impayé + relances + historique au `onMounted`
- `components/ImpayeDrawerPdf.vue` — drawer latéral affichant le PDF via l'endpoint `/api/pdf/:impayelId`
- `components/RelanceDrawer.vue` — drawer création/modification d'une relance (date, objet, corps via Toast UI Editor)

### Backend

Pas de Cloud Functions nécessaires. Toutes les opérations sont effectuées directement depuis le frontend via le SDK Parse JS (`useNuxtApp().$parse`). Le Parse Server avec les ACLs par défaut autorise les utilisateurs authentifiés à modifier les objets.

| Opération | SDK Parse (frontend) |
|---|---|
| Changer statut | `impaye.set('statut', ...); impaye.save()` |
| Assigner séquence | `impaye.set('sequence', seq); impaye.save()` puis créer les `Relance` |
| Retirer séquence | `impaye.unset('sequence'); impaye.save()` + annuler relances pending |
| Créer relance | `new Parse.Object('Relance').set({...}).save()` |
| Modifier relance | `relance.set({...}).save()` |
| Supprimer relance | `relance.destroy()` |

### Modèle de données (classes Parse existantes — champs réels)

```
Impaye {
  // Facture
  nfacture, ref_piece, date_piece,
  total_ht, total_ttc, reste_a_payer, facture_soldee,
  commentaire_piece,
  url_pdf,
  statut: 'impaye' | 'en cours' | 'payé',
  source: 'db_externe' | 'upload',
  externe_id,

  // Dossier
  id_dossier, numero_dossier, reference, reference_externe,
  statut_dossier, commentaire_dossier,
  date_debut_mission, employe_intervention,

  // Bien (adresse_bien = concaténation faite par le sync)
  adresse_bien, code_postal, ville,
  entree, escalier, etage, porte, numero_lot,

  // Interlocuteurs à plat (pas de Pointer — directement sur Impaye)
  payeur_nom, payeur_email, payeur_telephone,
  payeur_type,            // 'Propriétaire' | 'Apporteur d'affaire' | 'Autre'
  payeur_type_personne,   // 'M' (morale) | null (physique)
  payeur_contact_nom, payeur_contact_email,   // personne physique si payeur = entreprise

  apporteur_nom, apporteur_email, apporteur_telephone,
  apporteur_contact_nom, apporteur_contact_email,

  proprietaire_nom, proprietaire_email, proprietaire_telephone,
  proprietaire_type_personne,
  proprietaire_contact_nom, proprietaire_contact_email,

  locataire_entrant_nom, locataire_entrant_email, locataire_entrant_telephone,
  locataire_sortant_nom, locataire_sortant_email, locataire_sortant_telephone,
  acquereur_nom, acquereur_email, acquereur_telephone,
  donneur_ordre_nom, donneur_ordre_email, donneur_ordre_telephone,
  notaire_nom, notaire_email, notaire_telephone,
  syndic_nom, syndic_email, syndic_telephone,

  // Pointers
  payeur:          Pointer<Contact>,   // Contact principal du payeur
  apporteur:       Pointer<Contact>,   // Contact de l'apporteur
  contact_relance: Pointer<Contact>,   // Contact destinataire par défaut des relances
  sequence:        Pointer<Sequence>,  // Séquence active assignée
}

Contact {
  nom, email, telephone, type_personne,
  source: 'db_externe' | 'upload',
  externe_id,
  employes: Relation<Contact>  // personnes physiques liées à une entreprise
}

Sequence {
  nom,
  emails: Array<{ delai, smtp, to, cc, objet, corps }>,
  regles: Array<{ champ, operateur, valeur, type }>
}

Relance {
  impaye:     Pointer<Impaye>,
  dateEnvoi, objet, corps,
  statut:    'pending' | 'envoyé' | 'échec',
  manuelle:  Boolean,
  destinataire, cc
}
```

### `/impayes` — Vue unitaire

- Query Parse `Impaye` avec `include(['sequence'])` uniquement (les données interlocuteurs sont à plat), limite 50, pagination offset
- **Colonnes par défaut** :

| Colonne | Champ Parse |
|---|---|
| ☐ | sélection |
| N° Facture | `nfacture` |
| N° Dossier | `numero_dossier` |
| Adresse du bien | `adresse_bien` + `code_postal` + `ville` |
| Payeur | `payeur_nom` |
| Retard | calculé `aujourd'hui - date_piece` en jours |
| Reste à payer | `reste_a_payer` |
| Date intervention | `date_debut_mission` |
| Séquence | `sequence.get('nom')` (Pointer) |
| Actions | 📄 ≡ |

- Retard : rouge si > 30j, orange si > 7j
- Colonnes optionnelles masquées par défaut via `ref` `visibleColumns` :

| Colonne | Champ Parse |
|---|---|
| Référence | `reference` |
| Réf externe | `reference_externe` |
| Statut dossier | `statut_dossier` |
| Total HT | `total_ht` |
| Total TTC | `total_ttc` |
| Apporteur | `apporteur_nom` |
| Commentaire | `commentaire_piece` |
| Lot / Étage / Porte | `numero_lot` / `etage` / `porte` |
| Date pièce | `date_piece` |

- Actions par ligne : 📄 (ouvre `ImpayeDrawerPdf`), ≡ (NDropdown : voir détail, assigner séquence, marquer payé)
- Sélection groupée : barre flottante en bas avec "Assigner séquence" et "Marquer payé"

### `/impayes` — Vue par payeur

- Group by `payeur_nom` en mémoire après fetch (pas d'`include` Contact nécessaire)
- Chaque groupe : `payeur_nom`, nb factures, total `reste_a_payer`, séquence si uniforme
- Lignes dépliables avec `NCollapse`

### `/impayes` — Vue par contact

- Group by toutes les relations : un contact peut apparaître comme `payeur_nom` ET comme `apporteur_nom`
- Affiche "Ses propres impayés" (où il est payeur) et "Apporteur d'affaire pour" (où il est apporteur)

### `/impayes/[id]` — Sections

1. **Header** : `← Retour`, `nfacture` — `numero_dossier`, NSelect statut (`impaye/en cours/payé`), bouton `📄 Voir PDF`

2. **FACTURE** (colonne gauche) :
   - N° facture : `nfacture`
   - Réf pièce : `ref_piece`
   - Date pièce : `date_piece`
   - Retard : calculé, coloré
   - Total HT : `total_ht`
   - Total TTC : `total_ttc`
   - Reste à payer : `reste_a_payer`
   - Commentaire : `commentaire_piece`

3. **BIEN** (colonne droite, haut) :
   - Adresse : `adresse_bien`
   - Entrée / Escalier / Étage / Porte / Lot : `entree`, `escalier`, `etage`, `porte`, `numero_lot`
   - CP Ville : `code_postal` + `ville`

4. **DOSSIER** (colonne droite, bas) :
   - N° dossier : `numero_dossier`
   - Référence : `reference`
   - Réf externe : `reference_externe`
   - Statut : `statut_dossier`
   - Date intervention : `date_debut_mission`
   - Employé : `employe_intervention`

5. **INTERLOCUTEURS** — tous champs plats sur `Impaye`, pas de requête Contact séparée :
   - Payeur : `payeur_nom`, `payeur_email`, `payeur_telephone`, badge `payeur_type` ; si entreprise (`payeur_type_personne = 'M'`) afficher aussi `payeur_contact_nom`, `payeur_contact_email`
   - Apporteur : `apporteur_nom`, `apporteur_email`, `apporteur_telephone` ; si entreprise : `apporteur_contact_nom`, `apporteur_contact_email`
   - Propriétaire : `proprietaire_nom`, `proprietaire_email`, `proprietaire_telephone`
   - Locataire entrant : `locataire_entrant_nom`, `locataire_entrant_email`, `locataire_entrant_telephone`
   - Locataire sortant : `locataire_sortant_nom`, `locataire_sortant_email`, `locataire_sortant_telephone`
   - Acquéreur : `acquereur_nom`, `acquereur_email`, `acquereur_telephone`
   - Donneur d'ordre : `donneur_ordre_nom`, `donneur_ordre_email`, `donneur_ordre_telephone`
   - Notaire : `notaire_nom`, `notaire_email`, `notaire_telephone`
   - Syndic : `syndic_nom`, `syndic_email`, `syndic_telephone`
   - N'afficher un bloc interlocuteur que si `xxx_nom` est non null

6. **SÉQUENCE** : `sequence.get('nom')` (Pointer, `include(['sequence'])` dans la query) + boutons [Changer] [Retirer] ; si `sequence === null` : "Aucune séquence assignée" + [Assigner]

7. **RELANCES** : query séparée `Relance` où `equalTo('impaye', impayelPtr)`, triées `dateEnvoi` ASC ; colonnes Date | Objet | Statut (badge) | `manuelle` (✋) | Actions (✏ 🗑)

8. **HISTORIQUE** : timeline construite à partir de `createdAt` de l'impayé et des relances existantes (envoyées, échec, pending)

### Drawer PDF (`ImpayeDrawerPdf`)

- `NDrawer` avec `iframe` pointant sur `/api/pdf/:impayelId` (le backend streame le PDF)
- Pagination page par page non nécessaire — le browser gère le scroll PDF dans l'iframe
- Bouton "Télécharger" : lien `download` vers le même endpoint

### Drawer Relance (`RelanceDrawer`)

- Props : `mode: 'create' | 'edit'`, `relance?: Relance`, `impayelId`
- Champs : Date envoi (NDatePicker), Objet (NInput), Corps (Toast UI Editor)
- En mode create : VariablePicker `[[variable]]` (NSelect avec les variables disponibles)
- Soumission : SDK Parse direct (`new Parse.Object('Relance').set({...}).save()` ou `relance.set({...}).save()`)

### Logique d'assignation de séquence (frontend)

Lors d'une assignation depuis `/impayes/[id]` :
1. Query `Relance` où `impaye = this` et `statut = 'pending'` → `destroyAll()`
2. Charger la `Sequence` sélectionnée avec ses emails
3. Pour chaque email : `dateEnvoi = aujourd'hui + email.delai` (J+N), créer `Parse.Object('Relance')` avec `manuelle: false`
4. `Parse.Object.saveAll(nouvelles_relances)`
5. `impaye.set('sequence', sequence); impaye.save()`

## Dépendances

- `@toast-ui/vue-editor` — déjà prévu dans les specs, à installer si pas encore présent
- `@heroicons/vue` — déjà installé
- Naive UI — déjà installé
- Pas de nouvelles dépendances backend
