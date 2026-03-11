#!/bin/bash

echo "🚀 Configuration de Caddy pour Marki16"
echo "======================================"

# Installer Caddy
echo "📦 Installation de Caddy..."
sudo apt update
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy

# Configurer les noms de domaine locaux
echo "📝 Configuration des noms de domaine locaux..."
echo "127.0.0.1 dev.markidiags.com" | sudo tee -a /etc/hosts
echo "127.0.0.1 dev.api.markidiags.com" | sudo tee -a /etc/hosts

# Démarrer Caddy avec la configuration
echo "🌐 Démarrage de Caddy..."
sudo caddy start --config /home/oswald/Desktop/marki16/Caddyfile

# Redémarrer les services Marki16
echo "🔄 Redémarrage des services Marki16..."
cd /home/oswald/Desktop/marki16
./stop.sh
sleep 2
./start.sh

echo "✅ Configuration terminée!"
echo "======================================"
echo "Accédez à:"
echo "- Frontend: https://dev.markidiags.com"
echo "- API: https://dev.api.markidiags.com/parse"
echo "======================================"
