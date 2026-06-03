# Gestion des activités

- **Objectif** : Permettre le suivi et la gestion des activités commerciales et opérationnelles
+>>> permet de suivre les actions faites sur tous les impayés : création, import dans marki, les attributions de séquences, les générations de relances, les envois, le passage en blackliste ou non, le passage en récalcitrants, les modifications manuelles des utilisateurs <<<+
- **Périmètre** : 
  - Page activites.vue
  - Liste, filtrage et tri des activités
  - Visualisation des détails des activités
  - Inclut : Création, modification, suppression d'activités
  - Exclut : La gestion des contacts associée
- **Contraintes** : 
  - Historique des modifications
  - Export des données possibles +>>> quel format <<<+
  - Intégration avec le système de relances
- **Dépendances** : 
  - FT010 (Gestion des contacts) pour l'association
  - FT008 (Gestion des relances) pour les actions automatisées

+>>> il existe beaucoup plus de dépendance que cela <<<+