export type TypeConge   = 'ANNUEL' | 'MALADIE' | 'SANS_SOLDE' | 'EXCEPTIONNEL' | 'MATERNITE' | 'PATERNITE';
export type StatutConge = 'BROUILLON' | 'SOUMISE' | 'APPROUVEE' | 'REJETEE';

export interface CongeResponse {
  id:                string;
  type:              TypeConge;
  typeIntitule:      string;
  dateDebut:         string;
  dateFin:           string;
  nombreJours:       number;
  motif:             string | null;
  statut:            StatutConge;
  commentaireRejet:  string | null;
  collaborateurId:   string;
  collaborateurNom:  string;
  createdAt:         string;
}

export interface CongeCalendrierItem {
  id:               string;
  collaborateurNom: string;
  type:             TypeConge;
  typeIntitule:     string;
  dateDebut:        string;
  dateFin:          string;
  nombreJours:      number;
}

export interface CongeSaveRequest {
  type:      TypeConge;
  dateDebut: string;
  dateFin:   string;
  motif:     string | null;
}

export interface CongeRejeterRequest {
  commentaire: string | null;
}
