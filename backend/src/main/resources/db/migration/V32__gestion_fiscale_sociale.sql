-- ─── Référentiel obligations fiscales par pays ───────────────────────────────
CREATE TABLE ref_obligations_fiscales (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    code_pays     VARCHAR(2)   NOT NULL,
    code_impot    VARCHAR(30)  NOT NULL,
    libelle       VARCHAR(200) NOT NULL,
    description   TEXT,
    taux          DECIMAL(7,4),
    base_calcul   VARCHAR(150),
    frequence     VARCHAR(20)  NOT NULL,
    delai_jours   INT          NOT NULL DEFAULT 20,
    compte_debit  VARCHAR(20),
    compte_credit VARCHAR(20),
    ordre         INT          NOT NULL DEFAULT 0,
    CONSTRAINT uq_ref_oblig UNIQUE (code_pays, code_impot),
    CONSTRAINT chk_ref_frequence CHECK (frequence IN ('MENSUEL','TRIMESTRIEL','SEMESTRIEL','ANNUEL'))
);

-- ─── Déclarations fiscales (hors TVA et IS qui ont leurs propres tables) ──────
CREATE TABLE declarations_fiscales (
    id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id       UUID          NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    code_impot          VARCHAR(30)   NOT NULL,
    libelle             VARCHAR(200)  NOT NULL,
    periode             VARCHAR(10)   NOT NULL,  -- YYYY-MM / YYYY-QN / YYYY
    date_echeance       DATE          NOT NULL,
    statut              VARCHAR(20)   NOT NULL DEFAULT 'A_FAIRE',
    montant_base        DECIMAL(15,2),
    montant_impot       DECIMAL(15,2),
    reference_paiement  VARCHAR(100),
    notes               TEXT,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_decl_fisc UNIQUE (entreprise_id, code_impot, periode),
    CONSTRAINT chk_decl_statut CHECK (statut IN ('A_FAIRE','EN_COURS','DECLAREE','PAYEE'))
);

-- ─── Référentiel cotisations sociales par pays ────────────────────────────────
CREATE TABLE ref_cotisations_sociales (
    id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    code_pays           VARCHAR(2)    NOT NULL,
    code_organisme      VARCHAR(30)   NOT NULL,
    libelle_organisme   VARCHAR(200)  NOT NULL,
    code_cotisation     VARCHAR(40)   NOT NULL,
    libelle_cotisation  VARCHAR(200)  NOT NULL,
    secteur             VARCHAR(20)   NOT NULL DEFAULT 'PRIVE',  -- PRIVE, PUBLIC, TOUS
    taux_salarie        DECIMAL(6,4)  NOT NULL DEFAULT 0,
    taux_patronal       DECIMAL(6,4)  NOT NULL DEFAULT 0,
    plafond_mensuel     DECIMAL(15,2),
    frequence           VARCHAR(20)   NOT NULL DEFAULT 'MENSUEL',
    delai_jours         INT           NOT NULL DEFAULT 15,
    ordre               INT           NOT NULL DEFAULT 0,
    CONSTRAINT uq_ref_cotis UNIQUE (code_pays, code_cotisation)
);

-- ─── Déclarations sociales par entreprise ────────────────────────────────────
CREATE TABLE declarations_sociales (
    id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id       UUID          NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    code_organisme      VARCHAR(30)   NOT NULL,
    libelle_organisme   VARCHAR(200)  NOT NULL,
    periode             VARCHAR(7)    NOT NULL,   -- YYYY-MM
    date_echeance       DATE          NOT NULL,
    nb_employes         INT           NOT NULL DEFAULT 0,
    masse_salariale     DECIMAL(15,2) NOT NULL DEFAULT 0,
    montant_salarie     DECIMAL(15,2) NOT NULL DEFAULT 0,
    montant_patronal    DECIMAL(15,2) NOT NULL DEFAULT 0,
    montant_total       DECIMAL(15,2) NOT NULL DEFAULT 0,
    statut              VARCHAR(20)   NOT NULL DEFAULT 'A_FAIRE',
    reference_paiement  VARCHAR(100),
    notes               TEXT,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_decl_soc UNIQUE (entreprise_id, code_organisme, periode),
    CONSTRAINT chk_decl_soc_statut CHECK (statut IN ('A_FAIRE','DECLAREE','PAYEE'))
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED : Burkina Faso
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT INTO ref_obligations_fiscales
    (code_pays, code_impot, libelle, description, taux, base_calcul, frequence, delai_jours, compte_debit, compte_credit, ordre)
VALUES
('BF','BF_TVA','Taxe sur la Valeur Ajoutée (TVA 18%)',
 'Déclaration mensuelle avant le 20 du mois suivant. Régime du réel normal : TVA collectée - TVA déductible = TVA nette à payer.',
 0.18,'CA TTC — TVA déductible','MENSUEL',20,'4431','4441',1),

('BF','BF_IUTS','Impôt Unique sur les Traitements et Salaires (IUTS)',
 'Retenu à la source sur les salaires et versé au Trésor avant le 20 du mois suivant. Barème progressif de 0 % à 25 %.',
 NULL,'Salaire net imposable = Brut — cotisations salariales','MENSUEL',20,'4471','4471',2),

('BF','BF_TPA','Taxe Patronale et d''Apprentissage (TPA 3%)',
 'À la charge exclusive de l''employeur. Déclaration mensuelle avec la feuille de paie.',
 0.03,'Masse salariale brute (y compris avantages en nature)','MENSUEL',20,'6481','4431',3),

('BF','BF_TFP','Taxe de Formation Professionnelle (TFP 2%)',
 'Contribution obligatoire des employeurs de plus de 20 salariés. Versée au FAFPA.',
 0.02,'Masse salariale brute','MENSUEL',20,'6482','4431',4),

('BF','BF_IFA','Acomptes d''IS — Impôt Forfaitaire sur les Avances (IFA)',
 'Acompte trimestriel égal au quart de l''IS de l''exercice précédent. Échéances : 20 avril, 20 juillet, 20 octobre, 20 janvier.',
 0.275,'IS N-1 ÷ 4 (par trimestre)','TRIMESTRIEL',20,'4412','5211',5),

('BF','BF_IS','Impôt sur les Sociétés (IS 27,5% — min 1% CA HT)',
 'Taux normal 27,5%. Minimum forfaitaire 1% du CA HT. Déclaration et paiement du solde en mars (90 jours après clôture).',
 0.275,'Résultat fiscal = Résultat comptable + Réintégrations — Déductions','ANNUEL',90,'4412','4412',6),

('BF','BF_RSH','Retenues à la Source sur Honoraires (RSH 20%)',
 'Retenue sur les honoraires versés à des prestataires non immatriculés au régime du bénéfice réel. Déclaration mensuelle.',
 0.20,'Montant brut des honoraires et commissions versés','MENSUEL',20,'4471','4471',7),

('BF','BF_RSL','Retenues à la Source sur Loyers (RSL 15%)',
 'Retenue opérée par le locataire sur les loyers versés à des personnes physiques ou morales non assujetties à la TVA.',
 0.15,'Montant brut des loyers et charges locatives versés','MENSUEL',20,'4471','4471',8),

('BF','BF_PATENTE','Contribution des Patentes',
 'Impôt annuel sur l''exercice d''une activité commerciale ou industrielle. Barème progressif basé sur le CA HT de N-1. Paiement en janvier.',
 NULL,'Chiffre d''affaires HT N-1 (barème DGI)','ANNUEL',31,NULL,NULL,9),

('BF','BF_CFPB','Contribution Foncière des Propriétés Bâties (CFPB)',
 'Taxe annuelle sur les propriétés bâties. Basée sur la valeur locative nette (valeur brute × 75%). Paiement en janvier.',
 NULL,'Valeur locative nette des propriétés bâties possédées ou exploitées','ANNUEL',31,NULL,NULL,10);

-- ─── Côte d'Ivoire
INSERT INTO ref_obligations_fiscales (code_pays, code_impot, libelle, taux, base_calcul, frequence, delai_jours, ordre) VALUES
('CI','CI_TVA','TVA (18%)', 0.18,'CA TTC — TVA déductible','MENSUEL',15,1),
('CI','CI_IRPP','Impôt sur le Revenu des Personnes Physiques (IRPP)', NULL,'Salaire net imposable','MENSUEL',15,2),
('CI','CI_IS','Impôt sur les Bénéfices (IS 25%)', 0.25,'Résultat fiscal','ANNUEL',90,3),
('CI','CI_CMU','Contribution Mutuelle Universelle (CMU 1%)', 0.01,'Masse salariale brute','MENSUEL',15,4),
('CI','CI_FNS','Fonds National de Solidarité (FNS 1.5%)', 0.015,'Masse salariale brute','MENSUEL',15,5);

-- ─── Sénégal
INSERT INTO ref_obligations_fiscales (code_pays, code_impot, libelle, taux, base_calcul, frequence, delai_jours, ordre) VALUES
('SN','SN_TVA','TVA (18%)', 0.18,'CA TTC — TVA déductible','MENSUEL',15,1),
('SN','SN_IR','Impôt sur le Revenu (IR)', NULL,'Salaire net imposable','MENSUEL',15,2),
('SN','SN_IS','Impôt sur les Sociétés (IS 30%)', 0.30,'Résultat fiscal','ANNUEL',90,3),
('SN','SN_CFCE','Contribution Forfaitaire à la Charge des Employeurs (CFCE 3%)', 0.03,'Masse salariale brute','MENSUEL',15,4);

-- ─── Mali
INSERT INTO ref_obligations_fiscales (code_pays, code_impot, libelle, taux, base_calcul, frequence, delai_jours, ordre) VALUES
('ML','ML_TVA','TVA (18%)', 0.18,'CA TTC — TVA déductible','MENSUEL',20,1),
('ML','ML_IRCM','Impôt sur les Revenus des Capitaux Mobiliers', NULL,'Salaire net imposable','MENSUEL',20,2),
('ML','ML_IS','Impôt sur les Bénéfices Industriels et Commerciaux (BIC 30%)', 0.30,'Résultat fiscal','ANNUEL',90,3);

-- ─── Cameroun
INSERT INTO ref_obligations_fiscales (code_pays, code_impot, libelle, taux, base_calcul, frequence, delai_jours, ordre) VALUES
('CM','CM_TVA','TVA (19,25%)', 0.1925,'CA TTC — TVA déductible','MENSUEL',15,1),
('CM','CM_IS','Impôt sur les Sociétés (IS 30%)', 0.30,'Résultat fiscal','ANNUEL',90,2),
('CM','CM_IRPP','Impôt sur le Revenu des Personnes Physiques', NULL,'Salaire net imposable','MENSUEL',15,3);

-- ─── Togo
INSERT INTO ref_obligations_fiscales (code_pays, code_impot, libelle, taux, base_calcul, frequence, delai_jours, ordre) VALUES
('TG','TG_TVA','TVA (18%)', 0.18,'CA TTC — TVA déductible','MENSUEL',15,1),
('TG','TG_IS','Impôt sur les Sociétés (IS 27%)', 0.27,'Résultat fiscal','ANNUEL',90,2),
('TG','TG_IPTS','Impôt sur les Traitements et Salaires', NULL,'Salaire net imposable','MENSUEL',15,3);

-- ─── Bénin
INSERT INTO ref_obligations_fiscales (code_pays, code_impot, libelle, taux, base_calcul, frequence, delai_jours, ordre) VALUES
('BJ','BJ_TVA','TVA (18%)', 0.18,'CA TTC — TVA déductible','MENSUEL',15,1),
('BJ','BJ_IS','Impôt sur les Bénéfices (IS 30%)', 0.30,'Résultat fiscal','ANNUEL',90,2);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED : Cotisations sociales
-- ═══════════════════════════════════════════════════════════════════════════════
-- Burkina Faso — CNSS (secteur privé)
INSERT INTO ref_cotisations_sociales
    (code_pays, code_organisme, libelle_organisme, code_cotisation, libelle_cotisation, secteur, taux_salarie, taux_patronal, plafond_mensuel, frequence, delai_jours, ordre)
VALUES
('BF','BF_CNSS','Caisse Nationale de Sécurité Sociale (CNSS)',
 'BF_CNSS_VIEILLESSE','Vieillesse, Invalidité, Décès','PRIVE', 0.0550, 0.0550, 500000, 'MENSUEL', 15, 1),
('BF','BF_CNSS','Caisse Nationale de Sécurité Sociale (CNSS)',
 'BF_CNSS_PF','Prestations Familiales','PRIVE', 0.0000, 0.0700, 500000, 'MENSUEL', 15, 2),
('BF','BF_CNSS','Caisse Nationale de Sécurité Sociale (CNSS)',
 'BF_CNSS_AT','Accidents du Travail','PRIVE', 0.0000, 0.0350, 500000, 'MENSUEL', 15, 3),

-- Burkina Faso — CARFO (fonctionnaires / secteur public)
('BF','BF_CARFO','Caisse Autonome de Retraite des Fonctionnaires (CARFO)',
 'BF_CARFO_RETRAITE','Retraite des fonctionnaires','PUBLIC', 0.0800, 0.0840, NULL, 'MENSUEL', 15, 1),

-- Côte d'Ivoire — CNPS
('CI','CI_CNPS','Caisse Nationale de Prévoyance Sociale (CNPS)',
 'CI_CNPS_RETRAITE','Retraite','PRIVE', 0.0630, 0.0770, NULL, 'MENSUEL', 15, 1),
('CI','CI_CNPS','Caisse Nationale de Prévoyance Sociale (CNPS)',
 'CI_CNPS_PF','Prestations Familiales','PRIVE', 0.0000, 0.0575, NULL, 'MENSUEL', 15, 2),
('CI','CI_CNPS','Caisse Nationale de Prévoyance Sociale (CNPS)',
 'CI_CNPS_AT','Accidents du Travail','PRIVE', 0.0000, 0.0200, NULL, 'MENSUEL', 15, 3),

-- Sénégal — IPRES
('SN','SN_IPRES','Institution de Prévoyance Retraite du Sénégal (IPRES)',
 'SN_IPRES_GEN','Régime général retraite','PRIVE', 0.0560, 0.0840, NULL, 'MENSUEL', 15, 1),
-- Sénégal — CSS
('SN','SN_CSS','Caisse de Sécurité Sociale (CSS)',
 'SN_CSS_PF','Prestations Familiales','PRIVE', 0.0000, 0.0700, NULL, 'MENSUEL', 15, 1),
('SN','SN_CSS','Caisse de Sécurité Sociale (CSS)',
 'SN_CSS_AT','Accidents du Travail','PRIVE', 0.0000, 0.0100, NULL, 'MENSUEL', 15, 2),

-- Mali — INPS
('ML','ML_INPS','Institut National de Prévoyance Sociale (INPS)',
 'ML_INPS_VIEILLESSE','Vieillesse, Invalidité, Décès','PRIVE', 0.0346, 0.0760, NULL, 'MENSUEL', 15, 1),
('ML','ML_INPS','Institut National de Prévoyance Sociale (INPS)',
 'ML_INPS_PF','Prestations Familiales','PRIVE', 0.0000, 0.0580, NULL, 'MENSUEL', 15, 2),

-- Cameroun — CNPS
('CM','CM_CNPS','Caisse Nationale de Prévoyance Sociale (CNPS)',
 'CM_CNPS_VIEILLESSE','Vieillesse, Invalidité, Décès','PRIVE', 0.0280, 0.0420, NULL, 'MENSUEL', 15, 1),
('CM','CM_CNPS','Caisse Nationale de Prévoyance Sociale (CNPS)',
 'CM_CNPS_PF','Allocations Familiales','PRIVE', 0.0000, 0.0750, NULL, 'MENSUEL', 15, 2),

-- Togo — CNSS
('TG','TG_CNSS','Caisse Nationale de Sécurité Sociale (CNSS)',
 'TG_CNSS_VIEILLESSE','Vieillesse','PRIVE', 0.0400, 0.0800, NULL, 'MENSUEL', 15, 1),
('TG','TG_CNSS','Caisse Nationale de Sécurité Sociale (CNSS)',
 'TG_CNSS_PF','Prestations Familiales','PRIVE', 0.0000, 0.0550, NULL, 'MENSUEL', 15, 2),

-- Bénin — CNSS
('BJ','BJ_CNSS','Caisse Nationale de Sécurité Sociale (CNSS)',
 'BJ_CNSS_VIEILLESSE','Vieillesse, Invalidité, Décès','PRIVE', 0.0360, 0.0640, NULL, 'MENSUEL', 15, 1),
('BJ','BJ_CNSS','Caisse Nationale de Sécurité Sociale (CNSS)',
 'BJ_CNSS_PF','Prestations Familiales','PRIVE', 0.0000, 0.0620, NULL, 'MENSUEL', 15, 2);
