export type FactureStatut = 'BROUILLON' | 'EMISE' | 'PAYEE' | 'ANNULEE';

export interface LigneFactureForm {
  description:    string;
  quantite:       number;
  prixUnitaire:   number;
  tauxTva:        number;
  compteProduit:  string;
  ordre:          number;
}

export interface LigneFacture extends LigneFactureForm {
  id:          string;
  montantHt:   number;
  montantTva:  number;
  montantTtc:  number;
}

export interface FactureResume {
  id:           string;
  numero:       string;
  dateFacture:  string;
  dateEcheance: string | null;
  tiersId:      string | null;
  nomTiers:     string | null;
  statut:       FactureStatut;
  montantHt:    number;
  montantTva:   number;
  montantTtc:   number;
  enRetard:     boolean;
}

export interface FactureDetail extends FactureResume {
  adresseTiers: string | null;
  notes:        string | null;
  lignes:       LigneFacture[];
}

export interface FactureCreateRequest {
  dateFacture:   string;
  dateEcheance?: string | null;
  tiersId?:      string | null;
  nomTiers?:     string;
  adresseTiers?: string;
  notes?:        string;
  lignes:        LigneFactureForm[];
}

export interface PayerRequest {
  dateReglement:   string;
  compteReglement: string;
}
