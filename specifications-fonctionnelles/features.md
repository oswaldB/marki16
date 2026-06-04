# Liste des fonctionnalités - Marki16 Frontend

Ce document recense toutes les **features** et **user stories** du frontend Marki16, organisées selon la nomenclature [id:FTXXX]-[nom-feature].

---

## 📋 Table des matières

1. [FT001 - Authentification](#FT001-authentification)
2. [FT002 - Tableau de bord](#FT002-tableau-de-bord)
3. [FT003 - Gestion des activités](#FT003-gestion-activites)
4. [FT004 - Import de données](#FT004-import-donnees)
5. [FT005 - Éléments à corriger](#FT005-elements-a-corriger)
6. [FT006 - Gestion de la liste noire](#FT006-gestion-liste-noire)
7. [FT007 - Gestion des clients récalcitrants](#FT007-gestion-clients-recalcitrants)
8. [FT008 - Gestion des relances](#FT008-gestion-relances)
9. [FT010 - Gestion des contacts](#FT010-gestion-contacts)
10. [FT011 - Espace client simple](#FT011-espace-client-simple)
11. [FT012 - Espace client complexe](#FT012-espace-client-complexe)
12. [FT013 - Gestion des impayés](#FT013-gestion-impayes)
13. [FT014 - Paramètres système](#FT014-parametres-systeme)
14. [FT015 - Intégrations externes](#FT015-integrations-externes)
15. [FT016 - Import depuis base externe SQLite3](#FT016-import-depuis-base-externe-sqlite3)
16. [FT017 - Gestion des suivis](#FT017-gestion-des-suivis)

---

## 📂 Détail des fonctionnalités

### FT001-authentification
- **Description** : Permettre aux utilisateurs de se connecter et de s'authentifier de manière sécurisée dans l'application
- **Dossier** : features/FT001-authentification/
- **User Stories** :
  - [FT001-US001 - Connexion utilisateur](features/FT001-authentification/user-stories/FT001-US001-connexion-utilisateur.md)
  - [FT001-US002 - Déconnexion](features/FT001-authentification/user-stories/FT001-US002-deconnexion.md)
  - [FT001-US003 - Mot de passe oublié](features/FT001-authentification/user-stories/FT001-US003-mot-de-passe-oublie.md)

### FT002-tableau-de-bord
- **Description** : Fournir une vue d'ensemble des activités et indicateurs clés de l'application
- **Dossier** : features/FT002-tableau-de-bord/
- **User Stories** :
  - [FT002-US001 - Affichage des indicateurs clés](features/FT002-tableau-de-bord/user-stories/FT002-US001-affichage-indicateurs.md)
  - [FT002-US002 - Navigation rapide](features/FT002-tableau-de-bord/user-stories/FT002-US002-navigation-rapide.md)

### FT003-gestion-activites
- **Description** : Permettre le suivi et la gestion des activités commerciales et opérationnelles
- **Dossier** : features/FT003-gestion-activites/
- **User Stories** :
  - [FT003-US001 - Liste des activités](features/FT003-gestion-activites/user-stories/FT003-US001-liste-activites.md)
  - [FT003-US002 - Création d'une activité](features/FT003-gestion-activites/user-stories/FT003-US002-creation-activite.md)

### FT004-import-donnees
- **Description** : Permettre l'import massif de données depuis des fichiers externes
- **Dossier** : features/FT004-import-donnees/
- **User Stories** :
  - [FT004-US001 - Import de fichier](features/FT004-import-donnees/user-stories/FT004-US001-import-fichier.md)
  - [FT004-US002 - Validation des données importées](features/FT004-import-donnees/user-stories/FT004-US002-validation-donnees.md)

### FT005-elements-a-corriger
- **Description** : Centraliser et gérer les éléments nécessitant une correction ou une attention particulière
- **Dossier** : features/FT005-elements-a-corriger/
- **User Stories** :
  - [FT005-US001 - Liste des éléments](features/FT005-elements-a-corriger/user-stories/FT005-US001-liste-elements.md)
  - [FT005-US002 - Correction d'un élément](features/FT005-elements-a-corriger/user-stories/FT005-US002-correction-element.md)

### FT006-gestion-liste-noire
- **Description** : Maintenir une liste des contacts ou clients exclus des opérations
- **Dossier** : features/FT006-gestion-liste-noire/
- **User Stories** :
  - [FT006-US001 - Ajout à la liste noire](features/FT006-gestion-liste-noire/user-stories/FT006-US001-ajout-liste-noire.md)
  - [FT006-US002 - Retrait de la liste noire](features/FT006-gestion-liste-noire/user-stories/FT006-US002-retrait-liste-noire.md)

### FT007-gestion-clients-recalcitrants
- **Description** : Identifier et gérer les clients avec un historique de non-paiement ou de comportement problématique
- **Dossier** : features/FT007-gestion-clients-recalcitrants/
- **User Stories** :
  - [FT007-US001 - Identification des clients récalcitrants](features/FT007-gestion-clients-recalcitrants/user-stories/FT007-US001-identification-recalcitrants.md)
  - [FT007-US002 - Actions spécifiques pour récalcitrants](features/FT007-gestion-clients-recalcitrants/user-stories/FT007-US002-actions-specificques.md)

### FT008-gestion-relances
- **Description** : Automatiser et suivre le processus de relance des clients
- **Dossier** : features/FT008-gestion-relances/
- **User Stories** :
  - [FT008-US001 - Création de campagne de relance](features/FT008-gestion-relances/user-stories/FT008-US001-creation-campagne.md)
  - [FT008-US002 - Suivi des campagnes de relance](features/FT008-gestion-relances/user-stories/FT008-US002-suivi-campagne.md)

### FT010-gestion-contacts
- **Description** : Gérer la base de données des contacts (clients, prospects, partenaires)
- **Dossier** : features/FT010-gestion-contacts/
- **User Stories** :
  - [FT010-US001 - Liste des contacts](features/FT010-gestion-contacts/user-stories/FT010-US001-liste-contacts.md)
  - [FT010-US002 - Contacts sans email](features/FT010-gestion-contacts/user-stories/FT010-US002-contacts-sans-email.md)
  - [FT010-US003 - Fiche contact détaillée](features/FT010-gestion-contacts/user-stories/FT010-US003-fiche-contact.md)

### FT011-espace-client-simple
- **Description** : Fournir un espace client basique pour consulter les informations essentielles
- **Dossier** : features/FT011-espace-client-simple/
- **User Stories** :
  - [FT011-US001 - Accès à l'espace client](features/FT011-espace-client-simple/user-stories/FT011-US001-acces-espace-client.md)
  - [FT011-US002 - Consultation des impayés](features/FT011-espace-client-simple/user-stories/FT011-US002-consultation-impayes.md)
  - [FT011-US003 - Téléchargement de documents](features/FT011-espace-client-simple/user-stories/FT011-US003-telechargement-documents.md)

### FT012-espace-client-complexe
- **Description** : Fournir un espace client avancé avec fonctionnalités étendues pour les clients premium
- **Dossier** : features/FT012-espace-client-complexe/
- **User Stories** :
  - [FT012-US001 - Tableau de bord client](features/FT012-espace-client-complexe/user-stories/FT012-US001-tableau-bord-client.md)
  - [FT012-US002 - Gestion des accès utilisateurs](features/FT012-espace-client-complexe/user-stories/FT012-US002-gestion-acces.md)
  - [FT012-US003 - Historique complet](features/FT012-espace-client-complexe/user-stories/FT012-US003-historique-complet.md)

### FT013-gestion-impayes
- **Description** : Suivre et gérer les impayés et le recouvrement
- **Dossier** : features/FT013-gestion-impayes/
- **User Stories** :
  - [FT013-US001 - Liste des impayés](features/FT013-gestion-impayes/user-stories/FT013-US001-liste-impayes.md)
  - [FT013-US002 - Détail d'un impayé](features/FT013-gestion-impayes/user-stories/FT013-US002-detail-impaye.md)
  - [FT013-US003 - Actions de recouvrement](features/FT013-gestion-impayes/user-stories/FT013-US003-actions-recouvrement.md)

### FT014-parametres-systeme
- **Description** : Configurer les paramètres globaux de l'application
- **Dossier** : features/FT014-parametres-systeme/
- **User Stories** :
  - [FT014-US001 - Gestion des utilisateurs](features/FT014-parametres-systeme/user-stories/FT014-US001-gestion-utilisateurs.md)
  - [FT014-US002 - Configuration SMTP](features/FT014-parametres-systeme/user-stories/FT014-US002-configuration-smtp.md)

### FT015-integrations-externes
- **Description** : Connecter Marki16 avec des services et plateformes externes
- **Dossier** : features/FT015-integrations-externes/
- **User Stories** :
  - [FT015-US001 - Connexion API externe](features/FT015-integrations-externes/user-stories/FT015-US001-connexion-api.md)
  - [FT015-US002 - Synchronisation des données](features/FT015-integrations-externes/user-stories/FT015-US002-synchronisation-donnees.md)

### FT016-import-depuis-base-externe-sqlite3
- **Description** : Importer des données depuis une base de données externe SQLite3
- **Dossier** : features/FT016-import-sqlite3/
- **User Stories** :
  - [FT016-US001 - Configuration de la connexion](features/FT016-import-sqlite3/user-stories/FT016-US001-configuration-connexion.md)
  - [FT016-US002 - Import des données](features/FT016-import-sqlite3/user-stories/FT016-US002-import-donnees.md)

### FT017-gestion-des-suivis
- **Description** : Automatiser et suivre les envois récurrents de communications (suivis)
- **Dossier** : features/FT017-gestion-suivis/
- **User Stories** :
  - [FT017-US001 - Création d'un suivi](features/FT017-gestion-suivis/user-stories/FT017-US001-creation-suivi.md)
  - [FT017-US002 - Planification récurrente](features/FT017-gestion-suivis/user-stories/FT017-US002-planification-recurrente.md)

---

## 📊 Statistiques

- **Total des fonctionnalités** : 16
- **Total des user stories** : 40
- **Moyenne par feature** : ~2.5 user stories
- **Fichiers markdown** : 58 (16 descriptions + 40 user stories + 1 liste des écrans + 1 liste des features)

---

## 🔗 Liens utiles

- [Liste des écrans](ecrans-liste.md) - Référence des 25 écrans du frontend
- [Dépôt GitHub](https://github.com/oswaldB/marki16/tree/main/specifications-fonctionnelles)

---

*Dernière mise à jour : 4 juin 2026*
*Généré automatiquement à partir du dépôt marki16*