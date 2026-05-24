export type TypeTiers = 'CLIENT' | 'FOURNISSEUR' | 'AUTRE';

export interface Tiers {
  id: string;
  code: string;
  nom: string;
  type: TypeTiers;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  compteNumero: string | null;
  actif: boolean;
  createdAt: string;
}

export interface TiersStats {
  total: number;
  clients: number;
  fournisseurs: number;
  actifs: number;
}

export interface TiersRequest {
  code: string;
  nom: string;
  type: TypeTiers;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  compteNumero: string | null;
}
