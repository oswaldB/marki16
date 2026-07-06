# F-T-NOTIF : Notifications

**Personas** : Tous les utilisateurs  
**Contexte** : L'application doit informer l'utilisateur des actions réussies ou des erreurs via des notifications (toasts).

## User Stories

### US-T-NOTIF-1
En tant qu'utilisateur  
Je veux recevoir une confirmation visuelle après une action réussie  
Afin de savoir que mon action a bien été prise en compte.

### US-T-NOTIF-2
En tant qu'utilisateur  
Je veux être informé des erreurs de manière claire  
Afin de comprendre ce qui n'a pas fonctionné.

## Critères d'acceptation

- Un toast vert s'affiche pour les actions réussies
- Un toast rouge s'affiche pour les erreurs
- Les toasts disparaissent après 5 secondes (ou sur clic)
- Les toasts sont positionnés en haut à droite de l'écran

---

## **🔄 Système d'Activités (Parse Server)**
**Nouveau** : Les notifications pour le système d'activités suivent les mêmes règles et ajoutent des messages spécifiques.

### **Notifications pour les Activités**
| Action | Type de Toast | Message | Durée |
|--------|---------------|---------|-------|
| Enregistrement réussi | ✅ Succès | "Activité enregistrée avec succès." | 5s |
| Enregistrement échoué | ❌ Erreur | "Échec de l'enregistrement de l'activité. Veuillez réessayer." | 5s |
| Batch réussi | ✅ Succès | "X activités enregistrées." | 5s |
| Batch partiel | ⚠️ Avertissement | "X/Y activités enregistrées. Certaines ont échoué." | 7s |

### **Exemple de Code pour les Toasts**
```javascript
// Après enregistrement réussi d'une activité
toast.add({
  title: 'Activité enregistrée',
  description: 'Vos modifications ont été sauvegardées.',
  color: 'green',
  icon: 'i-heroicons-check-circle',
  duration: 5000
});

// Après échec d'enregistrement
tost.add({
  title: 'Erreur',
  description: 'Impossible d\'enregistrer l\'activité. Veuillez réessayer.',
  color: 'red',
  icon: 'i-heroicons-exclamation-circle',
  duration: 5000
});

// Après enregistrement en batch
toast.add({
  title: 'Activités enregistrées',
  description: `${successCount} activités ont été enregistrées avec succès.`,
  color: 'green',
  icon: 'i-heroicons-check-circle',
  duration: 5000
});

// En cas d'échec partiel en batch
if (failedCount > 0) {
  toast.add({
    title: 'Avertissement',
    description: `${successCount}/${totalCount} activités enregistrées. ${failedCount} ont échoué.`,
    color: 'amber',
    icon: 'i-heroicons-exclamation-triangle',
    duration: 7000
  });
}
```

---

## **📌 Règles de Notification pour le Système d'Activités**
1. **Toujours notifier** : Chaque action utilisateur qui modifie une activité doit afficher un toast de confirmation.
2. **Être clair** : Les messages doivent indiquer clairement ce qui s'est passé (succès, échec, avertissement).
3. **Proposer des actions** : Pour les erreurs, inclure un bouton "Réessayer" si possible.
4. **Ne pas spammer** : Éviter les toasts redondants (ex: ne pas notifier chaque activité en batch, mais le batch complet).

---

## **🔗 Exemples de Notifications par Feature**

### **F-001 : Import de données**
```javascript
// Après import réussi
toast.add({
  title: 'Import réussi',
  description: `10 factures importées. 10 activités enregistrées.`,
  color: 'green'
});
```

### **F-007 : Relances email**
```javascript
// Après envoi réussi d'une relance
await logActivite({ type: 'envoi_relance', ... });
toast.add({
  title: 'Relance envoyée',
  description: 'La relance a été envoyée à Dupont SARL. Activité enregistrée.',
  color: 'green'
});
```

### **F-008 : Blacklist des impayés**
```javascript
// Après blacklist réussie
await logActivite({ type: 'blacklist_impaye', ... });
toast.add({
  title: 'Impayé blacklisté',
  description: 'La facture FAC-2026-001 est maintenant suspendue. Activité enregistrée.',
  color: 'green'
});
```

### **F-009 : Bouton Enregistrer**
```javascript
// Après enregistrement réussi
await logActivite({ type: 'enregistrement_relance', ... });
toast.add({
  title: 'Modifications enregistrées',
  description: 'Vos modifications ont été sauvegardées.',
  color: 'green'
});
```

---

## **📂 Fichiers Concernés**
- `frontend/composables/useToast.js` (gestion des toasts)
- `frontend/components/NotificationCenter.vue` (affichage)
- `backend/cloud/utils/logActivite.js` (appels aux toasts après logging)

---

## **🔗 Voir aussi**
- [F-013 : Système d'Activités](../F-013-système-activités.md) (spécification complète)
- [F-T-LOG : Observabilité / Logging](./F-T-LOG.md) (logs associés)
- [F-T-ERROR : Gestion d'erreurs](./F-T-ERROR.md) (erreurs associées)