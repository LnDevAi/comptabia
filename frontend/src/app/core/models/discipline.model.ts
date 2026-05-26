export type TypeSanction = 'AVERTISSEMENT' | 'BLAME' | 'MISE_A_PIED' | 'LICENCIEMENT';
export type StatutDossier = 'EN_COURS' | 'CLOTURE' | 'ANNULE';
export type TypeEtape = 'CONVOCATION' | 'ENTRETIEN' | 'DECISION' | 'CLOTURE';

export interface EtapeResponse {
  id:          string;
  typeEtape:   TypeEtape;
  dateEtape:   string;
  description: string | null;
  createdAt:   string;
}

export interface DossierResponse {
  id:                  string;
  collaborateurId:     string;
  collaborateurNom:    string;
  typeSanction:        TypeSanction;
  motif:               string;
  description:         string | null;
  dateFaits:           string;
  dateConvocation:     string | null;
  dateEntretien:       string | null;
  dateNotification:    string | null;
  dureeJours:          number | null;
  statut:              StatutDossier;
  notes:               string | null;
  etapes:              EtapeResponse[];
  createdAt:           string;
}

export interface DossierSaveRequest {
  collaborateurId: string;
  typeSanction:    TypeSanction;
  motif:           string;
  description:     string | null;
  dateFaits:       string;
  dateConvocation: string | null;
  dureeJours:      number | null;
  notes:           string | null;
}

export interface DossierUpdateRequest {
  typeSanction?:     TypeSanction;
  motif?:            string;
  description?:      string | null;
  dateFaits?:        string;
  dateConvocation?:  string | null;
  dateEntretien?:    string | null;
  dateNotification?: string | null;
  dureeJours?:       number | null;
  statut?:           StatutDossier;
  notes?:            string | null;
}

export interface EtapeSaveRequest {
  typeEtape:   TypeEtape;
  dateEtape:   string;
  description: string | null;
}

export interface DossierResume {
  id:           string;
  typeSanction: TypeSanction;
  dateFaits:    string;
  statut:       StatutDossier;
}

export interface HistoriqueCollaborateur {
  collaborateurId:  string;
  collaborateurNom: string;
  nbDossiers:       number;
  nbEnCours:        number;
  dossiers:         DossierResume[];
}
