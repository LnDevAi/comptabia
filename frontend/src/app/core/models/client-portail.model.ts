export interface PortailTokenResponse {
  token: string;
  nomTiers: string;
  nomEntreprise: string;
}

export interface FactureClientResponse {
  id: string;
  numero: string;
  dateFacture: string;
  dateEcheance: string | null;
  statut: 'EMISE' | 'PAYEE' | 'ANNULEE';
  montantHt: number;
  montantTva: number;
  montantTtc: number;
  nomEntreprise: string;
  createdAt: string;
}
