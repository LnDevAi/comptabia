export type CoursNiveau    = 'DEBUTANT' | 'INTERMEDIAIRE' | 'AVANCE';
export type CoursCategorie =
  'SYSCOHADA' | 'OHADA' | 'COMPTABILITE' | 'FISCALITE' | 'TRESORERIE' |
  'PAIE_RH' | 'AUDIT' | 'BUDGET' | 'IMMOBILISATIONS' | 'FACTURATION' |
  'CRM' | 'PILOTAGE' | 'GOUVERNANCE' | 'ASSURANCE_CIMA' |
  'MICROFINANCE_SFD' | 'FINANCE_ISLAMIQUE';

export interface CoursResume {
  id: string;
  titre: string;
  description: string;
  niveau: CoursNiveau;
  categorie: CoursCategorie;
  dureeHeures: number;
  inscrit: boolean;
  progression: number;
  certifie: boolean;
  nbInscrits: number;
}

export interface ChapitreInfo {
  id: string;
  titre: string;
  contenu: string | null;
  ordre: number;
  dureeMinutes: number;
}

export interface QuestionInfo {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string | null;
  optionD: string | null;
}

export interface QuizInfo {
  id: string;
  titre: string;
  scoreMinimum: number;
  questions: QuestionInfo[];
}

export interface CoursDetail {
  id: string;
  titre: string;
  description: string;
  niveau: CoursNiveau;
  categorie: CoursCategorie;
  dureeHeures: number;
  chapitres: ChapitreInfo[];
  quiz: QuizInfo | null;
  inscrit: boolean;
  inscriptionId: string | null;
  progression: number;
  chapitresTermines: string[];
  certifie: boolean;
}

export interface InscriptionResume {
  id: string;
  coursId: string;
  coursTitre: string;
  coursCategorie: CoursCategorie;
  coursNiveau: CoursNiveau;
  dureeHeures: number;
  statut: 'EN_COURS' | 'TERMINE' | 'ABANDONNE';
  progression: number;
  dateDebut: string;
  dateFin: string | null;
}

export interface CertificatResponse {
  id: string;
  numeroCertificat: string;
  coursTitre: string;
  coursCategorie: CoursCategorie;
  coursNiveau: CoursNiveau;
  nomBeneficiaire: string;
  scoreObtenu: number;
  dateObtention: string;
}

export interface QuizSubmission {
  reponses: { questionId: string; reponse: string }[];
}

export interface QuizResult {
  scoreObtenu: number;
  scoreMinimum: number;
  reussi: boolean;
  certificat: CertificatResponse | null;
}

export interface DashboardStats {
  totalCours: number;
  mesFormations: number;
  mesFormationsTerminees: number;
  mesCertificats: number;
}

export const NIVEAU_LABELS: Record<CoursNiveau, string> = {
  DEBUTANT:      'Débutant',
  INTERMEDIAIRE: 'Intermédiaire',
  AVANCE:        'Avancé',
};

export const NIVEAU_CLASSES: Record<CoursNiveau, string> = {
  DEBUTANT:      'bg-green-100 text-green-700',
  INTERMEDIAIRE: 'bg-blue-100 text-blue-700',
  AVANCE:        'bg-purple-100 text-purple-700',
};

export const CATEGORIE_LABELS: Record<CoursCategorie, string> = {
  SYSCOHADA:        'SYSCOHADA',
  OHADA:            'OHADA',
  COMPTABILITE:     'Comptabilité',
  FISCALITE:        'Fiscalité',
  TRESORERIE:       'Trésorerie',
  PAIE_RH:          'Paie & RH',
  AUDIT:            'Audit',
  BUDGET:           'Budget',
  IMMOBILISATIONS:  'Immobilisations',
  FACTURATION:      'Facturation',
  CRM:              'CRM',
  PILOTAGE:         'Pilotage',
  GOUVERNANCE:      'Gouvernance',
  ASSURANCE_CIMA:   'Assurance CIMA',
  MICROFINANCE_SFD: 'Microfinance SFD',
  FINANCE_ISLAMIQUE:'Finance Islamique',
};
