-- V28 : Référentiel pays — multi-comptabilité & multi-fiscalité

ALTER TABLE entreprises
    ADD COLUMN IF NOT EXISTS code_pays           VARCHAR(2)  NOT NULL DEFAULT 'BF',
    ADD COLUMN IF NOT EXISTS referentiel_comptable VARCHAR(30) NOT NULL DEFAULT 'SYSCOHADA';

-- ─── Table référentiel ────────────────────────────────────────────────────────
CREATE TABLE referentiel_fiscal_pays (
    code                    VARCHAR(2)    PRIMARY KEY,
    nom                     VARCHAR(100)  NOT NULL,
    devise                  VARCHAR(10)   NOT NULL,
    locale                  VARCHAR(10)   NOT NULL DEFAULT 'fr-FR',
    systeme_comptable       VARCHAR(30)   NOT NULL DEFAULT 'SYSCOHADA',
    taux_tva                NUMERIC(5,2)  NOT NULL DEFAULT 18.00,
    taux_is                 NUMERIC(5,2)  NOT NULL DEFAULT 25.00,
    nom_tva                 VARCHAR(100),
    nom_is                  VARCHAR(100),
    minimum_forfaitaire     NUMERIC(15,2) NOT NULL DEFAULT 0,
    periode_declaration_tva VARCHAR(20)   NOT NULL DEFAULT 'MENSUELLE'
);

-- ─── Zone OHADA (SYSCOHADA / AUDCIF) ─────────────────────────────────────────
INSERT INTO referentiel_fiscal_pays VALUES
('BJ','Bénin',              'XOF','fr-BJ','SYSCOHADA',18.00,30.00,'TVA','BIC / IS',  0,'MENSUELLE'),
('BF','Burkina Faso',        'XOF','fr-BF','SYSCOHADA',18.00,27.50,'TVA','BIC / IS',  0,'MENSUELLE'),
('CM','Cameroun',            'XAF','fr-CM','SYSCOHADA',19.25,30.00,'TVA','IS',         0,'MENSUELLE'),
('CF','Centrafrique',        'XAF','fr-CF','SYSCOHADA',19.00,30.00,'TVA','IS',         0,'MENSUELLE'),
('KM','Comores',             'KMF','fr-KM','SYSCOHADA',10.00,25.00,'TVA','IS',         0,'MENSUELLE'),
('CG','Congo',               'XAF','fr-CG','SYSCOHADA',18.90,30.00,'TVA','IS',         0,'MENSUELLE'),
('CD','RD Congo',            'CDF','fr-CD','SYSCOHADA',16.00,30.00,'TVA','IS',         0,'MENSUELLE'),
('CI','Côte d''Ivoire',     'XOF','fr-CI','SYSCOHADA',18.00,25.00,'TVA','IS',         0,'MENSUELLE'),
('GA','Gabon',               'XAF','fr-GA','SYSCOHADA',18.00,30.00,'TVA','IS',         0,'MENSUELLE'),
('GN','Guinée',              'GNF','fr-GN','SYSCOHADA',18.00,35.00,'TVA','IS',         0,'MENSUELLE'),
('GW','Guinée-Bissau',       'XOF','pt-GW','SYSCOHADA',15.00,25.00,'TVA','IS',         0,'MENSUELLE'),
('GQ','Guinée Équatoriale',  'XAF','es-GQ','SYSCOHADA',15.00,35.00,'TVA','IS',         0,'MENSUELLE'),
('ML','Mali',                'XOF','fr-ML','SYSCOHADA',18.00,30.00,'TVA','BIC / IS',   0,'MENSUELLE'),
('NE','Niger',               'XOF','fr-NE','SYSCOHADA',19.00,30.00,'TVA','BIC',        0,'MENSUELLE'),
('SN','Sénégal',             'XOF','fr-SN','SYSCOHADA',18.00,30.00,'TVA','IS',         0,'MENSUELLE'),
('TD','Tchad',               'XAF','fr-TD','SYSCOHADA',18.00,35.00,'TVA','IS',         0,'MENSUELLE'),
('TG','Togo',                'XOF','fr-TG','SYSCOHADA',18.00,27.00,'TVA','IS',         0,'MENSUELLE');

-- ─── Afrique anglophone (IFRS) ────────────────────────────────────────────────
INSERT INTO referentiel_fiscal_pays VALUES
('NG','Nigeria',         'NGN','en-NG','IFRS', 7.50,30.00,'VAT','CIT',            0,'MENSUELLE'),
('GH','Ghana',           'GHS','en-GH','IFRS',12.50,25.00,'VAT','CIT',            0,'TRIMESTRIELLE'),
('KE','Kenya',           'KES','en-KE','IFRS',16.00,30.00,'VAT','CIT',            0,'MENSUELLE'),
('TZ','Tanzanie',        'TZS','sw-TZ','IFRS',18.00,30.00,'VAT','CIT',            0,'MENSUELLE'),
('UG','Ouganda',         'UGX','en-UG','IFRS',18.00,30.00,'VAT','CIT',            0,'MENSUELLE'),
('RW','Rwanda',          'RWF','rw-RW','IFRS',18.00,30.00,'VAT','CIT',            0,'MENSUELLE'),
('ET','Éthiopie',        'ETB','am-ET','IFRS',15.00,30.00,'VAT','CIT',            0,'MENSUELLE'),
('ZA','Afrique du Sud',  'ZAR','en-ZA','IFRS',15.00,28.00,'VAT','CIT',            0,'BIMESTRIELLE'),
('BW','Botswana',        'BWP','en-BW','IFRS',14.00,22.00,'VAT','CIT',            0,'BIMESTRIELLE'),
('NA','Namibie',         'NAD','en-NA','IFRS',15.00,32.00,'VAT','CIT',            0,'BIMESTRIELLE'),
('MU','Maurice',         'MUR','en-MU','IFRS',15.00,15.00,'VAT','CIT',            0,'MENSUELLE'),
('ZM','Zambie',          'ZMW','en-ZM','IFRS',16.00,30.00,'VAT','CIT',            0,'MENSUELLE'),
('ZW','Zimbabwe',        'ZWL','en-ZW','IFRS',15.00,25.00,'VAT','CIT',            0,'MENSUELLE'),
('MW','Malawi',          'MWK','en-MW','IFRS',16.50,30.00,'VAT','CIT',            0,'MENSUELLE'),
('MZ','Mozambique',      'MZN','pt-MZ','IFRS',17.00,32.00,'IVA','IRPC',          0,'MENSUELLE'),
('AO','Angola',          'AOA','pt-AO','IFRS',14.00,25.00,'IVA','IS',             0,'MENSUELLE'),
('LS','Lesotho',         'LSL','st-LS','IFRS',15.00,25.00,'VAT','CIT',            0,'BIMESTRIELLE'),
('SZ','Eswatini',        'SZL','en-SZ','IFRS',15.00,27.50,'VAT','CIT',            0,'BIMESTRIELLE');

-- ─── Maghreb & Afrique du Nord ────────────────────────────────────────────────
INSERT INTO referentiel_fiscal_pays VALUES
('MA','Maroc',     'MAD','ar-MA','CGNC', 20.00,31.00,'TVA','IS',  0,'MENSUELLE'),
('TN','Tunisie',   'TND','ar-TN','NCT',  19.00,25.00,'TVA','IS',  0,'MENSUELLE'),
('DZ','Algérie',   'DZD','ar-DZ','PCN',  19.00,26.00,'TVA','IBS', 0,'MENSUELLE'),
('EG','Égypte',    'EGP','ar-EG','EAS',  14.00,22.50,'VAT','CIT', 0,'MENSUELLE'),
('LY','Libye',     'LYD','ar-LY','IFRS',  0.00,20.00,'N/A','CIT', 0,'ANNUELLE'),
('SD','Soudan',    'SDG','ar-SD','IFRS',  17.00,35.00,'VAT','CIT', 0,'MENSUELLE'),
('DJ','Djibouti',  'DJF','fr-DJ','PCF',  10.00,25.00,'TVA','IS',  0,'MENSUELLE');

-- ─── Autres pays africains ────────────────────────────────────────────────────
INSERT INTO referentiel_fiscal_pays VALUES
('MG','Madagascar','MGA','fr-MG','PCG2005',20.00,20.00,'TVA','IS', 0,'MENSUELLE'),
('ER','Érythrée',  'ERN','ti-ER','IFRS',   5.00,30.00,'VAT','CIT', 0,'ANNUELLE'),
('SO','Somalie',   'SOS','so-SO','IFRS',   0.00,30.00,'N/A','CIT', 0,'ANNUELLE'),
('SS','Soudan du Sud','SSP','en-SS','IFRS',0.00,30.00,'N/A','CIT', 0,'ANNUELLE');

-- ─── Europe ──────────────────────────────────────────────────────────────────
INSERT INTO referentiel_fiscal_pays VALUES
('FR','France',          'EUR','fr-FR','PCG',       20.00,25.00,'TVA','IS',          0,'MENSUELLE'),
('BE','Belgique',        'EUR','fr-BE','IFRS',       21.00,25.00,'TVA','ISOC',        0,'MENSUELLE'),
('CH','Suisse',          'CHF','fr-CH','SWISS-GAAP',  7.70,14.93,'TVA','IS cantonal',0,'TRIMESTRIELLE'),
('GB','Royaume-Uni',     'GBP','en-GB','IFRS',       20.00,25.00,'VAT','CIT',         0,'TRIMESTRIELLE'),
('DE','Allemagne',       'EUR','de-DE','HGB',        19.00,29.83,'MwSt','KSt',        0,'MENSUELLE'),
('ES','Espagne',         'EUR','es-ES','IFRS',       21.00,25.00,'IVA','IS',          0,'TRIMESTRIELLE'),
('PT','Portugal',        'EUR','pt-PT','SNC',        23.00,21.00,'IVA','IRC',         0,'MENSUELLE'),
('IT','Italie',          'EUR','it-IT','IFRS',       22.00,24.00,'IVA','IRES',        0,'TRIMESTRIELLE'),
('LU','Luxembourg',      'EUR','fr-LU','IFRS',       17.00,17.00,'TVA','IS',          0,'TRIMESTRIELLE');

-- ─── Amériques ───────────────────────────────────────────────────────────────
INSERT INTO referentiel_fiscal_pays VALUES
('US','États-Unis',  'USD','en-US','US-GAAP', 0.00,21.00,'N/A','Federal CIT',0,'TRIMESTRIELLE'),
('CA','Canada',      'CAD','fr-CA','IFRS',    5.00,26.50,'GST/HST','CIT',    0,'MENSUELLE'),
('BR','Brésil',      'BRL','pt-BR','IFRS',   18.00,25.00,'ICMS','IRPJ',      0,'MENSUELLE'),
('MX','Mexique',     'MXN','es-MX','IFRS',   16.00,30.00,'IVA','ISR',        0,'MENSUELLE'),
('AR','Argentine',   'ARS','es-AR','IFRS',   21.00,35.00,'IVA','IG',         0,'MENSUELLE'),
('CO','Colombie',    'COP','es-CO','IFRS',   19.00,35.00,'IVA','IR',         0,'BIMESTRIELLE'),
('CL','Chili',       'CLP','es-CL','IFRS',   19.00,27.00,'IVA','IA',         0,'MENSUELLE');

-- ─── Asie & Océanie ──────────────────────────────────────────────────────────
INSERT INTO referentiel_fiscal_pays VALUES
('CN','Chine',         'CNY','zh-CN','CAS',   13.00,25.00,'增值税','企业所得税',0,'MENSUELLE'),
('IN','Inde',          'INR','hi-IN','Ind-AS',18.00,30.00,'GST','CIT',         0,'MENSUELLE'),
('JP','Japon',         'JPY','ja-JP','J-GAAP',10.00,23.20,'消費税','法人税',   0,'MENSUELLE'),
('SG','Singapour',     'SGD','en-SG','SFRS',   9.00,17.00,'GST','CIT',         0,'TRIMESTRIELLE'),
('AU','Australie',     'AUD','en-AU','AASB',  10.00,30.00,'GST','CIT',         0,'TRIMESTRIELLE'),
('AE','Émirats Arabes','AED','ar-AE','IFRS',   5.00, 9.00,'VAT','CIT',         0,'TRIMESTRIELLE');

CREATE INDEX idx_ref_fiscal_pays_code ON referentiel_fiscal_pays(code);
