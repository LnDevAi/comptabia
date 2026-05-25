export type DevisStatut = 'BROUILLON' | 'ENVOYE' | 'ACCEPTE' | 'REFUSE' | 'EXPIRE';

export interface LigneDevisForm {
  description:   string;
  quantite:      number;
  prixUnitaire:  number;
  tauxTva:       number;
  compteProduit: string;
  ordre:         number;
}

export interface LigneDevis extends LigneDevisForm {
  id:         string;
  montantHt:  number;
  montantTva: number;
  montantTtc: number;
}

export interface DevisResume {
  id:           string;
  numero:       string;
  dateDevis:    string;
  dateValidite: string | null;
  tiersId:      string | null;
  nomTiers:     string | null;
  statut:       DevisStatut;
  montantHt:    number;
  montantTva:   number;
  montantTtc:   number;
  factureId:    string | null;
  expire:       boolean;
}

export interface DevisDetail extends DevisResume {
  adresseTiers: string | null;
  objet:        string | null;
  conditions:   string | null;
  lignes:       LigneDevis[];
}

export interface DevisSaveRequest {
  dateDevis:    string;
  dateValidite?: string | null;
  tiersId?:     string | null;
  nomTiers?:    string;
  adresseTiers?:string;
  objet?:       string;
  conditions?:  string;
  lignes:       LigneDevisForm[];
}
