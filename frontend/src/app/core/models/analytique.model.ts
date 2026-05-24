export interface AxeAnalytique {
  id: string;
  code: string;
  intitule: string;
  actif: boolean;
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
  lignes: LigneRapport[];
  totalDebit: number;
  totalCredit: number;
  solde: number;
}

export interface RapportAnalytique {
  periodeDebut: string;
  periodeFin: string;
  axes: RapportAxe[];
}
