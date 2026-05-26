export type TypeCompte = 'COURANT' | 'EPARGNE' | 'CAISSE' | 'AUTRE';
export type TypeMouvement =
  | 'VIREMENT_INTERNE' | 'REMISE_CHEQUES' | 'DEPOT_ESPECES'
  | 'RETRAIT_ESPECES' | 'FRAIS_BANCAIRES' | 'ENCAISSEMENT' | 'DECAISSEMENT' | 'AUTRE';

export interface CompteBancaireResponse {
  id: string;
  libelle: string;
  banque: string | null;
  iban: string | null;
  bic: string | null;
  compteComptableNumero: string | null;
  typeCompte: TypeCompte;
  soldeReel: number;
  soldeDate: string | null;
  seuilAlerte: number;
  actif: boolean;
  enAlerte: boolean;
  createdAt: string;
}

export interface CompteBancaireRequest {
  libelle: string;
  banque?: string;
  iban?: string;
  bic?: string;
  compteComptableNumero?: string;
  typeCompte?: TypeCompte;
  seuilAlerte?: number;
}

export interface SoldeRequest {
  solde: number;
  date: string;
}

export interface MouvementResponse {
  id: string;
  compteLibelle: string;
  compteDestLibelle: string | null;
  typeMouvement: TypeMouvement;
  libelle: string;
  montant: number;
  dateOperation: string;
  reference: string | null;
  createdAt: string;
}

export interface MouvementRequest {
  compteId: string;
  compteDestId?: string | null;
  typeMouvement: TypeMouvement | string;
  libelle: string;
  montant: number;
  dateOperation: string;
  reference?: string;
}

export interface AlerteResponse {
  id: string;
  compteLibelle: string;
  typeAlerte: string;
  message: string;
  soldeConstate: number | null;
  acquittee: boolean;
  createdAt: string;
}

export interface TresorerieDashboard {
  soldeConsolide: number;
  nombreComptes: number;
  alertesActives: number;
  comptes: CompteBancaireResponse[];
  derniersMovements: MouvementResponse[];
  alertesRecentes: AlerteResponse[];
}

export interface ImportOFXResult {
  imported: number;
  skipped: number;
  message: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
