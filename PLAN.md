# Plan de Développement - Marki16

## Objectifs
1. Finaliser la configuration du backend Parse Server
2. Configurer et tester le frontend Nuxt.js
3. Établir la communication entre frontend et backend
4. Implémenter les fonctionnalités de base

## Étapes Détaillées

### Phase 1: Configuration du Backend (✓ Complété)
- [x] Changer le port de Parse Server de 1337 à 1555
- [x] Configurer CORS pour permettre les requêtes depuis localhost:5001
- [x] Vérifier que le backend répond correctement sur /healthy et /parse

### Phase 2: Configuration du Frontend (✓ Complété)
- [x] Changer le port de Nuxt de 3000 à 5001 (5000 était occupé)
- [x] Mettre à jour toutes les URLs pour pointer vers localhost:1555
- [x] Installer les dépendances npm
- [x] Démarrer le serveur de développement

### Phase 3: Résolution des Problèmes de Connexion (En cours)
- [ ] Vérifier que le frontend peut atteindre le backend
- [ ] Corriger les problèmes de CORS si nécessaire
- [ ] Tester la communication entre frontend et backend
- [ ] Vérifier l'initialisation de Parse dans le frontend

### Phase 4: Implémentation des Fonctionnalités
- [ ] Créer les modèles de données Parse
- [ ] Implémenter l'authentification
- [ ] Développer les pages principales
- [ ] Connecter le frontend au backend via l'API Parse

### Phase 5: Tests et Déploiement
- [ ] Tester toutes les fonctionnalités
- [ ] Corriger les bugs
- [ ] Préparer pour le déploiement

## Prochaines Actions
1. Vérifier la connexion entre frontend et backend
2. Corriger le message d'erreur Parse SDK
3. Tester manuellement dans le navigateur
4. Implémenter les premières fonctionnalités

## Commandes Utiles

### Démarrer le backend:
```bash
cd backend && npm start
```

### Démarrer le frontend:
```bash
cd frontend && npm run dev
```

### Arrêter les serveurs:
```bash
pkill -f "node server.js"
pkill -f "nuxt dev"
```

### Vérifier les logs:
```bash
cat backend/backend.log
cat frontend/frontend.log
```

## URLs Importantes
- Backend: http://localhost:1555/parse
- Frontend: http://localhost:5001
- Health check: http://localhost:1555/healthy