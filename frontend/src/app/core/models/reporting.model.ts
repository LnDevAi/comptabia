export interface SyntheseRh {
  nbCollaborateurs:            number;
  congesEnAttente:             number;
  absencesEnAttente:           number;
  notesFraisEnAttente:         number;
  montantNotesFraisEnAttente:  number;
  pretsEnCours:                number;
  encoursPrets:                number;
  documentsExpirant30j:        number;
  recrutementOuvert:           number;
  onboardingEnCours:           number;
}

export interface LigneConge {
  collaborateur: string;
  type:          string;
  dateDebut:     string;
  dateFin:       string;
  nombreJours:   number;
  statut:        string;
}

export interface RapportConges {
  annee:       number;
  nbTotal:     number;
  nbApprouves: number;
  totalJours:  number;
  lignes:      LigneConge[];
}

export interface LignePresence {
  collaborateur:    string;
  nbJoursTravailles: number;
  nbRetards:         number;
  nbAbsences:        number;
  totalHeures:       number;
}

export interface RapportPresences {
  mois:   number;
  annee:  number;
  lignes: LignePresence[];
}

export interface LigneNoteFrais {
  collaborateur: string;
  categorie:     string;
  titre:         string;
  montant:       number;
  dateDebut:     string;
  statut:        string;
}

export interface RapportNotesFrais {
  annee:        number;
  nbTotal:      number;
  montantTotal: number;
  lignes:       LigneNoteFrais[];
}

export interface LignePret {
  collaborateur: string;
  type:          string;
  montant:       number;
  nbEcheances:   number;
  nbPrelevees:   number;
  restantDu:     number;
  statut:        string;
}

export interface RapportPrets {
  lignes:        LignePret[];
  totalEncours:  number;
}

export const MOIS_LABELS = [
  '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];
