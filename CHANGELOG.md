# Changelog — e-Compta IA

Toutes les modifications notables de ce projet sont documentées ici.
Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).
Ce projet suit le [Versionnage Sémantique](https://semver.org/lang/fr/).

---

## [1.0.0] - 2026-05-27

Première version complète d'e-Compta IA — logiciel de comptabilité en ligne conforme
SYSCOHADA Révisé, conçu pour les entreprises d'Afrique de l'Ouest (UEMOA / OHADA).
Cette version couvre l'intégralité des modules comptables, fiscaux, RH, sectoriels,
ainsi que la documentation complète et le système de paiement SaaS.

### Comptabilité de base

- Plan comptable SYSCOHADA Révisé (classes 1-9), journaux, écritures, exercices ([#20](#))
- Déclarations TVA 18 % (mensuel / trimestriel) avec report de crédit ([#20](#))
- Lettrage des comptes tiers 401x/411x — lettrage automatique et manuel ([#21](#))
- Comptabilité analytique multi-axes SYSCOHADA — répartitions, rapports ([#22](#))
- Relances clients : 3 niveaux, suivi des impayés, historique ([#23](#))
- Alertes et notifications transversales configurables ([#24](#))
- Export CSV et FEC OHADA (DGFIP format) ([#25](#))
- Paramètres entreprise SYSCOHADA — référentiel, devise, exercice ([#26](#))
- Affectation du résultat : dividendes, réserves, report à nouveau ([#27](#))
- Déclaration IS — Impôt sur les Sociétés Burkina Faso ([#28](#))
- Journal des événements / audit trail SYSCOHADA — 18 actions tracées ([#29](#))
- Import FEC OHADA — détection automatique du séparateur, preview ([#30](#))
- Modèles d'écritures récurrentes — abonnements comptables automatiques ([#31](#))
- Balance âgée — rapport d'antériorité créances/dettes, tranches configurables ([#32](#))
- Tableau des flux de trésorerie SYSCOHADA (méthode indirecte) ([#33](#))
- Gestion de la paie — bulletins, OD comptable automatique SYSCOHADA ([#34](#))
- État de variation des capitaux propres SYSCOHADA ([#35](#))
- Notes annexes AUDCIF — 36 notes structurées SYSCOHADA SN ([#36](#))
- Lettrage automatique, régularisations CCA/PCA/CAP/PAR ([#49](#))
- Modèles d'écritures avec paramétrage par journal ([#31](#))

### États financiers & Pilotage

- Ratios financiers SYSCOHADA — liquidité, rentabilité, solvabilité, activité ([#37](#))
- Tableau de bord de pilotage financier ([#38](#))
- Prévisions de trésorerie — scénarios optimiste/pessimiste ([#41](#))
- Tableau de bord KPI exécutif ([#45](#))
- États financiers multi-référentiel + prompt IA adaptatif par référentiel ([#66](#))
- Comparatif N vs N-1 sur tous les états financiers ([#100](#))
- Tableau de bord dirigeant multi-modules ([#71](#))
- Enrichissement visuel Chart.js — dashboard 5 graphiques, comparaison N-1 ([#95](#))
- Ratios — score global, radar SYSCOHADA, tendances ([#100](#))
- KPI exécutif — alertes seuils, graphique N vs N-1, top charges ([#99](#))

### Facturation & Commerce

- Facturation clients SYSCOHADA — numérotation automatique, PDF ([#39](#))
- Devis SYSCOHADA — conversion en facture en un clic ([#40](#))
- Conformité Facture Normalisée Burkina Faso (DGI/eSINTAX) ([#58](#))
- Relances automatiques par email sur factures impayées ([#23](#))
- Graphiques Chart.js : dashboard facturation, évolution mensuelle ([#105](#))

### Trésorerie

- Rapprochement bancaire — import OFX, matching automatique ([#92](#))
- Trésorerie avancée — comptes bancaires, mouvements, alertes seuils ([#92](#))
- Graphique Chart.js — flux mensuels encaissements/décaissements, jauges ([#103](#))

### Immobilisations & Stocks

- Immobilisations — amortissements linéaire et dégressif, dotations auto ([#90](#))
- Gestion des stocks — articles, mouvements, inventaires ([#90](#))
- Graphique Chart.js — doughnut + bar brute/amortie/nette par catégorie ([#111](#))
- Graphique Chart.js — stocks : évolution mensuelle, top articles ([#105](#))

### Budget

- Budget comptable — lignes budgétaires par compte ([#101](#))
- Graphique Chart.js — alertes dépassements, tendance mensuelle ([#101](#))
- Import balance externe → génération états financiers sans saisie ([#68](#))

### Fiscalité

- Liasse fiscale SYSCOHADA pour dépôt légal OHADA ([#72](#))
- SMT ESP + import balance à 6 colonnes ([#73](#))
- Gestion fiscale — échéances, calendrier fiscal ([#55](#))
- Gestion sociale — déclarations sociales, charges patronales ([#55](#))
- Notes annexes fiscales structurées ([#55](#))
- Déclaration TVA — stats annuelles, graphique mensuel collectée/déductible, export CSV ([#102](#))

### Analytique

- Analytique multi-dimension — projets, bailleurs, activités ([#22](#), [#104](#))
- Graphiques Chart.js — KPI analytiques, répartitions ([#104](#))

### Module RH complet

- Notes de frais — saisie, validation hiérarchique, OD comptable ([#50](#))
- Gestion des congés et absences — soldes, workflow validation ([#53](#))
- Évaluations de performance — objectifs, notation, historique ([#55](#))
- Formation professionnelle — plan, sessions, inscriptions, bilan ([#56](#))
- Discipline et sanctions RH — dossiers, procédure, historique ([#57](#))
- Tableau de bord RH consolidé ([#59](#))
- Gestion des temps et présences — pointages, absences ([#60](#))
- Recrutement et onboarding — pipeline Kanban, checklist onboarding ([#61](#))
- Prêts et avances sur salaire — échéances automatiques ([#62](#))
- Portail Collaborateur (Mon espace) — self-service RH ([#63](#))
- Documents RH — bulletins archivés, contrats, alertes expiration ([#64](#))
- Reporting & Exports RH — synthèse, 4 rapports, export CSV ([#65](#))
- Comparatif RH N vs N-1 ([#67](#))
- Budget RH prévisionnel + analytique multi-dimension ([#69](#))
- Rapport bailleur / rapport d'exécution de subvention ([#70](#))
- Graphiques Chart.js : dashboard RH bar N/N-1, paie mensuelle, congés doughnut ([#110](#), [#112](#), [#113](#))
- Budget RH — doughnut vs réalisé, bar mensuel ([#109](#))

### Modules sectoriels

- **Associations et ONG** — multi-référentiel SYCEBNL, documents réglementaires ([#80](#))
- **Assurances CIMA** — plan comptable CIMA, provisions techniques, états financiers ([#81](#))
- **Microfinances SFD/BCEAO** — portefeuille crédits, PAR, états de résultat ([#82](#))
- **Gouvernance** — assemblées générales, résolutions, mandats, registre associés ([#83](#))
- **Finance Islamique** — produits Mourabaha/Ijara/Musharaka, Zakat, PNI ([#84](#))
- **Consolidation multi-entités** — méthodes OHADA, éliminations interco, TFT consolidé ([#85](#))
- **CRM** — contacts, pipeline Kanban, emailing & SMS ([#86](#))
- **Commerce** — gestion commerciale, pipelines ventes ([#88](#))
- **Multi-référentiels** — SYSCOHADA, SYSCEBNL, IFRS, CIMA, BCEAO avec états adaptatifs ([#52](#), [#66](#))

### Fonctionnalités transversales

- Notifications temps réel via SSE (Server-Sent Events) avec badge non-lu ([#43](#))
- GED — pièces jointes aux écritures, catégories, recherche ([#44](#), [#91](#))
- Workflow d'approbation des écritures — ADMIN requis ([#47](#))
- Multi-devises — cours de change, conversion automatique ([#48](#))
- Abonnements comptables — écritures récurrentes programmées ([#46](#))
- Dashboard analytique temps réel ([#51](#))
- Alertes intelligentes configurables + historique persistant ([#97](#))
- Balance âgée — score de risque, graphique Chart.js, filtres, export CSV ([#98](#))
- Tiers — graphiques Chart.js, doughnut + bar créations mensuelles ([#108](#))
- Portail client — consultation factures via OTP email ([#79](#))
- Portail associé — accès sécurisé par token ([#83](#))
- Notifications email pour alertes critiques ([#75](#))
- UX — toast notifications, loading bar, intercepteur HTTP ([#93](#))
- Rapport d'exécution de subvention ([#70](#))

### Sécurité & Infrastructure

- Authentification JWT (access 15 min + refresh 7 j) + blacklist Redis ([#74](#))
- Authentification double facteur TOTP — 2FA compatible Google Authenticator ([#77](#))
- Gestion des rôles et permissions multi-utilisateurs (ADMIN / COMPTABLE / LECTEUR) ([#78](#))
- Multi-tenancy Hibernate — isolation stricte par `entreprise_id` ([#74](#))
- Contrôle d'accès RBAC avec `@PreAuthorize` sur tous les endpoints ([#74](#))
- CORS, BCrypt 12, rate limiting Nginx ([#74](#))
- Licence RSA robuste + Docker on-premise ([#87](#))
- Audit trail — 18 actions, stats & filtres avancés ([#96](#))
- Documentation API OpenAPI / Swagger UI ([#76](#))

### Paiement SaaS

- Système de paiement SaaS — CinetPay (Mobile Money), Stripe (carte), Virement ([#114](#))
- Gestion des licences et abonnements par plan (FREE / STANDARD / PREMIUM / ENTERPRISE) ([#88](#))
- Module Académie eCompta — 28 certifications couvrant tous les modules ([#94](#))

### Import & Migration

- Module Import & Migration complet ([#117](#))
  - FEC (Fichier des Écritures Comptables OHADA)
  - Sage 100 Comptabilité (export CSV)
  - EBP Comptabilité (CSV/TXT)
  - WaveSoft (XML/CSV)
  - Excel générique et CSV multi-colonnes
  - Import de soldes initiaux (6 colonnes)
- Preview interactive avec détection auto du séparateur ([#117](#))
- Historique des imports avec rapport JSON d'erreurs ([#117](#))

### Documentation

- **Documentation légale** — CGU, CGV, Politique de confidentialité, Mentions légales ([#118](#))
  - Conformité OHADA/Burkina Faso, droit burkinabè applicable
- **Documentation utilisateur** — Centre d'aide intégré ([#119](#))
  - 8 guides thématiques : démarrage, comptabilité, états financiers, tiers,
    import/migration, module IA, fiscalité/TVA, administration
  - FAQ 20+ questions/réponses
  - Recherche plein texte avec extraits contextuels
- **Documentation commerciale** ([#120](#))
  - Pitch deck : problème OHADA → solution → marché cible → proposition de valeur
  - Comparatif détaillé 50+ fonctionnalités par plan
  - 13 fiches modules avec disponibilité par plan
  - Guide argumentaire commercial : 7 objections + réponses
  - Programme partenaires : Silver / Gold / Platinum (commissions 10-20 %)
- **Documentation technique** ([#121](#))
  - Architecture système (stack, diagramme, multi-tenancy, flux JWT)
  - Référence API REST (auth, écritures, migration, états, licences)
  - Guide déploiement Docker Compose + Nginx + CI GitHub Actions
  - Modèle de sécurité 4 couches + checklist production
  - Guide de contribution (Git workflow, Conventional Commits, PR checklist)
  - Historique des migrations Flyway V1–V61

### Corrections et améliorations

- Migration ENUM → VARCHAR(20) sur colonnes Hibernate 6 / PostgreSQL ENUM natif (V60) ([#116](#))
- Redis fail-open en développement — démarrage garanti sans Redis ([#116](#))
- Corrections compilation Angular — module paiement-saas ([#115](#))

---

## [0.1.0] - 2026-05-21

Première release officielle du projet. Établit la structure de base du dépôt et les
conventions de développement.

### Ajouté

- Initialisation du dépôt public sur GitHub
- Branches : `main`, `dev`, `feature/frontend-neya`, `feature/security-zombre`
- Protection des branches `main` (PR obligatoire, 1 approbation) et `dev`
- Collaborateurs : MoussaNEYA, Yamalr
- `README.md`, `CONTRIBUTING.md`, `.gitignore`, `LICENSE` (propriétaire)
- Workflow CI GitHub Actions (Python 3.11 & 3.12)

---

[1.0.0]: https://github.com/LnDevAi/e-compta-ia-inter/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/LnDevAi/e-compta-ia-inter/releases/tag/v0.1.0
