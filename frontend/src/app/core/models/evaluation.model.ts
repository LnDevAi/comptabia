export type StatutEvaluation = 'BROUILLON' | 'SOUMISE' | 'VALIDEE';
export type PeriodeEvaluation = 'ANNUEL' | 'S1' | 'S2' | 'T1' | 'T2' | 'T3' | 'T4';

export interface ObjectifResponse {
  id:               string;
  collaborateurId:  string;
  collaborateurNom: string;
  annee:            number;
  titre:            string;
  description:      string | null;
  poids:            number;
  createdAt:        string;
}

export interface LigneResponse {
  id:            string;
  objectifId:    string;
  objectifTitre: string;
  objectifPoids: number;
  note:          number;
  commentaire:   string | null;
}

export interface EvaluationResponse {
  id:                string;
  collaborateurId:   string;
  collaborateurNom:  string;
  annee:             number;
  periode:           PeriodeEvaluation;
  statut:            StatutEvaluation;
  commentaireGlobal: string | null;
  scoreGlobal:       number | null;
  lignes:            LigneResponse[];
  createdAt:         string;
}

export interface ObjectifSaveRequest {
  titre:       string;
  description: string | null;
  poids:       number;
  annee:       number;
}

export interface LigneSaveRequest {
  objectifId:  string;
  note:        number;
  commentaire: string | null;
}

export interface EvaluationSaveRequest {
  commentaireGlobal: string | null;
  lignes:            LigneSaveRequest[];
}

export interface EvaluationCreateRequest {
  collaborateurId: string;
  annee:           number;
  periode:         PeriodeEvaluation;
}
