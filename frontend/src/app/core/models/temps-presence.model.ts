export type PointageType   = 'NORMAL' | 'RETARD' | 'DEMI_JOURNEE';
export type AbsenceType    = 'MALADIE' | 'ACCIDENT_TRAVAIL' | 'SANS_SOLDE' | 'AUTRE';
export type AbsenceStatut  = 'EN_ATTENTE' | 'APPROUVEE' | 'REJETEE';

export interface PointageResponse {
  id:                  string;
  collaborateurId:     string;
  collaborateurNom:    string;
  datePointage:        string;
  heureArrivee:        string;
  heureDepart:         string | null;
  heuresTravaillees:   number | null;
  type:                PointageType;
  notes:               string | null;
}

export interface AbsenceResponse {
  id:               string;
  collaborateurId:  string;
  collaborateurNom: string;
  dateDebut:        string;
  dateFin:          string;
  typeAbsence:      AbsenceType;
  justificatif:     boolean;
  notes:            string | null;
  statut:           AbsenceStatut;
  createdAt:        string | null;
}

export interface EtatCollaborateur {
  collaborateurId:     string;
  collaborateurNom:    string;
  nbJoursTravailles:   number;
  nbRetards:           number;
  nbAbsences:          number;
  totalHeures:         number;
  pointages:           PointageResponse[];
  absences:            AbsenceResponse[];
}

export interface EtatMensuel {
  mois:           number;
  annee:          number;
  collaborateurs: EtatCollaborateur[];
}

export interface PointageRequest {
  collaborateurId: string;
  datePointage:    string;
  heureArrivee:    string;
  heureDepart?:    string | null;
  notes?:          string;
}

export interface AbsenceRequest {
  collaborateurId: string;
  dateDebut:       string;
  dateFin:         string;
  typeAbsence:     AbsenceType;
  justificatif:    boolean;
  notes?:          string;
}

export const ABSENCE_TYPE_LABELS: Record<AbsenceType, string> = {
  MALADIE:          'Maladie',
  ACCIDENT_TRAVAIL: 'Accident de travail',
  SANS_SOLDE:       'Sans solde',
  AUTRE:            'Autre',
};

export const MOIS_LABELS = [
  '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];
