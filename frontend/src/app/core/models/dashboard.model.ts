export interface JournalStat {
  journal: string;
  count: number;
  totalDebit: number;
}

export interface MoisStat {
  mois: string;
  count: number;
  totalDebit: number;
}

export interface EcritureResume {
  id: string;
  numeroPiece: string;
  dateEcriture: string;
  libelle: string;
  journal: string;
  statut: string;
  totalDebit: number;
  totalCredit: number;
}

export interface DashboardData {
  totalComptes: number;
  comptesActifs: number;
  totalEcritures: number;
  brouillons: number;
  validees: number;
  cloturees: number;
  totalDebitValide: number;
  totalCreditValide: number;
  parJournal: JournalStat[];
  derniersMois: MoisStat[];
  dernieresEcritures: EcritureResume[];
}
