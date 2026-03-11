## 1. Frontend — Page `/sequences`

- [x] 1.1 Créer `frontend/pages/sequences.vue` : au `onMounted`, query `Sequence` triée par `nom` ASC, limit 200 ; `UTable` colonnes : Nom (lien cliquable vers `/sequences/${id}`) | Emails (`emails.length`) | Impayés | Actions
- [x] 1.2 Compteurs impayés : `Promise.all` de `new $parse.Query('Impaye').equalTo('sequence', ptr).count()` pour chaque séquence ; afficher le résultat dans la colonne Impayés
- [x] 1.3 Bouton `+ Nouvelle séquence` : `new $parse.Object('Sequence').set({ nom: 'Nouvelle séquence', emails: [], regles: [], regles_type: 'incluant', lien_paiement: '' }).save()` puis `router.push('/sequences/' + seq.id)`
- [x] 1.4 Action `✏` par ligne → `router.push('/sequences/' + seq.id)`
- [x] 1.5 Action `🗑` par ligne → UModal de confirmation ; si la séquence a des impayés (`impayes_count > 0`), afficher un avertissement "X impayés assignés seront sans séquence" ; confirmer → `sequence.destroy()` + recharger

## 2. Frontend — Page `/sequences/[id]` — Structure de base

- [x] 2.1 Créer `frontend/pages/sequences/[id].vue` : au `onMounted`, charger la `Sequence` par id + charger les `SmtpProfile` (`new $parse.Query('SmtpProfile').ascending('nom').limit(50).find()`) ; initialiser refs `nom`, `lienPaiement`, `emails` (copie du tableau), `regles`, `reglesType`
- [x] 2.2 **Header** : lien `← Retour` (→ `/sequences`), `UInput` v-model `nom` (style titre, `text-xl font-semibold`), bouton `💾 Enregistrer` (`:loading="saving"`) → appelle `sauvegarder()`
- [x] 2.3 **Champ Lien de paiement** : `UInput` v-model `lienPaiement` (read-only, affiche la valeur tronquée) + bouton `[ ✏ Construire ]` qui ouvre le drawer lien de paiement

## 3. Frontend — Section EMAILS

- [x] 3.1 Afficher les emails triés par `delai` croissant avec `v-for` ; chaque email dans une `UCard` avec en-tête `Email N — J+{delai}` et bouton 🗑 (splice du tableau)
- [x] 3.2 Champs par email : `J+` (UInput type number, v-model `email.delai`), `Profil SMTP` (USelect des SmtpProfile par `objectId` + label `nom_affiche || nom`, + option spéciale `+ Créer` qui ouvre la popup SMTP), `À` (UInput), `CC` (UInput), `Objet` (UInput), `Corps` (Toast UI Editor via `@toast-ui/vue-editor`, mode WYSIWYG)
- [x] 3.3 Sous le champ Corps : bouton `[ [[ ]] Variables ]` → ouvre un popover ancré en dessous avec une search bar (filtre temps réel) et les variables groupées par catégorie (PAYEUR / FACTURE / BIEN / DOSSIER) sous forme de chips cliquables ; clic sur un chip → `navigator.clipboard.writeText('[[variable]]')` + toast "Copié — collez avec Ctrl+V" ; le popover se ferme au clic extérieur ; bouton `[ 🔗 Lien de paiement ]` → copie la valeur brute de `lienPaiement.value` dans le presse-papier + toast (bouton désactivé si `lienPaiement` vide) ; bouton `[ Demander à ChatGPT ]` → ouvre la popup ChatGPT pour cet email ; pour lire le contenu à la sauvegarde : `editorRef.getInstance().getHTML()`
- [x] 3.4 Bouton `+ Ajouter un email` en bas de la section : push `{ delai: 0, smtp: '', to: '[[payeur_email]]', cc: '', objet: '', corps: '' }` dans `emails`
- [x] 3.5 Bouton `[ ✨ Générer par IA ]` en header de la section → ouvre la popup "Générer par IA" globale

## 4. Frontend — Section RÈGLES

- [x] 4.1 Afficher les règles avec `v-for` ; chaque règle sur une ligne : `USelect` champ (payeur_type / reste_a_payer / statut / statut_dossier), `USelect` opérateur (egal / superieur / inferieur / contient), `UInput` valeur, bouton 🗑
- [x] 4.2 En bas des règles : `USelect` v-model `reglesType` avec options `[{ label: 'Incluant', value: 'incluant' }, { label: 'Excluant', value: 'excluant' }]` + bouton `+ Ajouter un filtre` (push `{ champ: 'payeur_type', operateur: 'egal', valeur: '' }`)
- [x] 4.3 Aperçu live sous les règles : `watch(regles, calculerApercu, { deep: true })` debounce 600ms ; afficher `✅ X impayés concernés` et `❌ Y exclus` (Y = total − X) ; lien `[ Voir les X impayés ]` → `/impayes?sequence=${id}`

## 5. Frontend — Drawers et popups

- [x] 5.1 **Drawer lien de paiement** : UModal avec UTextarea ref `lienPaiementTextareaEl` v-model `lienPaiementEdit` ; bouton `[ [[ ]] Variables ]` → même popover avec search bar et chips groupés, mais au clic insère `[[var]]` directement dans le textarea à la position du curseur via `selectionStart/selectionEnd` (pas clipboard) ; aperçu live (remplace les variables par des valeurs d'exemple : `[[nfacture]]` → `FA-2024-01`, `[[reste_a_payer]]` → `1200`) ; bouton `Copier le lien` (clipboard) ; bouton `Enregistrer` → `lienPaiement.value = lienPaiementEdit.value`, fermer modal
- [x] 5.2 **Popup Générer par IA** : UModal ; bouton `📋 Copier le prompt` → génère et copie dans le clipboard un prompt décrivant la séquence (objectif, nb emails, variables disponibles) ; UTextarea pour coller la réponse JSON ; `[ ✓ Valider ]` → `JSON.parse(response)` pour remplacer `emails` si le format contient un tableau d'objets valides (champs `objet`, `corps`, `delai`), toast erreur si JSON invalide
- [x] 5.3 **Popup Demander à ChatGPT** (par email) : UModal ; bouton `📋 Copier le prompt` → prompt contextuel (objectif + emails de la séquence déjà définis + variables) ; UTextarea pour coller la réponse ; `[ ✓ Insérer dans éditeur ]` → copie la réponse dans `email.corps`
- [x] 5.4 **Popup Créer profil SMTP** : UModal avec champs `nom`, `host`, `port` (number, défaut 587), `username`, `password` (type password), `nom_affiche`, `email_from` ; `[ Enregistrer ]` → `new $parse.Object('SmtpProfile').set({...}).save()` puis ajouter le nouveau profil à `smtpProfiles` et sélectionner automatiquement dans l'email courant

## 6. Sauvegarde

- [x] 6.1 Fonction `sauvegarder()` : `sequence.set('nom', nom.value); sequence.set('lien_paiement', lienPaiement.value); sequence.set('emails', emails.value); sequence.set('regles', regles.value); sequence.set('regles_type', reglesType.value); await sequence.save()` ; toast succès/erreur

## 7. Navigation

- [x] 7.1 Vérifier que `frontend/layouts/default.vue` a bien `{ to: '/sequences', label: 'Séquences', icon: 'i-heroicons-queue-list' }` (déjà présent — juste valider, aucune modification nécessaire)
