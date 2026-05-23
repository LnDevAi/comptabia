export interface Compte {
  id: string;
  numero: string;
  intitule: string;
  classe: number;
  actif: boolean;
  createdAt: string;
}

export interface CompteRequest {
  numero: string;
  intitule: string;
  classe: number;
}
