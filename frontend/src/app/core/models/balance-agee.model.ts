export interface Buckets {
  j0:    number;
  j30:   number;
  j60:   number;
  j90:   number;
  total: number;
}

export interface LigneTiers {
  nom:          string;
  code:         string;
  compteNumero: string;
  buckets:      Buckets;
}

export interface BalanceAgeeResponse {
  type:        'CLIENT' | 'FOURNISSEUR';
  dateArrete:  string;
  lignes:      LigneTiers[];
  totaux:      Buckets;
}
