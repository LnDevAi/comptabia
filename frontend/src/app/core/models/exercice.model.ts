export interface ExerciceComptable {
  id: string;
  annee: number;
  statut: 'OUVERT' | 'CLOTURE';
  dateOuverture: string;
  dateCloture: string | null;
  clotureAt: string | null;
}

export interface ClotureResponse {
  id: string;
  annee: number;
  statut: string;
  dateCloture: string;
  totalCharges: number;
  totalProduits: number;
  resultatNet: number;
}
