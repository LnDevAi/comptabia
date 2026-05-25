export interface SemaineProjection {
  debutSemaine: string;
  finSemaine:   string;
  label:        string;
  entrees:      number;
  sorties:      number;
  soldeFin:     number;
  alerte:       boolean;
}

export interface FluxItem {
  id:        string;
  date:      string;
  type:      'ENCAISSEMENT' | 'DECAISSEMENT';
  libelle:   string;
  montant:   number;
  source:    string;
  categorie: string | null;
}

export interface PrevisionResponse {
  dateCalcul:    string;
  soldeCourant:  number;
  totalCreances: number;
  semaines:      SemaineProjection[];
  fluxDetails:   FluxItem[];
  seuilAlerte:   number;
}

export interface FluxManuelForm {
  dateFlux:    string;
  typeFlux:    'ENCAISSEMENT' | 'DECAISSEMENT';
  libelle:     string;
  montant:     number;
  recurrent:   boolean;
  periodicite: string;
  categorie:   string;
}

export interface FluxManuelResponse {
  id:          string;
  dateFlux:    string;
  typeFlux:    string;
  libelle:     string;
  montant:     number;
  recurrent:   boolean;
  periodicite: string | null;
  categorie:   string | null;
  actif:       boolean;
}
