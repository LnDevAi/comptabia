export type TypeAssocie = 'ASSOCIE' | 'GERANT' | 'ADMINISTRATEUR' | 'COMMISSAIRE_AUX_COMPTES' | 'OBSERVATEUR';
export type TypeAssemblee = 'AG_ORDINAIRE' | 'AG_EXTRAORDINAIRE' | 'CONSEIL_ADMINISTRATION' | 'AUTRE';
export type StatutAssemblee = 'PLANIFIEE' | 'TENUE' | 'CLOTUREE' | 'ANNULEE';
export type TypeResolution =
  | 'APPROBATION_COMPTES' | 'AFFECTATION_RESULTAT' | 'NOMINATION_REVOCATION'
  | 'MODIFICATION_STATUTS' | 'AUGMENTATION_CAPITAL' | 'REDUCTION_CAPITAL'
  | 'DISSOLUTION' | 'AUTRE';
export type StatutResolution = 'EN_ATTENTE' | 'ADOPTEE' | 'REJETEE';

export interface AssocieResponse {
  id: string;
  nom: string;
  prenom: string | null;
  email: string | null;
  telephone: string | null;
  typeAssocie: TypeAssocie;
  typeAssocieLabel: string;
  apport: number;
  pourcentage: number;
  dateEntree: string | null;
  dateSortie: string | null;
  actif: boolean;
  tokenPortail: string;
  urlPortail: string;
  notes: string | null;
  createdAt: string;
}

export interface CreateAssocieRequest {
  nom: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  typeAssocie?: TypeAssocie;
  apport?: number;
  pourcentage?: number;
  dateEntree?: string;
  notes?: string;
}

export interface UpdateAssocieRequest {
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  typeAssocie?: TypeAssocie;
  apport?: number;
  pourcentage?: number;
  dateSortie?: string;
  actif?: boolean;
  notes?: string;
}

export interface ResolutionResponse {
  id: string;
  numeroOrdre: number;
  titre: string;
  texte: string | null;
  typeResolution: TypeResolution;
  typeResolutionLabel: string;
  statut: StatutResolution;
  statutLabel: string;
  votesPour: number;
  votesContre: number;
  votesAbstention: number;
  createdAt: string;
}

export interface ResolutionRequest {
  numeroOrdre: number;
  titre: string;
  texte?: string;
  typeResolution?: TypeResolution;
  statut?: StatutResolution;
  votesPour?: number;
  votesContre?: number;
  votesAbstention?: number;
}

export interface AssembleeResponse {
  id: string;
  typeAssemblee: TypeAssemblee;
  typeAssembleeLabel: string;
  titre: string;
  dateAssemblee: string;
  lieu: string | null;
  exerciceConcerne: number | null;
  quorumRequis: number | null;
  quorumAtteint: number | null;
  statut: StatutAssemblee;
  statutLabel: string;
  ordreDuJour: string | null;
  procesVerbal: string | null;
  resolutions: ResolutionResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssembleeRequest {
  typeAssemblee?: TypeAssemblee;
  titre: string;
  dateAssemblee: string;
  lieu?: string;
  exerciceConcerne?: number;
  quorumRequis?: number;
  ordreDuJour?: string;
  resolutions?: ResolutionRequest[];
}

export interface UpdateAssembleeRequest {
  titre?: string;
  dateAssemblee?: string;
  lieu?: string;
  exerciceConcerne?: number;
  quorumRequis?: number;
  quorumAtteint?: number;
  statut?: StatutAssemblee;
  ordreDuJour?: string;
  procesVerbal?: string;
  resolutions?: ResolutionRequest[];
}

export interface EvolutionAnnuelle {
  exercice: number;
  totalActif: number;
  fondsPropres: number;
  resultatNet: number;
  chiffreAffaires: number;
}

export interface PortailDashboard {
  totalActif: number;
  fondsPropres: number;
  resultatNet: number;
  chiffreAffaires: number;
  exercice: number;
  evolution: EvolutionAnnuelle[];
}

export interface PortailAssocieResponse {
  nomEntreprise: string;
  nomAssocie: string;
  typeAssocie: string;
  pourcentage: number;
  assemblees: AssembleeResponse[];
  dashboard: PortailDashboard;
}

export const TYPES_ASSOCIE: { value: TypeAssocie; label: string }[] = [
  { value: 'ASSOCIE',                 label: 'Associé' },
  { value: 'GERANT',                  label: 'Gérant' },
  { value: 'ADMINISTRATEUR',          label: 'Administrateur' },
  { value: 'COMMISSAIRE_AUX_COMPTES', label: 'Commissaire aux comptes' },
  { value: 'OBSERVATEUR',             label: 'Observateur' },
];

export const TYPES_ASSEMBLEE: { value: TypeAssemblee; label: string }[] = [
  { value: 'AG_ORDINAIRE',         label: 'Assemblée Générale Ordinaire' },
  { value: 'AG_EXTRAORDINAIRE',    label: 'Assemblée Générale Extraordinaire' },
  { value: 'CONSEIL_ADMINISTRATION', label: "Conseil d'Administration" },
  { value: 'AUTRE',                label: 'Réunion / Décision' },
];

export const TYPES_RESOLUTION: { value: TypeResolution; label: string }[] = [
  { value: 'APPROBATION_COMPTES',   label: 'Approbation des comptes' },
  { value: 'AFFECTATION_RESULTAT',  label: 'Affectation du résultat' },
  { value: 'NOMINATION_REVOCATION', label: 'Nomination / Révocation' },
  { value: 'MODIFICATION_STATUTS',  label: 'Modification des statuts' },
  { value: 'AUGMENTATION_CAPITAL',  label: 'Augmentation de capital' },
  { value: 'REDUCTION_CAPITAL',     label: 'Réduction de capital' },
  { value: 'DISSOLUTION',           label: 'Dissolution' },
  { value: 'AUTRE',                 label: 'Autre décision' },
];
