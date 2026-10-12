#!/usr/bin/env bash
# Script pour déclencher le workflow generate-suivis-du-jour via curl en utilisant les variables du .env
# Prérequis : le serveur backend doit être accessible

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
    [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]] && continue
    value="$(echo "$value" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e "s/^['\"]//" -e "s/['\"]$//")"
    export "$key=$value"
done < "$ENV_FILE"

URL="${PARSE_SERVER_URL:-https://dev.markidiags.com/api/parse}/functions/generateSuivisDuJour"
APP_ID="${PARSE_APP_ID:-adti-marki}"
MASTER_KEY="${PARSE_MASTER_KEY:-}"

echo "🚀 Déclenchement du workflow generate-suivis-du-jour..."
echo "   URL : $URL"
echo "   APP_ID : $APP_ID"
echo ""

if [[ -z "$MASTER_KEY" ]]; then
    echo "❌ PARSE_MASTER_KEY non défini dans le .env"
    exit 1
fi

# Appel curl avec suivi du temps
curl -s -X POST "$URL" \
    -H "X-Parse-Application-Id: $APP_ID" \
    -H "X-Parse-Master-Key: $MASTER_KEY" \
    -H "Content-Type: application/json" \
    -d '{}' \
    -w "\n\n📊 HTTP Status: %{http_code}\n⏱️  Total time: %{time_total}s\n" \
    | tee /tmp/trigger-generate-suivis-du-jour-response.json

echo ""
echo "✅ Requête terminée. Réponse sauvegardée dans /tmp/trigger-generate-suivis-du-jour-response.json"
