export type CategorieImmo = 'CORPORELLE' | 'INCORPORELLE' | 'FINANCIERE';
export type StatutImmo   = 'ACTIF' | 'CEDE' | 'RETIRE';

export interface Immobilisation {
  id: string;
  code: string;
  designation: string;
  categorie: CategorieImmo;
  compteNumero: string | null;
  compteAmortNumero: string | null;
  dateAcquisition: string;
  valeurBrute: number;
  dureeAmortissement: number;
  methode: string;
  statut: StatutImmo;
  dateCession: string | null;
  cumulAmortissement: number;
  valeurNette: number;
  createdAt: string;
}

export interface LignePlan {
  exercice: number;
  dotation: number;
  cumulAmortissement: number;
  valeurNette: number;
  comptabilisee: boolean;
}

export interface PlanAmortissement {
  immobilisationId: string;
  code: string;
  designation: string;
  valeurBrute: number;
  dureeAmortissement: number;
  methode: string;
  lignes: LignePlan[];
}

export interface DotationResult {
  immobilisationId: string;
  exercice: number;
  dotation: number;
  ecritureId: string | null;
}

export interface ImmoStats {
  totalActifs: number;
  valeurBrute: number;
  cumulAmortissements: number;
  valeurNette: number;
}

export interface ImmoRequest {
  code: string;
  designation: string;
  categorie: CategorieImmo;
  compteNumero: string | null;
  compteAmortNumero: string | null;
  dateAcquisition: string;
  valeurBrute: number;
  dureeAmortissement: number;
  methode?: string;
}
