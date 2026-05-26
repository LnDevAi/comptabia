export type LicenceModule =
  | 'COMPTABILITE' | 'TIERS' | 'IMMOBILISATIONS' | 'FISCAL'
  | 'BUDGET' | 'TRESORERIE' | 'FACTURATION' | 'EXPORT' | 'DOCUMENTS'
  | 'PAIE_RH' | 'CRM' | 'IA' | 'CONSOLIDATION' | 'AUDIT'
  | 'PILOTAGE' | 'ASSURANCE' | 'MICROFINANCE' | 'FINANCE_ISLAMIQUE' | 'GOUVERNANCE';

export interface LicenceInfo {
  licenceId: string;
  clientName: string;
  clientId: string;
  modules: LicenceModule[];
  maxUsers: number;
  issuedAt: string;
  expiresAt: string;
  fingerprint: string | null;
}

export interface LicenceStatus {
  valid: boolean;
  info: LicenceInfo | null;
  error: string | null;
}
