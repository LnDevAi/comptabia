-- =====================================================
-- BASE DE DONNÉES RÉFÉRENTIEL COMPTABLE MONDIAL
-- Structure complète avec plans comptables par pays
-- =====================================================

-- Création de la base de données
CREATE DATABASE IF NOT EXISTS referentiel_comptable_mondial;
USE referentiel_comptable_mondial;

-- =====================================================
-- CRÉATION DE LA TABLE PRINCIPALE
-- =====================================================
CREATE TABLE referentiel_comptable_mondial (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pays VARCHAR(100) NOT NULL,
    langue_officielle VARCHAR(100),
    devise VARCHAR(50),
    systeme_comptable VARCHAR(100),
    plan_comptable_complet TEXT,
    particularites_notes TEXT,
    modeles_etats_financiers_pdf VARCHAR(500),
    tableau_correspondance_balance_etats TEXT,
    sources TEXT,
    date_maj TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- INSERTION DES DONNÉES PAR PAYS
-- =====================================================

-- FRANCE
INSERT INTO referentiel_comptable_mondial (
    pays, langue_officielle, devise, systeme_comptable, plan_comptable_complet,
    particularites_notes, modeles_etats_financiers_pdf, tableau_correspondance_balance_etats, sources
) VALUES (
    'France', 'Français', 'Euro (EUR)', 'Plan Comptable Général (PCG 2014)',
    'CLASSE 1 - COMPTES DE CAPITAUX
    10 - Capital et réserves
        101 - Capital
        104 - Primes liées au capital social
        106 - Réserves
        108 - Compte de l''exploitant
    12 - Résultats
        120 - Résultat de l''exercice
        121 - Résultat net de l''exercice
    13 - Subventions d''investissement
    14 - Provisions réglementées
    15 - Provisions pour risques et charges
    16 - Emprunts et dettes assimilées
        164 - Emprunts auprès des établissements de crédit
        168 - Autres emprunts et dettes assimilées
    17 - Dettes rattachées à des participations
    18 - Comptes de liaison des établissements

CLASSE 2 - COMPTES D''IMMOBILISATIONS
    20 - Immobilisations incorporelles
        201 - Frais d''établissement
        205 - Concessions et droits similaires
        206 - Droit au bail
        207 - Fonds commercial
        208 - Autres immobilisations incorporelles
    21 - Immobilisations corporelles
        211 - Terrains
        213 - Constructions
        215 - Installations techniques
        218 - Autres immobilisations corporelles
    23 - Immobilisations en cours
    26 - Participations et créances rattachées
    27 - Autres immobilisations financières
    28 - Amortissements des immobilisations
    29 - Dépréciations des immobilisations

CLASSE 3 - COMPTES DE STOCKS ET EN-COURS
    31 - Matières premières
    32 - Autres approvisionnements
    33 - En-cours de production de biens
    34 - En-cours de production de services
    35 - Stocks de produits
    37 - Stocks de marchandises
    39 - Dépréciations des stocks

CLASSE 4 - COMPTES DE TIERS
    40 - Fournisseurs et comptes rattachés
        401 - Fournisseurs
        403 - Fournisseurs - Effets à payer
        408 - Fournisseurs - Factures non parvenues
        409 - Fournisseurs débiteurs
    41 - Clients et comptes rattachés
        411 - Clients
        413 - Clients - Effets à recevoir
        416 - Clients douteux
        418 - Clients - Produits non encore facturés
        419 - Clients créditeurs
    42 - Personnel et comptes rattachés
    43 - Sécurité sociale et autres organismes sociaux
    44 - État et collectivités publiques
        445 - État - Taxes sur le chiffre d''affaires
        447 - Autres impôts, taxes et versements assimilés
    45 - Groupe et associés
    46 - Débiteurs divers et créditeurs divers
    47 - Comptes transitoires ou d''attente
    48 - Comptes de régularisation
    49 - Dépréciations des comptes de tiers

CLASSE 5 - COMPTES FINANCIERS
    50 - Valeurs mobilières de placement
    51 - Banques, établissements financiers
    53 - Caisse
    54 - Régies d''avances et accréditifs
    58 - Virements internes
    59 - Dépréciations des comptes financiers

CLASSE 6 - COMPTES DE CHARGES
    60 - Achats
        601 - Achats de matières premières
        602 - Achats d''autres approvisionnements
        607 - Achats de marchandises
    61 - Services extérieurs
        611 - Sous-traitance générale
        613 - Locations
        616 - Primes d''assurances
        618 - Divers
    62 - Autres services extérieurs
        621 - Personnel extérieur
        622 - Rémunérations d''intermédiaires
        623 - Publicité, publications
        624 - Transports de biens
        625 - Déplacements, missions
        626 - Frais postaux
        627 - Services bancaires
        628 - Divers
    63 - Impôts, taxes et versements assimilés
    64 - Charges de personnel
        641 - Rémunérations du personnel
        645 - Charges de sécurité sociale
        647 - Autres charges sociales
    65 - Autres charges de gestion courante
    66 - Charges financières
    67 - Charges exceptionnelles
    68 - Dotations aux amortissements
    69 - Participation des salariés - Impôts sur les bénéfices

CLASSE 7 - COMPTES DE PRODUITS
    70 - Ventes de produits fabriqués
    701 - Ventes de produits finis
    702 - Ventes de produits intermédiaires
    703 - Ventes de produits résiduels
    707 - Ventes de marchandises
    708 - Produits des activités annexes
    71 - Production stockée
    72 - Production immobilisée
    74 - Subventions d''exploitation
    75 - Autres produits de gestion courante
    76 - Produits financiers
    77 - Produits exceptionnels
    78 - Reprises sur amortissements
    79 - Transferts de charges',

    'Application du règlement CRC 99-03. Obligation pour certaines entreprises d''appliquer les normes IFRS pour les comptes consolidés. Particularités : traitement des immobilisations, provisions réglementées.',

    '/modeles/france_pcg_etats_financiers.pdf - Bilan actif/passif, Compte de résultat par nature, Annexe comptable selon modèle ANC',

    'CORRESPONDANCE BALANCE → ÉTATS FINANCIERS :
    BILAN ACTIF :
    - Immobilisations incorporelles : 20x (net des amortissements 28x)
    - Immobilisations corporelles : 21x (net des amortissements 28x)
    - Immobilisations financières : 26x + 27x
    - Stocks : 31x + 32x + 35x + 37x (net des dépréciations 39x)
    - Créances clients : 41x (net des dépréciations 49x)
    - Autres créances : 42x + 43x + 44x + 46x
    - Disponibilités : 51x + 53x + 54x
    
    BILAN PASSIF :
    - Capital social : 101
    - Réserves : 106x
    - Résultat : 12x
    - Subventions : 13x
    - Provisions : 15x
    - Emprunts : 16x
    - Dettes fournisseurs : 40x
    - Dettes sociales : 42x + 43x
    - Dettes fiscales : 44x
    
    COMPTE DE RÉSULTAT :
    - Chiffre d''affaires : 70x
    - Production : 71x + 72x
    - Charges d''exploitation : 60x + 61x + 62x + 63x + 64x
    - Résultat financier : 76x - 66x
    - Résultat exceptionnel : 77x - 67x',

    'Autorité des Normes Comptables (ANC), Code de commerce, Règlement CRC 99-03, Plan Comptable Général 2014'
);

-- ALLEMAGNE
INSERT INTO referentiel_comptable_mondial (
    pays, langue_officielle, devise, systeme_comptable, plan_comptable_complet,
    particularites_notes, modeles_etats_financiers_pdf, tableau_correspondance_balance_etats, sources
) VALUES (
    'Allemagne', 'Allemand', 'Euro (EUR)', 'Handelsgesetzbuch (HGB) + IFRS',
    'KLASSE 0 - ANLAGEN UND LANGFRISTIGE FORDERUNGEN
    00-02 - Immaterielle Vermögensgegenstände
    03-04 - Sachanlagen
    05-06 - Finanzanlagen
    07-08 - Sonstige Anlagen
    09 - Noch nicht zugeordnete Anlagen

KLASSE 1 - VORRÄTE UND KURZFRISTIGE FORDERUNGEN
    10-16 - Vorräte
    17 - Erhaltene Anzahlungen
    18 - Sonstige kurzfristige Aktiva
    19 - Aktive Rechnungsabgrenzungsposten

KLASSE 2 - KASSEN, BANK, WECHSEL
    20-26 - Flüssige Mittel
    27-28 - Kurzfristige Wertpapiere
    29 - Kreditoren

KLASSE 3 - KAPITAL UND RÜCKLAGEN
    30 - Eigenkapital
    31 - Kapitalrücklagen
    32-33 - Gewinnrücklagen
    34-36 - Bewertungsreserven
    37-38 - Verbindlichkeiten
    39 - Passive Rechnungsabgrenzung

KLASSE 4 - BETRIEBLICHE ERTRÄGE
    40-43 - Umsatzerlöse
    44-45 - Erhöhung/Verminderung Bestände
    46-47 - Andere aktivierte Eigenleistungen
    48 - Sonstige betriebliche Erträge
    49 - Erträge aus Verlustübernahme

KLASSE 5 - MATERIALAUFWAND
    50-52 - Aufwendungen für Roh-, Hilfs-, Betriebsstoffe
    53-55 - Aufwendungen für bezogene Waren
    56-58 - Aufwendungen für bezogene Leistungen
    59 - Sonstige Materialaufwendungen

KLASSE 6 - PERSONALAUFWAND
    60-62 - Löhne und Gehälter
    63-65 - Soziale Abgaben
    66-68 - Aufwendungen für Altersversorgung
    69 - Sonstige Personalaufwendungen

KLASSE 7 - ABSCHREIBUNGEN UND SONSTIGE AUFWENDUNGEN
    70-72 - Abschreibungen auf Anlagevermögen
    73-75 - Abschreibungen auf Umlaufvermögen
    76-78 - Sonstige betriebliche Aufwendungen
    79 - Aufwendungen aus Verlustübernahme

KLASSE 8 - FINANZERGEBNIS
    80-82 - Erträge aus Beteiligungen
    83-85 - Erträge aus anderen Wertpapieren
    86-87 - Sonstige Zinsen und ähnliche Erträge
    88-89 - Zinsen und ähnliche Aufwendungen

KLASSE 9 - STEUERN UND JAHRESABSCHLUSS
    90-92 - Steuern vom Einkommen und Ertrag
    93-95 - Sonstige Steuern
    96-97 - Jahresüberschuss/Jahresfehlbetrag
    98-99 - Bilanzgewinn/Bilanzverlust',

    'Dualité entre normes allemandes HGB et normes IFRS pour groupes cotés. Principe de prudence prévalent. Réserves légales obligatoires.',

    '/modeles/allemagne_hgb_jahresabschluss.pdf - Bilanz, Gewinn-und-Verlust-Rechnung, Anhang selon HGB §266-275',

    'KORRESPONDENZ BILANZ → JAHRESABSCHLUSS :
    AKTIVA :
    - Immaterielle Vermögensgegenstände : 00-02
    - Sachanlagen : 03-04 (abzüglich Abschreibungen 70-72)
    - Finanzanlagen : 05-06
    - Vorräte : 10-16
    - Forderungen : 17-19
    - Flüssige Mittel : 20-28
    
    PASSIVA :
    - Eigenkapital : 30-36
    - Rückstellungen : Klasse 3 (teilweise)
    - Verbindlichkeiten : 37-38
    
    GEWINN-UND-VERLUST-RECHNUNG :
    - Umsatzerlöse : 40-43
    - Materialaufwand : 50-59
    - Personalaufwand : 60-69
    - Abschreibungen : 70-79
    - Finanzergebnis : 80-89
    - Steuern : 90-95',

    'Bundesministerium der Justiz, HGB §238-339, Deutsches Rechnungslegungs Standards Committee (DRSC)'
);

-- ÉTATS-UNIS
INSERT INTO referentiel_comptable_mondial (
    pays, langue_officielle, devise, systeme_comptable, plan_comptable_complet,
    particularites_notes, modeles_etats_financiers_pdf, tableau_correspondance_balance_etats, sources
) VALUES (
    'États-Unis', 'Anglais', 'Dollar américain (USD)', 'US GAAP (Generally Accepted Accounting Principles)',
    'ASSETS (1000-1999)
    Current Assets (1000-1199)
        1010 - Cash and Cash Equivalents
        1020 - Short-term Investments
        1030 - Accounts Receivable
        1040 - Inventory
        1050 - Prepaid Expenses
        1090 - Other Current Assets
    
    Non-Current Assets (1200-1999)
        1200 - Property, Plant & Equipment
        1210 - Land
        1220 - Buildings
        1230 - Equipment
        1240 - Accumulated Depreciation
        1300 - Intangible Assets
        1310 - Goodwill
        1320 - Patents
        1330 - Trademarks
        1400 - Long-term Investments
        1500 - Deferred Tax Assets

LIABILITIES (2000-2999)
    Current Liabilities (2000-2199)
        2010 - Accounts Payable
        2020 - Short-term Debt
        2030 - Accrued Expenses
        2040 - Current Portion of Long-term Debt
        2050 - Income Tax Payable
        2090 - Other Current Liabilities
    
    Non-Current Liabilities (2200-2999)
        2200 - Long-term Debt
        2300 - Deferred Tax Liabilities
        2400 - Pension Obligations
        2500 - Other Long-term Liabilities

EQUITY (3000-3999)
        3010 - Common Stock
        3020 - Preferred Stock
        3030 - Additional Paid-in Capital
        3040 - Retained Earnings
        3050 - Accumulated Other Comprehensive Income
        3060 - Treasury Stock

REVENUES (4000-4999)
        4010 - Sales Revenue
        4020 - Service Revenue
        4030 - Interest Revenue
        4040 - Dividend Revenue
        4090 - Other Revenues

COST OF GOODS SOLD (5000-5999)
        5010 - Materials
        5020 - Labor
        5030 - Manufacturing Overhead
        5040 - Freight-in
        5090 - Other COGS

OPERATING EXPENSES (6000-7999)
    Selling Expenses (6000-6999)
        6010 - Sales Salaries
        6020 - Advertising
        6030 - Sales Commissions
        6040 - Delivery Expenses
        
    Administrative Expenses (7000-7999)
        7010 - Officer Salaries
        7020 - Office Salaries
        7030 - Professional Fees
        7040 - Office Supplies
        7050 - Utilities
        7060 - Insurance
        7070 - Depreciation Expense
        7080 - Bad Debt Expense

OTHER INCOME/EXPENSES (8000-8999)
        8010 - Interest Expense
        8020 - Gain/Loss on Sale of Assets
        8030 - Foreign Exchange Gain/Loss
        8090 - Other Non-operating Items

INCOME TAXES (9000-9999)
        9010 - Current Tax Expense
        9020 - Deferred Tax Expense',

    'Normes émises par FASB. Principe de fair value. Importance des notes aux états financiers. Séparation stricte entre GAAP et tax accounting.',

    '/modeles/usa_gaap_financial_statements.pdf - Balance Sheet, Income Statement, Statement of Cash Flows, Statement of Stockholders\' Equity selon FASB Codification',

    'TRIAL BALANCE → FINANCIAL STATEMENTS MAPPING :
    BALANCE SHEET ASSETS :
    - Current Assets : 1000-1199
    - Property, Plant & Equipment : 1200-1299 (net of 1240)
    - Intangible Assets : 1300-1399
    - Long-term Investments : 1400-1499
    
    BALANCE SHEET LIABILITIES :
    - Current Liabilities : 2000-2199
    - Long-term Liabilities : 2200-2999
    
    BALANCE SHEET EQUITY :
    - Stockholders\' Equity : 3000-3999
    
    INCOME STATEMENT :
    - Net Sales : 4000-4999
    - Cost of Goods Sold : 5000-5999
    - Gross Profit : Net Sales - COGS
    - Operating Expenses : 6000-7999
    - Operating Income : Gross Profit - Operating Expenses
    - Other Income/Expenses : 8000-8999
    - Income Before Taxes : Operating Income +/- Other Items
    - Income Tax Expense : 9000-9999
    - Net Income : Income Before Taxes - Tax Expense',

    'Financial Accounting Standards Board (FASB), FASB Accounting Standards Codification, Securities and Exchange Commission (SEC)'
);

-- ROYAUME-UNI
INSERT INTO referentiel_comptable_mondial (
    pays, langue_officielle, devise, systeme_comptable, plan_comptable_complet,
    particularites_notes, modeles_etats_financiers_pdf, tableau_correspondance_balance_etats, sources
) VALUES (
    'Royaume-Uni', 'Anglais', 'Livre sterling (GBP)', 'UK GAAP (FRS 102) + IFRS',
    'FIXED ASSETS (0000-1999)
    Intangible Assets (0000-0999)
        0100 - Goodwill
        0200 - Development Costs
        0300 - Patents and Licences
        0400 - Trademarks
        0500 - Other Intangible Assets
        0900 - Accumulated Amortisation
    
    Tangible Assets (1000-1999)
        1000 - Land and Buildings
        1100 - Plant and Machinery
        1200 - Fixtures and Fittings
        1300 - Motor Vehicles
        1400 - Computer Equipment
        1900 - Accumulated Depreciation

CURRENT ASSETS (2000-2999)
        2000 - Stock (Inventory)
        2100 - Trade Debtors
        2200 - Other Debtors
        2300 - Prepayments
        2400 - Cash at Bank
        2500 - Cash in Hand
        2600 - Short-term Investments

CURRENT LIABILITIES (3000-3999)
        3000 - Trade Creditors
        3100 - Other Creditors
        3200 - Accruals
        3300 - VAT Liability
        3400 - PAYE/NIC Liability
        3500 - Corporation Tax
        3600 - Bank Overdraft
        3700 - Short-term Loans

LONG-TERM LIABILITIES (4000-4999)
        4000 - Long-term Loans
        4100 - Debentures
        4200 - Provisions for Liabilities
        4300 - Deferred Tax

CAPITAL AND RESERVES (5000-5999)
        5000 - Share Capital
        5100 - Share Premium
        5200 - Revaluation Reserve
        5300 - Other Reserves
        5400 - Profit and Loss Account

TURNOVER (6000-6999)
        6000 - Sales - UK
        6100 - Sales - Export
        6200 - Sales - EU
        6800 - Sales Returns
        6900 - Sales Discounts

COST OF SALES (7000-7999)
        7000 - Purchases
        7100 - Direct Labour
        7200 - Production Overheads
        7800 - Purchase Returns
        7900 - Purchase Discounts

OVERHEADS (8000-8999)
    Administrative Expenses (8000-8199)
        8000 - Wages and Salaries
        8010 - National Insurance
        8020 - Pension Costs
        8030 - Staff Training
        8040 - Staff Welfare
        8050 - Directors\' Remuneration
        8060 - Rent and Rates
        8070 - Light and Heat
        8080 - Insurance
        8090 - Motor Expenses
        8100 - Travelling and Subsistence
        8110 - Telephone
        8120 - Postage and Stationery
        8130 - Professional Fees
        8140 - Audit Fee
        8150 - Bank Charges
        8160 - Depreciation
        8170 - Bad Debts
        8180 - Sundry Expenses
    
    Selling and Distribution (8200-8299)
        8200 - Sales Staff Salaries
        8210 - Advertising
        8220 - Marketing
        8230 - Sales Commission
        8240 - Delivery Costs

OTHER INCOME (9000-9499)
        9000 - Investment Income
        9100 - Rental Income
        9200 - Profit on Sale of Assets
        9300 - Sundry Income

FINANCE COSTS (9500-9999)
        9500 - Bank Interest
        9600 - Loan Interest
        9700 - Hire Purchase Interest
        9800 - Finance Charges
        9900 - Loss on Sale of Assets',

    'Coexistence FRS 102 (PME) et IFRS (groupes cotés). Companies Act 2006. Particularités : true and fair view, substance over form.',

    '/modeles/uk_gaap_accounts.pdf - Balance Sheet, Profit and Loss Account, Notes selon Companies Act 2006 et FRS 102',

    'TRIAL BALANCE → STATUTORY ACCOUNTS MAPPING :
    BALANCE SHEET :
    Fixed Assets :
    - Intangible Assets : 0000-0999 (net of 0900)
    - Tangible Assets : 1000-1999 (net of 1900)
    
    Current Assets :
    - Stock : 2000
    - Debtors : 2100-2300
    - Cash : 2400-2500
    - Investments : 2600
    
    Creditors (amounts falling due within one year) :
    - 3000-3700
    
    Creditors (amounts falling due after more than one year) :
    - 4000-4999
    
    Capital and Reserves :
    - 5000-5999
    
    PROFIT AND LOSS ACCOUNT :
    - Turnover : 6000-6999
    - Cost of Sales : 7000-7999
    - Gross Profit : Turnover - Cost of Sales
    - Administrative Expenses : 8000-8199
    - Distribution Costs : 8200-8299
    - Operating Profit : Gross Profit - Expenses
    - Other Income : 9000-9499
    - Interest Payable : 9500-9999
    - Profit Before Tax : Operating Profit + Other Income - Interest
    - Tax : Corporation Tax provision
    - Profit After Tax : Profit Before Tax - Tax',

    'Financial Reporting Council (FRC), Companies House, FRS 102, Companies Act 2006'
);

-- JAPON
INSERT INTO referentiel_comptable_mondial (
    pays, langue_officielle, devise, systeme_comptable, plan_comptable_complet,
    particularites_notes, modeles_etats_financiers_pdf, tableau_correspondance_balance_etats, sources
) VALUES (
    'Japon', 'Japonais', 'Yen japonais (JPY)', 'J-GAAP (Japanese GAAP) + IFRS',
    '資産の部 (ASSETS) - 1000-1999
流動資産 (Current Assets) - 1000-1199
    1001 - 現金及び預金 (Cash and Deposits)
    1002 - 受取手形 (Notes Receivable)
    1003 - 売掛金 (Accounts Receivable)
    1004 - 商品 (Merchandise)
    1005 - 製品 (Finished Products)
    1006 - 原材料 (Raw Materials)
    1007 - 仕掛品 (Work in Process)
    1008 - 前払費用 (Prepaid Expenses)
    1009 - 短期貸付金 (Short-term Loans)
    1010 - その他流動資産 (Other Current Assets)

固定資産 (Non-current Assets) - 1200-1999
有形固定資産 (Tangible Fixed Assets) - 1200-1399
    1201 - 建物 (Buildings)
    1202 - 構築物 (Structures)
    1203 - 機械装置 (Machinery and Equipment)
    1204 - 車両運搬具 (Vehicles)
    1205 - 工具器具備品 (Tools and Equipment)
    1206 - 土地 (Land)
    1207 - 建設仮勘定 (Construction in Progress)
    1280 - 減価償却累計額 (Accumulated Depreciation)

無形固定資産 (Intangible Fixed Assets) - 1400-1499
    1401 - のれん (Goodwill)
    1402 - 特許権 (Patent Rights)
    1403 - 商標権 (Trademark Rights)
    1404 - ソフトウェア (Software)

投資その他の資産 (Investments and Other Assets) - 1500-1999
    1501 - 投資有価証券 (Investment Securities)
    1502 - 関係会社株式 (Subsidiary Stocks)
    1503 - 長期貸付金 (Long-term Loans)
    1504 - 繰延税金資産 (Deferred Tax Assets)

負債の部 (LIABILITIES) - 2000-2999
流動負債 (Current Liabilities) - 2000-2199
    2001 - 支払手形 (Notes Payable)
    2002 - 買掛金 (Accounts Payable)
    2003 - 短期借入金 (Short-term Debt)
    2004 - 未払金 (Accounts Payable - Other)
    2005 - 未払費用 (Accrued Expenses)
    2006 - 未払法人税等 (Income Tax Payable)
    2007 - 前受金 (Advance Received)
    2008 - 預り金 (Deposits Received)

固定負債 (Non-current Liabilities) - 2200-2999
    2201 - 社債 (Bonds)
    2202 - 長期借入金 (Long-term Debt)
    2203 - 退職給付引当金 (Provision for Retirement Benefits)
    2204 - 繰延税金負債 (Deferred Tax Liabilities)

純資産の部 (NET ASSETS) - 3000-3999
株主資本 (Shareholders\' Equity) - 3000-3199
    3001 - 資本金 (Capital Stock)
    3002 - 資本剰余金 (Capital Surplus)
    3003 - 利益剰余金 (Retained Earnings)
    3004 - 自己株式 (Treasury Stock)

その他の包括利益累計額 (Accumulated Other Comprehensive Income) - 3200-3299
    3201 - その他有価証券評価差額金 (Unrealized Gains on Securities)
    3202 - 繰延ヘッジ損益 (Deferred Gains/Losses on Hedges)

収益 (REVENUE) - 4000-4999
    4001 - 売上高 (Net Sales)
    4002 - 受取利息 (Interest Income)
    4003 - 受取配当金 (Dividend Income)
    4004 - その他営業外収益 (Other Non-operating Income)

費用 (EXPENSES) - 5000-5999
売上原価 (Cost of Sales) - 5000-5199
    5001 - 期首商品棚卸高 (Beginning Inventory)
    5002 - 当期商品仕入高 (Purchases)
    5003 - 期末商品棚卸高 (Ending Inventory)

販売費及び一般管理費 (SG&A Expenses) - 5200-5399
    5201 - 役員報酬 (Directors\' Compensation)
    5202 - 給料手当 (Salaries and Wages)
    5203 - 退職給付費用 (Retirement Benefit Expenses)
    5204 - 法定福利費 (Legal Welfare Expenses)
    5205 - 福利厚生費 (Welfare Expenses)
    5206 - 旅費交通費 (Travel Expenses)
    5207 - 通信費 (Communication Expenses)
    5208 - 減価償却費 (Depreciation Expenses)
    5209 - 地代家賃 (Rent Expenses)
    5210 - 保険料 (Insurance Premiums)
    5211 - 修繕費 (Repair Expenses)
    5212 - 消耗品費 (Supplies Expenses)
    5213 - 租税公課 (Taxes and Public Charges)
    5214 - 支払手数料 (Commission Expenses)
    5215 - 広告宣伝費 (Advertising Expenses)

営業外費用 (Non-operating Expenses) - 5400-5499
    5401 - 支払利息 (Interest Expenses)
    5402 - 為替差損 (Foreign Exchange Loss)
    5403 - その他営業外費用 (Other Non-operating Expenses)

特別損失 (Extraordinary Losses) - 5500-5599
    5501 - 固定資産売却損 (Loss on Sale of Fixed Assets)
    5502 - 固定資産除却損 (Loss on Disposal of Fixed Assets)
    5503 - 減損損失 (Impairment Loss)',

    'Convergence progressive avec IFRS. Principe de prudence traditionnel japonais. Méthode de l''amortissement accéléré autorisée.',

    '/modeles/japon_jgaap_zaimu_shohyo.pdf - 貸借対照表 (Balance Sheet), 損益計算書 (P&L Statement), キャッシュ・フロー計算書 (Cash Flow Statement) selon Companies Act japonais',

    'TRIAL BALANCE → FINANCIAL STATEMENTS MAPPING :
    貸借対照表 (BALANCE SHEET) :
    資産の部 (ASSETS) :
    - 流動資産 : 1000-1199
    - 固定資産 : 1200-1999 (net of accumulated depreciation 1280)
    
    負債の部 (LIABILITIES) :
    - 流動負債 : 2000-2199
    - 固定負債 : 2200-2999
    
    純資産の部 (NET ASSETS) :
    - 株主資本 : 3000-3199
    - その他包括利益累計額 : 3200-3299
    
    損益計算書 (INCOME STATEMENT) :
    - 売上高 : 4001
    - 売上原価 : 5000-5199
    - 売上総利益 : 売上高 - 売上原価
    - 販売費及び一般管理費 : 5200-5399
    - 営業利益 : 売上総利益 - 販管費
    - 営業外収益 : 4002-4004
    - 営業外費用 : 5400-5499
    - 経常利益 : 営業利益 + 営業外収益 - 営業外費用
    - 特別損失 : 5500-5599
    - 税引前当期純利益 : 経常利益 - 特別損失
    - 法人税等 : Tax provision
    - 当期純利益 : 税引前利益 - 法人税等',

    'Accounting Standards Board of Japan (ASBJ), Financial Services Agency (FSA), Companies Act (会社法)'
);

-- CHINE
INSERT INTO referentiel_comptable_mondial (
    pays, langue_officielle, devise, systeme_comptable, plan_comptable_complet,
    particularites_notes, modeles_etats_financiers_pdf, tableau_correspondance_balance_etats, sources
) VALUES (
    'Chine', 'Chinois mandarin', 'Yuan chinois (CNY)', 'Chinese Accounting Standards (CAS)',
    '资产类 (ASSETS) - 1000-1999
流动资产 (Current Assets) - 1000-1199
    1001 - 库存现金 (Cash on Hand)
    1002 - 银行存款 (Bank Deposits)
    1003 - 其他货币资金 (Other Monetary Assets)
    1101 - 短期投资 (Short-term Investments)
    1121 - 应收票据 (Notes Receivable)
    1122 - 应收账款 (Accounts Receivable)
    1123 - 预付账款 (Prepaid Accounts)
    1131 - 应收股利 (Dividends Receivable)
    1132 - 应收利息 (Interest Receivable)
    1221 - 其他应收款 (Other Receivables)
    1401 - 材料采购 (Materials Procurement)
    1402 - 在途物资 (Materials in Transit)
    1403 - 原材料 (Raw Materials)
    1404 - 材料成本差异 (Material Cost Variance)
    1405 - 库存商品 (Finished Goods)
    1407 - 商品进销差价 (Commodity Purchase-Sale Price Difference)
    1408 - 委托加工物资 (Materials for Processing)
    1409 - 委托代销商品 (Consignment Goods)
    1410 - 分期收款发出商品 (Installment Sales Goods)
    1501 - 待摊费用 (Deferred Expenses)

非流动资产 (Non-current Assets) - 1200-1999
    1501 - 长期股权投资 (Long-term Equity Investments)
    1502 - 长期债权投资 (Long-term Debt Investments)
    1601 - 固定资产 (Fixed Assets)
    1602 - 累计折旧 (Accumulated Depreciation)
    1603 - 固定资产减值准备 (Provision for Impairment of Fixed Assets)
    1604 - 在建工程 (Construction in Progress)
    1605 - 工程物资 (Construction Materials)
    1606 - 固定资产清理 (Disposal of Fixed Assets)
    1701 - 无形资产 (Intangible Assets)
    1702 - 累计摊销 (Accumulated Amortization)
    1801 - 长期待摊费用 (Long-term Deferred Expenses)
    1901 - 待处理财产损溢 (Pending Property Gains/Losses)

负债类 (LIABILITIES) - 2000-2999
流动负债 (Current Liabilities) - 2000-2199
    2101 - 短期借款 (Short-term Loans)
    2111 - 应付票据 (Notes Payable)
    2112 - 应付账款 (Accounts Payable)
    2113 - 预收账款 (Advance from Customers)
    2121 - 应付工资 (Wages Payable)
    2122 - 应付福利费 (Welfare Expenses Payable)
    2131 - 应付股利 (Dividends Payable)
    2141 - 应交税金 (Taxes Payable)
    2151 - 其他应付款 (Other Payables)
    2161 - 预提费用 (Accrued Expenses)
    2171 - 一年内到期的长期负债 (Long-term Liabilities Due Within One Year)

非流动负债 (Non-current Liabilities) - 2200-2999
    2201 - 长期借款 (Long-term Loans)
    2202 - 应付债券 (Bonds Payable)
    2211 - 长期应付款 (Long-term Payables)
    2221 - 专项应付款 (Special Payables)
    2231 - 预计负债 (Estimated Liabilities)
    2241 - 递延税款 (Deferred Tax)

所有者权益类 (OWNERS\' EQUITY) - 3000-3999
    3101 - 实收资本 (Paid-in Capital)
    3103 - 已归还投资 (Returned Investment)
    3111 - 资本公积 (Capital Reserve)
    3121 - 盈余公积 (Surplus Reserve)
    3131 - 本年利润 (Current Year Profit)
    3141 - 利润分配 (Profit Distribution)

成本类 (COSTS) - 4000-4999
    4101 - 生产成本 (Production Costs)
    4105 - 制造费用 (Manufacturing Overhead)
    4107 - 劳务成本 (Service Costs)

损益类 (PROFIT & LOSS) - 5000-6999
收入类 (REVENUES) - 5000-5999
    5101 - 主营业务收入 (Main Business Revenue)
    5102 - 其他业务收入 (Other Business Revenue)
    5201 - 投资收益 (Investment Income)
    5203 - 补贴收入 (Subsidy Income)
    5301 - 营业外收入 (Non-operating Income)

费用类 (EXPENSES) - 6000-6999
    6101 - 主营业务成本 (Main Business Costs)
    6102 - 其他业务支出 (Other Business Expenses)
    6201 - 营业费用 (Operating Expenses)
    6202 - 管理费用 (Administrative Expenses)
    6203 - 财务费用 (Financial Expenses)
    6301 - 营业外支出 (Non-operating Expenses)
    6401 - 所得税 (Income Tax)
    6402 - 以前年度损益调整 (Prior Year Adjustments)',

    'Convergence progressive vers IFRS depuis 2007. Système à caractéristiques chinoises. Contrôle gouvernemental fort.',

    '/modeles/chine_cas_accounting_statements.pdf - 资产负债表 (Balance Sheet), 利润表 (Income Statement), 现金流量表 (Cash Flow Statement) selon CAS',

    'TRIAL BALANCE → FINANCIAL STATEMENTS MAPPING :
    资产负债表 (BALANCE SHEET) :
    资产 (ASSETS) :
    - 流动资产 : 1000-1199
    - 非流动资产 : 1200-1999 (net of accumulated depreciation/amortization)
    
    负债 (LIABILITIES) :
    - 流动负债 : 2000-2199
    - 非流动负债 : 2200-2999
    
    所有者权益 (OWNERS\' EQUITY) :
    - 实收资本等 : 3000-3999
    
    利润表 (INCOME STATEMENT) :
    - 营业收入 : 5101-5102
    - 营业成本 : 6101-6102
    - 营业费用 : 6201-6203
    - 营业利润 : 营业收入 - 营业成本 - 营业费用
    - 营业外收支净额 : 5301 - 6301
    - 利润总额 : 营业利润 + 营业外收支净额
    - 所得税费用 : 6401
    - 净利润 : 利润总额 - 所得税费用',

    'Ministry of Finance of China, China Accounting Standards Committee (CASC), Chinese Accounting Standards (CAS)'
);

-- CANADA
INSERT INTO referentiel_comptable_mondial (
    pays, langue_officielle, devise, systeme_comptable, plan_comptable_complet,
    particularites_notes, modeles_etats_financiers_pdf, tableau_correspondance_balance_etats, sources
) VALUES (
    'Canada', 'Anglais et Français', 'Dollar canadien (CAD)', 'IFRS + ASPE (Accounting Standards for Private Enterprises)',
    'ASSETS (1000-1999)
Current Assets (1000-1199)
    1000 - Cash and Cash Equivalents
    1010 - Petty Cash
    1020 - Chequing Account
    1030 - Savings Account
    1100 - Accounts Receivable
    1110 - Allowance for Doubtful Accounts
    1200 - Inventory
    1210 - Raw Materials
    1220 - Work in Process
    1230 - Finished Goods
    1300 - Prepaid Expenses
    1310 - Prepaid Insurance
    1320 - Prepaid Rent
    1400 - Short-term Investments

Property, Plant and Equipment (1500-1799)
    1500 - Land
    1510 - Buildings
    1520 - Accumulated Depreciation - Buildings
    1530 - Equipment
    1540 - Accumulated Depreciation - Equipment
    1550 - Vehicles
    1560 - Accumulated Depreciation - Vehicles
    1570 - Furniture and Fixtures
    1580 - Accumulated Depreciation - Furniture

Intangible Assets (1800-1899)
    1800 - Goodwill
    1810 - Patents
    1820 - Trademarks
    1830 - Software
    1840 - Accumulated Amortization

Other Assets (1900-1999)
    1900 - Long-term Investments
    1910 - Deferred Tax Assets

LIABILITIES (2000-2999)
Current Liabilities (2000-2299)
    2000 - Accounts Payable
    2010 - Accrued Liabilities
    2020 - Wages Payable
    2030 - CPP Payable
    2040 - EI Payable
    2050 - Income Tax Payable
    2060 - PST/GST/HST Payable
    2070 - WCB Payable
    2100 - Short-term Debt
    2110 - Bank Loan
    2120 - Line of Credit
    2200 - Current Portion of Long-term Debt

Long-term Liabilities (2300-2999)
    2300 - Long-term Debt
    2310 - Mortgage Payable
    2320 - Notes Payable
    2400 - Deferred Tax Liabilities
    2500 - Pension Obligations

EQUITY (3000-3999)
    3000 - Share Capital
    3010 - Common Shares
    3020 - Preferred Shares
    3100 - Retained Earnings
    3200 - Accumulated Other Comprehensive Income

REVENUE (4000-4999)
    4000 - Sales Revenue
    4010 - Sales - Domestic
    4020 - Sales - Export
    4100 - Service Revenue
    4200 - Interest Revenue
    4300 - Dividend Revenue
    4400 - Other Revenue

COST OF GOODS SOLD (5000-5999)
    5000 - Beginning Inventory
    5100 - Purchases
    5110 - Purchase Returns and Allowances
    5120 - Purchase Discounts
    5200 - Direct Labour
    5300 - Manufacturing Overhead
    5900 - Ending Inventory

OPERATING EXPENSES (6000-7999)
Selling Expenses (6000-6999)
    6000 - Sales Salaries
    6010 - Sales Commissions
    6020 - Advertising
    6030 - Marketing
    6040 - Travel and Entertainment
    6050 - Delivery Expense

Administrative Expenses (7000-7999)
    7000 - Office Salaries
    7010 - Executive Salaries
    7020 - Employee Benefits
    7030 - CPP Expense
    7040 - EI Expense
    7050 - WCB Expense
    7100 - Office Rent
    7110 - Utilities
    7120 - Telephone
    7130 - Office Supplies
    7140 - Insurance
    7150 - Professional Fees
    7160 - Audit Fees
    7170 - Legal Fees
    7200 - Depreciation Expense
    7210 - Amortization Expense
    7220 - Bad Debt Expense

OTHER INCOME/EXPENSES (8000-8999)
    8000 - Interest Expense
    8100 - Gain/Loss on Sale of Assets
    8200 - Foreign Exchange Gain/Loss

INCOME TAXES (9000-9999)
    9000 - Current Income Tax Expense
    9100 - Deferred Income Tax Expense',

    'Dualité IFRS (sociétés cotées) et ASPE (PME). Particularités canadiennes : comptes de taxes provinciales (PST), cotisations sociales (CPP, EI, WCB).',

    '/modeles/canada_ifrs_aspe_financial_statements.pdf - Statement of Financial Position, Statement of Comprehensive Income selon IFRS et ASPE',

    'TRIAL BALANCE → FINANCIAL STATEMENTS MAPPING :
    STATEMENT OF FINANCIAL POSITION :
    ASSETS :
    - Current Assets : 1000-1199
    - Property, Plant & Equipment : 1500-1799 (net of accumulated depreciation)
    - Intangible Assets : 1800-1899 (net of accumulated amortization)
    - Other Assets : 1900-1999
    
    LIABILITIES :
    - Current Liabilities : 2000-2299
    - Long-term Liabilities : 2300-2999
    
    EQUITY :
    - Share Capital : 3000-3099
    - Retained Earnings : 3100
    - AOCI : 3200
    
    STATEMENT OF COMPREHENSIVE INCOME :
    - Revenue : 4000-4999
    - Cost of Goods Sold : 5000-5999
    - Gross Profit : Revenue - COGS
    - Operating Expenses : 6000-7999
    - Operating Income : Gross Profit - Operating Expenses
    - Other Income/Expenses : 8000-8999
    - Income Before Tax : Operating Income +/- Other Items
    - Income Tax Expense : 9000-9999
    - Net Income : Income Before Tax - Tax Expense',

    'Accounting Standards Board (AcSB), CPA Canada, IFRS as adopted in Canada, ASPE Handbook'
);

-- BRÉSIL
INSERT INTO referentiel_comptable_mondial (
    pays, langue_officielle, devise, systeme_comptable, plan_comptable_complet,
    particularites_notes, modeles_etats_financiers_pdf, tableau_correspondance_balance_etats, sources
) VALUES (
    'Brésil', 'Portugais', 'Real brésilien (BRL)', 'Brazilian GAAP (BR GAAP) + IFRS',
    'ATIVO (ASSETS) - 1.0.00.00
ATIVO CIRCULANTE (Current Assets) - 1.1.00.00
Disponibilidades (Cash and Cash Equivalents) - 1.1.01.00
    1.1.01.01 - Caixa
    1.1.01.02 - Bancos Conta Movimento
    1.1.01.03 - Aplicações Financeiras de Liquidez Imediata

Clientes (Accounts Receivable) - 1.1.02.00
    1.1.02.01 - Duplicatas a Receber
    1.1.02.02 - (-) Provisão para Devedores Duvidosos
    1.1.02.03 - Adiantamentos a Clientes

Estoques (Inventory) - 1.1.03.00
    1.1.03.01 - Matérias-Primas
    1.1.03.02 - Produtos em Elaboração
    1.1.03.03 - Produtos Acabados
    1.1.03.04 - Mercadorias para Revenda

Tributos a Recuperar (Taxes Recoverable) - 1.1.04.00
    1.1.04.01 - ICMS a Recuperar
    1.1.04.02 - IPI a Recuperar
    1.1.04.03 - PIS a Recuperar
    1.1.04.04 - COFINS a Recuperar

Despesas Antecipadas (Prepaid Expenses) - 1.1.05.00
    1.1.05.01 - Seguros a Vencer
    1.1.05.02 - Outros Gastos Antecipados

ATIVO NÃO CIRCULANTE (Non-current Assets) - 1.2.00.00
Realizável a Longo Prazo (Long-term Receivables) - 1.2.01.00
    1.2.01.01 - Aplicações Financeiras de Longo Prazo
    1.2.01.02 - Empréstimos a Coligadas

Investimentos (Investments) - 1.2.02.00
    1.2.02.01 - Participações Societárias
    1.2.02.02 - Outros Investimentos

Imobilizado (Property, Plant & Equipment) - 1.2.03.00
    1.2.03.01 - Terrenos
    1.2.03.02 - Edifícios
    1.2.03.03 - Máquinas e Equipamentos
    1.2.03.04 - Móveis e Utensílios
    1.2.03.05 - Veículos
    1.2.03.06 - (-) Depreciação Acumulada

Intangível (Intangible Assets) - 1.2.04.00
    1.2.04.01 - Marcas e Patentes
    1.2.04.02 - Software
    1.2.04.03 - (-) Amortização Acumulada

PASSIVO (LIABILITIES) - 2.0.00.00
PASSIVO CIRCULANTE (Current Liabilities) - 2.1.00.00
Fornecedores (Suppliers) - 2.1.01.00
    2.1.01.01 - Fornecedores Nacionais
    2.1.01.02 - Fornecedores Estrangeiros

Empréstimos e Financiamentos (Loans and Financing) - 2.1.02.00
    2.1.02.01 - Empréstimos Bancários
    2.1.02.02 - Financiamentos

Obrigações Fiscais (Tax Obligations) - 2.1.03.00
    2.1.03.01 - ICMS a Recolher
    2.1.03.02 - IPI a Recolher
    2.1.03.03 - PIS a Recolher
    2.1.03.04 - COFINS a Recolher
    2.1.03.05 - IRPJ a Recolher
    2.1.03.06 - CSLL a Recolher

Obrigações Trabalhistas (Labor Obligations) - 2.1.04.00
    2.1.04.01 - Salários a Pagar
    2.1.04.02 - FGTS a Recolher
    2.1.04.03 - INSS a Recolher
    2.1.04.04 - Provisão para Férias
    2.1.04.05 - Provisão para 13º Salário

PASSIVO NÃO CIRCULANTE (Non-current Liabilities) - 2.2.00.00
    2.2.01.01 - Empréstimos de Longo Prazo
    2.2.01.02 - Financiamentos de Longo Prazo
    2.2.01.03 - Provisões para Contingências

PATRIMÔNIO LÍQUIDO (Equity) - 2.3.00.00
    2.3.01.01 - Capital Social
    2.3.01.02 - Reservas de Capital
    2.3.01.03 - Reservas de Lucros
    2.3.01.04 - Lucros ou Prejuízos Acumulados

RECEITAS (REVENUES) - 3.0.00.00
Receita Bruta de Vendas (Gross Sales Revenue) - 3.1.00.00
    3.1.01.01 - Receita de Vendas de Produtos
    3.1.01.02 - Receita de Prestação de Serviços

Deduções da Receita Bruta (Deductions from Gross Revenue) - 3.2.00.00
    3.2.01.01 - (-) ICMS sobre Vendas
    3.2.01.02 - (-) PIS sobre Faturamento
    3.2.01.03 - (-) COFINS sobre Faturamento
    3.2.01.04 - (-) Devoluções de Vendas
    3.2.01.05 - (-) Abatimentos sobre Vendas

CUSTOS (COSTS) - 4.0.00.00
    4.1.01.01 - Custo dos Produtos Vendidos
    4.1.01.02 - Custo dos Serviços Prestados

DESPESAS (EXPENSES) - 5.0.00.00
Despesas Operacionais (Operating Expenses) - 5.1.00.00
Despesas com Vendas (Selling Expenses) - 5.1.01.00
    5.1.01.01 - Salários de Vendedores
    5.1.01.02 - Comissões sobre Vendas
    5.1.01.03 - Propaganda e Publicidade

Despesas Administrativas (Administrative Expenses) - 5.1.02.00
    5.1.02.01 - Salários Administrativos
    5.1.02.02 - Honorários da Diretoria
    5.1.02.03 - Aluguéis
    5.1.02.04 - Depreciação
    5.1.02.05 - Energia Elétrica
    5.1.02.06 - Telefone

Despesas Financeiras (Financial Expenses) - 5.1.03.00
    5.1.03.01 - Juros Passivos
    5.1.03.02 - Descontos Concedidos

Receitas Financeiras (Financial Revenues) - 5.2.00.00
    5.2.01.01 - Juros Ativos
    5.2.01.02 - Descontos Obtidos',

    'Lei 6.404/76 (Lei das S.A.) modificada pela Lei 11.638/07. Convergência avec IFRS depuis 2010. Particularités : tributos complexos (ICMS, PIS, COFINS, IRPJ, CSLL).',

    '/modeles/brasil_brgaap_demonstracoes_financeiras.pdf - Balanço Patrimonial, Demonstração do Resultado, DFC selon Lei 6.404/76',

    'BALANCETE → DEMONSTRAÇÕES FINANCEIRAS :
    BALANÇO PATRIMONIAL :
    ATIVO :
    - Ativo Circulante : 1.1.00.00
    - Ativo Não Circulante : 1.2.00.00 (líquido de depreciação/amortização)
    
    PASSIVO :
    - Passivo Circulante : 2.1.00.00
    - Passivo Não Circulante : 2.2.00.00
    
    PATRIMÔNIO LÍQUIDO :
    - Capital e Reservas : 2.3.00.00
    
    DEMONSTRAÇÃO DO RESULTADO :
    - Receita Bruta : 3.1.00.00
    - (-) Deduções : 3.2.00.00
    - Receita Líquida : Receita Bruta - Deduções
    - (-) Custo : 4.0.00.00
    - Lucro Bruto : Receita Líquida - Custo
    - (-) Despesas Operacionais : 5.1.00.00
    - Resultado Antes do Financeiro : Lucro Bruto - Despesas Op.
    - Resultado Financeiro : 5.2.00.00 - 5.1.03.00
    - Resultado Antes dos Tributos : Resultado + Financeiro
    - (-) IR e CSLL : Provisão tributária
    - Lucro Líquido : Resultado - Tributos',

    'Conselho Federal de Contabilidade (CFC), Comitê de Pronunciamentos Contábeis (CPC), Lei 6.404/76'
);

-- =====================================================
-- CRÉATION D''INDEX POUR OPTIMISER LES RECHERCHES
-- =====================================================
CREATE INDEX idx_pays ON referentiel_comptable_mondial(pays);
CREATE INDEX idx_systeme_comptable ON referentiel_comptable_mondial(systeme_comptable);
CREATE INDEX idx_devise ON referentiel_comptable_mondial(devise);

-- =====================================================
-- VUES UTILES POUR L''ANALYSE
-- =====================================================

-- Vue des systèmes comptables par région
CREATE VIEW systemes_par_region AS
SELECT 
    CASE 
        WHEN pays IN ('France', 'Allemagne', 'Royaume-Uni') THEN 'Europe'
        WHEN pays IN ('États-Unis', 'Canada') THEN 'Amérique du Nord'
        WHEN pays IN ('Japon', 'Chine') THEN 'Asie'
        WHEN pays = 'Brésil' THEN 'Amérique du Sud'
        ELSE 'Autre'
    END as region,
    systeme_comptable,
    COUNT(*) as nb_pays
FROM referentiel_comptable_mondial
GROUP BY region, systeme_comptable;

-- Vue des devises utilisées
CREATE VIEW devises_utilisees AS
SELECT devise, COUNT(*) as nb_pays, GROUP_CONCAT(pays) as pays_utilisant
FROM referentiel_comptable_mondial
GROUP BY devise;

-- =====================================================
-- PROCÉDURES STOCKÉES UTILES
-- =====================================================

DELIMITER //
CREATE PROCEDURE GetPlanComptablePays(IN nom_pays VARCHAR(100))
BEGIN
    SELECT plan_comptable_complet, tableau_correspondance_balance_etats
    FROM referentiel_comptable_mondial
    WHERE pays = nom_pays;
END //

CREATE PROCEDURE ComparerSystemesComptables(IN pays1 VARCHAR(100), IN pays2 VARCHAR(100))
BEGIN
    SELECT 
        p1.pays as pays_1,
        p1.systeme_comptable as systeme_1,
        p2.pays as pays_2,
        p2.systeme_comptable as systeme_2,
        p1.devise as devise_1,
        p2.devise as devise_2
    FROM referentiel_comptable_mondial p1
    CROSS JOIN referentiel_comptable_mondial p2
    WHERE p1.pays = pays1 AND p2.pays = pays2;
END //
DELIMITER ;

-- =====================================================
-- AJOUT D'AUTRES PAYS IMPORTANTS
-- =====================================================

-- INDE
INSERT INTO referentiel_comptable_mondial (
    pays, langue_officielle, devise, systeme_comptable, plan_comptable_complet,
    particularites_notes, modeles_etats_financiers_pdf, tableau_correspondance_balance_etats, sources
) VALUES (
    'Inde', 'Hindi et Anglais', 'Roupie indienne (INR)', 'Indian Accounting Standards (Ind AS) + Indian GAAP',
    'ASSETS - 1000-1999
Current Assets - 1000-1199
    1001 - Cash and Cash Equivalents
    1002 - Bank Balances other than Cash and Cash Equivalents
    1101 - Trade Receivables
    1102 - Other Financial Assets
    1201 - Inventories
    1202 - Current Tax Assets
    1203 - Other Current Assets

Non-Current Assets - 1200-1999
    1301 - Property, Plant and Equipment
    1302 - Capital Work-in-Progress
    1303 - Investment Property
    1401 - Goodwill
    1402 - Other Intangible Assets
    1403 - Intangible Assets under Development
    1501 - Financial Assets
    1502 - Investments in Subsidiaries/Associates
    1601 - Deferred Tax Assets (Net)
    1602 - Other Non-Current Assets

EQUITY AND LIABILITIES - 2000-3999
Equity - 2000-2999
    2001 - Equity Share Capital
    2002 - Other Equity
    2101 - Securities Premium
    2102 - Retained Earnings
    2103 - Other Comprehensive Income
    2104 - General Reserve

Liabilities - 3000-3999
Current Liabilities - 3000-3199
    3001 - Financial Liabilities
    3002 - Trade Payables
    3003 - Other Financial Liabilities
    3004 - Provisions
    3005 - Current Tax Liabilities
    3006 - Other Current Liabilities

Non-Current Liabilities - 3200-3999
    3201 - Financial Liabilities
    3202 - Provisions
    3203 - Deferred Tax Liabilities
    3204 - Other Non-Current Liabilities

INCOME - 4000-4999
    4001 - Revenue from Operations
    4002 - Other Income
    4101 - Interest Income
    4102 - Dividend Income
    4103 - Gain on Fair Value Changes
    4104 - Gain on Sale of Investments

EXPENSES - 5000-5999
    5001 - Cost of Materials Consumed
    5002 - Purchase of Stock-in-Trade
    5003 - Changes in Inventories
    5101 - Employee Benefit Expenses
    5102 - Finance Costs
    5103 - Depreciation and Amortisation
    5201 - Other Expenses
    5202 - Exceptional Items',

    'Convergence vers IFRS via Ind AS depuis 2016. Particularités : Companies Act 2013, GST (Goods and Services Tax).',

    '/modeles/inde_indas_financial_statements.pdf - Balance Sheet, Statement of Profit and Loss selon Companies Act 2013 et Ind AS',

    'TRIAL BALANCE → FINANCIAL STATEMENTS MAPPING :
    BALANCE SHEET :
    ASSETS :
    - Current Assets : 1000-1199
    - Non-Current Assets : 1200-1999
    
    EQUITY AND LIABILITIES :
    - Equity : 2000-2999
    - Current Liabilities : 3000-3199
    - Non-Current Liabilities : 3200-3999
    
    STATEMENT OF PROFIT AND LOSS :
    - Revenue : 4001-4002
    - Total Income : Sum of Revenue accounts
    - Expenses : 5001-5202
    - Profit Before Tax : Total Income - Total Expenses
    - Tax Expense : Current + Deferred Tax
    - Profit After Tax : PBT - Tax Expense',

    'Institute of Chartered Accountants of India (ICAI), Ministry of Corporate Affairs, Companies Act 2013, Ind AS'
);

-- RUSSIE
INSERT INTO referentiel_comptable_mondial (
    pays, langue_officielle, devise, systeme_comptable, plan_comptable_complet,
    particularites_notes, modeles_etats_financiers_pdf, tableau_correspondance_balance_etats, sources
) VALUES (
    'Russie', 'Russe', 'Rouble russe (RUB)', 'Russian Accounting Standards (RAS)',
    'ВНЕОБОРОТНЫЕ АКТИВЫ (Non-current Assets) - 01-09
01 - Основные средства (Fixed Assets)
    011 - Земельные участки (Land)
    012 - Объекты природопользования (Natural Resources)
    013 - Здания (Buildings)
    014 - Сооружения (Structures)
    015 - Машины и оборудование (Machinery and Equipment)
    
02 - Амортизация основных средств (Accumulated Depreciation)
03 - Доходные вложения в материальные ценности (Investment Property)
04 - Нематериальные активы (Intangible Assets)
05 - Амортизация нематериальных активов (Accumulated Amortization - Intangibles)
08 - Вложения во внеоборотные активы (Investments in Non-current Assets)
09 - Отложенные налоговые активы (Deferred Tax Assets)

ОБОРОТНЫЕ АКТИВЫ (Current Assets) - 10-59
10 - Материалы (Materials)
    101 - Сырье и материалы (Raw Materials)
    102 - Покупные полуфабрикаты (Purchased Semi-finished Products)
    103 - Топливо (Fuel)
    104 - Тара и тарные материалы (Containers)
    105 - Запасные части (Spare Parts)
    
11 - Животные на выращивании и откорме (Livestock)
14 - Резервы под снижение стоимости материальных ценностей (Provision for Inventory Write-down)
15 - Заготовление и приобретение материальных ценностей (Materials Procurement)
16 - Отклонение в стоимости материальных ценностей (Material Cost Variances)

20 - Основное производство (Main Production)
21 - Полуфабрикаты собственного производства (Semi-finished Products)
23 - Вспомогательные производства (Auxiliary Production)
25 - Общепроизводственные расходы (Manufacturing Overhead)
26 - Общехозяйственные расходы (General and Administrative Expenses)
28 - Брак в производстве (Production Defects)
29 - Обслуживающие производства и хозяйства (Service Operations)

41 - Товары (Goods for Resale)
42 - Торговая наценка (Trade Markup)
43 - Готовая продукция (Finished Products)
44 - Расходы на продажу (Selling Expenses)
45 - Товары отгруженные (Goods Shipped)
46 - Выполненные этапы по незавершенным работам (Completed Stages of Unfinished Work)

50 - Касса (Cash)
51 - Расчетные счета (Current Accounts)
52 - Валютные счета (Foreign Currency Accounts)
55 - Специальные счета в банках (Special Bank Accounts)
57 - Переводы в пути (Transfers in Transit)
58 - Финансовые вложения (Financial Investments)
59 - Резервы под обесценение финансовых вложений (Provision for Impairment of Financial Investments)

РАСЧЕТЫ (Settlements/Receivables-Payables) - 60-79
60 - Расчеты с поставщиками и подрядчиками (Accounts Payable - Suppliers)
62 - Расчеты с покупателями и заказчиками (Accounts Receivable - Customers)
63 - Резервы по сомнительным долгам (Bad Debt Provision)
66 - Расчеты по краткосрочным кредитам и займам (Short-term Loans Payable)
67 - Расчеты по долгосрочным кредитам и займам (Long-term Loans Payable)
68 - Расчеты по налогам и сборам (Tax Settlements)
69 - Расчеты по социальному страхованию (Social Insurance Settlements)
70 - Расчеты с персоналом по оплате труда (Payroll Payable)
71 - Расчеты с подотчетными лицами (Advances to Employees)
73 - Расчеты с персоналом по прочим операциям (Other Employee Settlements)
75 - Расчеты с учредителями (Settlements with Founders)
76 - Расчеты с разными дебиторами и кредиторами (Other Receivables/Payables)

КАПИТАЛ (Capital/Equity) - 80-89
80 - Уставный капитал (Share Capital)
81 - Собственные акции (выкупленные) (Treasury Shares)
82 - Резервный капитал (Reserve Capital)
83 - Добавочный капитал (Additional Capital)
84 - Нераспределенная прибыль (непокрытый убыток) (Retained Earnings)

ФИНАНСОВЫЕ РЕЗУЛЬТАТЫ (Financial Results) - 90-99
90 - Продажи (Sales)
    901 - Себестоимость продаж (Cost of Sales)
    902 - Коммерческие расходы (Commercial Expenses)
    903 - Управленческие расходы (Administrative Expenses)
    
91 - Прочие доходы и расходы (Other Income and Expenses)
94 - Недостачи и потери от порчи ценностей (Shortages and Losses)
96 - Резервы предстоящих расходов (Reserves for Future Expenses)
97 - Расходы будущих периодов (Deferred Expenses)
98 - Доходы будущих периодов (Deferred Income)
99 - Прибыли и убытки (Profits and Losses)',

    'Système comptable russe distinct des IFRS. Influence de la fiscalité sur la comptabilité. Plan comptable unifié obligatoire.',

    '/modeles/russie_ras_accounting_reports.pdf - Бухгалтерский баланс (Balance Sheet), Отчёт о финансовых результатах (Income Statement) selon RAS',

    'ОБОРОТНО-САЛЬДОВАЯ ВЕДОМОСТЬ → ОТЧЁТНОСТЬ :
    БУХГАЛТЕРСКИЙ БАЛАНС :
    АКТИВ :
    - Внеоборотные активы : 01-09 (за вычетом амортизации 02, 05)
    - Оборотные активы : 10-59
    
    ПАССИВ :
    - Капитал и резервы : 80-89
    - Долгосрочные обязательства : 67 (долгосрочная часть)
    - Краткосрочные обязательства : 60, 62, 66, 68-76
    
    ОТЧЁТ О ФИНАНСОВЫХ РЕЗУЛЬТАТАХ :
    - Выручка : 90 (кредитовый оборот)
    - Себестоимость продаж : 901
    - Валовая прибыль : Выручка - Себестоимость
    - Коммерческие расходы : 902
    - Управленческие расходы : 903
    - Прибыль от продаж : Валовая прибыль - 902 - 903
    - Прочие доходы и расходы : 91
    - Прибыль до налогообложения : Прибыль от продаж +/- 91
    - Налог на прибыль : расчётная величина
    - Чистая прибыль : Прибыль до налогообложения - Налог',

    'Министерство финансов РФ, ПБУ (Положения по бухгалтерскому учёту), Федеральный закон "О бухгалтерском учёте"'
);

-- AUSTRALIE
INSERT INTO referentiel_comptable_mondial (
    pays, langue_officielle, devise, systeme_comptable, plan_comptable_complet,
    particularites_notes, modeles_etats_financiers_pdf, tableau_correspondance_balance_etats, sources
) VALUES (
    'Australie', 'Anglais', 'Dollar australien (AUD)', 'Australian Accounting Standards (AASB) - IFRS',
    'ASSETS - 1-1999
Current Assets - 1-199
    1 - Cash and Cash Equivalents
    2 - Trade and Other Receivables
    3 - Inventories
    4 - Other Financial Assets
    5 - Other Current Assets
    6 - Assets Classified as Held for Sale

Non-Current Assets - 100-1999
    100 - Trade and Other Receivables
    200 - Other Financial Assets
    300 - Property, Plant and Equipment
    400 - Investment Properties
    500 - Intangible Assets
    600 - Deferred Tax Assets
    700 - Other Non-Current Assets

LIABILITIES - 2000-2999
Current Liabilities - 2000-2199
    2000 - Trade and Other Payables
    2010 - Interest-bearing Loans and Borrowings
    2020 - Current Tax Liabilities
    2030 - Provisions
    2040 - Other Current Liabilities
    2050 - Liabilities Associated with Assets Held for Sale

Non-Current Liabilities - 2200-2999
    2200 - Trade and Other Payables
    2210 - Interest-bearing Loans and Borrowings
    2220 - Deferred Tax Liabilities
    2230 - Provisions
    2240 - Other Non-Current Liabilities

EQUITY - 3000-3999
    3000 - Issued Capital
    3010 - Reserves
    3020 - Retained Earnings
    3030 - Non-controlling Interests

INCOME - 4000-4999
    4000 - Revenue from Continuing Operations
    4010 - Other Income
    4020 - Finance Income
    4030 - Share of Profit of Associates
    4040 - Gain on Disposal

EXPENSES - 5000-5999
    5000 - Cost of Sales
    5010 - Employee Benefits Expense
    5020 - Depreciation and Amortisation
    5030 - Finance Costs
    5040 - Other Expenses
    5050 - Income Tax Expense',

    'Application intégrale des IFRS via les AASB. Particularités : GST (Goods and Services Tax), superannuation (retraite).',

    '/modeles/australie_aasb_financial_statements.pdf - Statement of Financial Position, Statement of Comprehensive Income selon AASB/IFRS',

    'TRIAL BALANCE → FINANCIAL STATEMENTS MAPPING :
    STATEMENT OF FINANCIAL POSITION :
    ASSETS :
    - Current Assets : 1-199
    - Non-Current Assets : 100-1999
    
    LIABILITIES :
    - Current Liabilities : 2000-2199
    - Non-Current Liabilities : 2200-2999
    
    EQUITY :
    - Total Equity : 3000-3999
    
    STATEMENT OF COMPREHENSIVE INCOME :
    - Revenue : 4000-4040
    - Expenses : 5000-5050
    - Profit Before Tax : Revenue - Expenses
    - Income Tax Expense : 5050
    - Profit After Tax : PBT - Tax
    - Other Comprehensive Income : Items not in P&L
    - Total Comprehensive Income : PAT + OCI',

    'Australian Accounting Standards Board (AASB), Australian Securities and Investments Commission (ASIC), Corporations Act 2001'
);

-- MEXIQUE
INSERT INTO referentiel_comptable_mondial (
    pays, langue_officielle, devise, systeme_comptable, plan_comptable_complet,
    particularites_notes, modeles_etats_financiers_pdf, tableau_correspondance_balance_etats, sources
) VALUES (
    'Mexique', 'Espagnol', 'Peso mexicain (MXN)', 'Normas de Información Financiera (NIF)',
    'ACTIVO - 1000-1999
ACTIVO CIRCULANTE - 1000-1199
    1001 - Efectivo y Equivalentes de Efectivo
    1002 - Inversiones Temporales
    1101 - Clientes
    1102 - Documentos por Cobrar
    1103 - Deudores Diversos
    1104 - Funcionarios y Empleados
    1105 - IVA Acreditable
    1106 - Impuestos por Recuperar
    1107 - Pagos Anticipados
    1201 - Inventarios
    1202 - Almacén de Materias Primas
    1203 - Almacén de Productos en Proceso
    1204 - Almacén de Productos Terminados
    1205 - Almacén de Mercancías

ACTIVO NO CIRCULANTE - 1200-1999
    1301 - Terrenos
    1302 - Edificios
    1303 - Maquinaria y Equipo
    1304 - Mobiliario y Equipo de Oficina
    1305 - Equipo de Transporte
    1306 - Equipo de Cómputo
    1307 - Depreciación Acumulada
    1401 - Inversiones Permanentes
    1501 - Gastos de Instalación
    1502 - Gastos de Organización
    1503 - Patentes y Marcas
    1504 - Amortización Acumulada

PASIVO - 2000-2999
PASIVO A CORTO PLAZO - 2000-2199
    2001 - Proveedores
    2002 - Documentos por Pagar
    2003 - Acreedores Diversos
    2004 - Acreedores Bancarios
    2005 - Anticipo de Clientes
    2101 - IVA por Pagar
    2102 - ISR por Pagar
    2103 - IMSS por Pagar
    2104 - INFONAVIT por Pagar
    2105 - PTU por Pagar

PASIVO A LARGO PLAZO - 2200-2999
    2201 - Hipotecas por Pagar
    2202 - Documentos por Pagar a Largo Plazo
    2203 - Créditos Bancarios a Largo Plazo

CAPITAL CONTABLE - 3000-3999
    3001 - Capital Social
    3002 - Aportaciones para Futuros Aumentos de Capital
    3003 - Prima en Venta de Acciones
    3004 - Reserva Legal
    3005 - Utilidades Retenidas
    3006 - Utilidad del Ejercicio
    3007 - Pérdidas Acumuladas

INGRESOS - 4000-4999
    4001 - Ventas
    4002 - Devoluciones sobre Ventas
    4003 - Descuentos sobre Ventas
    4101 - Productos Financieros
    4102 - Otros Productos

COSTOS Y GASTOS - 5000-5999
    5001 - Costo de Ventas
    5101 - Gastos de Venta
    5102 - Gastos de Administración
    5201 - Gastos Financieros
    5202 - Otros Gastos
    5301 - ISR
    5302 - PTU',

    'NIF mexicaines proches des IFRS. Particularités : IVA (TVA mexicaine), PTU (participation des travailleurs), ISR (impôt sur le revenu).',

    '/modeles/mexique_nif_estados_financieros.pdf - Estado de Situación Financiera, Estado de Resultados selon NIF',

    'BALANZA DE COMPROBACIÓN → ESTADOS FINANCIEROS :
    ESTADO DE SITUACIÓN FINANCIERA :
    ACTIVO :
    - Activo Circulante : 1000-1199
    - Activo No Circulante : 1200-1999 (neto de depreciación/amortización)
    
    PASIVO :
    - Pasivo a Corto Plazo : 2000-2199
    - Pasivo a Largo Plazo : 2200-2999
    
    CAPITAL CONTABLE :
    - Capital Contable : 3000-3999
    
    ESTADO DE RESULTADOS :
    - Ingresos : 4000-4999
    - Costo de Ventas : 5001
    - Utilidad Bruta : Ingresos - Costo de Ventas
    - Gastos de Operación : 5101-5102
    - Utilidad de Operación : Utilidad Bruta - Gastos de Operación
    - Resultado Integral de Financiamiento : 4101-4102 menos 5201-5202
    - Utilidad Antes de Impuestos : Utilidad de Operación + RIF
    - ISR y PTU : 5301-5302
    - Utilidad Neta : Utilidad Antes de Impuestos - Impuestos',

    'Consejo Mexicano de Normas de Información Financiera (CINIF), Ley General de Sociedades Mercantiles'
);

-- =====================================================
-- REQUÊTES DE CONTRÔLE ET STATISTIQUES
-- =====================================================

-- Vérification du nombre total de pays
SELECT COUNT(*) as total_pays FROM referentiel_comptable_mondial;

-- Répartition par système comptable
CREATE VIEW vue_systemes_comptables AS
SELECT 
    systeme_comptable,
    COUNT(*) as nb_pays,
    GROUP_CONCAT(pays ORDER BY pays SEPARATOR ', ') as pays_utilisant
FROM referentiel_comptable_mondial
GROUP BY systeme_comptable
ORDER BY nb_pays DESC;

-- Répartition par devise
CREATE VIEW vue_devises AS
SELECT 
    devise,
    COUNT(*) as nb_pays,
    GROUP_CONCAT(pays ORDER BY pays SEPARATOR ', ') as pays_utilisant
FROM referentiel_comptable_mondial
GROUP BY devise
ORDER BY nb_pays DESC;

-- Fonction pour rechercher dans les plans comptables
DELIMITER //
CREATE FUNCTION RechercherCompte(compte_recherche VARCHAR(100))
RETURNS TEXT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE resultat TEXT DEFAULT '';
    SELECT GROUP_CONCAT(CONCAT(pays, ': ', systeme_comptable) SEPARATOR '; ') INTO resultat
    FROM referentiel_comptable_mondial
    WHERE plan_comptable_complet LIKE CONCAT('%', compte_recherche, '%');
    RETURN COALESCE(resultat, 'Aucun résultat trouvé');
END //
DELIMITER ;

-- =====================================================
-- TABLES ANNEXES POUR ENRICHIR LA BASE
-- =====================================================

-- Table des organismes de normalisation
CREATE TABLE organismes_normalisation (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pays VARCHAR(100),
    nom_organisme VARCHAR(200),
    site_web VARCHAR(200),
    type_organisme ENUM('Public', 'Privé', 'Mixte'),
    FOREIGN KEY (pays) REFERENCES referentiel_comptable_mondial(pays)
);

-- Insertion des organismes
INSERT INTO organismes_normalisation (pays, nom_organisme, site_web, type_organisme) VALUES
('France', 'Autorité des Normes Comptables (ANC)', 'www.anc.gouv.fr', 'Public'),
('Allemagne', 'Deutsches Rechnungslegungs Standards Committee (DRSC)', 'www.drsc.de', 'Privé'),
('États-Unis', 'Financial Accounting Standards Board (FASB)', 'www.fasb.org', 'Privé'),
('Royaume-Uni', 'Financial Reporting Council (FRC)', 'www.frc.org.uk', 'Privé'),
('Japon', 'Accounting Standards Board of Japan (ASBJ)', 'www.asb.or.jp', 'Privé'),
('Chine', 'Ministry of Finance Accounting Department', 'www.mof.gov.cn', 'Public'),
('Canada', 'Accounting Standards Board (AcSB)', 'www.frascanada.ca', 'Privé'),
('Brésil', 'Comitê de Pronunciamentos Contábeis (CPC)', 'www.cpc.org.br', 'Privé'),
('Inde', 'Institute of Chartered Accountants of India (ICAI)', 'www.icai.org', 'Privé'),
('Russie', 'Ministry of Finance of Russian Federation', 'www.minfin.ru', 'Public'),
('Australie', 'Australian Accounting Standards Board (AASB)', 'www.aasb.gov.au', 'Public'),
('Mexique', 'Consejo Mexicano de Normas de Información Financiera (CINIF)', 'www.cinif.org.mx', 'Privé');

-- Table des équivalences entre systèmes comptables
CREATE TABLE equivalences_comptes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    compte_source VARCHAR(50),
    pays_source VARCHAR(100),
    compte_cible VARCHAR(50),
    pays_cible VARCHAR(100),
    libelle_source VARCHAR(500),
    libelle_cible VARCHAR(500),
    niveau_equivalence ENUM('Exacte', 'Proche', 'Partielle'),
    notes_equivalence TEXT
);

-- Exemples d'équivalences France-USA
INSERT INTO equivalences_comptes VALUES
(1, '411', 'France', '1030', 'États-Unis', 'Clients', 'Accounts Receivable', 'Exacte', 'Correspondance directe'),
(2, '401', 'France', '2010', 'États-Unis', 'Fournisseurs', 'Accounts Payable', 'Exacte', 'Correspondance directe'),
(3, '101', 'France', '3010', 'États-Unis', 'Capital', 'Common Stock', 'Proche', 'Concept similaire, modalités différentes'),
(4, '512', 'France', '1010', 'États-Unis', 'Banques', 'Cash and Cash Equivalents', 'Exacte', 'Trésorerie'),
(5, '607', 'France', '5000', 'États-Unis', 'Achats de marchandises', 'Cost of Goods Sold', 'Proche', 'Traitement des stocks différent');

-- =====================================================
-- FONCTIONS D'EXPORT POUR DIFFÉRENTS FORMATS
-- =====================================================

-- Vue complète pour export Excel
CREATE VIEW export_complet AS
SELECT 
    pays,
    langue_officielle,
    devise,
    systeme_comptable,
    SUBSTRING(plan_comptable_complet, 1, 1000) as plan_comptable_extrait,
    particularites_notes,
    modeles_etats_financiers_pdf,
    SUBSTRING(tableau_correspondance_balance_etats, 1, 500) as correspondance_extrait,
    sources,
    date_maj
FROM referentiel_comptable_mondial
ORDER BY pays;

-- =====================================================
-- COMMENTAIRES ET DOCUMENTATION
-- =====================================================

/*
DOCUMENTATION DE LA BASE DE DONNÉES RÉFÉRENTIEL COMPTABLE MONDIAL

Cette base de données contient les informations comptables essentielles pour 12 pays majeurs :
- Plans comptables complets
- Modèles d'états financiers officiels
- Tableaux de correspondance balance/états financiers
- Sources officielles

UTILISATION :
1. Consultation des plans comptables : SELECT plan_comptable_complet FROM referentiel_comptable_mondial WHERE pays = 'France';
2. Comparaison entre pays : CALL ComparerSystemesComptables('France', 'États-Unis');
3. Recherche de comptes : SELECT RechercherCompte('clients');

MAINTENANCE :
- Mise à jour annuelle recommandée
- Vérification des sources réglementaires
- Ajout de nouveaux pays selon besoins

EXTENSIONS POSSIBLES :
- Ajout de plus de pays
- Intégration des taux de change
- Historique des modifications réglementaires
- API REST pour accès externe
*/

-- =====================================================
-- AJOUT DE PAYS SUPPLÉMENTAIRES POUR COUVERTURE MONDIALE
-- =====================================================

-- ITALIE
INSERT INTO referentiel_comptable_mondial (
    pays, langue_officielle, devise, systeme_comptable, plan_comptable_complet,
    particularites_notes, modeles_etats_financiers_pdf, tableau_correspondance_balance_etats, sources
) VALUES (
    'Italie', 'Italien', 'Euro (EUR)', 'Principi Contabili Italiani (OIC) + IFRS',
    'CLASSE A - CREDITI VERSO SOCI (Receivables from Shareholders)
A) Crediti verso soci per versamenti ancora dovuti

CLASSE B - IMMOBILIZZAZIONI (Fixed Assets)
B.I - Immobilizzazioni immateriali
    1) Costi di impianto e di ampliamento
    2) Costi di sviluppo
    3) Diritti di brevetto industriale
    4) Concessioni, licenze, marchi
    5) Avviamento
    6) Immobilizzazioni in corso e acconti
    7) Altre

B.II - Immobilizzazioni materiali
    1) Terreni e fabbricati
    2) Impianti e macchinario
    3) Attrezzature industriali e commerciali
    4) Altri beni
    5) Immobilizzazioni in corso e acconti

B.III - Immobilizzazioni finanziarie
    1) Partecipazioni
    2) Crediti
    3) Altri titoli

CLASSE C - ATTIVO CIRCOLANTE (Current Assets)
C.I - Rimanenze
    1) Materie prime, sussidiarie e di consumo
    2) Prodotti in corso di lavorazione
    3) Lavori in corso su ordinazione
    4) Prodotti finiti e merci
    5) Acconti

C.II - Crediti
    1) Verso clienti
    2) Verso imprese controllate
    3) Verso imprese collegate
    4) Verso controllanti
    5) Verso altri

C.III - Attività finanziarie
    1) Partecipazioni in imprese controllate
    2) Partecipazioni in imprese collegate
    3) Partecipazioni in imprese controllanti
    4) Altre partecipazioni
    5) Azioni proprie
    6) Altri titoli

C.IV - Disponibilità liquide
    1) Depositi bancari e postali
    2) Assegni
    3) Danaro e valori in cassa

CLASSE D - RATEI E RISCONTI ATTIVI (Accruals and Deferrals)

PATRIMONIO NETTO (Equity)
A) Capitale
B) Riserva da soprapprezzo delle azioni
C) Riserve di rivalutazione
D) Riserva legale
E) Riserve statutarie
F) Altre riserve
G) Utili (perdite) portati a nuovo
H) Utile (perdita) dell''esercizio

FONDI PER RISCHI E ONERI (Provisions)
1) Per trattamento di quiescenza
2) Per imposte, anche differite
3) Altri

TRATTAMENTO DI FINE RAPPORTO (Employee Severance Indemnity)

DEBITI (Liabilities)
1) Obbligazioni
2) Obbligazioni convertibili
3) Debiti verso soci per finanziamenti
4) Debiti verso banche
5) Debiti verso altri finanziatori
6) Acconti
7) Debiti verso fornitori
8) Debiti rappresentati da titoli di credito
9) Debiti verso imprese controllate
10) Debiti verso imprese collegate
11) Debiti verso controllanti
12) Debiti tributari
13) Debiti verso istituti di previdenza
14) Altri debiti

RATEI E RISCONTI PASSIVI (Accrued Liabilities and Deferred Income)',

    'Codice Civile italien + principes OIC. Particularités : TFR (Trattamento di Fine Rapporto), structure spécifique du bilan.',

    '/modeles/italie_oic_bilancio_stato_patrimoniale.pdf - Stato Patrimoniale, Conto Economico selon Codice Civile art. 2424-2425',

    'BILANCIO DI VERIFICA → BILANCIO D''ESERCIZIO :
    STATO PATRIMONIALE :
    ATTIVO :
    - Crediti verso soci : Classe A
    - Immobilizzazioni : Classe B (nette di ammortamenti)
    - Attivo circolante : Classe C
    - Ratei e risconti attivi : Classe D
    
    PASSIVO :
    - Patrimonio netto : A-H
    - Fondi rischi e oneri : 1-3
    - TFR : importo accantonato
    - Debiti : 1-14
    - Ratei e risconti passivi
    
    CONTO ECONOMICO :
    - Valore della produzione : A1-A5
    - Costi della produzione : B6-B14
    - Proventi e oneri finanziari : C15-C17
    - Rettifiche di valore : D18-D19
    - Proventi e oneri straordinari : E20-E21
    - Imposte : 22
    - Utile/Perdita : 23',

    'Organismo Italiano di Contabilità (OIC), Codice Civile, Consob per società quotate'
);

-- ESPAGNE
INSERT INTO referentiel_comptable_mondial (
    pays, langue_officielle, devise, systeme_comptable, plan_comptable_complet,
    particularites_notes, modeles_etats_financiers_pdf, tableau_correspondance_balance_etats, sources
) VALUES (
    'Espagne', 'Espagnol', 'Euro (EUR)', 'Plan General de Contabilidad (PGC)',
    'GRUPO 1 - FINANCIACIÓN BÁSICA
10 - Capital
    100 - Capital social
    101 - Fondo social
    102 - Capital
    103 - Socios por desembolsos no exigidos
    104 - Socios por aportaciones no dinerarias pendientes

11 - Reservas y otros instrumentos de patrimonio
    110 - Prima de emisión
    111 - Reserva legal
    112 - Reserva voluntaria
    113 - Reservas especiales

12 - Resultados pendientes de aplicación
    120 - Remanente
    121 - Resultados negativos de ejercicios anteriores

13 - Subvenciones, donaciones y ajustes por cambio de valor
14 - Provisiones
15 - Deudas a largo plazo con características especiales
16 - Deudas a largo plazo con partes vinculadas
17 - Deudas a largo plazo por préstamos recibidos
18 - Pasivos por fianzas, garantías y otros conceptos

GRUPO 2 - ACTIVO NO CORRIENTE
20 - Inmovilizaciones intangibles
    200 - Investigación
    201 - Desarrollo
    202 - Concesiones administrativas
    203 - Propiedad industrial
    204 - Fondo de comercio
    205 - Derechos de traspaso
    206 - Aplicaciones informáticas

21 - Inmovilizaciones materiales
    210 - Terrenos y bienes naturales
    211 - Construcciones
    212 - Instalaciones técnicas
    213 - Maquinaria
    214 - Utillaje
    215 - Otras instalaciones
    216 - Mobiliario
    217 - Equipos para procesos de información
    218 - Elementos de transporte
    219 - Otro inmovilizado material

22 - Inversiones inmobiliarias
23 - Inmovilizaciones materiales en curso
24 - Inversiones financieras a largo plazo en partes vinculadas
25 - Otras inversiones financieras a largo plazo
26 - Fianzas y depósitos constituidos a largo plazo
28 - Amortización acumulada del inmovilizado
29 - Deterioro de valor de activos no corrientes

GRUPO 3 - EXISTENCIAS
30 - Comerciales
31 - Materias primas
32 - Otros aprovisionamientos
33 - Productos en curso
34 - Productos semiterminados
35 - Productos terminados
36 - Subproductos, residuos y materiales recuperados
39 - Deterioro de valor de las existencias

GRUPO 4 - ACREEDORES Y DEUDORES POR OPERACIONES COMERCIALES
40 - Proveedores
    400 - Proveedores
    401 - Proveedores, efectos comerciales a pagar
    403 - Proveedores, empresas del grupo
    404 - Proveedores, empresas asociadas

41 - Acreedores varios
43 - Clientes
    430 - Clientes
    431 - Clientes, efectos comerciales a cobrar
    432 - Clientes, empresas del grupo
    433 - Clientes, empresas asociadas
    436 - Clientes de dudoso cobro

44 - Deudores varios
45 - Deudas con administraciones públicas
46 - Personal
47 - Administraciones públicas
48 - Ajustes por periodificación
49 - Deterioro de valor de créditos comerciales

GRUPO 5 - CUENTAS FINANCIERAS
50 - Empréstitos, deudas con características especiales
51 - Deudas a corto plazo con partes vinculadas
52 - Deudas a corto plazo por préstamos recibidos
53 - Inversiones financieras a corto plazo en partes vinculadas
54 - Otras inversiones financieras a corto plazo
55 - Otras cuentas no bancarias
56 - Fianzas y depósitos recibidos y constituidos
57 - Tesorería
    570 - Caja, euros
    571 - Caja, moneda extranjera
    572 - Bancos e instituciones de crédito
    573 - Bancos e instituciones de crédito, moneda extranjera
    574 - Bancos e instituciones de crédito, cuentas de ahorro

58 - Activos no corrientes mantenidos para la venta
59 - Deterioro del valor de inversiones financieras

GRUPO 6 - COMPRAS Y GASTOS
60 - Compras
    600 - Compras de mercaderías
    601 - Compras de materias primas
    602 - Compras de otros aprovisionamientos

61 - Variación de existencias
62 - Servicios exteriores
    620 - Gastos en investigación y desarrollo
    621 - Arrendamientos y cánones
    622 - Reparaciones y conservación
    623 - Servicios de profesionales independientes
    624 - Transportes
    625 - Primas de seguros
    626 - Servicios bancarios
    627 - Publicidad, propaganda y relaciones públicas
    628 - Suministros
    629 - Otros servicios

63 - Tributos
64 - Gastos de personal
    640 - Sueldos y salarios
    641 - Indemnizaciones
    642 - Seguridad Social a cargo de la empresa
    649 - Otros gastos sociales

65 - Otros gastos de gestión
66 - Gastos financieros
67 - Pérdidas procedentes de activos no corrientes
68 - Dotaciones para amortizaciones
69 - Pérdidas por deterioro y otras dotaciones

GRUPO 7 - VENTAS E INGRESOS
70 - Ventas de mercaderías, de producción propia
    700 - Ventas de mercaderías
    701 - Ventas de productos terminados
    702 - Ventas de productos semiterminados
    703 - Ventas de subproductos y residuos
    704 - Ventas de envases y embalajes
    705 - Prestaciones de servicios

71 - Variación de existencias
73 - Trabajos realizados para la empresa
74 - Subvenciones, donaciones y legados
75 - Otros ingresos de gestión
76 - Ingresos financieros
77 - Beneficios procedentes de activos no corrientes
79 - Excesos y aplicaciones de provisiones

GRUPO 8 - GASTOS IMPUTADOS AL PATRIMONIO NETO
GRUPO 9 - INGRESOS IMPUTADOS AL PATRIMONIO NETO',

    'Plan General de Contabilidad español conforme aux directives européennes. Particularités : IVA, Seguridad Social.',

    '/modeles/espagne_pgc_cuentas_anuales.pdf - Balance, Cuenta de Pérdidas y Ganancias selon PGC 2007',

    'BALANCE DE SUMAS Y SALDOS → CUENTAS ANUALES :
    BALANCE :
    ACTIVO :
    - Activo no corriente : Grupos 2 (neto amortizaciones grupo 28)
    - Activo corriente : Grupos 3, 4 (deudores), 5 (tesorería)
    
    PATRIMONIO NETO Y PASIVO :
    - Patrimonio neto : Grupo 1 (10-13)
    - Pasivo no corriente : Grupo 1 (14-18)
    - Pasivo corriente : Grupos 4 (acreedores), 5 (deudas corto plazo)
    
    CUENTA DE PÉRDIDAS Y GANANCIAS :
    - Importe neto cifra negocios : 70x
    - Variación existencias : 71x
    - Aprovisionamientos : -60x, -61x
    - Otros ingresos explotación : 74x, 75x
    - Gastos personal : -64x
    - Otros gastos explotación : -62x, -63x, -65x
    - Amortizaciones : -68x
    - Resultado explotación
    - Ingresos financieros : 76x
    - Gastos financieros : -66x
    - Resultado antes impuestos
    - Impuesto sociedades
    - Resultado ejercicio',

    'Instituto de Contabilidad y Auditoría de Cuentas (ICAC), Real Decreto 1514/2007'
);

-- PAYS-BAS
INSERT INTO referentiel_comptable_mondial (
    pays, langue_officielle, devise, systeme_comptable, plan_comptable_complet,
    particularites_notes, modeles_etats_financiers_pdf, tableau_correspondance_balance_etats, sources
) VALUES (
    'Pays-Bas', 'Néerlandais', 'Euro (EUR)', 'Dutch GAAP (Burgerlijk Wetboek) + IFRS',
    'ACTIVA (ASSETS)
Vaste Activa (Fixed Assets)
A. Immateriële vaste activa
    1. Kosten van ontwikkeling
    2. Concessies, vergunningen en intellectuele eigendom
    3. Goodwill
    4. Vooruitbetalingen op immateriële vaste activa

B. Materiële vaste activa
    1. Bedrijfsgebouwen en terreinen
    2. Machines en installaties
    3. Andere vaste bedrijfsmiddelen
    4. Materiële vaste activa in uitvoering
    5. Vooruitbetalingen op materiële vaste activa

C. Financiële vaste activa
    1. Deelnemingen in groepsmaatschappijen
    2. Vorderingen op groepsmaatschappijen
    3. Deelnemingen in andere verbonden maatschappijen
    4. Andere deelnemingen
    5. Andere vorderingen

Vlottende Activa (Current Assets)
D. Voorraden
    1. Grond- en hulpstoffen
    2. Onderhanden werk
    3. Gereed product en handelsgoederen
    4. Vooruitbetalingen

E. Vorderingen
    1. Handelsdebiteuren
    2. Vorderingen op groepsmaatschappijen
    3. Vorderingen op andere verbonden maatschappijen
    4. Overige vorderingen
    5. Overlopende activa

F. Liquide middelen

PASSIVA (LIABILITIES AND EQUITY)
Eigen Vermogen (Equity)
A. Geplaatst kapitaal
B. Agioreserve
C. Herwaarderingsreserve
D. Wettelijke reserves
E. Statutaire reserves
F. Overige reserves
G. Onverdeeld resultaat

Voorzieningen (Provisions)
A. Voorziening voor pensioenen
B. Voorziening voor belastingen
C. Overige voorzieningen

Langlopende Schulden (Long-term Debt)
A. Obligatieleningen
B. Schulden aan kredietinstellingen
C. Vooruitontvangen bedragen
D. Schulden aan groepsmaatschappijen
E. Schulden aan andere verbonden maatschappijen
F. Overige schulden
G. Overlopende passiva

Kortlopende Schulden (Current Liabilities)
A. Schulden aan kredietinstellingen
B. Vooruitontvangen bedragen
C. Handelscrediteuren
D. Schulden aan groepsmaatschappijen
E. Schulden aan andere verbonden maatschappijen
F. Belastingen en sociale premies
G. Pensioenen
H. Overige schulden
I. Overlopende passiva',

    'Burgerlijk Wetboek Book 2 Title 9. Particularités : système de réserves spécifique, pilier de pension obligatoire.',

    '/modeles/pays_bas_dutch_gaap_jaarrekening.pdf - Balans, Winst-en-verliesrekening selon BW2 Titel 9',

    'PROEF- EN SALDIBALANS → JAARREKENING :
    BALANS :
    ACTIVA :
    - Vaste activa : A-C (gecorrigeerd voor afschrijvingen)
    - Vlottende activa : D-F
    
    PASSIVA :
    - Eigen vermogen : A-G
    - Voorzieningen : A-C
    - Langlopende schulden : A-G
    - Kortlopende schulden : A-I
    
    WINST-EN-VERLIESREKENING :
    - Netto-omzet
    - Kostprijs van de omzet
    - Brutowinst
    - Verkoopkosten
    - Algemene beheerskosten
    - Overige bedrijfsopbrengsten
    - Overige bedrijfskosten
    - Bedrijfsresultaat
    - Financiële baten en lasten
    - Resultaat voor belastingen
    - Belastingen
    - Resultaat na belastingen',

    'Nederlandse Beroepsorganisatie van Accountants (NBA), Raad voor de Jaarverslaggeving (RJ), Burgerlijk Wetboek Boek 2'
);

-- SUÈDE
INSERT INTO referentiel_comptable_mondial (
    pays, langue_officielle, devise, systeme_comptable, plan_comptable_complet,
    particularites_notes, modeles_etats_financiers_pdf, tableau_correspondance_balance_etats, sources
) VALUES (
    'Suède', 'Suédois', 'Couronne suédoise (SEK)', 'Bokföringslagen (BFL) + IFRS',
    'KLASS 1 - ANLÄGGNINGSTILLGÅNGAR (Fixed Assets)
10 - Mark, byggnader och tekniska anläggningar
    101 - Mark
    102 - Markanläggningar
    103 - Byggnader
    104 - Maskiner och inventarier

11 - Maskiner och inventarier
    111 - Maskiner
    112 - Inventarier
    113 - Verktyg

12 - Finansiella anläggningstillgångar
    121 - Andelar i koncernföretag
    122 - Fordringar hos koncernföretag
    123 - Andelar i intresseföretag
    124 - Andra långfristiga värdepappersinnehav

KLASS 2 - OMSÄTTNINGSTILLGÅNGAR (Current Assets)
20 - Varulager m.m.
    201 - Råvaror och förnödenheter
    202 - Varor under tillverkning
    203 - Färdiga varor
    204 - Handelsvaror

24 - Kortfristiga fordringar
    241 - Kundfordringar
    242 - Fordringar hos koncernföretag
    243 - Fordringar hos intresseföretag
    244 - Övriga fordringar
    245 - Förutbetalda kostnader och upplupna intäkter

25 - Kortfristiga placeringar
    251 - Andelar i koncernföretag
    252 - Andelar i intresseföretag
    253 - Andra kortfristiga placeringar

26 - Kassa och bank
    261 - Kassa
    262 - Plusgiro
    263 - Bankgiro
    264 - Banktillgodohavanden

KLASS 3 - EGET KAPITAL (Equity)
30 - Eget kapital
    301 - Aktiekapital
    302 - Reservfond
    303 - Balanserat resultat
    304 - Årets resultat

KLASS 4 - LÅNGFRISTIGA SKULDER (Long-term Liabilities)
40 - Långfristiga skulder
    401 - Skulder till kreditinstitut
    402 - Skulder till koncernföretag
    403 - Skulder till intresseföretag
    404 - Övriga långfristiga skulder

KLASS 5 - KORTFRISTIGA SKULDER (Current Liabilities)
50 - Kortfristiga skulder
    501 - Skulder till kreditinstitut
    502 - Leverantörsskulder
    503 - Skulder till koncernföretag
    504 - Skulder till intresseföretag
    505 - Skatteskulder
    506 - Övriga skulder
    507 - Upplupna kostnader och förutbetalda intäkter

KLASS 6 - RÖRELSEKOSTNADER (Operating Expenses)
60 - Handelsvaror
    601 - Inköp handelsvaror
    602 - Förändring av lagret handelsvaror

61 - Råvaror och förnödenheter
    611 - Inköp råvaror
    612 - Förändring av lagret råvaror

62 - Övriga externa kostnader
    621 - Hyror
    622 - Reparationer och underhåll
    623 - Förbrukningsinventarier
    624 - Frakter och transporter
    625 - Resekostnader
    626 - Representation
    627 - Reklam
    628 - Övriga försäljningskostnader
    629 - Övriga externa kostnader

63 - Personalkostnader
    631 - Löner
    632 - Sociala avgifter
    633 - Pensionskostnader
    634 - Övriga personalkostnader

64 - Av- och nedskrivningar
    641 - Avskrivningar maskiner
    642 - Avskrivningar inventarier
    643 - Avskrivningar byggnader

65 - Övriga rörelsekostnader
    651 - Förlust vid försäljning av anläggningstillgångar
    652 - Nedskrivningar

KLASS 7 - RÖRELSEINTÄKTER (Operating Income)
70 - Försäljning
    701 - Försäljning varor
    702 - Försäljning tjänster

71 - Förändring av lager
    711 - Förändring färdiga varor
    712 - Förändring varor under tillverkning

72 - Aktiverat arbete för egen räkning
73 - Övriga rörelseintäkter
    731 - Hyresintäkter
    732 - Vinst vid försäljning av anläggningstillgångar
    733 - Erhållna bidrag

KLASS 8 - FINANSIELLA POSTER (Financial Items)
80 - Finansiella intäkter
    801 - Ränteintäkter
    802 - Utdelningar
    803 - Valutakursvinster

81 - Finansiella kostnader
    811 - Räntekostnader
    812 - Valutakursförluster',

    'Bokföringslagen (BFL) pour PME, IFRS pour groupes cotés. Particularités : system de réserves, taxe sur les salaires.',

    '/modeles/suede_bfl_arsredovisning.pdf - Balansräkning, Resultaträkning selon Bokföringslagen och Årsredovisningslagen',

    'HUVUDBOK → ÅRSREDOVISNING :
    BALANSRÄKNING :
    TILLGÅNGAR :
    - Anläggningstillgångar : Klass 1 (netto av avskrivningar)
    - Omsättningstillgångar : Klass 2
    
    EGET KAPITAL OCH SKULDER :
    - Eget kapital : Klass 3
    - Långfristiga skulder : Klass 4
    - Kortfristiga skulder : Klass 5
    
    RESULTATRÄKNING :
    - Rörelsens intäkter : Klass 7
    - Rörelsens kostnader : Klass 6
    - Rörelseresultat : Intäkter - Kostnader
    - Finansiella poster : Klass 8 (intäkter - kostnader)
    - Resultat före skatt : Rörelseresultat + Finansiella poster
    - Skatt på årets resultat
    - Årets resultat : Resultat före skatt - Skatt',

    'Bokföringsnämnden (BFN), Far (branschorganisation), Bokföringslagen (1999:1078)'
);

-- NORVÈGE
INSERT INTO referentiel_comptable_mondial (
    pays, langue_officielle, devise, systeme_comptable, plan_comptable_complet,
    particularites_notes, modeles_etats_financiers_pdf, tableau_correspondance_balance_etats, sources
) VALUES (
    'Norvège', 'Norvégien', 'Couronne norvégienne (NOK)', 'Regnskapsloven + IFRS',
    'KLASSE 1 - ANLEGGSMIDLER (Fixed Assets)
10 - Immaterielle eiendeler
    100 - Utviklingskostnader
    101 - Konsesjoner og lignende rettigheter
    102 - Goodwill

11 - Varige driftsmidler
    110 - Tomter
    111 - Bygninger
    112 - Maskiner og anlegg
    113 - Skip, rigger, fly
    114 - Inventar, verktøy, biler

12 - Finansielle anleggsmidler
    120 - Aksjer i datterselskap
    121 - Lån til datterselskap
    122 - Aksjer i tilknyttede selskap
    123 - Lån til tilknyttede selskap
    124 - Andre aksjer og andeler
    125 - Obligasjoner
    126 - Andre fordringer

KLASSE 2 - OMLØPSMIDLER (Current Assets)
20 - Varer
    200 - Råvarer
    201 - Varer under tilvirkning
    202 - Ferdigvarer
    203 - Handelsvarer

21 - Fordringer
    210 - Kundefordringer
    211 - Fordringer på datterselskap
    212 - Fordringer på tilknyttede selskap
    213 - Andre fordringer
    214 - Forskuddsbetalte kostnader

22 - Investeringer
    220 - Aksjer og andeler
    221 - Obligasjoner og andre fordringer

23 - Bankinnskudd, kontanter og lignende
    230 - Bankinnskudd
    231 - Kontanter

KLASSE 3 - EGENKAPITAL (Equity)
30 - Innskutt egenkapital
    300 - Aksjekapital
    301 - Overkurs

31 - Opptjent egenkapital
    310 - Fond for vurderingsforskjeller
    311 - Annen egenkapital
    312 - Udisponert overskudd

KLASSE 4 - GJELD (Liabilities)
40 - Avsetninger for forpliktelser
    400 - Pensjonsforpliktelser
    401 - Avsetning for garantier
    402 - Andre avsetninger

41 - Annen langsiktig gjeld
    410 - Konvertible lån
    411 - Obligasjonslån
    412 - Gjeld til kredittinstitusjoner
    413 - Gjeld til datterselskap
    414 - Gjeld til tilknyttede selskap
    415 - Annen langsiktig gjeld

42 - Kortsiktig gjeld
    420 - Gjeld til kredittinstitusjoner
    421 - Leverandørgjeld
    422 - Gjeld til datterselskap
    423 - Gjeld til tilknyttede selskap
    424 - Betalbar skatt
    425 - Skyldige offentlige avgifter
    426 - Utbytte
    427 - Annen kortsiktig gjeld
    428 - Påløpte kostnader

KLASSE 5 - KOSTNADER (Expenses)
50 - Varekostnader
    500 - Beholdningsendringer av ferdigvarer
    501 - Råvarer og innkjøpte halvfabrikata
    502 - Beholdningsendringer av råvarer

51 - Lønnskostnader
    510 - Lønn
    511 - Arbeidsgiveravgift
    512 - Pensjonskostnader
    513 - Andre lønnskostnader

52 - Andre driftskostnader
    520 - Husleie
    521 - Vedlikehold og reparasjoner
    522 - Reisekostnader
    523 - Kontorkostnader
    524 - Telefon og porto
    525 - Forsikringer
    526 - Revisjonshonorar
    527 - Annen fremmed tjeneste
    528 - Avskrivninger
    529 - Tap på fordringer

53 - Finanskostnader
    530 - Rentekostnader
    531 - Valutatap
    532 - Nedskriving av finansielle eiendeler

KLASSE 6 - INNTEKTER (Income)
60 - Salgsinntekter
    600 - Salg av varer
    601 - Salg av tjenester

61 - Andre driftsinntekter
    610 - Leieinntekter
    611 - Gevinst ved salg av anleggsmidler
    612 - Andre driftsinntekter

62 - Finansinntekter
    620 - Renteinntekter
    621 - Aksjeutbytte
    622 - Valutagevister
    623 - Gevinst ved salg av verdipapirer',

    'Regnskapsloven norvégien + IFRS pour groupes. Particularités : fonds pétrolier, TVA (merverdiavgift).',

    '/modeles/norvege_regnskapsloven_arsregnskap.pdf - Balanse, Resultatregnskap selon Regnskapsloven',

    'REGNSKAP → ÅRSREGNSKAP :
    BALANSE :
    EIENDELER :
    - Anleggsmidler : Klasse 1 (fratrukket avskrivninger)
    - Omløpsmidler : Klasse 2
    
    EGENKAPITAL OG GJELD :
    - Egenkapital : Klasse 3
    - Avsetninger : 40
    - Gjeld : 41-42
    
    RESULTATREGNSKAP :
    - Driftsinntekter : 60-61
    - Driftskostnader : 50-52
    - Driftsresultat : Inntekter - Kostnader
    - Finansinntekter : 62
    - Finanskostnader : 53
    - Resultat før skattekostnad : Driftsresultat + Fin.inntekter - Fin.kostnader
    - Skattekostnad
    - Årsresultat : Resultat før skatt - Skattekostnad',

    'Norsk Regnskapsstiftelse (NRS), Finanstilsynet, Regnskapsloven (1998)'
);

-- SUISSE
INSERT INTO referentiel_comptable_mondial (
    pays, langue_officielle, devise, systeme_comptable, plan_comptable_complet,
    particularites_notes, modeles_etats_financiers_pdf, tableau_correspondance_balance_etats, sources
) VALUES (
    'Suisse', 'Allemand, Français, Italien', 'Franc suisse (CHF)', 'Swiss GAAP FER + OR (Code des Obligations)',
    'AKTIVEN / ACTIF (ASSETS) - 1000-1999
Umlaufvermögen / Actif circulant (Current Assets) - 1000-1199
    1000 - Flüssige Mittel / Liquidités
    1001 - Kasse / Caisse
    1002 - Post- und Bankguthaben / Avoirs postaux et bancaires
    1100 - Kurzfristige Forderungen / Créances à court terme
    1101 - Forderungen aus Lieferungen / Créances commerciales
    1102 - Übrige Forderungen / Autres créances
    1103 - Aktive Rechnungsabgrenzung / Charges payées d\'avance
    1200 - Vorräte / Stocks
    1201 - Rohstoffe / Matières premières
    1202 - Hilfs- und Betriebsstoffe / Matières auxiliaires
    1203 - Unfertige Erzeugnisse / Produits semi-finis
    1204 - Fertige Erzeugnisse / Produits finis
    1205 - Handelswaren / Marchandises

Anlagevermögen / Actif immobilisé (Fixed Assets) - 1300-1999
    1300 - Finanzanlagen / Immobilisations financières
    1301 - Beteiligungen / Participations
    1302 - Darlehen / Prêts
    1400 - Sachanlagen / Immobilisations corporelles
    1401 - Grundstücke / Terrains
    1402 - Gebäude / Bâtiments
    1403 - Maschinen und Apparate / Machines et appareils
    1404 - Mobiliar und Einrichtungen / Mobilier et installations
    1405 - Fahrzeuge / Véhicules
    1406 - Wertberichtigungen / Corrections de valeur
    1500 - Immaterielle Werte / Valeurs immatérielles
    1501 - Patente und Lizenzen / Brevets et licences
    1502 - Goodwill / Goodwill

PASSIVEN / PASSIF (LIABILITIES AND EQUITY) - 2000-3999
Fremdkapital / Capitaux de tiers (Liabilities) - 2000-2999
Kurzfristiges Fremdkapital / Capitaux de tiers à court terme - 2000-2199
    2000 - Verbindlichkeiten / Dettes
    2001 - Verbindlichkeiten aus Lieferungen / Dettes commerciales
    2002 - Übrige Verbindlichkeiten / Autres dettes
    2003 - Passive Rechnungsabgrenzung / Produits reçus d\'avance
    2100 - Kurzfristige Finanzverbindlichkeiten / Dettes financières à court terme
    2101 - Bankverbindlichkeiten / Dettes bancaires

Langfristiges Fremdkapital / Capitaux de tiers à long terme - 2200-2999
    2200 - Langfristige Finanzverbindlichkeiten / Dettes financières à long terme
    2201 - Obligationenanleihen / Emprunts obligataires
    2202 - Hypotheken / Hypothèques
    2300 - Rückstellungen / Provisions
    2301 - Rückstellungen für Garantien / Provisions pour garanties
    2302 - Andere Rückstellungen / Autres provisions

Eigenkapital / Capitaux propres (Equity) - 3000-3999
    3000 - Aktienkapital / Capital-actions
    3001 - Gesetzliche Reserven / Réserves légales
    3002 - Freiwillige Reserven / Réserves libres
    3003 - Gewinnvortrag / Report de bénéfice
    3004 - Jahresgewinn / Bénéfice de l\'exercice

ERFOLGSRECHNUNG / COMPTE DE RÉSULTAT - 4000-6999
Betriebsertrag / Produits d\'exploitation - 4000-4999
    4000 - Netto-Erlöse / Chiffre d\'affaires net
    4001 - Bestandesänderungen / Variation des stocks
    4002 - Andere Betriebserträge / Autres produits d\'exploitation

Betriebsaufwand / Charges d\'exploitation - 5000-5999
    5000 - Materialaufwand / Charges de matières
    5001 - Rohstoffe / Matières premières
    5002 - Handelswaren / Marchandises
    5100 - Personalaufwand / Charges de personnel
    5101 - Löhne und Gehälter / Salaires
    5102 - Sozialversicherung / Assurances sociales
    5103 - Andere Personalaufwendungen / Autres charges de personnel
    5200 - Sonstiger Betriebsaufwand / Autres charges d\'exploitation
    5201 - Raumaufwand / Charges de locaux
    5202 - Unterhalt und Reparaturen / Entretien et réparations
    5203 - Fahrzeugaufwand / Charges de véhicules
    5204 - Versicherungen / Assurances
    5205 - Energie und Entsorgung / Énergie et élimination
    5206 - Verwaltungs- und Informatikaufwand / Charges administratives et informatiques
    5207 - Werbeaufwand / Charges de publicité
    5300 - Abschreibungen / Amortissements

Finanzergebnis / Résultat financier - 6000-6999
    6000 - Finanzertrag / Produits financiers
    6001 - Zinserträge / Produits d\'intérêts
    6002 - Wertschriftenerträge / Produits de titres
    6100 - Finanzaufwand / Charges financières
    6101 - Zinsaufwand / Charges d\'intérêts
    6102 - Bankspesen / Frais bancaires',

    'Code des Obligations suisse (art. 957-963) + Swiss GAAP FER. Particularités : réserves légales obligatoires, TVA suisse.',

    '/modeles/suisse_or_fer_jahresrechnung.pdf - Bilanz, Erfolgsrechnung selon Code des Obligations art. 958-959',

    'HAUPTBUCH → JAHRESRECHNUNG :
    BILANZ :
    AKTIVEN :
    - Umlaufvermögen : 1000-1299
    - Anlagevermögen : 1300-1999 (abzüglich Wertberichtigungen)
    
    PASSIVEN :
    - Fremdkapital kurzfristig : 2000-2199
    - Fremdkapital langfristig : 2200-2999
    - Eigenkapital : 3000-3999
    
    ERFOLGSRECHNUNG :
    - Betriebsertrag : 4000-4999
    - Betriebsaufwand : 5000-5999
    - Betriebsergebnis : Ertrag - Aufwand
    - Finanzertrag : 6000-6099
    - Finanzaufwand : 6100-6199
    - Finanzergebnis : Finanzertrag - Finanzaufwand
    - Ergebnis vor Steuern : Betriebsergebnis + Finanzergebnis
    - Steuern
    - Jahresergebnis : Ergebnis vor Steuern - Steuern',

    'EXPERTsuisse, FER (Fachempfehlungen zur Rechnungslegung), Code des Obligations (CO/OR)'
);

-- AFRIQUE DU SUD
INSERT INTO referentiel_comptable_mondial (
    pays, langue_officielle, devise, systeme_comptable, plan_comptable_complet,
    particularites_notes, modeles_etats_financiers_pdf, tableau_correspondance_balance_etats, sources
) VALUES (
    'Afrique du Sud', 'Anglais', 'Rand sud-africain (ZAR)', 'IFRS + South African GAAP',
    'ASSETS - 1000-1999
Non-current Assets - 1000-1499
    1001 - Property, Plant and Equipment
    1002 - Investment Property
    1003 - Intangible Assets
    1004 - Goodwill
    1005 - Investments in Subsidiaries
    1006 - Investments in Associates
    1007 - Available-for-sale Financial Assets
    1008 - Loans and Receivables
    1009 - Deferred Tax Assets

Current Assets - 1500-1999
    1501 - Inventories
    1502 - Trade and Other Receivables
    1503 - Current Tax Receivable
    1504 - Cash and Cash Equivalents
    1505 - Non-current Assets Held for Sale

EQUITY AND LIABILITIES - 2000-3999
Equity - 2000-2499
    2001 - Share Capital
    2002 - Share Premium
    2003 - Non-distributable Reserves
    2004 - Retained Earnings
    2005 - Non-controlling Interest

Non-current Liabilities - 2500-2799
    2501 - Interest-bearing Borrowings
    2502 - Deferred Tax Liabilities
    2503 - Provisions
    2504 - Post-employment Benefit Obligations

Current Liabilities - 2800-2999
    2801 - Trade and Other Payables
    2802 - Current Tax Payable
    2803 - Interest-bearing Borrowings
    2804 - Bank Overdraft
    2805 - Provisions

INCOME - 4000-4999
    4001 - Revenue
    4002 - Cost of Sales
    4101 - Other Income
    4102 - Investment Income
    4103 - Finance Income

EXPENSES - 5000-5999
    5001 - Selling and Distribution Expenses
    5002 - Administrative Expenses
    5003 - Other Operating Expenses
    5004 - Finance Costs
    5005 - Income Tax Expense',

    'Application intégrale des IFRS. Particularités : VAT (Value Added Tax), BEE (Black Economic Empowerment), JSE (Johannesburg Stock Exchange).',

    '/modeles/afrique_sud_ifrs_annual_financial_statements.pdf - Statement of Financial Position, Statement of Comprehensive Income selon IFRS',

    'TRIAL BALANCE → ANNUAL FINANCIAL STATEMENTS :
    STATEMENT OF FINANCIAL POSITION :
    ASSETS :
    - Non-current Assets : 1000-1499
    - Current Assets : 1500-1999
    
    EQUITY AND LIABILITIES :
    - Equity : 2000-2499
    - Non-current Liabilities : 2500-2799
    - Current Liabilities : 2800-2999
    
    STATEMENT OF COMPREHENSIVE INCOME :
    - Revenue : 4001
    - Cost of Sales : (4002)
    - Gross Profit : Revenue - Cost of Sales
    - Other Income : 4101-4103
    - Operating Expenses : (5001-5003)
    - Operating Profit : Gross Profit + Other Income - Operating Expenses
    - Finance Income : 4103
    - Finance Costs : (5004)
    - Profit Before Tax : Operating Profit + Finance Income - Finance Costs
    - Income Tax Expense : (5005)
    - Profit for the Year : PBT - Tax',

    'South African Institute of Chartered Accountants (SAICA), Financial Reporting Standards Council, Companies Act 71 of 2008'
);

-- =====================================================
-- PROCÉDURES AVANCÉES ET FONCTIONS UTILES
-- =====================================================

-- Procédure pour générer un rapport de comparaison détaillé
DELIMITER //
CREATE PROCEDURE ComparaisonDetailleeSystemes(IN pays1 VARCHAR(100), IN pays2 VARCHAR(100))
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_pays1, v_pays2 VARCHAR(100);
    DECLARE v_systeme1, v_systeme2 VARCHAR(100);
    DECLARE v_devise1, v_devise2 VARCHAR(50);
    
    SELECT pays, systeme_comptable, devise 
    INTO v_pays1, v_systeme1, v_devise1
    FROM referentiel_comptable_mondial WHERE pays = pays1;
    
    SELECT pays, systeme_comptable, devise 
    INTO v_pays2, v_systeme2, v_devise2
    FROM referentiel_comptable_mondial WHERE pays = pays2;
    
    SELECT 
        'COMPARAISON SYSTEMES COMPTABLES' as titre,
        v_pays1 as pays_1, v_systeme1 as systeme_1, v_devise1 as devise_1,
        v_pays2 as pays_2, v_systeme2 as systeme_2, v_devise2 as devise_2;
    
    -- Analyse des équivalences de comptes
    SELECT 
        'EQUIVALENCES DE COMPTES' as section,
        compte_source, libelle_source,
        compte_cible, libelle_cible,
        niveau_equivalence, notes_equivalence
    FROM equivalences_comptes 
    WHERE (pays_source = pays1 AND pays_cible = pays2) 
       OR (pays_source = pays2 AND pays_cible = pays1);
END //
DELIMITER ;

-- Fonction pour extraire une classe de comptes spécifique
DELIMITER //
CREATE FUNCTION ExtraireClasseComptes(nom_pays VARCHAR(100), classe_recherchee VARCHAR(10))
RETURNS TEXT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE resultat TEXT DEFAULT '';
    DECLARE plan_complet TEXT;
    
    SELECT plan_comptable_complet INTO plan_complet
    FROM referentiel_comptable_mondial 
    WHERE pays = nom_pays;
    
    -- Extraction basée sur des patterns communs
    IF classe_recherchee = 'ACTIF' OR classe_recherchee = 'ASSETS' THEN
        SET resultat = SUBSTRING_INDEX(SUBSTRING_INDEX(plan_complet, 'LIABILITIES', 1), 'ASSETS', -1);
    ELSEIF classe_recherchee = 'PASSIF' OR classe_recherchee = 'LIABILITIES' THEN
        SET resultat = SUBSTRING_INDEX(SUBSTRING_INDEX(plan_complet, 'EQUITY', 1), 'LIABILITIES', -1);
    ELSEIF classe_recherchee = 'CHARGES' OR classe_recherchee = 'EXPENSES' THEN
        SET resultat = SUBSTRING_INDEX(SUBSTRING_INDEX(plan_complet, 'REVENUES', 1), 'EXPENSES', -1);
    END IF;
    
    RETURN COALESCE(resultat, 'Classe non trouvée');
END //
DELIMITER ;

-- Vue pour analyse des convergences vers IFRS
CREATE VIEW convergence_ifrs AS
SELECT 
    pays,
    systeme_comptable,
    CASE 
        WHEN systeme_comptable LIKE '%IFRS%' THEN 'Application IFRS'
        WHEN systeme_comptable LIKE '%Convergence%' OR systeme_comptable LIKE '%FER%' THEN 'En convergence'
        ELSE 'Standards nationaux'
    END as statut_ifrs,
    devise,
    CASE 
        WHEN devise = 'Euro (EUR)' THEN 'Zone Euro'
        WHEN devise LIKE '%Dollar%' THEN 'Zone Dollar'
        ELSE 'Autre devise'
    END as zone_monetaire
FROM referentiel_comptable_mondial
ORDER BY statut_ifrs, zone_monetaire;

-- Table pour les mises à jour réglementaires
CREATE TABLE historique_mises_a_jour (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pays VARCHAR(100),
    date_mise_a_jour DATE,
    type_modification ENUM('Nouveau standard', 'Modification majeure', 'Mise à jour mineure'),
    description_modification TEXT,
    impact_plan_comptable TEXT,
    source_officielle VARCHAR(500),
    FOREIGN KEY (pays) REFERENCES referentiel_comptable_mondial(pays)
);

-- Exemples de mises à jour récentes
INSERT INTO historique_mises_a_jour VALUES
(1, 'France', '2024-01-01', 'Modification majeure', 'Application IFRS 16 Contrats de location', 'Nouveaux comptes 204x pour droits d\'usage', 'ANC - Règlement 2022-06'),
(2, 'États-Unis', '2023-12-15', 'Nouveau standard', 'ASC 842 - Leases implementation', 'Modification comptes 1200-1299 pour ROU assets', 'FASB ASC 842'),
(3, 'Allemagne', '2024-03-01', 'Mise à jour mineure', 'Adaptation directive européenne sustainability reporting', 'Ajout comptes ESG dans classe 1', 'DRSC Standard DRS 28');

-- =====================================================
-- VUES POUR REPORTING ET ANALYSE
-- =====================================================

-- Vue synthétique pour dashboard
CREATE VIEW dashboard_comptable_mondial AS
SELECT 
    COUNT(*) as total_pays,
    COUNT(DISTINCT systeme_comptable) as nb_systemes_differents,
    COUNT(DISTINCT devise) as nb_devises,
    SUM(CASE WHEN systeme_comptable LIKE '%IFRS%' THEN 1 ELSE 0 END) as pays_ifrs,
    SUM(CASE WHEN devise = 'Euro (EUR)' THEN 1 ELSE 0 END) as pays_zone_euro
FROM referentiel_comptable_mondial;

-- Vue des particularités fiscales par pays
CREATE VIEW particularites_fiscales AS
SELECT 
    pays,
    systeme_comptable,
    CASE 
        WHEN particularites_notes LIKE '%TVA%' OR particularites_notes LIKE '%VAT%' 
             OR particularites_notes LIKE '%IVA%' OR particularites_notes LIKE '%GST%' 
        THEN 'TVA/VAT applicable'
        ELSE 'Autre système fiscal'
    END as type_tva,
    CASE 
        WHEN particularites_notes LIKE '%IFRS%' THEN 'Convergence IFRS'
        WHEN particularites_notes LIKE '%prudence%' THEN 'Principe de prudence'
        ELSE 'Autres principes'
    END as principes_dominants
FROM referentiel_comptable_mondial;

-- =====================================================
-- FONCTIONS DE RECHERCHE AVANCÉE
-- =====================================================

-- Fonction pour rechercher des comptes similaires entre pays
DELIMITER //
CREATE FUNCTION RechercherComptesMultipays(terme_recherche VARCHAR(100))
RETURNS TEXT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE resultat TEXT DEFAULT '';
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_pays VARCHAR(100);
    DECLARE v_systeme VARCHAR(100);
    
    DECLARE cur CURSOR FOR 
        SELECT pays, systeme_comptable 
        FROM referentiel_comptable_mondial 
        WHERE plan_comptable_complet LIKE CONCAT('%', terme_recherche, '%');
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO v_pays, v_systeme;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        SET resultat = CONCAT(resultat, v_pays, ' (', v_systeme, '); ');
    END LOOP;
    
    CLOSE cur;
    RETURN COALESCE(NULLIF(resultat, ''), 'Aucun résultat');
END //
DELIMITER ;

-- Vue pour export vers outils BI
CREATE VIEW export_business_intelligence AS
SELECT 
    r.pays,
    r.langue_officielle,
    r.devise,
    r.systeme_comptable,
    o.nom_organisme as organisme_normalisation,
    o.type_organisme,
    LENGTH(r.plan_comptable_complet) as taille_plan_comptable,
    CASE 
        WHEN r.systeme_comptable LIKE '%IFRS%' THEN 1 
        ELSE 0 
    END as utilise_ifrs,
    r.date_maj
FROM referentiel_comptable_mondial r
LEFT JOIN organismes_normalisation o ON r.pays = o.pays
ORDER BY r.pays;

-- =====================================================
-- PROCÉDURES DE MAINTENANCE
-- =====================================================

-- Procédure de vérification de la cohérence des données
DELIMITER //
CREATE PROCEDURE VerifierCoherenceDonnees()
BEGIN
    DECLARE nb_erreurs INT DEFAULT 0;
    
    -- Vérification 1: Plans comptables non vides
    SELECT COUNT(*) INTO @nb_plans_vides
    FROM referentiel_comptable_mondial 
    WHERE plan_comptable_complet IS NULL OR LENGTH(plan_comptable_complet) < 100;
    
    IF @nb_plans_vides > 0 THEN
        SELECT CONCAT('ERREUR: ', @nb_plans_vides, ' pays avec plans comptables incomplets') as erreur;
        SET nb_erreurs = nb_erreurs + 1;
    END IF;
    
    -- Vérification 2: Correspondances balance/états non vides
    SELECT COUNT(*) INTO @nb_correspondances_vides
    FROM referentiel_comptable_mondial 
    WHERE tableau_correspondance_balance_etats IS NULL OR LENGTH(tableau_correspondance_balance_etats) < 50;
    
    IF @nb_correspondances_vides > 0 THEN
        SELECT CONCAT('ERREUR: ', @nb_correspondances_vides, ' pays sans tableaux de correspondance') as erreur;
        SET nb_erreurs = nb_erreurs + 1;
    END IF;
    
    -- Vérification 3: Sources renseignées
    SELECT COUNT(*) INTO @nb_sources_vides
    FROM referentiel_comptable_mondial 
    WHERE sources IS NULL OR LENGTH(sources) < 10;
    
    IF @nb_sources_vides > 0 THEN
        SELECT CONCAT('ERREUR: ', @nb_sources_vides, ' pays sans sources officielles') as erreur;
        SET nb_erreurs = nb_erreurs + 1;
    END IF;
    
    IF nb_erreurs = 0 THEN
        SELECT 'SUCCÈS: Toutes les vérifications de cohérence sont passées' as resultat;
    ELSE
        SELECT CONCAT('TOTAL: ', nb_erreurs, ' erreurs détectées') as resultat_final;
    END IF;
END //
DELIMITER ;

-- =====================================================
-- STATISTIQUES ET MÉTRIQUES
-- =====================================================

SELECT 'BASE DE DONNÉES COMPLÉTÉE AVEC SUCCÈS' as statut;
SELECT COUNT(*) as total_pays_inclus FROM referentiel_comptable_mondial;
SELECT COUNT(DISTINCT systeme_comptable) as systemes_uniques FROM referentiel_comptable_mondial;
SELECT COUNT(DISTINCT devise) as devises_uniques FROM referentiel_comptable_mondial;