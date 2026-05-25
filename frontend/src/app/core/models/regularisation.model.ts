export type TypeRegularisation = 'CCA' | 'PCA' | 'CAP' | 'PAR';
export type StatutRegularisation = 'EN_ATTENTE' | 'COMPTABILISEE' | 'EXTOURNEE';

export interface RegularisationResponse {
  id:                   string;
  type:                 TypeRegularisation;
  libelle:              string;
  compteContrepartie:   string;
  montant:              number;
  exercice:             number;
  dateRegularisation:   string;
  dateExtourne:         string;
  statut:               StatutRegularisation;
  ecritureId:           string | null;
  ecritureExtourneId:   string | null;
  compteRegularisation: string;
  description:          string;
}

export interface RegularisationSaveRequest {
  type:               TypeRegularisation;
  libelle:            string;
  compteContrepartie: string;
  montant:            number;
  exercice:           number;
  dateRegularisation: string;
  dateExtourne:       string;
}
