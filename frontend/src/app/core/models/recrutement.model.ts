export type TypeContrat    = 'CDI' | 'CDD' | 'STAGE' | 'FREELANCE';
export type StatutOffre    = 'OUVERTE' | 'EN_PAUSE' | 'FERMEE';
export type StatutCandidature = 'RECUE' | 'PRESELECTIONEE' | 'ENTRETIEN' | 'OFFRE' | 'EMBAUCHEE' | 'REFUSEE';
export type StatutPlan     = 'EN_COURS' | 'TERMINE';
export type CategorieTache = 'ADMIN' | 'IT' | 'RH' | 'METIER';

export interface OffreResponse {
  id:             string;
  titre:          string;
  departement:    string | null;
  description:    string | null;
  typeContrat:    TypeContrat;
  nbPostes:       number;
  statut:         StatutOffre;
  dateOuverture:  string | null;
  dateCloture:    string | null;
  nbCandidatures: number;
  createdAt:      string | null;
}

export interface OffreRequest {
  titre:         string;
  departement?:  string;
  description?:  string;
  typeContrat:   TypeContrat;
  nbPostes:      number;
  dateOuverture?: string;
  dateCloture?:   string;
}

export interface CandidatureResponse {
  id:             string;
  offreId:        string | null;
  offreTitre:     string | null;
  nomCandidat:    string;
  emailCandidat:  string | null;
  telephone:      string | null;
  statut:         StatutCandidature;
  notes:          string | null;
  createdAt:      string | null;
}

export interface CandidatureRequest {
  offreId?:       string;
  nomCandidat:    string;
  emailCandidat?: string;
  telephone?:     string;
  notes?:         string;
}

export interface TacheResponse {
  id:          string;
  titre:       string;
  description: string | null;
  categorie:   CategorieTache;
  ordre:       number;
  terminee:    boolean;
  dateLimite:  string | null;
}

export interface TacheRequest {
  titre:        string;
  description?: string;
  categorie:    CategorieTache;
  ordre:        number;
  dateLimite?:  string;
}

export interface PlanResponse {
  id:               string;
  collaborateurId:  string;
  collaborateurNom: string;
  titre:            string;
  dateEmbauche:     string | null;
  statut:           StatutPlan;
  nbTaches:         number;
  nbTerminees:      number;
  taches:           TacheResponse[];
  createdAt:        string | null;
}

export interface PlanRequest {
  collaborateurId: string;
  titre?:          string;
  dateEmbauche?:   string;
}

export const TYPE_CONTRAT_LABELS: Record<TypeContrat, string> = {
  CDI:       'CDI',
  CDD:       'CDD',
  STAGE:     'Stage',
  FREELANCE: 'Freelance',
};

export const STATUT_OFFRE_LABELS: Record<StatutOffre, string> = {
  OUVERTE:   'Ouverte',
  EN_PAUSE:  'En pause',
  FERMEE:    'Fermée',
};

export const STATUT_CANDIDATURE_LABELS: Record<StatutCandidature, string> = {
  RECUE:          'Reçue',
  PRESELECTIONEE: 'Présélectionnée',
  ENTRETIEN:      'Entretien',
  OFFRE:          'Offre faite',
  EMBAUCHEE:      'Embauchée',
  REFUSEE:        'Refusée',
};

export const CATEGORIE_TACHE_LABELS: Record<CategorieTache, string> = {
  ADMIN:  'Administration',
  IT:     'IT',
  RH:     'RH',
  METIER: 'Métier',
};

export const PIPELINE_STATUTS: StatutCandidature[] = [
  'RECUE', 'PRESELECTIONEE', 'ENTRETIEN', 'OFFRE', 'EMBAUCHEE', 'REFUSEE'
];
