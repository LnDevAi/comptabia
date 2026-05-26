export type CategorieRh =
  'MASSE_BRUTE' | 'COTISATIONS_PATRONALES' | 'COTISATIONS_SALARIALES' |
  'IMPOT_RETENU' | 'NET_A_PAYER';

export interface LigneBudgetRh {
  categorie: CategorieRh;
  libelleCategorie: string;
  mois: number;
  budget: number;
  realise: number;
  ecart: number;
  pctConsomme: number;
  id: string;
}

export interface ComparatifRh {
  exercice: number;
  lignes: LigneBudgetRh[];
  totalBudget: number;
  totalRealise: number;
  totalEcart: number;
}

export interface BudgetRhUpsertRequest {
  categorie: CategorieRh;
  mois: number;
  montant: number;
}

export const CATEGORIES_RH: { value: CategorieRh; label: string }[] = [
  { value: 'MASSE_BRUTE',           label: 'Masse salariale brute' },
  { value: 'COTISATIONS_PATRONALES',label: 'Cotisations patronales' },
  { value: 'COTISATIONS_SALARIALES',label: 'Cotisations salariales' },
  { value: 'IMPOT_RETENU',          label: 'Impôt retenu (IRPP/ICS)' },
  { value: 'NET_A_PAYER',           label: 'Net à payer' },
];

export const MOIS_LABELS: { [k: number]: string } = {
  0: 'Annuel', 1: 'Janvier', 2: 'Février', 3: 'Mars', 4: 'Avril',
  5: 'Mai', 6: 'Juin', 7: 'Juillet', 8: 'Août', 9: 'Septembre',
  10: 'Octobre', 11: 'Novembre', 12: 'Décembre',
};
