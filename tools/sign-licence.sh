#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Génère un fichier licence.lic signé RSA-SHA256.
# Usage : ./sign-licence.sh licence-template.json private.pem
# ─────────────────────────────────────────────────────────────────────────────
set -e

JSON_FILE="${1:-licence-template.json}"
PRIVATE_KEY="${2:-private.pem}"
OUTPUT="${3:-licence.lic}"

if [[ ! -f "$JSON_FILE" ]]; then
  echo "Erreur : fichier JSON introuvable : $JSON_FILE"
  exit 1
fi
if [[ ! -f "$PRIVATE_KEY" ]]; then
  echo "Erreur : clé privée introuvable : $PRIVATE_KEY"
  exit 1
fi

# Payload = JSON encodé en Base64url (sans padding)
PAYLOAD=$(cat "$JSON_FILE" | base64 -w0 | tr '+/' '-_' | tr -d '=')

# Signature = RSA-SHA256 sur les octets bruts du JSON, encodé Base64url
SIG=$(cat "$JSON_FILE" | openssl dgst -sha256 -sign "$PRIVATE_KEY" | base64 -w0 | tr '+/' '-_' | tr -d '=')

echo "${PAYLOAD}.${SIG}" > "$OUTPUT"
echo "✓ Licence générée : $OUTPUT"
echo ""
echo "Contenu :"
cat "$OUTPUT"
