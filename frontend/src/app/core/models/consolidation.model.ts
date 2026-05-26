export type MethodeConsolidation =
  | 'INTEGRATION_GLOBALE'
  | 'INTEGRATION_PROPORTIONNELLE'
  | 'MISE_EN_EQUIVALENCE';

export interface MembreInfo {
  entrepriseId:        string;
  nom:                 string;
  pays:                string;
  tauxDetention:       number;
  methodeConsolidation: MethodeConsolidation;
}

export interface MembreRequest {
  entrepriseId:         string;
  tauxDetention:        number;
  methodeConsolidation: MethodeConsolidation;
}

export interface GroupeRequest {
  nom:         string;
  description: string;
  membres:     MembreRequest[];
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

export interface EliminationAppliquee {
  compteDebit:  string;
  compteCredit: string;
  libelle:      string;
  montant:      number;
}

export interface BilanConsolide {
  groupeNom:             string;
  exercice:              number;
  actif:                 PosteConsolide[];
  passif:                PosteConsolide[];
  totalActif:            number;
  totalPassif:           number;
  nbSocietes:            number;
  note:                  string;
  eliminationsAppliquees: EliminationAppliquee[];
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

export interface PosteTFT {
  libelle:  string;
  montant:  number;
}

export interface TFTConsolide {
  groupeNom:              string;
  exercice:               number;
  fluxExploitation:       PosteTFT[];
  totalFluxExploitation:  number;
  fluxInvestissement:     PosteTFT[];
  totalFluxInvestissement: number;
  fluxFinancement:        PosteTFT[];
  totalFluxFinancement:   number;
  variationTresorerie:    number;
  tresorerieOuverture:    number;
  tresorerieCloture:      number;
  nbSocietes:             number;
  note:                   string;
}

export interface EliminationRequest {
  compteDebit:  string;
  compteCredit: string;
  libelle:      string;
  exercice:     number;
  montant:      number;
}

export interface EliminationResponse {
  id:           string;
  compteDebit:  string;
  compteCredit: string;
  libelle:      string;
  exercice:     number;
  montant:      number;
}

export const METHODES_CONSOLIDATION: { value: MethodeConsolidation; label: string; description: string }[] = [
  { value: 'INTEGRATION_GLOBALE',         label: 'Intégration globale',          description: 'Contrôle exclusif > 50% — 100% des comptes intégrés' },
  { value: 'INTEGRATION_PROPORTIONNELLE', label: 'Intégration proportionnelle',  description: 'Contrôle conjoint — intégration au prorata du taux de détention' },
  { value: 'MISE_EN_EQUIVALENCE',         label: 'Mise en équivalence',           description: 'Influence notable 20-50% — seule la quote-part de capitaux propres est retenue' },
];
