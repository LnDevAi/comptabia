import { CategorieNoteFrais, StatutNoteFrais } from './note-frais.model';
import { StatutPret, TypePret } from './pret.model';

export interface PortailProfil {
  id:            string;
  nom:           string;
  email:         string;
  role:          'ADMIN' | 'COMPTABLE' | 'LECTEUR';
  nomEntreprise: string;
  createdAt:     string | null;
}

export interface PortailConge {
  id:          string;
  type:        string;
  dateDebut:   string;
  dateFin:     string;
  nombreJours: number;
  statut:      'BROUILLON' | 'SOUMISE' | 'APPROUVEE' | 'REJETEE';
  motif:       string | null;
}

export interface PortailNoteFrais {
  id:        string;
  titre:     string;
  categorie: CategorieNoteFrais;
  montant:   number;
  dateDebut: string;
  dateFin:   string;
  statut:    StatutNoteFrais;
}

export interface PortailPret {
  id:               string;
  typePret:         TypePret;
  montant:          number;
  nbEcheances:      number;
  montantEcheance:  number;
  dateDebut:        string;
  statut:           StatutPret;
  nbPrelevees:      number;
}

export interface PortailPointage {
  id:                string;
  datePointage:      string;
  heureArrivee:      string | null;
  heureDepart:       string | null;
  heuresTravaillees: number | null;
  type:              'NORMAL' | 'RETARD' | 'DEMI_JOURNEE';
}

export interface PortailTableau {
  profil:     PortailProfil;
  conges:     PortailConge[];
  notesFrais: PortailNoteFrais[];
  prets:      PortailPret[];
  pointages:  PortailPointage[];
}
