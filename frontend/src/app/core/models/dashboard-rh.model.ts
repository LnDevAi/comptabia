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

// ─── Comparatif N vs N-1 ─────────────────────────────────────────────────────

export interface ComparatifSection {
  valeurN:           number;
  valeurN1:          number;
  variation:         number;
  variationPourcent: number;
}

export interface PaiesMensuel {
  mois:        number;
  masseBrute:  number;
  netAPayer:   number;
  nbSalaries:  number;
}

export interface ComparatifRh {
  anneeN:              number;
  anneeN1:             number;
  masseSalariale:      ComparatifSection;
  netAPayer:           ComparatifSection;
  congesJours:         ComparatifSection;
  congesNb:            ComparatifSection;
  notesFraisMontant:   ComparatifSection;
  notesFraisNb:        ComparatifSection;
  paiesMensuellesN:    PaiesMensuel[];
  paiesMensuellesN1:   PaiesMensuel[];
}
