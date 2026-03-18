#!/bin/bash

# Script pour récupérer les schémas de toutes les classes Parse

# Configuration à partir du fichier .env
PARSE_APP_ID="marki15-app"
PARSE_MASTER_KEY="e2f4e4e89056af61dd95a71226fa0e51917313e09b68aca8bf434e5eb9bd8aa9"
PARSE_SERVER_URL="https://dev.api.markidiags.com:8444/parse"

# Fichier de sortie
OUTPUT_FILE="parse_schemas.json"

# Fonction pour récupérer toutes les classes
get_all_classes() {
    curl -s -X GET \
        -H "X-Parse-Application-Id: $PARSE_APP_ID" \
        -H "X-Parse-Master-Key: $PARSE_MASTER_KEY" \
        "$PARSE_SERVER_URL/schemas" | jq -r '.results[].className'
}

# Fonction pour récupérer le schéma d'une classe
get_class_schema() {
    local class_name=$1
    echo "Récupération du schéma pour la classe: $class_name"
    
    curl -s -X GET \
        -H "X-Parse-Application-Id: $PARSE_APP_ID" \
        -H "X-Parse-Master-Key: $PARSE_MASTER_KEY" \
        "$PARSE_SERVER_URL/schemas/$class_name" > "schema_${class_name}.json"
    
    # Extraire juste le nom de la classe
    jq -r ".className" "schema_${class_name}.json" >> "$OUTPUT_FILE"
}

# Vérifier si jq est installé
if ! command -v jq &> /dev/null; then
    echo "Erreur: jq n'est pas installé. Veuillez installer jq pour exécuter ce script."
    exit 1
fi

# Initialiser le fichier de sortie
> "$OUTPUT_FILE"

# Récupérer toutes les classes et traiter chaque schéma
echo "Récupération de la liste des classes..."
CLASSES=$(get_all_classes)

if [ -z "$CLASSES" ]; then
    echo "Aucune classe trouvée ou erreur lors de la récupération."
    exit 1
fi

echo "Classes trouvées: $CLASSES"

for CLASS in $CLASSES; do
    get_class_schema "$CLASS"
done

echo "Les noms des classes ont été enregistrés dans $OUTPUT_FILE"
