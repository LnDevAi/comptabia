export interface LigneModele {
  id?: string;
  compteId: string;
  compteNumero?: string;
  compteIntitule?: string;
  libelle: string;
  debit: number;
  credit: number;
  ordre: number;
}

export interface ModeleRequest {
  nom: string;
  libelleDefaut: string;
  journal: 'AC' | 'BQ' | 'OD' | 'VT';
  lignes: LigneModele[];
}

export interface ModeleResponse {
  id: string;
  nom: string;
  libelleDefaut: string;
  journal: string;
  lignes: LigneModele[];
  createdAt: string;
}

export interface InstancierRequest {
  date: string;
  numeroPiece: string;
}
