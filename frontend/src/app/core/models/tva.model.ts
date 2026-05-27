export interface LigneDetailTva {
  compteNumero: string;
  intitule: string;
  debit: number;
  credit: number;
  type: 'COLLECTEE' | 'DEDUCTIBLE';
}

export interface SimulationTva {
  periodeDebut: string;
  periodeFin: string;
  tvaCollectee: number;
  tvaDeductible: number;
  tvaADecaisser: number;
  detail: LigneDetailTva[];
  dejaDeclare: boolean;
}

export interface DeclarationTva {
  id: string;
  periodeDebut: string;
  periodeFin: string;
  tvaCollectee: number;
  tvaDeductible: number;
  tvaADecaisser: number;
  statut: 'BROUILLON' | 'VALIDEE';
  ecritureId: string | null;
  createdAt: string;
}

export interface MoisTva {
  mois: number;
  label: string;
  tvaCollectee: number;
  tvaDeductible: number;
  tvaADecaisser: number;
}

export interface StatAnnuelle {
  exercice: number;
  totalCollectee: number;
  totalDeductible: number;
  totalADecaisser: number;
  nbDeclarations: number;
  moisDeclares: number[];
  mensuel: MoisTva[];
}
