# Liste des fonctionnalités - Marki16 Frontend

Ce document recense toutes les **features** et **user stories** du frontend Marki16, organisées selon la nomenclature [id:FTXXX]-[nom-feature].

---

## 📋 Table des matières

1. [FT001 - Authentification](#ft001---authentification)
2. [FT002 - Tableau de bord](#ft002---tableau-de-bord)
3. [FT003 - Gestion des activités](#ft003---gestion-des-activites)
4. [FT004 - Import de données](#ft004---import-de-donnees)
5. [FT005 - Éléments à corriger](#ft005---elements-a-corriger)
6. [FT006 - Gestion de la liste noire](#ft006---gestion-de-la-liste-noire)
7. [FT007 - Gestion des clients récalcitrants](#ft007---gestion-des-clients-recalcitrants)
8. [FT008 - Gestion des relances](#ft008---gestion-des-relances)
9. [FT009 - Gestion des services](#ft009---gestion-des-services)
10. [FT010 - Gestion des contacts](#ft010---gestion-des-contacts)
11. [FT011 - Espace client](#ft011---espace-client)
12. [FT012 - Gestion des impayés](#ft012---gestion-des-impayes)
13. [FT013 - Gestion des séquences](#ft013---gestion-des-sequences)
14. [FT014 - Paramètres système](#ft014---parametres-systeme)
15. [FT015 - Redirections](#ft015---redirections)

---

## 📂 Détail des fonctionnalités

### FT001 - Authentification
- **Description** : Permettre aux utilisateurs de se connecter et de s'authentifier de manière sécurisée dans l'application
- **Dossier** : features/FT001-authentification/
- **User Stories** :
  - [FT001-US001 - Connexion utilisateur](features/FT001-authentification/user-stories/FT001-US001 - Connexion utilisateur.md)
  - [FT001-US002 - Déconnexion](features/FT001-authentification/user-stories/FT001-US002 - Déconnexion.md)
  - [FT001-US003 - Mot de passe oublié](features/FT001-authentification/user-stories/FT001-US003 - Mot de passe oublié.md)

### FT002 - Tableau de bord
- **Description** : Fournir une vue d'ensemble des activités et indicateurs clés de l'application
- **Dossier** : features/FT002-tableau-de-bord/
- **User Stories** :
  - [FT002-US001 - Affichage des indicateurs clés](features/FT002-tableau-de-bord/user-stories/FT002-US001 - Affichage des indicateurs clés.md)
  - [FT002-US002 - Navigation rapide](features/FT002-tableau-de-bord/user-stories/FT002-US002 - Navigation rapide.md)

### FT003 - Gestion des activités
- **Description** : Permettre le suivi et la gestion des activités commerciales et opérationnelles
- **Dossier** : features/FT003-gestion-activites/
- **User Stories** :
  - [FT003-US001 - Liste des activités](features/FT003-gestion-activites/user-stories/FT003-US001 - Liste des activités.md)
  - [FT003-US002 - Création d'une activité](features/FT003-gestion-activites/user-stories/FT003-US002 - Création d'une activité.md)

### FT004 - Import de données
- **Description** : Permettre l'import massif de données depuis des fichiers externes
- **Dossier** : features/FT004-import-donnees/
- **User Stories** :
  - [FT004-US001 - Import de fichier](features/FT004-import-donnees/user-stories/FT004-US001 - Import de fichier.md)
  - [FT004-US002 - Validation des données importées](features/FT004-import-donnees/user-stories/FT004-US002 - Validation des données importées.md)

### FT005 - Éléments à corriger
- **Description** : Centraliser et gérer les éléments nécessitant une correction ou une attention particulière
- **Dossier** : features/FT005-elements-a-corriger/
- **User Stories** :
  - [FT005-US001 - Liste des éléments](features/FT005-elements-a-corriger/user-stories/FT005-US001 - Liste des éléments.md)
  - [FT005-US002 - Correction d'un élément](features/FT005-elements-a-corriger/user-stories/FT005-US002 - Correction d'un élément.md)

### FT006 - Gestion de la liste noire
- **Description** : Maintenir une liste des contacts ou clients exclus des opérations
- **Dossier** : features/FT006-gestion-liste-noire/
- **User Stories** :
  - [FT006-US001 - Ajout à la liste noire](features/FT006-gestion-liste-noire/user-stories/FT006-US001 - Ajout à la liste noire.md)
  - [FT006-US002 - Retrait de la liste noire](features/FT006-gestion-liste-noire/user-stories/FT006-US002 - Retrait de la liste noire.md)

### FT007 - Gestion des clients récalcitrants
- **Description** : Identifier et gérer les clients avec un historique de non-paiement ou de comportement problématique
- **Dossier** : features/FT007-gestion-clients-recalcitrants/
- **User Stories** :
  - [FT007-US001 - Identification des clients récalcitrants](features/FT007-gestion-clients-recalcitrants/user-stories/FT007-US001 - Identification des clients récalcitrants.md)
  - [FT007-US002 - Actions spécifiques pour récalcitrants](features/FT007-gestion-clients-recalcitrants/user-stories/FT007-US002 - Actions spécifiques pour récalcitrants.md)

### FT008 - Gestion des relances
- **Description** : Automatiser et suivre le processus de relance des clients
- **Dossier** : features/FT008-gestion-relances/
- **User Stories** :
  - [FT008-US001 - Création de campagne de relance](features/FT008-gestion-relances/user-stories/FT008-US001 - Création de campagne de relance.md)
  - [FT008-US002 - Suivi des campagnes de relance](features/FT008-gestion-relances/user-stories/FT008-US002 - Suivi des campagnes de relance.md)

### FT009 - Gestion des services
- **Description** : Configurer et gérer les services proposés par l'application
- **Dossier** : features/FT009-gestion-services/
- **User Stories** :
  - [FT009-US001 - Catalogue des services](features/FT009-gestion-services/user-stories/FT009-US001 - Catalogue des services.md)
  - [FT009-US002 - Association services-clients](features/FT009-gestion-services/user-stories/FT009-US002 - Association services-clients.md)

### FT010 - Gestion des contacts
- **Description** : Gérer la base de données des contacts (clients, prospects, partenaires)
- **Dossier** : features/FT010-gestion-contacts/
- **User Stories** :
  - [FT010-US001 - Liste des contacts](features/FT010-gestion-contacts/user-stories/FT010-US001 - Liste des contacts.md)
  - [FT010-US002 - Contacts sans email](features/FT010-gestion-contacts/user-stories/FT010-US002 - Contacts sans email.md)
  - [FT010-US003 - Fiche contact détaillée](features/FT010-gestion-contacts/user-stories/FT010-US003 - Fiche contact détaillée.md)

### FT011 - Espace client
- **Description** : Fournir un espace dédié aux clients pour consulter leurs informations
- **Dossier** : features/FT011-espace-client/
- **User Stories** :
  - [FT011-US001 - Accès à l'espace client](features/FT011-espace-client/user-stories/FT011-US001 - Accès à l'espace client.md)
  - [FT011-US002 - Consultation des impayés](features/FT011-espace-client/user-stories/FT011-US002 - Consultation des impayés.md)
  - [FT011-US003 - Téléchargement de documents](features/FT011-espace-client/user-stories/FT011-US003 - Téléchargement de documents.md)

### FT012 - Gestion des impayés
- **Description** : Suivre et gérer les impayés et le recouvrement
- **Dossier** : features/FT012-gestion-impayes/
- **User Stories** :
  - [FT012-US001 - Liste des impayés](features/FT012-gestion-impayes/user-stories/FT012-US001 - Liste des impayés.md)
  - [FT012-US002 - Détail d'un impayé](features/FT012-gestion-impayes/user-stories/FT012-US002 - Détail d'un impayé.md)
  - [FT012-US003 - Actions de recouvrement](features/FT012-gestion-impayes/user-stories/FT012-US003 - Actions de recouvrement.md)

### FT013 - Gestion des séquences
- **Description** : Définir et exécuter des séquences d'actions automatisées
- **Dossier** : features/FT013-gestion-sequences/
- **User Stories** :
  - [FT013-US001 - Création d'une séquence](features/FT013-gestion-sequences/user-stories/FT013-US001 - Création d'une séquence.md)
  - [FT013-US002 - Séquences de relance](features/FT013-gestion-sequences/user-stories/FT013-US002 - Séquences de relance.md)
  - [FT013-US003 - Séquences de suivi](features/FT013-gestion-sequences/user-stories/FT013-US003 - Séquences de suivi.md)

### FT014 - Paramètres système
- **Description** : Configurer les paramètres globaux de l'application
- **Dossier** : features/FT014-parametres-systeme/
- **User Stories** :
  - [FT014-US001 - Gestion des utilisateurs](features/FT014-parametres-systeme/user-stories/FT014-US001 - Gestion des utilisateurs.md)
  - [FT014-US002 - Configuration SMTP](features/FT014-parametres-systeme/user-stories/FT014-US002 - Configuration SMTP.md)

### FT015 - Redirections
- **Description** : Gérer les redirections vers des ressources externes ou internes
- **Dossier** : features/FT015-redirections/
- **User Stories** :
  - [FT015-US001 - Redirection vers espace client](features/FT015-redirections/user-stories/FT015-US001 - Redirection vers espace client.md)
  - [FT015-US002 - Redirection vers PDF](features/FT015-redirections/user-stories/FT015-US002 - Redirection vers PDF.md)

---

## 📊 Statistiques

- **Total des fonctionnalités** : 15
- **Total des user stories** : 35
- **Moyenne par feature** : ~2.3 user stories
- **Fichiers markdown** : 52 (15 descriptions + 35 user stories + 1 liste des écrans + 1 liste des features)

---

## 🔗 Liens utiles

- [Liste des écrans](ecrans-liste.md) - Référence des 25 écrans du frontend
- [Dépôt GitHub](https://github.com/oswaldB/marki16/tree/main/specifications-fonctionnelles)

---

*Dernière mise à jour : 3 juin 2026*
*Généré automatiquement à partir du dépôt marki16*