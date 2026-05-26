export type TypeAxe = 'PROJET' | 'BAILLEUR' | 'ACTIVITE' | 'CENTRE_COUT' | 'AUTRE';

export const TYPES_AXE: { value: TypeAxe; label: string; color: string }[] = [
  { value: 'PROJET',      label: 'Projet',           color: 'bg-blue-100 text-blue-700' },
  { value: 'BAILLEUR',    label: 'Bailleur',          color: 'bg-green-100 text-green-700' },
  { value: 'ACTIVITE',    label: 'Activité',          color: 'bg-purple-100 text-purple-700' },
  { value: 'CENTRE_COUT', label: 'Centre de coût',    color: 'bg-orange-100 text-orange-700' },
  { value: 'AUTRE',       label: 'Autre',             color: 'bg-gray-100 text-gray-600' },
];

export interface AxeAnalytique {
  id: string;
  code: string;
  intitule: string;
  actif: boolean;
  type: TypeAxe;
  montantBudget: number | null;
}

export interface LigneRapport {
  compteNumero: string;
  compteIntitule: string;
  debit: number;
  credit: number;
  solde: number;
}

export interface RapportAxe {
  axeId: string;
  axeCode: string;
  axeIntitule: string;
  axeType: TypeAxe;
  lignes: LigneRapport[];
  totalDebit: number;
  totalCredit: number;
  solde: number;
  montantBudget: number | null;
  tauxExecution: number | null;
}

export interface RapportAnalytique {
  periodeDebut: string;
  periodeFin: string;
  axes: RapportAxe[];
}
