#!/bin/bash

# Marki16 - Script de demarrage des serveurs
# Ce script demarre le backend Parse Server et le frontend Nuxt

echo "? Demarrage des serveurs Marki16..."
echo "===================================="

# Installer pm2 si ce n'est pas deja fait
if ! command -v pm2 &> /dev/null; then
    echo "? Installation de pm2..."
    npm install -g pm2
fi

# Verifier que nous sommes a la racine du projet
if [ ! -d "frontend" ]; then
    echo "? Erreur: Ce script doit etre execute depuis la racine du projet"
    exit 1
fi

# Verifier que le backend existe au nouvel emplacement
if [ ! -d "~/serveur/dev" ]; then
    echo "? Erreur: Le backend n'est pas trouve dans ~/serveur/dev"
    exit 1
fi

# Fonction pour verifier si un port est utilise
port_in_use() {
    if command -v ss &> /dev/null; then
        ss -tuln | grep -q ":$1\s"
    elif command -v netstat &> /dev/null; then
        netstat -tuln | grep -q ":$1\s"
    else
        echo "?  Avertissement: Impossible de verifier les ports (ss/netstat non disponible)"
        return 1
    fi
}

# Arreter les serveurs existants sur les ports 8445 et 3001
echo "? Arret des serveurs existants..."

for PORT in 1556 3001; do
    PIDS=$(lsof -ti:$PORT 2>/dev/null)
    if [ -n "$PIDS" ]; then
        echo "   Arret des processus sur le port $PORT (PIDs: $PIDS)"
        kill $PIDS 2>/dev/null
        sleep 2
    fi
done

# Demarrer le backend
echo "? Demarrage du backend Parse Server..."
cd ~/serveur/dev || { echo "? Impossible de se deplacer dans ~/serveur/dev/"; exit 1; }

# Verifier si les dependances sont installees
if [ ! -d "node_modules" ]; then
    echo "   Installation des dependances..."
    npm install --silent || { echo "? Echec de l'installation des dependances backend"; exit 1; }
fi

# Demarrer le serveur backend avec pm2
pm2 start "npm run dev" --name "adti-backend" --log ../backend.log --output ../backend.log --error ../backend.log
echo "   Backend demarre avec pm2"
echo "   ? Logs: backend.log"
echo "   ? URL: http://localhost:8445/parse"

# Attendre que le backend soit pret
sleep 5

# Verifier que le backend repond
if curl -s http://localhost:8445/healthy > /dev/null; then
    echo "   ? Backend est operationnel"
else
    echo "   ?  Backend ne repond pas encore (peut prendre plus de temps)"
fi

# Demarrer le frontend
echo "? Construction et demarrage du frontend Nuxt en production..."
cd ~/marki16/frontend || { echo "? Impossible de se deplacer dans ~/marki16/frontend/"; exit 1; }

# Verifier si les dependances sont installees
if [ ! -d "node_modules" ]; then
    echo "   Installation des dependances..."
    npm install --silent || { echo "? Echec de l'installation des dependances frontend"; exit 1; }
fi

# Construire le projet en mode production
echo "   Construction du projet..."
npm run build || { echo "? Echec de la construction du projet"; exit 1; }

# Demarrer le serveur en mode production sur le port 3001 avec pm2
echo "   Demarrage du serveur en production..."
pm2 start "NITRO_HOST=0.0.0.0 NITRO_PORT=3001 node .output/server/index.mjs" --name "adti-frontend" --log ../frontend.log --output ../frontend.log --error ../frontend.log
echo "   Frontend demarre avec pm2"
echo "   ? Logs: frontend.log"
echo "   ? URL: http://localhost:3001"

# Attendre que le frontend soit pret
sleep 10

# Verifier que le frontend repond
if curl -s http://localhost:3001 > /dev/null; then
    echo "   ? Frontend est operationnel"
else
    echo "   ?  Frontend ne repond pas encore (peut prendre plus de temps)"
fi

# Retour a la racine
cd ~/marki16

# Sauvegarder la liste des processus pm2 pour un redemarrage automatique
echo "? Configuration de pm2 pour un demarrage automatique..."
pm2 save
pm2 startup

echo ""
echo "===================================="
echo "? Serveurs demarres avec succes!"
echo ""
echo "? Resume:"
echo "   Backend:  http://localhost:8445/parse"
echo "   Frontend: http://localhost:3001"
echo "   Health:   http://localhost:8445/healthy"
echo ""
echo "? Commandes utiles:"
echo "   pm2 list              - Voir les processus en cours"
echo "   pm2 logs              - Voir les logs des processus"
echo "   pm2 restart all       - Redemarrer tous les processus"
echo "   pm2 stop all          - Arreter tous les processus"
echo "   pm2 delete all        - Supprimer tous les processus"
echo ""
echo "? Les serveurs tourneront toujours, meme apres un redemarrage du serveur."
echo "? Pour arreter les serveurs, utilisez: pm2 stop all"
