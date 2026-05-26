export interface KpiEffectifs {
  nbActifs: number;
}

export interface KpiPaie {
  disponible:           boolean;
  mois:                 number;
  exercice:             number;
  nbSalaries:           number;
  masseSalarialeBrute:  number;
  netAPayer:            number;
  cotisationsPatronales: number;
}

export interface KpiConges {
  enAttente: number;
  enCours:   number;
}

export interface KpiDiscipline {
  dossiersEnCours: number;
}

export interface KpiFormation {
  sessionsEnCours:    number;
  inscriptionsActives: number;
}

export interface KpiEvaluations {
  enAttente: number;
}

export interface KpiNotesFrais {
  enAttente:        number;
  montantEnAttente: number;
}

export interface DashboardRh {
  effectifs:    KpiEffectifs;
  paie:         KpiPaie;
  conges:       KpiConges;
  discipline:   KpiDiscipline;
  formation:    KpiFormation;
  evaluations:  KpiEvaluations;
  notesFrais:   KpiNotesFrais;
}

export const MOIS_LABELS = [
  '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];
