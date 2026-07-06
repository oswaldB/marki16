# F-007 : Relances email

**Personas** : Agent de recouvrement  
**Contexte** : Les agents doivent pouvoir envoyer des emails de relance personnalisés aux clients débiteurs.

## User Stories

### US-007-1
En tant qu'agent de recouvrement  
Je veux générer un email de relance pré-rempli depuis la fiche client  
Afin de gagner du temps sur la rédaction.

### US-007-2
En tant qu'agent de recouvrement  
Je veux personnaliser le message avant envoi  
Afin d'adapter le ton selon le client.

### US-007-3
En tant qu'agent de recouvrement  
Je veux voir l'historique des relances envoyées à un client  
Afin d'éviter les doublons.

### US-007-4
En tant qu'agent de recouvrement  
Je veux envoyer une relance en copie à mon responsable  
Afin de le tenir informé.

## Critères d'acceptation

- Un bouton "Relancer" est présent sur la fiche client et la liste des factures impayées
- Un modal s'ouvre avec un template d'email pré-rempli (objet + corps)
- Le template inclut automatiquement : nom client, montant dû, factures concernées
- Un éditeur permet de modifier le message avant envoi
- Une case à cocher permet d'ajouter le responsable en CC
- Un log `[CHECKPOINT] relance-opened` est émis à l'ouverture du modal
- Un log `[CHECKPOINT] relance-sent` est émis après envoi réussi
- Un log `[CHECKPOINT] relance-failed` est émis en cas d'erreur SMTP
- La liste des factures concernées est jointe automatiquement

---

## **🔄 Système d'Activités (Parse Server)**
**Nouveau** : Chaque action liée aux relances email est tracée dans la table `Activite`.

### **Activités Loggées**

| Type | Acteur | Cible | Workflow | Description |
|------|--------|-------|----------|-------------|
| `préparation_relance` | `user_id` | `Relance` | `preparer-template` | Préparation d'un template de relance. |
| `édition_message` | `user_id` | `Relance` | `editer-message` | Édition du message avant envoi. |
| `envoi_relance` | `marki` ou `user_id` | `Relance` | `envoyer-email` | Envoi effectif d'une relance par email. |
| `historisation_relance` | `marki` | `Relance` | `historiser-relance` | Historisation après envoi. |

### **Exemple de Log**
```javascript
// Dans le workflow `preparer-template`
const { logActivite } = require('../../utils/logActivite');

// Après préparation du template
await logActivite({
  type: 'préparation_relance',
  acteur: Parse.User.currentUser,
  cibleType: 'Relance',
  cibleId: relance.id,
  metadata: {
    clientId: client.id,
    clientNom: client.get('nom'),
    montantTotal: 12500,
    nombreFactures: 3
  },
  workflow: 'preparer-template',
  isSystem: false,
});

// Dans le workflow `editer-message`
await logActivite({
  type: 'édition_message',
  acteur: Parse.User.currentUser,
  cibleType: 'Relance',
  cibleId: relance.id,
  metadata: {
    modifications: ['objet', 'corps'],
    objetAvant: relance.get('sujet'),
    objetApres: nouveauSujet
  },
  workflow: 'editer-message',
  isSystem: false,
});

// Dans le workflow `envoyer-email`
await logActivite({
  type: 'envoi_relance',
  acteur: null, // marki (si automatique) ou user_id (si manuel)
  cibleType: 'Relance',
  cibleId: relance.id,
  metadata: {
    emailDestinataire: relance.get('contact').get('email'),
    cc: relance.get('cc'),
    sujet: relance.get('sujet'),
    statut: 'envoyée'
  },
  workflow: 'envoyer-email',
  isSystem: true,
});
```

### **Checkpoints Associés**
- `[CHECKPOINT] relance-opened` → Modal de relance ouvert.
- `[CHECKPOINT] relance-sent` → Relance envoyée.
- `[CHECKPOINT] relance-failed` → Échec d'envoi.
- **Nouveau** : `[CHECKPOINT] activite-created` → Une activité est enregistrée dans `Activite`.

---

## **📌 Intégration avec le Système d'Activités**
- **Où ?** : Dans `backend/cloud/workflows/preparer-template/00-master.js`, `editer-message/00-master.js`, `envoyer-email/00-master.js`.
- **Quand ?** : Après chaque étape de préparation, édition, ou envoi d'une relance.
- **Pourquoi ?** : Traçabilité complète des relances pour audit et analyse de l'efficacité.

---

## **🔗 Voir aussi**
- [F-013 : Système d'Activités](../F-013-système-activités.md) (spécification complète)