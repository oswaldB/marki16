# Règle métier — Passage multiple → single suite au paiement d'une facture

## Problème posé

> Un payeur a 2 factures impayées. Il est en relance **multiple** à l'`email_index` 4.  
> La première facture est payée. Il ne reste plus qu'**1 facture impayée**.  
> **Sur quel `email_index` repart-on ?**

---

## Solution proposée

### Principe fondamental

**L'`email_index` est une progression temporelle propre au couple (contact, séquence).**  
Il ne dépend **pas** du nombre de factures impayées. Le changement de scénario (`multiple` → `single` ou inversement) ne remet **jamais** l'index à zéro.

### Règle détaillée

| Situation | Comportement |
|---|---|
| Contact avait N factures, maintenant 1 | On continue la séquence là où on en était : `prochainIndex = lastSent.email_index + 1` |
| Le scénario passe de `multiple` à `single` | Le prompt utilisé change (`relance-single-prompt.txt`), mais **l'index reste le même** |
| Date d'échéance de la facture restante | Recalculée à partir de la **plus petite** `date_echeance` parmi les factures encore impayées |
| Date théorique dépassée | Génération en **rattrapage** (log existant : `Rattrapage : date théorique passée, on génère quand même`) |

### Exemple concret

```
Étape 0 : Contact a 2 factures (F1 échéance 01/07, F2 échéance 05/07)
Étape 1 : Relance multiple envoyée à l'index 4 (délai +12)
          → dateEnvoi = 01/07 + 12j = 13/07
Étape 2 : F1 est payée. Reste F2 (échéance 05/07).
Étape 3 : Prochain index = 5 (4 + 1)
          → date théorique = 05/07 + délai de l'index 5
          → scénario = single (1 seule facture restante)
          → pas de remise à zéro de l'index
```

### Pourquoi cette règle ?

1. **Cohérence temporelle** — Le contact a déjà reçu 4 relances. Recommencer à l'index 1 serait incohérent et trop agressif.
2. **La séquence est un contrat** — Chaque `email_index` correspond à un ton, un délai et un contenu spécifique. Ce contrat ne change pas parce qu'une facture a été payée.
3. **Le scénario est un rendu** — `single` vs `multiple` n'est qu'une instruction d'affichage pour le LLM. Il ne doit pas influencer la logique de séquence.

### Implémentation actuelle (déjà en place)

Le code dans `generate-relances-du-jour/index.js` suit déjà ce principe :

```javascript
const prochainIndex = lastSent
    ? (lastSent.get("email_index") + 1)
    : (emails[0]?.email_index ?? 0);
```

Aucune remise à zéro n'est prévue. La seule chose à surveiller est que la détection du scénario (`single` vs `multiple`) soit correcte après le retrait d'une facture.

---

## Cas limite : même nfacture sur plusieurs dossiers

Si les 2 factures impayées partagent le **même numéro de facture** (ex : facture 50947 sur 4 dossiers différents), alors :
- Même avec 4 lignes d'impayés, le scénario est **`single`** (une seule facture réelle).
- L'`email_index` continue normalement.
- Le prompt `relance-single-prompt.txt` gère ce cas.

---

## Cas limite — Fin de séquence atteinte mais factures toujours impayées

### Problème

> Le contact a reçu la dernière relance de la séquence (`email_index` = 9).  
> Il reste encore des factures impayées.  
> **Que se passe-t-il ?**

### Comportement actuel (constat)

Le workflow `generate-relances-du-jour` logue :
```
Fin de séquence (prochainIndex=10), ignoré
```
→ **Aucune nouvelle relance n'est générée.** Le contact n'est plus relancé.

### Options envisagées

| Option | Description | Avantage | Inconvénient |
|---|---|---|---|
| **A — Stop** | On ne relance plus. C'est au service client humain de prendre le relais. | Simple, évite le spam | Perte de recouvrement automatique |
| **B — Boucle** | Retour à l'`email_index` 1 (ou le premier index) et on recommence la séquence. | Le contact continue d'être relancé | Trop agressif, on repart comme au début |
| **C — Dernier index en boucle** | On reste bloqué sur le **dernier email de la séquence** (ex : index 9) et on le renvoie périodiquement (toutes les X semaines). | Le ton reste le plus fort (contentieux), pas de retour en arrière | Risque de lasser le destinataire |
| **D — Séquence de recouvrement** | On bascule automatiquement sur une autre séquence dédiée au "recouvrement post-séquence". | Séparation claire relance / recouvrement | Nécessite de créer et maintenir une nouvelle séquence |

### Recommandation : Option C (Dernier index en boucle)

**Principe** : Quand le dernier `email_index` est atteint, on continue à générer des relances avec ce même index, mais à une **fréquence fixe** (ex : toutes les 4 semaines).

```
Séquence terminée à l'index 9 (délai +34j)
→ Prochaine relance : index 9, date = dateEcheanceRef + 34j + 28j (intervalle de rappel)
→ Scénario : single ou multiple selon les factures restantes
→ Le contenu est regénéré par Ollama (pas juste un renvoi)
```

**Pourquoi Option C ?**
1. Le dernier email d'une séquence est généralement le plus fort — c'est celui qui mentionne le contentieux, la menace judiciaire, etc. C'est le bon niveau à maintenir.
2. Pas de retour en arrière — on ne revient pas à un ton soft après avoir menacé de contentieux.
3. Simple à implémenter — aucune nouvelle séquence à créer.

### Implémentation proposée (pseudo-code)

```javascript
const emails = sequence.get("emails") || [];
const lastEmailIndex = Math.max(...emails.map(e => e.email_index));

// ... calcul du prochainIndex normal ...

if (!emailConfig) {
    // Fin de séquence atteinte
    const dernierEmail = emails.find(e => e.email_index === lastEmailIndex);
    if (dernierEmail) {
        // Vérifier si assez de temps s'est écoulé depuis la dernière relance
        const lastRelance = await getDerniereRelanceEnvoyee(contact, sequence);
        const intervalleRappel = 28; // jours
        const dateProchainRappel = new Date(lastRelance.dateEnvoi);
        dateProchainRappel.setDate(dateProchainRappel.getDate() + intervalleRappel);
        
        if (aujourdhui >= dateProchainRappel) {
            // Générer une relance avec le dernier email_config
            prochainIndex = lastEmailIndex;
            emailConfig = dernierEmail;
            log("INFO", contactId, prochainIndex, "Séquence terminée — rappel périodique avec dernier index");
        } else {
            contactsIgnores++;
            log("INFO", contactId, null, "Trop tôt pour le rappel périodique");
            continue;
        }
    } else {
        contactsIgnores++;
        log("INFO", contactId, null, `Fin de séquence (prochainIndex=${prochainIndex}), ignoré`);
        continue;
    }
}
```

### À décider

- **Intervalle de rappel** : 28 jours ? 14 jours ?
- **Nombre max de rappels** : Illimité ? 3 rappels puis stop ?
- **Action humaine** : Faut-il créer une alerte/tâche pour le service recouvrement ?

---

## Résumé

| Situation | Règle |
|---|---|
| Facture payée, reste d'autres factures | **On continue la séquence** là où on en était. Pas de remise à zéro. |
| Même `nfacture` sur plusieurs dossiers | **Scénario `single`** malgré plusieurs lignes d'impayés. |
| Fin de séquence atteinte, factures restantes | **Rappel périodique avec le dernier email** (intervalle à définir). |

> **L'index ne remet pas à zéro quand une facture est payée.**  
> On continue la séquence. Seul le scénario d'affichage (single/multiple) s'adapte au nombre de factures **uniques** restantes.
