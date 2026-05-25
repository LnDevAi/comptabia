export interface MembreInfo {
  entrepriseId: string;
  nom:          string;
  pays:         string;
}

export interface GroupeRequest {
  nom:         string;
  description: string;
  membreIds:   string[];
}

export interface GroupeResponse {
  id:          string;
  nom:         string;
  description: string;
  membres:     MembreInfo[];
  createdAt:   string;
}

export interface PosteConsolide {
  categorie: string;
  numero:    string;
  intitule:  string;
  montant:   number;
}

export interface BilanConsolide {
  groupeNom:    string;
  exercice:     number;
  actif:        PosteConsolide[];
  passif:       PosteConsolide[];
  totalActif:   number;
  totalPassif:  number;
  nbSocietes:   number;
  note:         string;
}

export interface PosteResultat {
  numero:   string;
  intitule: string;
  montant:  number;
}

export interface CompteResultatConsolide {
  groupeNom:     string;
  exercice:      number;
  charges:       PosteResultat[];
  produits:      PosteResultat[];
  totalCharges:  number;
  totalProduits: number;
  resultat:      number;
  nbSocietes:    number;
  note:          string;
}
