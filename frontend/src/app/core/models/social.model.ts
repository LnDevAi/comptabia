export type StatutDeclarationSociale = 'A_FAIRE' | 'DECLAREE' | 'PAYEE';

export interface CotisationRefResponse {
  id:               string;
  codePays:         string;
  codeOrganisme:    string;
  libelleOrganisme: string;
  codeCotisation:   string;
  libelleCotisation:string;
  secteur:          string;
  tauxSalarie:      number;
  tauxPatronal:     number;
  plafondMensuel:   number | null;
  frequence:        string;
  delaiJours:       number;
}

export interface OrganismeResume {
  codeOrganisme:    string;
  libelleOrganisme: string;
  tauxSalarieTotal: number;
  tauxPatronalTotal:number;
  plafondMensuel:   number | null;
}

export interface CalculRequest {
  codeOrganisme: string;
  nbEmployes:    number;
  masseSalariale:number;
}

export interface CalculResult {
  codeOrganisme:              string;
  libelleOrganisme:           string;
  masseSalarialeBase:         number;
  masseSalarialeOuvrantDroit: number;
  montantSalarie:             number;
  montantPatronal:            number;
  montantTotal:               number;
  plafonneApplique:           boolean;
}

export interface DeclarationSocialeResponse {
  id:                string;
  codeOrganisme:     string;
  libelleOrganisme:  string;
  periode:           string;
  dateEcheance:      string;
  nbEmployes:        number;
  masseSalariale:    number;
  montantSalarie:    number;
  montantPatronal:   number;
  montantTotal:      number;
  statut:            StatutDeclarationSociale;
  referencePaiement: string | null;
  notes:             string | null;
  createdAt:         string;
}

export interface DeclarationSocialeSaveRequest {
  codeOrganisme:    string;
  libelleOrganisme: string;
  periode:          string;
  dateEcheance:     string;
  nbEmployes:       number;
  masseSalariale:   number;
  montantSalarie:   number;
  montantPatronal:  number;
  notes:            string | null;
}

export interface DeclarationSocialeUpdateRequest {
  statut?:            StatutDeclarationSociale;
  referencePaiement?: string | null;
  notes?:             string | null;
}
