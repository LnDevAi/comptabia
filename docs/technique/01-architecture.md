# Architecture système — e-Compta IA

## Vue d'ensemble

e-Compta IA est une application **SaaS multi-tenant** construite sur une architecture en couches :

```
┌─────────────────────────────────────────────────┐
│              Clients (navigateurs)               │
│         Angular 17 SPA — Tailwind CSS           │
└──────────────────────┬──────────────────────────┘
                       │ HTTPS / REST JSON
┌──────────────────────▼──────────────────────────┐
│           API REST — Spring Boot 3.2.5           │
│      Java 17 · Maven · JWT · Multitenancy        │
├─────────────────────────────────────────────────┤
│  Services métier  │  Module IA  │  Import/Export │
├─────────────────────────────────────────────────┤
│          Spring Data JPA · Hibernate 6           │
└──────────┬──────────────────────┬───────────────┘
           │                      │
    ┌──────▼──────┐        ┌──────▼──────┐
    │ PostgreSQL  │        │    Redis     │
    │  (données) │        │ (sessions/  │
    │             │        │  blacklist) │
    └─────────────┘        └─────────────┘
```

---

## Stack technique

### Backend

| Composant | Technologie | Version |
|-----------|-------------|---------|
| Langage | Java | 17 (LTS) |
| Framework | Spring Boot | 3.2.5 |
| Build | Maven | 3.9+ |
| ORM | Spring Data JPA / Hibernate | 6.x |
| Base de données | PostgreSQL | 16 |
| Cache / Sessions | Redis | 7.x |
| Migrations DB | Flyway | 9.x |
| Sécurité | Spring Security + JWT | — |
| Parsing Excel | Apache POI | 5.2.5 |
| Tests | JUnit 5 + Mockito | — |

### Frontend

| Composant | Technologie | Version |
|-----------|-------------|---------|
| Framework | Angular | 17 |
| Style | Tailwind CSS | 3.x |
| Langage | TypeScript | 5.x |
| Gestion d'état | Angular Signals | — |
| HTTP | Angular HttpClient | — |
| Routage | Angular Router (lazy loading) | — |
| Build | Angular CLI / esbuild | — |

### Infrastructure

| Composant | Technologie |
|-----------|-------------|
| Hébergeur | [HEBERGEUR_NOM] |
| Conteneurisation | Docker + Docker Compose |
| Reverse proxy | Nginx |
| CI/CD | GitHub Actions |
| Paiements | CinetPay, Stripe |
| Notifications temps réel | SSE (Server-Sent Events) |

---

## Multi-tenancy

L'isolation des données entre entreprises est assurée par un filtre Hibernate au niveau session.

### Mécanisme

1. Chaque requête authentifiée transporte un `entrepriseId` dans le JWT.
2. Le filtre `TenantFilter` (défini dans `package-info.java`) est activé par `@Filter("tenantFilter")` sur les entités concernées.
3. Toutes les requêtes JPA ajoutent automatiquement `WHERE entreprise_id = :tenantId`.

### Entités multi-tenant
Toutes les entités métier (écritures, tiers, comptes, journaux…) héritent d'un `entreprise_id UUID NOT NULL`. Les entités système (utilisateurs, plans) ont leur propre isolation via le modèle d'invitation.

---

## Sécurité — JWT

### Flux d'authentification

```
Client            API
  │── POST /api/auth/login ──▶│
  │                           │ Vérifie credentials
  │                           │ Génère access_token (15 min)
  │                           │ Génère refresh_token (7 jours)
  │◀── { accessToken, refreshToken } ──│
  │
  │── GET /api/ecritures ──▶│  (Header: Authorization: Bearer <token>)
  │                         │  JwtAuthFilter valide le token
  │                         │  Charge le SecurityContext
  │◀── 200 OK ──────────────│
  │
  │── POST /api/auth/refresh ──▶│  (Header: Authorization: Bearer <refresh>)
  │◀── { accessToken } ─────────│
```

### Blacklist JWT (Redis)
À la déconnexion, le token est ajouté à la blacklist Redis (`blacklist:<token>`).
Le filtre `JwtAuthFilter` vérifie la blacklist à chaque requête.
Redis est optionnel en développement (fail-open si indisponible).

---

## Structure du projet

```
e-compta-ia-inter/
├── backend/
│   ├── src/main/java/com/edefence/ecompta/
│   │   ├── controller/         # Contrôleurs REST (@RestController)
│   │   ├── service/            # Logique métier (@Service)
│   │   ├── domain/             # Entités JPA (@Entity)
│   │   ├── repository/         # Repositories Spring Data
│   │   ├── dto/                # Data Transfer Objects (records)
│   │   ├── security/           # JWT, filtres, configuration Spring Security
│   │   └── config/             # Beans de configuration
│   └── src/main/resources/
│       ├── application.yml     # Configuration principale
│       └── db/migration/       # Scripts Flyway (V1__, V2__…)
│
├── frontend/
│   └── src/app/
│       ├── core/
│       │   ├── guards/         # AuthGuard, GuestGuard, LicenceGuard
│       │   ├── interceptors/   # JWT interceptor, loading bar
│       │   ├── models/         # Interfaces TypeScript
│       │   └── services/       # Services Angular
│       ├── features/           # Composants par fonctionnalité (lazy loaded)
│       └── shared/
│           └── components/     # Layout, Toast, LoadingBar
│
├── docs/                       # Documentation (legal, utilisateur, commercial, technique)
├── docker-compose.yml          # Stack complète (backend, frontend, PostgreSQL, Redis)
└── tools/                      # Scripts utilitaires
```

---

## Base de données

### Migrations Flyway

Les scripts de migration sont dans `backend/src/main/resources/db/migration/`.
La convention de nommage est `V{N}__{description}.sql`.

| Version | Description |
|---------|-------------|
| V1 | Schéma initial (entreprises, utilisateurs) |
| … | … |
| V60 | Migration ENUM → VARCHAR (compatibilité Hibernate) |
| V61 | Table `import_historique` |

### Règles Flyway
- `ddl-auto: none` — Hibernate ne touche jamais le schéma
- Flyway est la seule source de vérité pour le DDL
- Les migrations sont irréversibles en production
- En développement : `flyway.repair` si checksum invalide

### Connexion
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/ecompta
    username: ${DB_USER}
    password: ${DB_PASSWORD}
```

---

## SSE — Notifications temps réel

Le backend expose un endpoint SSE :
```
GET /api/notifications/stream  (auth requise)
```

Le frontend se connecte via `SseNotificationService` et reçoit les événements en push :
- Alertes comptables
- Notifications d'approbation
- Résultats d'import longs

---

## Performances et scalabilité

- **Lazy loading** Angular : chaque module est chargé à la demande (bundles < 50 KB par route)
- **Connection pool** HikariCP : pool de 10 connexions par défaut
- **Index PostgreSQL** : index sur `entreprise_id` pour toutes les tables multi-tenant
- **Cache Redis** : sessions utilisateur, résultats computés fréquemment
- **Pagination** : toutes les listes exposent des endpoints paginés (`?page=0&size=20`)
