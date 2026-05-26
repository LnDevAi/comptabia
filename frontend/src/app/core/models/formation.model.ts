export type StatutFormation = 'PLANIFIE' | 'EN_COURS' | 'REALISE' | 'ANNULE';
export type StatutSession = 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';
export type StatutInscription = 'INSCRIT' | 'PRESENT' | 'ABSENT' | 'CERTIFIE';

export const DOMAINES = ['Comptabilité', 'Fiscalité', 'Informatique', 'Management', 'RH', 'Droit', 'Finance', 'Autre'];

export interface FormationResponse {
  id:          string;
  titre:       string;
  domaine:     string;
  objectif:    string | null;
  annee:       number;
  budgetPrevu: number | null;
  statut:      StatutFormation;
  nbSessions:  number;
  createdAt:   string;
}

export interface FormationSaveRequest {
  titre:       string;
  domaine:     string;
  objectif:    string | null;
  annee:       number;
  budgetPrevu: number | null;
}

export interface FormationUpdateRequest {
  titre?:       string;
  domaine?:     string;
  objectif?:    string | null;
  budgetPrevu?: number | null;
  statut?:      StatutFormation;
}

export interface SessionResponse {
  id:             string;
  formationId:    string;
  formationTitre: string;
  dateDebut:      string;
  dateFin:        string;
  lieu:           string | null;
  formateur:      string | null;
  nbPlaces:       number;
  nbInscrits:     number;
  coutReel:       number | null;
  statut:         StatutSession;
  createdAt:      string;
}

export interface SessionSaveRequest {
  formationId: string;
  dateDebut:   string;
  dateFin:     string;
  lieu:        string | null;
  formateur:   string | null;
  nbPlaces:    number;
  coutReel:    number | null;
}

export interface SessionUpdateRequest {
  dateDebut?:  string;
  dateFin?:    string;
  lieu?:       string | null;
  formateur?:  string | null;
  nbPlaces?:   number;
  coutReel?:   number | null;
  statut?:     StatutSession;
}

export interface InscriptionResponse {
  id:               string;
  sessionId:        string;
  collaborateurId:  string;
  collaborateurNom: string;
  statut:           StatutInscription;
  note:             number | null;
  commentaire:      string | null;
  createdAt:        string;
}

export interface BilanCollaborateur {
  collaborateurId:  string;
  collaborateurNom: string;
  nbFormations:     number;
  nbCertifications: number;
  domainesFormes:   string[];
  noteMoyenne:      number | null;
}
