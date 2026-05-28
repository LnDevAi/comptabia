export type FactureStatut = 'BROUILLON' | 'EMISE' | 'PAYEE' | 'ANNULEE';
export type StatutNormalisation = 'NON_NORMALISEE' | 'EN_ATTENTE' | 'NORMALISEE';

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
  id:                    string;
  numero:                string;
  dateFacture:           string;
  dateEcheance:          string | null;
  tiersId:               string | null;
  nomTiers:              string | null;
  statut:                FactureStatut;
  montantHt:             number;
  montantTva:            number;
  montantTtc:            number;
  enRetard:              boolean;
  statutNormalisation:   StatutNormalisation;
  estNormalisee:         boolean;
}

export interface FactureDetail extends FactureResume {
  adresseTiers:   string | null;
  ifuClient:      string | null;
  notes:          string | null;
  lignes:         LigneFacture[];
  nfn:            string | null;
  codeControle:   string | null;
}

export interface FactureCreateRequest {
  dateFacture:    string;
  dateEcheance?:  string | null;
  tiersId?:       string | null;
  nomTiers?:      string;
  adresseTiers?:  string;
  ifuClient?:     string;
  notes?:         string;
  lignes:         LigneFactureForm[];
}

export interface PayerRequest {
  dateReglement:   string;
  compteReglement: string;
}

export interface NormalisationRequest {
  nfn:          string;
  codeControle: string;
}

export interface MoisCA {
  mois:    number;
  label:   string;
  payees:  number;
  emises:  number;
  total:   number;
}

export interface StatFacturation {
  exercice:          number;
  totalFactures:     number;
  caTotalTtc:        number;
  caPayee:           number;
  caEmise:           number;
  tauxRecouvrement:  number;
  nbPayees:          number;
  nbEmises:          number;
  nbBrouillons:      number;
  nbAnnulees:        number;
  mensuel:           MoisCA[];
}
