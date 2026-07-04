---
title: ADTI - Analyse et Détection des Taux d'Impayés
status: draft
created: 2026-06-25
---

# ADTI - Analyse et Détection des Taux d'Impayés

## Problème métier

Les entreprises ont besoin d'analyser leurs taux d'impayés clients pour identifier les mauvais payeurs et optimiser leurs relances. Actuellement, les données sont dispersées et difficiles à analyser.

## Personas

- **Analyste financier** : Veut visualiser les tendances d'impayés et exporter des rapports
- **Responsable commercial** : Veut identifier les clients à risque et planifier des actions
- **Agent de recouvrement** : Veut relancer les mauvais payeurs avec des emails personnalisés

## Besoins fonctionnels

1. **Import de données** : Charger des fichiers de factures (CSV, Excel) pour analyse
2. **Tableau de bord** : Visualiser les KPIs clés (taux d'impayé, DSO, montants)
3. **Liste des factures** : Voir toutes les factures avec filtres et tri
4. **Fiche client** : Voir le détail d'un client et son historique d'impayés
5. **Détection anomalies** : Identifier automatiquement les clients à risque
6. **Export rapports** : Générer des rapports PDF/Excel des analyses
7. **Relances** : Envoyer des emails de relance personnalisés

## Contexte

Application web fullstack avec frontend Alpine.js + Tailwind, backend Node.js. L'application doit être responsive et fonctionner sans dépendances externes complexes.
