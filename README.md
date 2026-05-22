# E-Compta IA International — Plateforme SaaS de Comptabilité Assistée par IA

Plateforme SaaS internationale de comptabilité conforme **SYSCOHADA AUDCIF** (espace OHADA), avec assistant IA pour la saisie automatique des pièces justificatives et la génération des états financiers.

## Branches

| Branche | Rôle |
|---------|------|
| `main` | Production stable |
| `dev` | Intégration continue |
| `feature/frontend-neya` | Développement UI/UX Angular |
| `feature/security-zombre` | Sécurité & authentification |

## Stack Technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Angular (architecture modulaire, lazy loading, i18n) |
| Backend | Spring Boot 3.x (Java 17 / 21) |
| Sécurité | Spring Security — JWT Stateless |
| ORM | JPA / Hibernate + `@FilterDef` multi-tenant |
| Base de Données | PostgreSQL (isolation par `entreprise_id`) |
| Moteur IA | Anthropic Claude / OpenAI — RAG sur référentiel SYSCOHADA |
| Infrastructure | Docker / Docker Compose + Nginx (TLS/SSL) + VPS |

## Fonctionnalités V1.0

- **Multi-Tenant hermétique** — chaque entreprise dispose d'un espace logique isolé (`entreprise_id`)
- **Plan de comptes SYSCOHADA** — génération automatique des Classes 1 à 9 à l'initialisation
- **Moteur partie double** — validation algorithmique stricte (Total Débit = Total Crédit)
- **Assistant IA de saisie** — upload facture/reçu → extraction (fournisseur, HT, TVA, TTC) → imputation automatique dans les bons comptes (Classes 6 & 7)
- **États financiers** — Grands Livres, Balances, Bilan, Compte de Résultat
- **Révocation de session d'urgence** — invalidation instantanée des tokens (Redis blacklist)
- **Roadmap** : extension IFRS et US GAAP en V2

## Démarrage rapide

```bash
git clone https://github.com/LnDevAi/e-compta-ia-inter.git
cd e-compta-ia-inter
# Backend Spring Boot
cd backend && mvn spring-boot:run
# Frontend Angular
cd frontend && npm install && ng serve
```

## Conformité Réglementaire

SYSCOHADA AUDCIF · UEMOA · IFRS (V2) · US GAAP (V2)

## Contributeurs

- [@MoussaNEYA](https://github.com/MoussaNEYA) — Frontend Angular
- [@Yamalr](https://github.com/Yamalr) — Backend Spring Boot & Sécurité
- [@burkinabe](https://github.com/burkinabe) — Tests, CI/CD & Déploiement

---

**E-DEFENCE** · Ouaga 2000, derrière INSD, vers Rectorat UCAO · Ouagadougou, Burkina Faso
[www.edefence.tech](https://www.edefence.tech) · info@edefence.tech
