export type TypePret    = 'PRET' | 'AVANCE';
export type StatutPret  = 'EN_ATTENTE' | 'APPROUVE' | 'EN_COURS' | 'SOLDE' | 'REFUSE';
export type StatutEcheance = 'EN_ATTENTE' | 'PRELEVE';

export interface EcheanceResponse {
  id:      string;
  numero:  number;
  mois:    number;
  annee:   number;
  montant: number;
  statut:  StatutEcheance;
}

export interface PretResponse {
  id:               string;
  collaborateurId:  string;
  collaborateurNom: string;
  typePret:         TypePret;
  montant:          number;
  nbEcheances:      number;
  montantEcheance:  number;
  dateDebut:        string;
  statut:           StatutPret;
  motif:            string | null;
  nbPrelevees:      number;
  echeances:        EcheanceResponse[];
  createdAt:        string | null;
}

export interface PretRequest {
  collaborateurId: string;
  typePret:        TypePret;
  montant:         number;
  nbEcheances:     number;
  dateDebut:       string;
  motif?:          string;
}

export const TYPE_PRET_LABELS: Record<TypePret, string> = {
  PRET:   'Prêt',
  AVANCE: 'Avance sur salaire',
};

export const STATUT_PRET_LABELS: Record<StatutPret, string> = {
  EN_ATTENTE: 'En attente',
  APPROUVE:   'Approuvé',
  EN_COURS:   'En cours',
  SOLDE:      'Soldé',
  REFUSE:     'Refusé',
};

export const MOIS_LABELS = [
  '', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
  'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
];
