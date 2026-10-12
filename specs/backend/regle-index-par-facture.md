# Règle métier — Cycle de relance : nouvelle facture après paiement

## Problème complexe posé

> Un contact a une facture **F1** impayée.  
> Il reçoit des relances : index 1, 2, 3, 4 envoyés successivement.  
> **F1 est payée.**  
> Une nouvelle facture **F2** arrive pour le même contact, sur la même séquence.  
> **À quel `email_index` doit commencer F2 ?**

Le système actuel calcule `prochainIndex` à l'échelle du **contact + séquence**, ce qui fait que F2 hériterait de l'index 5 de F1 — c'est **incorrect** car F2 est une facture neuve avec sa propre date d'échéance.

---

## Solution proposée

### Principe fondamental

Quand une facture précédente a été payée et qu'une **nouvelle facture** arrive pour le même contact :

**On ne repart pas à zéro.**  
On calcule le nouvel index comme suit :

```
nouvel_index = index_max_de_la_séquence - nombre_de_relances_envoyées_pour_la_ancienne_facture
```

| Situation | Comportement |
|---|---|
| **F1** relancée jusqu'à l'index 4 puis payée | Son cycle s'arrête. Elle disparaît du groupe actif. |
| **F2** (nouvelle facture) arrive | On calcule l'index de départ : `max_séquence - relances_envoyées_F1` |
| Plusieurs dossiers pour la **même nfacture** | Un seul groupe, un seul cycle de relance. Le scénario est `single`. |

### Exemple concret

```
Séquence définie avec email_index de 1 à 9 (index_max = 9)

Jour 0  : F1 impayée → relance index 1 envoyée
Jour 5  : F1 impayée → relance index 2 envoyée
Jour 10 : F1 impayée → relance index 3 envoyée
Jour 15 : F1 impayée → relance index 4 envoyée
Jour 20 : F1 payée ✅
Jour 25 : F2 impayée arrive

→ Calcul : index_max (9) - relances_F1 (4) = 5
→ F2 démarre à l'email_index 5
→ Relances restantes pour F2 : 5, 6, 7, 8, 9
```

### Pourquoi cette règle ?

- **Pas de retour en arrière** : On ne repart pas à l'index 1 (ton trop soft pour une nouvelle facture alors que le contact a déjà reçu 4 relances).
- **Pas de continuation directe** : On ne repart pas à l'index 5 non plus (on adapte le nombre d'étapes restantes).
- **Équité** : Chaque facture a droit au même "crédit" total d'étapes dans la séquence. Si F1 a consommé 4 étapes, F2 hérite des 5 étapes restantes.

### Implémentation proposée (pseudo-code)

```javascript
// 1. Récupérer le dernier email_index envoyé pour ce contact + séquence
const Relance = Parse.Object.extend("Relance");
const histQuery = new Parse.Query(Relance);
histQuery.equalTo("contact", contact);
histQuery.equalTo("sequence", sequence);
histQuery.equalTo("manuelle", false);
histQuery.equalTo("statut", "Envoyée");
histQuery.descending("email_index");
histQuery.limit(1);
const lastSent = await histQuery.first({ useMasterKey: true });

// 2. Récupérer tous les emails de la séquence pour trouver le max
const emails = sequence.get("emails") || [];
const maxIndex = Math.max(...emails.map(e => e.email_index));

// 3. Calculer le nombre de relances envoyées pour ce contact
const relancesEnvoyees = lastSent ? lastSent.get("email_index") : 0;

// 4. Calculer le nouvel index pour la nouvelle facture
const prochainIndex = maxIndex - relancesEnvoyees;

// 5. Vérifier si l'index existe dans la séquence
const emailConfig = emails.find((e) => e.email_index === prochainIndex);
if (!emailConfig) {
    contactsIgnores++;
    log("INFO", contactId, null, `Index calculé ${prochainIndex} hors séquence, ignoré`);
    continue;
}
```

---

## Cas limite — Plusieurs factures impayées simultanément

Si F1 et F2 sont impayées **en même temps** :

| Factures | Comportement |
|---|---|
| F1 (index 1 envoyé) + F2 (neuve) | Les deux factures sont groupées. Le groupe hérite de l'index le plus avancé. |
| Deux factures distinctes, aucune relance envoyée | Scénario `multiple`, démarrage à l'index initial de la séquence. |

---

## Résumé

| Question | Réponse |
|---|---|
| **Le cycle de relance est-il par contact ou par facture ?** | **Par facture**. Chaque facture a son propre calcul d'index. |
| **F1 payée, F2 arrive — on repart à quel index ?** | **`max_séquence - relances_F1_envoyées`** |
| **Même nfacture, plusieurs dossiers** | **Une seule relance**, scénario `single`. |

> **L'email_index est un crédit par facture.**  
> Quand une facture est payée, le crédit restant est transféré à la nouvelle facture.
