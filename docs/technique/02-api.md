# Documentation API REST — e-Compta IA

**Base URL :** `https://[DOMAINE]/api`
**Authentification :** Bearer JWT (header `Authorization: Bearer <token>`)
**Format :** JSON (`Content-Type: application/json`)
**Encodage :** UTF-8

---

## Authentification

### POST `/auth/login`
Connexion et obtention des tokens JWT.

**Corps de requête :**
```json
{ "email": "user@example.com", "password": "motdepasse" }
```

**Réponse 200 :**
```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "user": {
    "id": "uuid",
    "nom": "Lassané NACOULMA",
    "email": "user@example.com",
    "role": "COMPTABLE",
    "nomEntreprise": "Mon Entreprise"
  }
}
```

**Erreurs :** `401` identifiants invalides · `423` compte désactivé

---

### POST `/auth/register`
Création d'un compte utilisateur.

**Corps :**
```json
{
  "nom": "Lassané NACOULMA",
  "email": "user@example.com",
  "password": "motdepasse",
  "nomEntreprise": "Mon Entreprise",
  "referentiel": "SYSCOHADA"
}
```

**Réponse 201 :** même structure que `/auth/login`

---

### POST `/auth/refresh`
Renouvellement du token d'accès.

**Header :** `Authorization: Bearer <refreshToken>`
**Réponse 200 :** `{ "accessToken": "eyJhbGci..." }`

---

### POST `/auth/logout`
Invalidation du token courant (ajout à la blacklist Redis).

**Header :** `Authorization: Bearer <accessToken>`
**Réponse 204**

---

## Écritures comptables

### GET `/ecritures`
Liste paginée des écritures de l'entreprise active.

**Paramètres de requête :**
| Paramètre | Type | Description |
|-----------|------|-------------|
| `page` | int | Numéro de page (défaut: 0) |
| `size` | int | Taille de page (défaut: 20, max: 100) |
| `journal` | string | Filtrer par code journal |
| `exerciceId` | UUID | Filtrer par exercice |
| `statut` | string | `BROUILLON` ou `VALIDEE` |
| `dateDebut` | date | Format `YYYY-MM-DD` |
| `dateFin` | date | Format `YYYY-MM-DD` |
| `compte` | string | Filtrer par numéro de compte |

**Réponse 200 :**
```json
{
  "content": [
    {
      "id": "uuid",
      "journal": "VT",
      "date": "2025-06-15",
      "numeroPiece": "FAC-2025-001",
      "libelle": "Vente client OUEDRAOGO",
      "statut": "VALIDEE",
      "lignes": [
        { "compte": "411000", "libelle": "Client OUEDRAOGO", "debit": 590000, "credit": 0 },
        { "compte": "701000", "libelle": "Ventes de marchandises", "debit": 0, "credit": 500000 },
        { "compte": "443100", "libelle": "TVA collectée", "debit": 0, "credit": 90000 }
      ]
    }
  ],
  "totalElements": 1543,
  "totalPages": 78,
  "number": 0,
  "size": 20
}
```

---

### POST `/ecritures`
Créer une nouvelle écriture.

**Corps :**
```json
{
  "journal": "VT",
  "exerciceId": "uuid-exercice",
  "date": "2025-06-15",
  "numeroPiece": "FAC-2025-001",
  "libelle": "Vente client OUEDRAOGO",
  "statut": "BROUILLON",
  "lignes": [
    { "compte": "411000", "libelle": "Client OUEDRAOGO", "debit": 590000, "credit": 0 },
    { "compte": "701000", "libelle": "Ventes de marchandises", "debit": 0, "credit": 500000 },
    { "compte": "443100", "libelle": "TVA collectée", "debit": 0, "credit": 90000 }
  ]
}
```

**Validations :**
- `Σ débit = Σ crédit` obligatoire (erreur 400 sinon)
- `date` dans l'exercice sélectionné
- Tous les comptes doivent exister dans le plan comptable

**Réponse 201 :** écriture créée avec `id` généré

---

### PUT `/ecritures/{id}/valider`
Passer une écriture en statut VALIDEE (irréversible).

**Réponse 200 :** écriture mise à jour · `409` si déjà validée

---

### DELETE `/ecritures/{id}`
Supprimer une écriture en statut BROUILLON.

**Réponse 204** · `403` si statut VALIDEE

---

## Plan comptable

### GET `/comptes`
Liste des comptes de l'entreprise.

**Paramètres :** `classe` (1–9), `actif` (boolean), `q` (recherche textuelle)

**Réponse 200 :**
```json
[
  { "id": "uuid", "numero": "411000", "libelle": "Clients", "classe": 4, "actif": true }
]
```

### POST `/comptes`
Créer un compte.

```json
{ "numero": "411001", "libelle": "Client OUEDRAOGO SARL", "classe": 4 }
```

---

## Tiers

### GET `/tiers`
Liste paginée des tiers.

**Paramètres :** `type` (`CLIENT`|`FOURNISSEUR`|`AUTRE`), `q`, `page`, `size`

### POST `/tiers`
```json
{
  "code": "CLI001",
  "nom": "OUEDRAOGO SARL",
  "type": "CLIENT",
  "email": "contact@ouedraogo.bf",
  "telephone": "+226 70 00 00 00",
  "adresse": "Ouagadougou, Burkina Faso",
  "compteComptable": "411001"
}
```

---

## Exercices

### GET `/exercices`
Liste des exercices de l'entreprise (ouverts et clos).

```json
[
  { "id": "uuid", "dateDebut": "2025-01-01", "dateFin": "2025-12-31", "statut": "OUVERT" }
]
```

### POST `/exercices/{id}/cloturer`
Clôture d'un exercice (irréversible). Génère les écritures de résultat.

**Réponse 200** · `409` si exercice déjà clos

---

## Import & Migration

### POST `/migration/preview`
Aperçu d'un fichier avant import.

**Corps :** `multipart/form-data`
- `file` : fichier (`.txt`, `.csv`, `.xlsx`)
- `format` : `FEC` | `SAGE` | `EBP` | `WAVESOFT` | `EXCEL_CSV` | `SOLDES`

**Réponse 200 :**
```json
{
  "colonnes": ["JournalCode", "EcritureDate", "CompteNum", "Debit", "Credit"],
  "lignes": [["VT", "20250615", "411000", "590000", "0"], ["..."]],
  "totalLignes": 4823,
  "separateurDetecte": "TAB",
  "mappingSuggere": [
    { "colonneSource": "JournalCode", "champCible": "journal" },
    { "colonneSource": "EcritureDate", "champCible": "date" }
  ]
}
```

### POST `/migration/importer`
Lancer l'import.

**Corps :** `multipart/form-data`
- `file`, `format`, `typeDonnees` (`ECRITURES`|`TIERS`|`PLAN_COMPTABLE`|`SOLDES`)
- `mapping` : JSON stringifié `{"JournalCode":"journal","EcritureDate":"date",...}`

**Réponse 200 :**
```json
{
  "nbImportes": 4780,
  "nbIgnores": 23,
  "nbErreurs": 20,
  "erreurs": [
    { "ligne": 45, "reference": "FAC-001", "message": "Compte 999999 introuvable" }
  ],
  "historiquId": "uuid"
}
```

### GET `/migration/historique`
Historique des imports de l'entreprise.

---

## États financiers

### GET `/etats/balance`
**Paramètres :** `exerciceId`, `dateDebut`, `dateFin`, `classe`

**Réponse 200 :**
```json
[
  {
    "compte": "411000",
    "libelle": "Clients",
    "soldeCumulDebit": 12500000,
    "soldeCumulCredit": 0,
    "mouvementDebit": 3200000,
    "mouvementCredit": 1800000,
    "soldeDebit": 1400000,
    "soldeCredit": 0
  }
]
```

### GET `/etats/grand-livre`
**Paramètres :** `compteId` (ou `compteNumero`), `dateDebut`, `dateFin`

### GET `/etats/bilan`
**Paramètres :** `exerciceId`

**Réponse :** structure actif/passif conforme SYSCOHADA

### GET `/etats/compte-resultat`
**Paramètres :** `exerciceId`

---

## Licences & Plans

### GET `/licences/actuelle`
Plan actif de l'entreprise.

```json
{
  "plan": "PREMIUM",
  "modules": ["COMPTABILITE", "IA", "TRESORERIE", "RH", "DOCUMENTS"],
  "dateExpiration": "2026-01-01",
  "statut": "ACTIVE"
}
```

### GET `/licences/plans`
Liste des plans disponibles avec tarifs.

---

## Codes d'erreur standard

| Code HTTP | Signification |
|-----------|---------------|
| `200` | Succès |
| `201` | Créé |
| `204` | Succès sans contenu |
| `400` | Requête invalide (validation échouée) |
| `401` | Non authentifié |
| `403` | Non autorisé (rôle insuffisant) |
| `404` | Ressource introuvable |
| `409` | Conflit (ex : compte déjà existant, écriture déjà validée) |
| `422` | Entité non traitable (règles métier, ex : déséquilibre débit/crédit) |
| `429` | Trop de requêtes (rate limiting) |
| `500` | Erreur interne serveur |

**Corps d'erreur standard :**
```json
{
  "timestamp": "2025-06-15T10:30:00Z",
  "status": 400,
  "error": "Validation Failed",
  "message": "Le total débit (590000) doit être égal au total crédit (500000)",
  "path": "/api/ecritures"
}
```

---

## Rate limiting

| Plan | Limite |
|------|--------|
| FREE | 100 req/min |
| STANDARD | 500 req/min |
| PREMIUM | 2000 req/min |
| ENTERPRISE | Illimité (SLA négocié) |

Header de réponse : `X-RateLimit-Remaining: 487`
