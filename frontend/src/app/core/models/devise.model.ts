export interface TauxResponse {
  id:         string;
  devise:     string;
  dateTaux:   string;
  taux:       number;
  createdAt:  string;
}

export interface TauxLatest {
  devise:   string;
  taux:     number;
  dateTaux: string;
}

export interface SoldeDevise {
  devise:           string;
  totalDebitDevise: number;
  totalCreditDevise: number;
  soldeDevise:      number;
  tauxActuel:       number;
  soldeXof:         number;
}

export interface TauxRequest {
  devise:   string;
  dateTaux: string;
  taux:     number;
}

export interface ConversionRequest {
  montant:      number;
  deviseSource: string;
  deviseCible:  string;
  date:         string;
}

export interface ConversionResponse {
  montantSource: number;
  deviseSource:  string;
  montantCible:  number;
  deviseCible:   string;
  taux:          number;
  date:          string;
}
