export interface BalanceLigne {
  numero: string;
  intitule: string;
  classe: number;
  totalDebit: number;
  totalCredit: number;
  soldeDebiteur: number;
  soldeCrediteur: number;
}

export interface BalanceData {
  exercice: number;
  lignes: BalanceLigne[];
  totalDebit: number;
  totalCredit: number;
}

export interface PosteBilan {
  categorie: string;
  numero: string;
  intitule: string;
  montant: number;
}

export interface BilanData {
  exercice: number;
  actif: PosteBilan[];
  passif: PosteBilan[];
  totalActif: number;
  totalPassif: number;
}

export interface PosteResultat {
  numero: string;
  intitule: string;
  montant: number;
}

export interface CompteResultatData {
  exercice: number;
  charges: PosteResultat[];
  produits: PosteResultat[];
  totalCharges: number;
  totalProduits: number;
  resultat: number;
}

export interface MouvementGL {
  date: string;
  numeroPiece: string;
  libelle: string;
  journal: string;
  debit: number;
  credit: number;
  soldeCumule: number;
}

export interface GrandLivreData {
  exercice: number;
  compteNumero: string;
  compteIntitule: string;
  mouvements: MouvementGL[];
  totalDebit: number;
  totalCredit: number;
  solde: number;
}

export interface LigneJournal {
  compteNumero: string;
  compteIntitule: string;
  debit: number;
  credit: number;
}

export interface EcritureJournal {
  id: string;
  numeroPiece: string;
  date: string;
  libelle: string;
  journal: string;
  lignes: LigneJournal[];
  totalDebit: number;
  totalCredit: number;
}

export interface JournalLivreData {
  exercice: number;
  ecritures: EcritureJournal[];
}

export interface PosteSmt {
  numero: string;
  intitule: string;
  montant: number;
}

export interface EtatRecettesDepensesData {
  exercice: number;
  recettes: PosteSmt[];
  depenses: PosteSmt[];
  totalRecettes: number;
  totalDepenses: number;
  solde: number;
}

export interface MouvementTresorerie {
  numero: string;
  intitule: string;
  entrees: number;
  sorties: number;
  solde: number;
}

export interface EtatTresorerieData {
  exercice: number;
  comptes: MouvementTresorerie[];
  totalEntrees: number;
  totalSorties: number;
  solde: number;
}

export interface NoteAnnexe {
  id: string;
  exercice: number;
  titre: string;
  contenu: string;
  ordre: number;
  createdAt: string;
  updatedAt: string;
}

export interface NoteAnnexeCreate {
  exercice: number;
  titre: string;
  contenu: string;
  ordre: number;
}

export interface NoteAnnexeUpdate {
  titre?: string;
  contenu?: string;
  ordre?: number;
}

export interface FluxLigne {
  libelle: string;
  montant: number;
}

export interface FluxSection {
  titre: string;
  code:  string;
  lignes: FluxLigne[];
  total:  number;
}

export interface FluxTresorerieData {
  exercice:              number;
  operationnel:          FluxSection;
  investissement:        FluxSection;
  financement:           FluxSection;
  variationNette:        number;
  tresorerieOuverture:   number;
  tresorerieCloture:     number;
}

export type EtatTab = 'balance' | 'bilan' | 'compte-resultat' | 'grand-livre' | 'journal' | 'recettes-depenses' | 'tresorerie' | 'flux-tresorerie' | 'notes';
