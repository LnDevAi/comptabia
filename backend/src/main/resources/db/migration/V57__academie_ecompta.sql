-- Académie eCompta : certifications couvrant tous les modules de la plateforme

CREATE TABLE academe_cours (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    titre        VARCHAR(255) NOT NULL,
    description  TEXT,
    niveau       VARCHAR(20)  NOT NULL DEFAULT 'DEBUTANT',
    -- DEBUTANT | INTERMEDIAIRE | AVANCE
    categorie    VARCHAR(30)  NOT NULL,
    -- SYSCOHADA | OHADA | COMPTABILITE | FISCALITE | TRESORERIE | PAIE_RH | AUDIT
    -- BUDGET | IMMOBILISATIONS | FACTURATION | CRM | PILOTAGE | GOUVERNANCE
    -- ASSURANCE_CIMA | MICROFINANCE_SFD | FINANCE_ISLAMIQUE
    duree_heures INTEGER      NOT NULL DEFAULT 1,
    actif        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE academe_chapitres (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    cours_id        UUID         NOT NULL REFERENCES academe_cours(id) ON DELETE CASCADE,
    titre           VARCHAR(255) NOT NULL,
    contenu         TEXT,
    ordre           INTEGER      NOT NULL DEFAULT 0,
    duree_minutes   INTEGER      NOT NULL DEFAULT 15
);

CREATE TABLE academe_quiz (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    cours_id        UUID         NOT NULL REFERENCES academe_cours(id) ON DELETE CASCADE,
    titre           VARCHAR(255) NOT NULL,
    score_minimum   INTEGER      NOT NULL DEFAULT 70
);

CREATE TABLE academe_questions (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id        UUID         NOT NULL REFERENCES academe_quiz(id) ON DELETE CASCADE,
    question       TEXT         NOT NULL,
    option_a       VARCHAR(500) NOT NULL,
    option_b       VARCHAR(500) NOT NULL,
    option_c       VARCHAR(500),
    option_d       VARCHAR(500),
    bonne_reponse  CHAR(1)      NOT NULL,
    ordre          INTEGER      NOT NULL DEFAULT 0
);

CREATE TABLE academe_inscriptions (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    utilisateur_id  UUID        NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    cours_id        UUID        NOT NULL REFERENCES academe_cours(id) ON DELETE CASCADE,
    entreprise_id   UUID        NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    statut          VARCHAR(20) NOT NULL DEFAULT 'EN_COURS',  -- EN_COURS | TERMINE | ABANDONNE
    progression     INTEGER     NOT NULL DEFAULT 0,           -- 0-100
    date_debut      DATE        NOT NULL DEFAULT CURRENT_DATE,
    date_fin        DATE,
    UNIQUE(utilisateur_id, cours_id)
);

CREATE TABLE academe_progression_chapitres (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    inscription_id  UUID        NOT NULL REFERENCES academe_inscriptions(id) ON DELETE CASCADE,
    chapitre_id     UUID        NOT NULL REFERENCES academe_chapitres(id) ON DELETE CASCADE,
    date_completion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(inscription_id, chapitre_id)
);

CREATE TABLE academe_certificats (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    utilisateur_id    UUID         NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    cours_id          UUID         NOT NULL REFERENCES academe_cours(id) ON DELETE CASCADE,
    entreprise_id     UUID         NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    numero_certificat VARCHAR(50)  NOT NULL UNIQUE,
    score_obtenu      INTEGER      NOT NULL,
    nom_beneficiaire  VARCHAR(255) NOT NULL,
    date_obtention    DATE         NOT NULL DEFAULT CURRENT_DATE,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_academe_inscriptions_user ON academe_inscriptions(utilisateur_id);
CREATE INDEX idx_academe_inscriptions_ent  ON academe_inscriptions(entreprise_id);
CREATE INDEX idx_academe_certificats_user  ON academe_certificats(utilisateur_id);

-- ═══════════════════════════════════════════════════════════════════
-- CATALOGUE COMPLET — 28 certifications couvrant tous les modules
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO academe_cours (titre, description, niveau, categorie, duree_heures) VALUES

-- ── SYSCOHADA ──────────────────────────────────────────────────────
('SYSCOHADA Révisé — Fondamentaux',
 'Maîtriser le référentiel comptable SYSCOHADA révisé : plan de comptes uniforme, classes de comptes, principes comptables fondamentaux et règles d''enregistrement.',
 'DEBUTANT', 'SYSCOHADA', 4),

('États financiers SYSCOHADA — Bilan et Compte de résultat',
 'Élaboration du bilan, du compte de résultat, du tableau des flux de trésorerie (TFT) et des notes annexes selon le SYSCOHADA révisé.',
 'INTERMEDIAIRE', 'SYSCOHADA', 6),

('Consolidation des comptes de groupe SYSCOHADA',
 'Méthodes de consolidation — intégration globale, proportionnelle et mise en équivalence. Écritures de consolidation, élimination des opérations intragroupe.',
 'AVANCE', 'SYSCOHADA', 8),

-- ── OHADA ──────────────────────────────────────────────────────────
('Comptabilité générale OHADA',
 'Tenue des livres comptables, rapprochements, corrections d''erreurs et obligations légales dans le cadre de l''Acte uniforme OHADA relatif au droit comptable.',
 'INTERMEDIAIRE', 'OHADA', 6),

('Droit comptable et financier OHADA',
 'Actes uniformes OHADA applicables aux entreprises : droit commercial, droit des sociétés, procédures collectives — liens avec la comptabilité.',
 'AVANCE', 'OHADA', 5),

-- ── COMPTABILITE ───────────────────────────────────────────────────
('Clôture des comptes et travaux de fin d''exercice',
 'Procédures de clôture annuelle : inventaires, amortissements, provisions, régularisations, affectation du résultat.',
 'AVANCE', 'COMPTABILITE', 8),

('Lettrage, analytique et affectation',
 'Lettrage des comptes de tiers, comptabilité analytique par axes, affectation des coûts et suivi budgétaire analytique.',
 'INTERMEDIAIRE', 'COMPTABILITE', 4),

('Import FEC et migration de données',
 'Format FEC (Fichier des Écritures Comptables), import/export, migration entre logiciels et contrôle de cohérence des données.',
 'INTERMEDIAIRE', 'COMPTABILITE', 3),

-- ── FISCALITE ──────────────────────────────────────────────────────
('Fiscalité des entreprises en Afrique de l''Ouest',
 'Impôt sur les sociétés, BIC, BNC — base imposable, taux, réductions et crédits d''impôt. Optimisation fiscale légale.',
 'INTERMEDIAIRE', 'FISCALITE', 5),

('TVA — Déclarations et régimes d''imposition',
 'Mécanismes de la TVA, régimes réel et simplifié, déclarations périodiques, TVA déductible et collectée, gestion des remboursements.',
 'DEBUTANT', 'FISCALITE', 3),

('Liasse fiscale et déclarations annuelles',
 'Établissement de la liasse fiscale complète : formulaires, tableaux de passage, déclarations IS/BIC et dépôt auprès de l''administration fiscale.',
 'AVANCE', 'FISCALITE', 5),

-- ── TRESORERIE ─────────────────────────────────────────────────────
('Gestion de trésorerie — Fondamentaux',
 'Prévisions de trésorerie à court terme, gestion des liquidités, flux entrants/sortants et seuils d''alerte.',
 'DEBUTANT', 'TRESORERIE', 3),

('Rapprochement bancaire et import OFX',
 'Méthode de rapprochement bancaire, résolution des écarts, import de relevés OFX/CSV, virements internes et suivi des comptes.',
 'INTERMEDIAIRE', 'TRESORERIE', 3),

-- ── BUDGET ─────────────────────────────────────────────────────────
('Gestion budgétaire et contrôle de budget',
 'Élaboration du budget d''exploitation et d''investissement, suivi des réalisations vs prévisions, analyse des écarts.',
 'INTERMEDIAIRE', 'BUDGET', 4),

('Budget RH et masse salariale',
 'Prévision des effectifs, calcul de la masse salariale prévisionnelle, suivi des coûts salariaux et des charges sociales.',
 'INTERMEDIAIRE', 'BUDGET', 3),

-- ── IMMOBILISATIONS ────────────────────────────────────────────────
('Immobilisations et amortissements SYSCOHADA',
 'Classification des immobilisations, méthodes d''amortissement (linéaire, dégressif, UO), cessions et mises au rebut selon SYSCOHADA.',
 'INTERMEDIAIRE', 'IMMOBILISATIONS', 4),

('Gestion des stocks et inventaires',
 'Méthodes de valorisation des stocks (FIFO, CMUP), inventaires permanents et tournants, dépréciations et gestion des mouvements.',
 'INTERMEDIAIRE', 'IMMOBILISATIONS', 3),

-- ── FACTURATION ────────────────────────────────────────────────────
('Facturation clients et recouvrement',
 'Création et gestion des factures clients, suivi des paiements, relances automatiques, avoirs et gestion des litiges.',
 'DEBUTANT', 'FACTURATION', 4),

('Devis, bons de commande et gestion commerciale',
 'Cycle commercial complet : devis, acceptation, bon de commande, livraison, facturation et suivi des règlements.',
 'DEBUTANT', 'FACTURATION', 3),

-- ── CRM ────────────────────────────────────────────────────────────
('CRM et gestion de la relation client',
 'Gestion des contacts, pipeline commercial, suivi des leads, campagnes marketing et analyse des performances commerciales.',
 'INTERMEDIAIRE', 'CRM', 4),

-- ── PILOTAGE ───────────────────────────────────────────────────────
('Pilotage financier et tableaux de bord',
 'Ratios financiers clés, indicateurs de performance (KPI), tableaux de bord de direction et reporting financier.',
 'INTERMEDIAIRE', 'PILOTAGE', 4),

-- ── PAIE_RH ────────────────────────────────────────────────────────
('Paie et cotisations sociales',
 'Calcul des bulletins de paie, charges patronales et salariales, déclarations CNSS, IRPP et procédures de clôture de paie.',
 'INTERMEDIAIRE', 'PAIE_RH', 4),

('Gestion des ressources humaines et droit du travail OHADA',
 'Contrats de travail, congés, absences, ruptures conventionnelles et obligations légales employeur dans l''espace OHADA.',
 'INTERMEDIAIRE', 'PAIE_RH', 6),

-- ── AUDIT ──────────────────────────────────────────────────────────
('Audit interne et contrôle interne',
 'Normes IIA, cartographie des risques, procédures de contrôle interne, piste d''audit et rapports d''audit.',
 'AVANCE', 'AUDIT', 6),

-- ── GOUVERNANCE ────────────────────────────────────────────────────
('Gouvernance d''entreprise et conformité OHADA',
 'Assemblées générales, conseils d''administration, obligations de reporting, conformité réglementaire et bonne gouvernance.',
 'AVANCE', 'GOUVERNANCE', 5),

-- ── ASSURANCE_CIMA ─────────────────────────────────────────────────
('Comptabilité des assurances — Plan comptable CIMA',
 'Plan comptable des assurances CIMA, provisions techniques, états réglementaires CIMA et marge de solvabilité.',
 'AVANCE', 'ASSURANCE_CIMA', 6),

-- ── MICROFINANCE_SFD ───────────────────────────────────────────────
('Microfinance et gestion du portefeuille SFD',
 'Réglementation BCEAO/COBAC des SFD, gestion du portefeuille de crédits, taux de remboursement, états prudentiels.',
 'AVANCE', 'MICROFINANCE_SFD', 5),

-- ── FINANCE_ISLAMIQUE ──────────────────────────────────────────────
('Finance islamique — Produits et comptabilisation',
 'Principes de la finance halal, produits Mourabaha, Ijara, Moucharaka — comptabilisation selon les normes AAOIFI.',
 'AVANCE', 'FINANCE_ISLAMIQUE', 6);
