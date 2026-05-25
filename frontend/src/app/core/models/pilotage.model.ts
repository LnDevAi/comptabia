export interface KpiAnnuel {
  exercice:    number;
  ca:          number;
  charges:     number;
  resultatNet: number;
  margeNette:  number;
  frng:        number;
  bfr:         number;
  tn:          number;
}

export interface ChargePoste {
  code:        string;
  libelle:     string;
  montant:     number;
  pourcentage: number;
}

export interface RatioCle {
  code:    string;
  libelle: string;
  valeur:  number;
  niveau:  'BON' | 'MOYEN' | 'FAIBLE';
}

export interface PilotageData {
  exercice:        number;
  evolution:       KpiAnnuel[];
  charges:         ChargePoste[];
  ratiosCles:      RatioCle[];
  ca:              number;
  resultatNet:     number;
  frng:            number;
  bfr:             number;
  tresorerieNette: number;
}
