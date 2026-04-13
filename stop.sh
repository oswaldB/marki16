#!/bin/bash

# Marki16 - Script d'arrêt des serveurs
# Ce script arrête proprement le backend et le frontend

# Se positionner à la racine du projet
cd ~/marki16 || { echo "❌ Impossible de se déplacer dans ~/marki16/"; exit 1; }

echo "🛑 Arrêt des serveurs Marki16..."
echo "===================================="

# Arrêter le backend
echo "🔥 Arrêt du backend Parse Server..."
BACKEND_PIDS=$(pgrep -f "node server.js" 2>/dev/null)
if [ -n "$BACKEND_PIDS" ]; then
    echo "   Trouvé backend PIDs: $BACKEND_PIDS"
    kill $BACKEND_PIDS 2>/dev/null
    sleep 2
    
    # Vérifier si les processus sont toujours en cours
    for PID in $BACKEND_PIDS; do
        if kill -0 $PID 2>/dev/null; then
            echo "   Forçant l'arrêt du PID $PID..."
            kill -9 $PID 2>/dev/null
        fi
    done
    echo "   ✅ Backend arrêté"
else
    echo "   Aucun backend en cours d'exécution"
fi

# Arrêter le frontend
echo "🎨 Arrêt du frontend Nuxt..."
FRONTEND_PIDS=$(pgrep -f "nuxt dev" 2>/dev/null)
if [ -n "$FRONTEND_PIDS" ]; then
    echo "   Trouvé frontend PIDs: $FRONTEND_PIDS"
    kill $FRONTEND_PIDS 2>/dev/null
    sleep 2
    
    # Vérifier si les processus sont toujours en cours
    for PID in $FRONTEND_PIDS; do
        if kill -0 $PID 2>/dev/null; then
            echo "   Forçant l'arrêt du PID $PID..."
            kill -9 $PID 2>/dev/null
        fi
    done
    echo "   ✅ Frontend arrêté"
else
    echo "   Aucun frontend en cours d'exécution"
fi

# Arrêter Parse Dashboard
echo "📊 Arrêt de Parse Dashboard..."
DASHBOARD_PIDS=$(pgrep -f "Parse-Dashboard" 2>/dev/null)
if [ -n "$DASHBOARD_PIDS" ]; then
    echo "   Trouvé Parse Dashboard PIDs: $DASHBOARD_PIDS"
    kill $DASHBOARD_PIDS 2>/dev/null
    sleep 2
    
    # Vérifier si les processus sont toujours en cours
    for PID in $DASHBOARD_PIDS; do
        if kill -0 $PID 2>/dev/null; then
            echo "   Forçant l'arrêt du PID $PID..."
            kill -9 $PID 2>/dev/null
        fi
    done
    echo "   ✅ Parse Dashboard arrêté"
else
    echo "   Aucun Parse Dashboard en cours d'exécution"
fi

# Arrêter les processus Parse Server
echo "🔧 Arrêt des processus Parse Server..."
PARSE_PIDS=$(pgrep -f "parse-server" 2>/dev/null)
if [ -n "$PARSE_PIDS" ]; then
    echo "   Trouvé Parse Server PIDs: $PARSE_PIDS"
    kill $PARSE_PIDS 2>/dev/null
    sleep 2
    
    # Vérifier si les processus sont toujours en cours
    for PID in $PARSE_PIDS; do
        if kill -0 $PID 2>/dev/null; then
            echo "   Forçant l'arrêt du PID $PID..."
            kill -9 $PID 2>/dev/null
        fi
    done
    echo "   ✅ Parse Server arrêté"
else
    echo "   Aucun Parse Server en cours d'exécution"
fi

# Arrêter Caddy
echo "🌐 Arrêt de Caddy..."
CADDY_PIDS=$(pgrep -f "caddy" 2>/dev/null)
if [ -n "$CADDY_PIDS" ]; then
    echo "   Trouvé Caddy PIDs: $CADDY_PIDS"
    sudo caddy stop 2>/dev/null || kill $CADDY_PIDS 2>/dev/null
    sleep 2
    
    # Vérifier si les processus sont toujours en cours
    for PID in $CADDY_PIDS; do
        if kill -0 $PID 2>/dev/null; then
            echo "   Forçant l'arrêt du PID $PID..."
            kill -9 $PID 2>/dev/null
        fi
    done
    echo "   ✅ Caddy arrêté"
else
    echo "   Aucun Caddy en cours d'exécution"
fi

echo ""
echo "===================================="
echo "✅ Tous les serveurs ont été arrêtés"
echo ""
echo "💡 Vous pouvez redémarrer avec: ./start.sh"