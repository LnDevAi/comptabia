export type SensReleve   = 'DEBIT' | 'CREDIT';
export type StatutReleve = 'NON_RAPPROCHE' | 'RAPPROCHE';

export interface LigneReleve {
  id: string;
  dateReleve: string;
  reference: string | null;
  libelle: string;
  montant: number;
  sens: SensReleve;
  statut: StatutReleve;
  ligneEcritureId: string | null;
}

export interface LigneEcritureRapp {
  id: string;
  dateEcriture: string;
  numeroPiece: string;
  libelle: string;
  debit: number;
  credit: number;
  rapprochee: boolean;
}

export interface EtatRapprochement {
  compteNumero: string;
  soldeComptable: number;
  soldeReleve: number;
  ecart: number;
  nonRapprochesReleve: number;
  nonRapprochesEcriture: number;
  lignesReleve: LigneReleve[];
  lignesEcriture: LigneEcritureRapp[];
}

export interface ImportResult {
  imported: number;
  skipped: number;
}
