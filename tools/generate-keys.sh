#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Génère une paire de clés RSA-2048 pour le système de licence eCompta.
# À exécuter UNE SEULE FOIS chez eDefence et conserver private.pem en sécurité.
# ─────────────────────────────────────────────────────────────────────────────
set -e

echo "Génération de la paire de clés RSA-2048..."

# Clé privée (à garder secrète chez eDefence)
openssl genrsa -out private.pem 2048

# Clé publique au format PEM
openssl rsa -in private.pem -pubout -out public.pem

# Clé publique au format DER puis Base64 — à mettre dans LICENCE_PUBLIC_KEY
openssl rsa -in private.pem -pubout -outform DER 2>/dev/null | base64 -w0 > public.b64

echo ""
echo "✓ Fichiers générés :"
echo "  private.pem   — clé privée (CONFIDENTIEL — ne jamais mettre dans git)"
echo "  public.pem    — clé publique PEM"
echo "  public.b64    — clé publique Base64 DER"
echo ""
echo "→ Copiez le contenu de public.b64 dans la variable LICENCE_PUBLIC_KEY du .env"
echo ""
cat public.b64
