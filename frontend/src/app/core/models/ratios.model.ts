export interface RatioItem {
  code:          string;
  libelle:       string;
  formule:       string;
  valeur:        number;
  interpretation:string;
  niveau:        'BON' | 'MOYEN' | 'FAIBLE' | 'INFO';
}

export interface RatioGroupe {
  titre:  string;
  ratios: RatioItem[];
}

export interface RatiosData {
  exercice:         number;
  groupes:          RatioGroupe[];
  totalActif:       number;
  chiffreAffaires:  number;
  resultatNet:      number;
  capitauxPropres:  number;
  dettesFinancieres:number;
  frng:             number;
  bfr:              number;
  tresorerieNette:  number;
}
