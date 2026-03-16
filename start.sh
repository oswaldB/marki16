#!/bin/bash

# Marki16 - Script de démarrage des serveurs
# Ce script démarre le backend Parse Server et le frontend Nuxt

echo "🚀 Démarrage des serveurs Marki16..."
echo "===================================="

# Vérifier que nous sommes à la racine du projet
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Erreur: Ce script doit être exécuté depuis la racine du projet"
    exit 1
fi

# Fonction pour vérifier si un port est utilisé
port_in_use() {
    if command -v ss &> /dev/null; then
        ss -tuln | grep -q ":$1\s"
    elif command -v netstat &> /dev/null; then
        netstat -tuln | grep -q ":$1\s"
    else
        echo "⚠️  Avertissement: Impossible de vérifier les ports (ss/netstat non disponible)"
        return 1
    fi
}

# Arrêter les serveurs existants
echo "🔄 Arrêt des serveurs existants..."

# Arrêter Caddy
CADDY_PIDS=$(pgrep -f "caddy" 2>/dev/null)
if [ -n "$CADDY_PIDS" ]; then
    echo "   Arrêt de Caddy (PIDs: $CADDY_PIDS)"
    sudo caddy stop 2>/dev/null || kill $CADDY_PIDS 2>/dev/null
    sleep 2
fi

# Arrêter le backend
BACKEND_PIDS=$(pgrep -f "node server.js" 2>/dev/null)
if [ -n "$BACKEND_PIDS" ]; then
    echo "   Arrêt du backend (PIDs: $BACKEND_PIDS)"
    kill $BACKEND_PIDS 2>/dev/null
    sleep 2
fi

# Arrêter le frontend
FRONTEND_PIDS=$(pgrep -f "nuxt dev" 2>/dev/null)
if [ -n "$FRONTEND_PIDS" ]; then
    echo "   Arrêt du frontend (PIDs: $FRONTEND_PIDS)"
    kill $FRONTEND_PIDS 2>/dev/null
    sleep 2
fi

# Arrêter Parse Dashboard si présent
DASHBOARD_PIDS=$(pgrep -f "Parse-Dashboard" 2>/dev/null)
if [ -n "$DASHBOARD_PIDS" ]; then
    echo "   Arrêt de Parse Dashboard (PIDs: $DASHBOARD_PIDS)"
    kill $DASHBOARD_PIDS 2>/dev/null
    sleep 2
fi

# Vérifier les ports
echo "🔍 Vérification des ports..."

if port_in_use 1555; then
    echo "⚠️  Le port 1555 est déjà utilisé"
    read -p "   Voulez-vous continuer quand même ? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

if port_in_use 5000; then
    echo "⚠️  Le port 5000 est déjà utilisé"
    read -p "   Voulez-vous continuer quand même ? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Démarrer le backend
echo "🔥 Démarrage du backend Parse Server..."
cd backend || { echo "❌ Impossible de se déplacer dans backend/"; exit 1; }

# Vérifier si les dépendances sont installées
if [ ! -d "node_modules" ]; then
    echo "   Installation des dépendances..."
    npm install --silent || { echo "❌ Échec de l'installation des dépendances backend"; exit 1; }
fi

# Démarrer le serveur backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend démarré (PID: $BACKEND_PID)"
echo "   📝 Logs: backend.log"
echo "   🌐 URL: http://localhost:1555/parse"

# Attendre que le backend soit prêt
sleep 5

# Vérifier que le backend répond
if curl -s http://localhost:1555/healthy > /dev/null; then
    echo "   ✅ Backend est opérationnel"
else
    echo "   ⚠️  Backend ne répond pas encore (peut prendre plus de temps)"
fi

# Démarrer le frontend
echo "🎨 Démarrage du frontend Nuxt..."
cd ../frontend || { echo "❌ Impossible de se déplacer dans frontend/"; exit 1; }

# Vérifier si les dépendances sont installées
if [ ! -d "node_modules" ]; then
    echo "   Installation des dépendances..."
    npm install --silent || { echo "❌ Échec de l'installation des dépendances frontend"; exit 1; }
fi

# Démarrer le serveur frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   Frontend démarré (PID: $FRONTEND_PID)"
echo "   📝 Logs: frontend.log"
echo "   🌐 URL: http://localhost:5000"

# Attendre que le frontend soit prêt
sleep 8

# Vérifier que le frontend répond
if curl -s http://localhost:5000 > /dev/null; then
    echo "   ✅ Frontend est opérationnel"
else
    echo "   ⚠️  Frontend ne répond pas encore (peut prendre plus de temps)"
fi

# Retour à la racine
cd ..

# Démarrer Caddy
echo "🌐 Démarrage de Caddy..."
if command -v caddy &> /dev/null; then
    sudo caddy start --config /etc/caddy/Caddyfile
    if [ $? -eq 0 ]; then
        echo "   ✅ Caddy démarré"
        echo "   🌐 Frontend: https://dev.markidiags.com"
        echo "   🌐 API: https://dev.api.markidiags.com:8444/parse"
    else
        echo "   ⚠️  Impossible de démarrer Caddy"
    fi
else
    echo "   ⚠️  Caddy n'est pas installé"
fi

echo ""
echo "===================================="
echo "🎉 Serveurs démarrés avec succès!"
echo ""
echo "📋 Résumé:"
echo "   Backend:  http://localhost:1555/parse"
echo "   Frontend: http://localhost:5000"
echo "   Health:   http://localhost:1555/healthy"
echo ""
echo "🌐 Avec Caddy (si installé):"
echo "   Frontend: https://dev.markidiags.com"
echo "   API:      https://dev.api.markidiags.com:8444/parse"
echo ""
echo "📝 Commandes utiles:"
echo "   ./start.sh          - Démarrer les serveurs"
echo "   ./stop.sh           - Arrêter les serveurs"
echo "   tail -f backend.log - Voir les logs backend"
echo "   tail -f frontend.log - Voir les logs frontend"
echo ""
echo "💡 Pour arrêter les serveurs: Ctrl+C ou exécutez ./stop.sh"

echo ""
echo "🔄 Surveillance des processus..."
echo "   Appuyez sur Ctrl+C pour arrêter"

# Surveiller les processus et afficher un message si ils s'arrêtent
while true; do
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "❌ Backend s'est arrêté (PID: $BACKEND_PID)"
        break
    fi
    
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "❌ Frontend s'est arrêté (PID: $FRONTEND_PID)"
        break
    fi
    
    sleep 5
    
    # Vérifier périodiquement que les serveurs répondent
    if ! curl -s http://localhost:1555/healthy > /dev/null; then
        echo "⚠️  Backend ne répond plus"
    fi
    
    if ! curl -s http://localhost:5000 > /dev/null; then
        echo "⚠️  Frontend ne répond plus"
    fi
done