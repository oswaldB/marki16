#!/usr/bin/env bash
# Script pour déclencher le workflow import-invoice via curl en utilisant les variables du .env
# Prérequis : le serveur backend doit être lancé (node backend/server.js)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${PROJECT_ROOT}/.env"

if [[ ! -f "$ENV_FILE" ]]; then
    echo "❌ Fichier .env introuvable : $ENV_FILE"
    exit 1
fi

# Charger le .env (format simple KEY=VALUE, sans interpolation)
while IFS='=' read -r key value; do
    # Ignorer les commentaires et lignes vides
    [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]] && continue
    # Supprimer les espaces et quotes autour de la valeur
    value="$(echo "$value" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e "s/^['\"]//" -e "s/['\"]$//")"
    export "$key=$value"
done < "$ENV_FILE"

PORT="${PORT:-1555}"
URL="http://localhost:${PORT}/trigger-import-invoices"

echo "🚀 Déclenchement du workflow import-invoice..."
echo "   URL : $URL"
echo "   Source .env : $ENV_FILE"
echo ""

# Appel curl avec suivi du temps
curl -s -X GET "$URL" \
    -H "Content-Type: application/json" \
    -w "\n\n📊 HTTP Status: %{http_code}\n⏱️  Total time: %{time_total}s\n" \
    | tee /tmp/trigger-import-invoice-response.json

echo ""
echo "✅ Requête terminée. Réponse sauvegardée dans /tmp/trigger-import-invoice-response.json"
