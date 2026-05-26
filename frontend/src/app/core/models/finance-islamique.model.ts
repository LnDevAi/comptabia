export type TypeProduitIslamique =
  | 'MOURABAHA' | 'IJARA' | 'IJARA_IMB' | 'MOUDARABA'
  | 'MOUCHARAKA' | 'SALAM' | 'ISTISNAA' | 'QARD_HASSAN' | 'SUKUK';

export type StatutProduit = 'ACTIF' | 'EN_RETARD' | 'DOUTEUX' | 'CLOTURE' | 'PASSE_EN_PERTES';
export type StatutZakat = 'CALCULE' | 'VERSE_PARTIELLEMENT' | 'VERSE_INTEGRALEMENT';

export interface ProduitIslamiqueResponse {
  id: string;
  reference: string | null;
  nomClient: string;
  typeProduit: TypeProduitIslamique;
  typeProduitLabel: string;
  montantFinancement: number;
  montantEncours: number;
  margeBeneficiaire: number;
  tauxMarge: number;
  dateContrat: string;
  dateEcheance: string | null;
  joursRetard: number;
  statut: StatutProduit;
  statutLabel: string;
  objetFinancement: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProduitRequest {
  reference?: string;
  nomClient: string;
  typeProduit?: TypeProduitIslamique;
  montantFinancement: number;
  montantEncours?: number;
  margeBeneficiaire?: number;
  tauxMarge?: number;
  dateContrat: string;
  dateEcheance?: string;
  joursRetard: number;
  objetFinancement?: string;
  notes?: string;
}

export interface UpdateProduitRequest {
  montantEncours?: number;
  joursRetard: number;
  statut?: StatutProduit;
  margeBeneficiaire?: number;
  dateEcheance?: string;
  notes?: string;
}

export interface RepartitionTypeIslamique {
  typeProduit: TypeProduitIslamique;
  typeProduitLabel: string;
  nbContrats: number;
  encours: number;
  marges: number;
  pourcentage: number;
}

export interface IslamiqueDashboard {
  nbContrats: number;
  encoursTotalActif: number;
  encoursPAR30: number;
  margeTotale: number;
  ratioPAR30: number;
  pourcentageParticipatifsVsTotal: number;
  rendementMoyen: number;
  totalActif: number;
  fondsPropres: number;
  totalDepots: number;
  produitNetIslamique: number;
  resultat: number;
  zakatDue: number;
  zakatVersee: number;
  repartitionParType: RepartitionTypeIslamique[];
}

export interface ZakatResponse {
  id: string;
  exercice: number;
  dateCalcul: string;
  baseZakatable: number;
  tauxZakat: number;
  montantZakat: number;
  montantVerse: number;
  resteAVerser: number;
  statut: StatutZakat;
  statutLabel: string;
  notes: string | null;
  createdAt: string;
}

export interface ZakatCreateRequest {
  exercice: number;
  dateCalcul?: string;
  baseZakatable?: number;
  tauxZakat?: number;
  notes?: string;
}

export interface ZakatUpdateRequest {
  montantVerse?: number;
  statut?: StatutZakat;
  notes?: string;
}

export interface EtatResultatIslamique {
  exercice: number;
  margesMourabaha: number;
  loyersIjara: number;
  quotesPartsMoudarabaMoucharaka: number;
  profitsSukuk: number;
  produitsInterbanc: number;
  chargesRessources: number;
  chargesDepots: number;
  produitNetIslamique: number;
  chargesGenerales: number;
  dotationsAmortProv: number;
  pertesIrrecouvr: number;
  chargesDiverses: number;
  reprises: number;
  resultatExploitation: number;
  zakatDue: number;
  produitsExceptionnels: number;
  chargesExceptionnelles: number;
  impots: number;
  resultatNet: number;
  ratioChargesPni: number;
  ratioZakatResultat: number;
}

export const TYPES_PRODUIT_ISLAMIQUE: { value: TypeProduitIslamique; label: string; description: string }[] = [
  { value: 'MOURABAHA',   label: 'Mourabaha',                  description: 'Vente avec marge bénéficiaire' },
  { value: 'IJARA',       label: 'Ijara',                      description: 'Crédit-bail islamique' },
  { value: 'IJARA_IMB',   label: 'Ijara Muntahia Bittamlik',   description: 'Leasing avec option d\'achat' },
  { value: 'MOUDARABA',   label: 'Moudaraba',                  description: 'Partenariat capital / travail' },
  { value: 'MOUCHARAKA',  label: 'Moucharaka',                  description: 'Participation aux bénéfices et pertes' },
  { value: 'SALAM',       label: 'Salam',                      description: 'Vente à terme (agriculture)' },
  { value: 'ISTISNAA',    label: 'Istisnaa',                   description: 'Fabrication sur commande' },
  { value: 'QARD_HASSAN', label: 'Qard Hassan',                description: 'Prêt bienveillant sans marge' },
  { value: 'SUKUK',       label: 'Sukuk',                      description: 'Obligations islamiques' },
];
