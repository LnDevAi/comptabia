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

# Clé privée PKCS8 DER puis Base64 — à mettre dans LICENCE_PRIVATE_KEY (serveur eDefence uniquement)
openssl pkcs8 -topk8 -nocrypt -in private.pem -outform DER 2>/dev/null | base64 -w0 > private.b64

echo ""
echo "✓ Fichiers générés :"
echo "  private.pem   — clé privée PEM (CONFIDENTIEL — ne jamais mettre dans git)"
echo "  private.b64   — clé privée PKCS8 Base64 DER (CONFIDENTIEL — serveur eDefence uniquement)"
echo "  public.pem    — clé publique PEM"
echo "  public.b64    — clé publique Base64 DER"
echo ""
echo "→ LICENCE_PUBLIC_KEY  : contenu de public.b64 (distribué sur chaque déploiement client)"
echo "→ LICENCE_PRIVATE_KEY : contenu de private.b64 (serveur eDefence UNIQUEMENT)"
echo ""
echo "=== LICENCE_PUBLIC_KEY ==="
cat public.b64
echo ""
echo ""
echo "=== LICENCE_PRIVATE_KEY (GARDER SECRET) ==="
cat private.b64
