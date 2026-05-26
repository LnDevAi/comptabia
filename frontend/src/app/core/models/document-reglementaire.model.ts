export type CategorieDoc =
  | 'DECLARATION_EXISTENCE' | 'RECEPISSE' | 'PUBLICATION_JO'
  | 'STATUTS' | 'REGLEMENT_INTERIEUR'
  | 'PV_AG_ORDINAIRE' | 'PV_AG_EXTRAORDINAIRE'
  | 'RAPPORT_ACTIVITES' | 'RAPPORT_FINANCIER' | 'BUDGET_PREVISIONNEL'
  | 'REGISTRE_MEMBRES' | 'REGISTRE_COMPTABLE' | 'REGISTRE_ACTIFS'
  | 'MODIFICATION_STATUTS' | 'CHANGEMENT_DIRIGEANTS' | 'RENOUVELLEMENT_RECEPISSE'
  | 'CONVENTION_ETAT' | 'AUTRE';

export type StatutDoc = 'EN_ATTENTE' | 'DEPOSE' | 'VALIDE' | 'EXPIRE';

export interface DocumentReglementaireResponse {
  id: string;
  categorie: CategorieDoc;
  categorieLabel: string;
  nom: string;
  description: string | null;
  dateDepot: string | null;
  dateEcheance: string | null;
  statut: StatutDoc;
  hasFichier: boolean;
  nomFichierOriginal: string | null;
  tailleFichier: number | null;
  typeMime: string | null;
  notes: string | null;
  joursRestants: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentRequest {
  categorie: CategorieDoc;
  nom: string;
  description?: string;
  dateDepot?: string;
  dateEcheance?: string;
  notes?: string;
}

export interface UpdateDocumentRequest {
  nom?: string;
  description?: string;
  dateDepot?: string;
  dateEcheance?: string;
  statut?: StatutDoc;
  notes?: string;
}

export const CATEGORIES_DOC: { value: CategorieDoc; label: string }[] = [
  { value: 'DECLARATION_EXISTENCE',    label: "Déclaration d'existence" },
  { value: 'RECEPISSE',                label: 'Récépissé de déclaration' },
  { value: 'PUBLICATION_JO',           label: 'Publication Journal Officiel' },
  { value: 'STATUTS',                  label: 'Statuts' },
  { value: 'REGLEMENT_INTERIEUR',      label: 'Règlement intérieur' },
  { value: 'PV_AG_ORDINAIRE',          label: 'PV Assemblée Générale Ordinaire' },
  { value: 'PV_AG_EXTRAORDINAIRE',     label: 'PV Assemblée Générale Extraordinaire' },
  { value: 'RAPPORT_ACTIVITES',        label: "Rapport annuel d'activités" },
  { value: 'RAPPORT_FINANCIER',        label: 'Rapport financier annuel' },
  { value: 'BUDGET_PREVISIONNEL',      label: 'Budget prévisionnel' },
  { value: 'REGISTRE_MEMBRES',         label: 'Registre des membres' },
  { value: 'REGISTRE_COMPTABLE',       label: 'Registre de comptabilité' },
  { value: 'REGISTRE_ACTIFS',          label: 'Registre des actifs' },
  { value: 'MODIFICATION_STATUTS',     label: 'Déclaration modification statuts' },
  { value: 'CHANGEMENT_DIRIGEANTS',    label: 'Déclaration changement dirigeants' },
  { value: 'RENOUVELLEMENT_RECEPISSE', label: 'Renouvellement du récépissé' },
  { value: 'CONVENTION_ETAT',          label: "Convention avec l'État" },
  { value: 'AUTRE',                    label: 'Autre document' },
];
