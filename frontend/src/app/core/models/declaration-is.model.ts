export interface DeclarationIs {
  id: string | null;
  exercice: number;
  resultatComptable: number;
  reintagrations: number;
  deductions: number;
  resultatFiscal: number;
  tauxIs: number;
  isTheorique: number;
  minimumForfaitaire: number;
  isDu: number;
  statut: 'BROUILLON' | 'VALIDEE';
  ecritureId: string | null;
}

export interface SaveRequest {
  reintagrations: number;
  deductions: number;
  tauxIs: number;
  minimumForfaitaire: number;
}
