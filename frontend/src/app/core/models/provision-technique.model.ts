export type TypeProvision =
  | 'PPNA' | 'PRC' | 'PSAP' | 'RISQUES_CROISSANTS'
  | 'PM_VIE' | 'PPB' | 'EGALISATION' | 'CATASTROPHES' | 'AUTRES';

export type Branche = 'VIE' | 'NON_VIE' | 'MIXTE';

export interface ProvisionTechniqueResponse {
  id: string;
  typeProvision: TypeProvision;
  typeLabel: string;
  branche: Branche;
  exercice: number;
  dateCalcul: string;
  montant: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProvisionRequest {
  typeProvision: TypeProvision;
  branche: Branche;
  exercice: number;
  dateCalcul: string;
  montant: number;
  notes?: string;
}

export interface UpdateProvisionRequest {
  montant?: number;
  dateCalcul?: string;
  notes?: string;
}

export interface TotalParType {
  typeProvision: TypeProvision;
  typeLabel: string;
  branche: Branche;
  total: number;
}

export interface ProvisionDashboard {
  exercice: number;
  totalProvisionsTechniques: number;
  totalPlacements: number;
  totalFondsPropres: number;
  primesAcquises: number;
  sinistresPayes: number;
  fraisAcquisitionEtAdministration: number;
  totauxParType: TotalParType[];
  ratioCouvertureProvisions: number;
  ratioMargeSolvabilite: number;
  ratioSinistralite: number;
  ratioFrais: number;
  ratioCombinaison: number;
}

export interface BilanCimaPoste {
  rubrique: string;
  numero: string;
  intitule: string;
  montant: number;
}

export interface BilanCima {
  exercice: number;
  actifIncorporelEtCorporel: BilanCimaPoste[];
  placements: BilanCimaPoste[];
  operationsAssuranceActif: BilanCimaPoste[];
  autresActifs: BilanCimaPoste[];
  tresorerie: BilanCimaPoste[];
  totalActif: number;
  fondsPropres: BilanCimaPoste[];
  provisionsTechniques: BilanCimaPoste[];
  autresPassifs: BilanCimaPoste[];
  totalPassif: number;
}

export interface CompteResultatCima {
  exercice: number;
  primesAcquisesNonVie: number;
  primesCedeesNonVie: number;
  primesNettesNonVie: number;
  produitsPlacementsAlloues: number;
  autresProduitsTechniquesNonVie: number;
  sinistresEtFraisNonVie: number;
  variationProvisionsNonVie: number;
  fraisAcquisitionNonVie: number;
  fraisAdministrationNonVie: number;
  autresChargesTechniquesNonVie: number;
  resultatTechniqueNonVie: number;
  primesAcquisesVie: number;
  primesCedeesVie: number;
  primesNettesVie: number;
  produitsPlacementsVie: number;
  prestationsVie: number;
  variationProvisionsMathematiques: number;
  participationsBeneficesVie: number;
  fraisGestionVie: number;
  resultatTechniqueVie: number;
  produitsPlacementsNet: number;
  fraisGestionPlacements: number;
  autresProduitsNonTechniques: number;
  chargesNonTechniques: number;
  resultatAvantIS: number;
  impotsSurResultats: number;
  resultatNet: number;
}

export const TYPES_PROVISION: { value: TypeProvision; label: string }[] = [
  { value: 'PPNA',               label: 'Provisions pour primes non acquises (PPNA)' },
  { value: 'PRC',                label: 'Provisions pour risques en cours (PRC)' },
  { value: 'PSAP',               label: 'Provisions pour sinistres à payer (PSAP)' },
  { value: 'RISQUES_CROISSANTS', label: 'Provisions pour risques croissants' },
  { value: 'PM_VIE',             label: 'Provisions mathématiques (Vie)' },
  { value: 'PPB',                label: 'Provisions pour participation aux bénéfices' },
  { value: 'EGALISATION',        label: "Provisions d'égalisation" },
  { value: 'CATASTROPHES',       label: 'Provisions pour catastrophes' },
  { value: 'AUTRES',             label: 'Autres provisions techniques' },
];
