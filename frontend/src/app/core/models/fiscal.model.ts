export type StatutDeclarationFiscale = 'A_FAIRE' | 'EN_COURS' | 'DECLAREE' | 'PAYEE';
export type FrequenceFiscale = 'MENSUEL' | 'TRIMESTRIEL' | 'SEMESTRIEL' | 'ANNUEL';

export interface ObligationRefResponse {
  id:          string;
  codePays:    string;
  codeImpot:   string;
  libelle:     string;
  description: string | null;
  taux:        number | null;
  baseCalcul:  string | null;
  frequence:   FrequenceFiscale;
  delaiJours:  number;
  ordre:       number;
}

export interface DeclarationFiscaleResponse {
  id:                string;
  codeImpot:         string;
  libelle:           string;
  periode:           string;
  dateEcheance:      string;
  statut:            StatutDeclarationFiscale;
  montantBase:       number | null;
  montantImpot:      number | null;
  referencePaiement: string | null;
  notes:             string | null;
  createdAt:         string;
}

export interface CalendrierFiscalItem {
  codeImpot:     string;
  libelle:       string;
  periode:       string;
  dateEcheance:  string;
  statut:        StatutDeclarationFiscale | null;
  montantImpot:  number | null;
  declarationId: string | null;
}

export interface DeclarationFiscaleSaveRequest {
  codeImpot:    string;
  libelle:      string;
  periode:      string;
  dateEcheance: string;
  montantBase:  number | null;
  montantImpot: number | null;
  notes:        string | null;
}

export interface DeclarationFiscaleUpdateRequest {
  statut?:            StatutDeclarationFiscale;
  montantBase?:       number | null;
  montantImpot?:      number | null;
  referencePaiement?: string | null;
  notes?:             string | null;
}
