export type SensBudget = 'DEBIT' | 'CREDIT';

export interface LigneComparatif {
  compteNumero: string;
  intitule:     string;
  sens:         SensBudget;
  budget:       number;
  realise:      number;
  ecart:        number;
  pctConsomme:  number;
  budgetId:     string;
}

export interface MoisRealise {
  mois:      number;
  label:     string;
  realise:   number;
  cibleMois: number;
}

export interface BudgetComparatif {
  exercice:          number;
  totalBudget:       number;
  totalRealise:      number;
  totalEcart:        number;
  tauxConsommation:  number;
  nbDepassements:    number;
  lignes:            LigneComparatif[];
  tendanceMensuelle: MoisRealise[];
}

export interface BudgetUpsertRequest {
  compteNumero: string;
  montant:      number;
  sens:         SensBudget;
}
