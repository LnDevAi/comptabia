# ComptaBIA

[![Version](https://img.shields.io/badge/version-1.5.0-blue.svg)](https://github.com/LnDevAi/comptabia/releases/tag/v1.5.0)
[![Licence](https://img.shields.io/badge/licence-propriétaire-red.svg)](LICENSE)
[![Java](https://img.shields.io/badge/Java-17-orange.svg)](https://adoptium.net/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2.5-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Angular](https://img.shields.io/badge/Angular-17-DD0031.svg)](https://angular.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
[![SYSCOHADA](https://img.shields.io/badge/Norme-SYSCOHADA_Révisé-gold.svg)](https://ohada.com/)

**Logiciel de comptabilité en ligne** conforme SYSCOHADA Révisé, conçu pour les entreprises,
cabinets d'expertise comptable et ONG d'Afrique de l'Ouest (UEMOA / OHADA).

Développé par **L'N EXPERTISE** — Ouagadougou, Burkina Faso.

---

## Table des matières

- [Présentation](#présentation)
- [Fonctionnalités](#fonctionnalités)
- [Plans et tarifs](#plans-et-tarifs)
- [Stack technique](#stack-technique)
- [Démarrage rapide](#démarrage-rapide)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [Migrations Flyway](#migrations-flyway)
- [Sécurité](#sécurité)
- [Documentation](#documentation)
- [Contribuer](#contribuer)
- [Équipe](#équipe)
- [Licence](#licence)

---

## Présentation

ComptaBIA est une plateforme SaaS multi-tenant qui couvre l'ensemble du cycle comptable
et financier d'une entreprise soumise au référentiel **SYSCOHADA Révisé** :

- Tenue de la comptabilité générale jusqu'à la production des **états financiers annuels**
- **Fiscalité** — TVA, IS, liasse fiscale, déclarations sociales
- **Paie & RH** — bulletins, congés, notes de frais, recrutement, formation
- **Modules sectoriels** — Assurances CIMA, Microfinances SFD/BCEAO, Gouvernance,
  Finance Islamique, Associations SYCEBNL
- **IA intégrée** — suggestions de comptes, détection d'anomalies, analyse financière,
  assistant conversationnel SYSCOHADA
- **Import/Migration** — FEC, Sage 100, EBP, WaveSoft, Excel/CSV

> **Zone géographique :** Burkina Faso · Côte d'Ivoire · Sénégal · Mali · Bénin · Togo ·
> Niger · Guinée · Cameroun · tout l'espace OHADA.

---

## Fonctionnalités

### Comptabilité générale

| Fonctionnalité | Détail |
|----------------|--------|
| Plan de comptes | SYSCOHADA Révisé classes 1–9, personnalisable |
| Journaux | Achats, Ventes, Banque, Caisse, OD, Paie, ANO |
| Saisie des écritures | Partie double, validation débit = crédit, numérotation auto |
| Exercices fiscaux | Clôture, réouverture, gestion multi-exercices |
| Lettrage | Automatique et manuel, comptes 401x/411x |
| Analytique | Multi-axes, répartitions, rapports par projet/bailleur/activité |
| Régularisations | CCA, PCA, CAP, PAR avec contre-passation automatique |
| Modèles | Écritures récurrentes, abonnements comptables programmés |
| Révision | Workflow d'approbation, audit trail 18 actions |

### États financiers

| État | Norme |
|------|-------|
| Bilan (Actif / Passif) | SYSCOHADA Révisé |
| Compte de résultat | SYSCOHADA Révisé |
| Tableau des flux de trésorerie | Méthode indirecte SYSCOHADA |
| État de variation des capitaux propres | AUDCIF |
| Balance générale et balance âgée | — |
| Grand livre par compte | — |
| Notes annexes AUDCIF | 36 notes structurées |
| Ratios financiers | Liquidité, rentabilité, solvabilité, activité |

### Fiscalité

- **TVA** — déclarations mensuelles et trimestrielles (taux 18 %), report de crédit TVA
- **IS** — Impôt sur les Sociétés Burkina Faso, réintégrations, déductions
- **Liasse fiscale SYSCOHADA** — pour dépôt légal OHADA (format SMT ESP)
- **Facture normalisée** — conformité DGI Burkina Faso / eSINTAX
- **Calendrier fiscal** — échéances, rappels automatiques
- **Gestion sociale** — déclarations CNSS, charges patronales et salariales

### Paie & Ressources humaines

- Bulletins de paie avec **OD comptable automatique SYSCOHADA**
- Congés et absences — soldes, workflow de validation
- Notes de frais — saisie, approbation hiérarchique, OD comptable
- Temps et présences — pointages, gestion des retards
- Évaluations de performance — objectifs SMART, historique
- Formation professionnelle — plan, sessions, inscriptions, bilan
- Discipline et sanctions — dossiers, procédure réglementaire
- Recrutement et onboarding — pipeline Kanban, checklist
- Prêts et avances sur salaire — échéances automatiques
- Portail Collaborateur — self-service RH (Mon espace)
- Documents RH — bulletins archivés, contrats, alertes expiration
- Budget RH prévisionnel — analytique multi-dimension (projets, bailleurs, activités)
- **Rapport d'exécution de subvention** (ONG et associations)

### Facturation & Commerce

- Facturation clients SYSCOHADA — numérotation automatique, téléchargement PDF
- Devis — création, envoi, conversion en facture en un clic
- Relances clients — 3 niveaux configurables, suivi des impayés
- Portail client — consultation des factures via OTP email (sans compte)
- CRM — contacts, pipeline Kanban, emailing & SMS

### Trésorerie

- Rapprochement bancaire — import OFX, matching automatique
- Trésorerie avancée — multi-comptes, mouvements, alertes seuils
- Prévisions de trésorerie — scénarios optimiste / pessimiste / réaliste
- Import de relevés bancaires OFX

### Pilotage & Reporting

- Tableau de bord dirigeant — 5 graphiques Chart.js, comparaison N-1
- KPI exécutif — indicateurs clés, alertes seuils, radar SYSCOHADA
- Ratios financiers — score global, tendances, comparatif N-1
- Consolidation multi-entités — éliminations interco, TFT consolidé (méthodes OHADA)
- Reporting avancé — rapports personnalisables, export CSV/PDF
- Notifications temps réel — SSE avec badge non-lu, alertes intelligentes configurables

### Modules sectoriels

| Module | Périmètre |
|--------|-----------|
| **Assurances CIMA** | Plan de comptes CIMA, provisions techniques (Vie/Non-Vie), états réglementaires |
| **Microfinances SFD/BCEAO** | Portefeuille crédits, calcul PAR, états de résultat BCEAO |
| **Gouvernance** | Assemblées générales, résolutions, mandats, registre des associés, portail associé |
| **Finance Islamique** | Mourabaha, Ijara, Musharaka, Zakat, état de résultat PNI |
| **Associations SYCEBNL** | Multi-référentiel SYSCEBNL, documents réglementaires |
| **Multi-référentiel** | SYSCOHADA, SYSCEBNL, IFRS, CIMA, BCEAO — états financiers adaptatifs |

### Assistant IA

- Suggestions automatiques de comptes à l'imputation
- Détection d'anomalies comptables (écritures déséquilibrées, doublons, ratios anormaux)
- Chat conversationnel SYSCOHADA — questions sur la norme, les comptes, les procédures
- Analyse financière — commentaires automatiques sur les états
- Pré-clôture IA — vérification de cohérence avant clôture de l'exercice

### Import & Migration

| Source | Format |
|--------|--------|
| FEC OHADA | Fichier des Écritures Comptables (DGFIP) |
| Sage 100 Comptabilité | Export CSV standard |
| EBP Comptabilité | CSV / TXT |
| WaveSoft | XML / CSV |
| Excel générique | .xlsx — colonnes configurables |
| CSV multi-colonnes | Séparateur auto-détecté (`,` `;` `\t`) |
| Soldes initiaux | 6 colonnes : compte, intitulé, débit N-1, crédit N-1, débit N, crédit N |

### Sécurité & Administration

- JWT HS256 — access 15 min + refresh 7 jours, blacklist Redis
- **2FA TOTP** — compatible Google Authenticator / Authy
- Multi-tenancy Hibernate — isolation stricte par `entreprise_id`
- RBAC : **ADMIN** / **COMPTABLE** / **LECTEUR** avec `@PreAuthorize`
- Workflow d'approbation des écritures sensibles
- Audit trail — 18 actions tracées (qui, quoi, quand)
- Licence RSA — module on-premise avec chiffrement de clé

---

## Plans et tarifs

| Fonctionnalité | FREE | STANDARD | PREMIUM | ENTERPRISE |
|----------------|:----:|:--------:|:-------:|:----------:|
| Comptabilité SYSCOHADA | ✓ | ✓ | ✓ | ✓ |
| États financiers | Basiques | Complets | Complets | Complets |
| TVA & IS | — | ✓ | ✓ | ✓ |
| Facturation & Devis | — | ✓ | ✓ | ✓ |
| Module RH & Paie | — | — | ✓ | ✓ |
| Assistant IA | — | — | ✓ | ✓ |
| Consolidation multi-entités | — | — | — | ✓ |
| Modules sectoriels (CIMA, SFD…) | — | — | — | ✓ |
| Utilisateurs | 1 | 5 | Illimités | Illimités |
| Support | Communauté | Email | Prioritaire | Dédié |

Voir le [comparatif complet](/produit/comparatif-plans) dans l'application.

---

## Stack technique

| Couche | Technologie | Version |
|--------|-------------|---------|
| **Backend** | Java + Spring Boot | 17 / 3.2.5 |
| **Sécurité** | Spring Security + JWT HS256 | — |
| **ORM** | Hibernate 6 + Flyway | 9.x |
| **Base de données** | PostgreSQL | 16 |
| **Cache / Sessions** | Redis | 7.x |
| **Frontend** | Angular (standalone + signals) | 17 |
| **Styles** | Tailwind CSS | 3.x |
| **Graphiques** | Chart.js | 4.x |
| **Traitement Excel** | Apache POI | 5.2.5 |
| **Paiements** | CinetPay + Stripe | — |
| **Temps réel** | SSE (Server-Sent Events) | — |
| **Infrastructure** | Docker + Nginx | — |
| **CI/CD** | GitHub Actions | — |

---

## Démarrage rapide

### Avec Docker Compose (recommandé)

```bash
# 1. Cloner le dépôt
git clone https://github.com/LnDevAi/comptabia.git
cd comptabia

# 2. Configurer les variables d'environnement
cp .env.example .env
# Éditez .env avec vos valeurs (voir section Configuration)

# 3. Lancer la stack
docker-compose up -d

# 4. Vérifier le démarrage
curl http://localhost:8080/api/actuator/health
# → {"status":"UP"}
```

L'application est accessible sur :
- **Frontend** : http://localhost:4200
- **API** : http://localhost:8080/api
- **Swagger UI** : http://localhost:8080/swagger-ui.html

### Sans Docker — Développement local

**Prérequis :** Java 17, Maven 3.9+, Node.js 18, PostgreSQL 16, Redis 7

```bash
# Backend
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev
# API disponible sur http://localhost:8080

# Frontend (dans un autre terminal)
cd frontend
npm install
npm start
# UI disponible sur http://localhost:4200
```

---

## Configuration

Créez un fichier `.env` à la racine (ne jamais committer) :

```env
# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecompta
DB_USER=ecompta
DB_PASSWORD=changeme_en_production

# JWT — générez avec : openssl rand -base64 64
JWT_SECRET=votre_secret_jwt_64_octets_minimum
JWT_EXPIRATION=900000           # 15 minutes
JWT_REFRESH_EXPIRATION=604800000 # 7 jours

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Paiements Mobile Money (CinetPay)
CINETPAY_API_KEY=
CINETPAY_SITE_ID=

# Paiements carte (Stripe)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Email
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM=noreply@[DOMAINE]
```

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                     Navigateur                      │
│        Angular 17 · TypeScript 5 · Tailwind CSS     │
└──────────────────────────┬──────────────────────────┘
                           │ HTTPS / SSE
┌──────────────────────────▼──────────────────────────┐
│              Nginx (reverse proxy, TLS)              │
└────────────┬─────────────────────────────────────────┘
             │ /api/*
┌────────────▼─────────────────────────────────────────┐
│             Spring Boot 3.2.5 (port 8080)            │
│  JWT Filter → Security → Controller → Service → Repo │
│         Hibernate tenantFilter (entreprise_id)       │
└──────────┬───────────────────────┬───────────────────┘
           │                       │
    ┌──────▼──────┐         ┌──────▼──────┐
    │ PostgreSQL 16│         │  Redis 7    │
    │ (données)   │         │ (blacklist  │
    │ Flyway V61  │         │  JWT, cache)│
    └─────────────┘         └─────────────┘
```

**Multi-tenancy :** toutes les entités métier portent `entreprise_id`.
Le filtre Hibernate `tenantFilter` est activé à chaque requête — un utilisateur
ne peut jamais accéder aux données d'une autre entreprise.

---

## Migrations Flyway

61 migrations appliquées depuis l'initialisation du schéma.

```
backend/src/main/resources/db/migration/
├── V1__init.sql                  ← Schéma initial (entreprises, utilisateurs, plan_comptable…)
├── V2__exercices.sql
├── ...
├── V60__enum_to_varchar.sql      ← Fix compatibilité Hibernate 6 / PostgreSQL ENUM
└── V61__import_migration.sql     ← Table import_historique
```

> **Règle absolue :** ne jamais modifier un script déjà appliqué en production.
> En cas d'erreur → créer une migration corrective `V{N+1}`.

Voir le [guide complet des migrations](docs/technique/06-migrations-db.md).

---

## Sécurité

```
1. Transport       HTTPS / TLS 1.3 (obligatoire en production)
2. Authentification  JWT HS256 (access 15 min + refresh 7 j) + blacklist Redis
3. Autorisation    Spring Security RBAC (@PreAuthorize) + 2FA TOTP
4. Isolation       Filtre Hibernate multi-tenant par entreprise_id
```

Checklist avant mise en production :
- [ ] `JWT_SECRET` généré aléatoirement — 64 octets minimum
- [ ] `DB_PASSWORD` fort et unique
- [ ] HTTPS activé (certificat TLS valide)
- [ ] CORS restreint aux domaines officiels
- [ ] Redis avec authentification (`requirepass`)
- [ ] Actuator restreint (`health` et `info` uniquement)

Voir le [guide de sécurité complet](docs/technique/04-securite.md).

---

## Documentation

| Type | Emplacement | Description |
|------|-------------|-------------|
| Technique | [`docs/technique/`](docs/technique/) | Architecture, API REST, déploiement, sécurité, contribution, migrations |
| Utilisateur | [`docs/utilisateur/`](docs/utilisateur/) | 8 guides thématiques + FAQ |
| Commerciale | [`docs/commercial/`](docs/commercial/) | Pitch, comparatif plans, fiches modules, partenaires |
| Légale | [`docs/legal/`](docs/legal/) | CGU, CGV, confidentialité, mentions légales |
| Changelog | [`CHANGELOG.md`](CHANGELOG.md) | Historique des versions |

La documentation est également accessible **dans l'application** :
- `/aide` — Centre d'aide (guides + recherche plein texte)
- `/produit` — Documentation commerciale
- `/tech` — Documentation technique
- `/legal/cgu` — Documents légaux

---

## Contribuer

### Prérequis

| Outil | Version |
|-------|---------|
| Java JDK | 17 LTS |
| Maven | 3.9+ |
| Node.js | 18 LTS |
| PostgreSQL | 16 |
| Redis | 7.x |
| Docker | 24+ |

### Workflow

```bash
# 1. Synchroniser main
git checkout main && git pull origin main

# 2. Créer une branche
git checkout -b feature/ma-feature

# 3. Développer et committer (Conventional Commits)
git commit -m "feat: description de la feature"

# 4. Vérifications avant PR
cd backend  && mvn clean compile -q              # ← zéro erreur
cd frontend && node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json

# 5. Ouvrir une PR vers main
git push -u origin feature/ma-feature
```

**Conventions de commit :** `feat` · `fix` · `refactor` · `docs` · `test` · `chore` · `perf`

Voir le [guide de contribution complet](docs/technique/05-contribution.md).

---

## Équipe

| Contributeur | Rôle |
|--------------|------|
| **Lassané NACOULMA** ([@burkinabe](https://github.com/burkinabe)) | Fondateur · Architecture · Comptabilité |
| [@MoussaNEYA](https://github.com/MoussaNEYA) | Frontend Angular |
| [@Yamalr](https://github.com/Yamalr) | Backend Spring Boot & Sécurité |

---

## Licence

Logiciel propriétaire — © 2026 L'N EXPERTISE.
Tous droits réservés. Voir [LICENSE](LICENSE).

---

<div align="center">

**L'N EXPERTISE**

Ouaga 2000, derrière INSD, vers Rectorat UCAO · Ouagadougou, Burkina Faso

[www.edefence.tech](https://www.edefence.tech) · info@edefence.tech

*Conforme SYSCOHADA Révisé · OHADA · UEMOA*

</div>
