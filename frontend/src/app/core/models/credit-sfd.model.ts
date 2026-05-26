export type StatutCredit = 'ACTIF' | 'EN_SOUFFRANCE' | 'DOUTEUX' | 'REMBOURSE' | 'PASSE_EN_PERTES';
export type TypeCredit = 'COURT_TERME' | 'MOYEN_TERME' | 'LONG_TERME' | 'MICRO_CREDIT';

export interface CreditSfdResponse {
  id: string;
  numeroCredit: string | null;
  nomClient: string;
  montantAccorde: number;
  montantEncours: number;
  dateDeblocage: string;
  dateEcheance: string | null;
  joursRetard: number;
  statut: StatutCredit;
  statutLabel: string;
  typeCredit: TypeCredit;
  typeCreditLabel: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCreditRequest {
  numeroCredit?: string;
  nomClient: string;
  montantAccorde: number;
  montantEncours?: number;
  dateDeblocage: string;
  dateEcheance?: string;
  joursRetard: number;
  typeCredit?: TypeCredit;
  notes?: string;
}

export interface UpdateCreditRequest {
  montantEncours?: number;
  joursRetard: number;
  statut?: StatutCredit;
  dateEcheance?: string;
  notes?: string;
}

export interface RepartitionType {
  typeCredit: TypeCredit;
  typeCreditLabel: string;
  nbCredits: number;
  encours: number;
  pourcentage: number;
}

export interface CreditSfdDashboard {
  nbCredits: number;
  encoursTotalActif: number;
  encoursPAR30: number;
  encoursPAR90: number;
  encoursEnSouffrance: number;
  encoursDouteux: number;
  ratioPAR30: number;
  ratioPAR90: number;
  totalActif: number;
  fondsPropres: number;
  totalDepots: number;
  pnb: number;
  resultat: number;
  car: number;
  roa: number;
  roe: number;
  creditDeposit: number;
  exploitation: number;
  repartitionParType: RepartitionType[];
}

export interface EtatResultatSfd {
  exercice: number;
  interetsCreditClientele: number;
  produitsInterbanc: number;
  produitsDiversBancaires: number;
  interetsSurDepots: number;
  chargesInterbanc: number;
  produitNetBancaire: number;
  chargesGeneralesExploitation: number;
  dotationsAmortProv: number;
  pertesCreancesIrrecouvr: number;
  autresChargesDiverses: number;
  reprisesProvisions: number;
  resultatExploitation: number;
  produitsExceptionnels: number;
  subventionsExploitation: number;
  chargesExceptionnelles: number;
  impotsSurResultats: number;
  resultatNet: number;
  ratioChargesPnb: number;
  ratioProvisionsPnb: number;
}

export const TYPES_CREDIT: { value: TypeCredit; label: string }[] = [
  { value: 'MICRO_CREDIT',  label: 'Micro-crédit' },
  { value: 'COURT_TERME',   label: 'Court terme' },
  { value: 'MOYEN_TERME',   label: 'Moyen terme' },
  { value: 'LONG_TERME',    label: 'Long terme' },
];

export const STATUTS_CREDIT: { value: StatutCredit; label: string }[] = [
  { value: 'ACTIF',           label: 'Actif' },
  { value: 'EN_SOUFFRANCE',   label: 'En souffrance' },
  { value: 'DOUTEUX',         label: 'Douteux' },
  { value: 'REMBOURSE',       label: 'Remboursé' },
  { value: 'PASSE_EN_PERTES', label: 'Passé en pertes' },
];
