export type CategorieArticle =
  'MATIERE_PREMIERE' | 'PRODUIT_FINI' | 'MARCHANDISE' | 'CONSOMMABLE' | 'EMBALLAGE' | 'AUTRE';

export type TypeMouvement =
  'ENTREE' | 'SORTIE' | 'AJUSTEMENT_POS' | 'AJUSTEMENT_NEG' | 'TRANSFERT_ENTREE' | 'TRANSFERT_SORTIE';

export type AlerteNiveau = 'OK' | 'ALERTE' | 'RUPTURE';

export interface DepotResponse {
  id: string;
  code: string;
  nom: string;
  adresse: string;
  actif: boolean;
  createdAt: string;
}

export interface DepotRequest {
  code: string;
  nom: string;
  adresse?: string;
  actif: boolean;
}

export interface ArticleResponse {
  id: string;
  code: string;
  designation: string;
  description: string;
  categorie: CategorieArticle;
  uniteMesure: string;
  prixUnitaire: number;
  coutMoyen: number;
  stockMin: number;
  stockMax: number | null;
  stockActuel: number;
  valeurStock: number;
  compteStockNumero: string;
  compteChargeNumero: string;
  methodeEvaluation: 'CMUP' | 'FIFO';
  actif: boolean;
  notes: string;
  alerteNiveau: AlerteNiveau;
  createdAt: string;
}

export interface ArticleRequest {
  code: string;
  designation: string;
  description?: string;
  categorie: string;
  uniteMesure: string;
  prixUnitaire: number;
  stockMin: number;
  stockMax?: number;
  compteStockNumero?: string;
  compteChargeNumero?: string;
  methodeEvaluation: string;
  actif: boolean;
  notes?: string;
}

export interface MouvementResponse {
  id: string;
  articleId: string;
  articleCode: string;
  articleDesignation: string;
  depotId: string | null;
  depotNom: string | null;
  typeMouvement: TypeMouvement;
  quantite: number;
  prixUnitaire: number;
  montant: number;
  coutMoyenApres: number;
  reference: string;
  libelle: string;
  dateMouvement: string;
  createdAt: string;
}

export interface MouvementRequest {
  articleId: string;
  depotId?: string;
  typeMouvement: string;
  quantite: number;
  prixUnitaire?: number;
  reference?: string;
  libelle?: string;
  dateMouvement: string;
}

export interface LigneInventaire {
  articleId: string;
  code: string;
  designation: string;
  categorie: string;
  uniteMesure: string;
  stockTheorique: number;
  stockReel: number;
  ecart: number;
  coutMoyen: number;
  valeurEcart: number;
}

export interface AjustementInventaireRequest {
  lignes: { articleId: string; stockReel: number }[];
  date: string;
  reference?: string;
}

export interface StatsArticle {
  articleId: string;
  code: string;
  designation: string;
  stockActuel: number;
  coutMoyen: number;
  valeurStock: number;
  totalEntrees: number;
  totalSorties: number;
}

export interface DashboardStock {
  totalArticles: number;
  articlesEnRupture: number;
  articlesEnAlerte: number;
  valeurTotaleStock: number;
  articlesRupture: ArticleResponse[];
  derniersMovements: MouvementResponse[];
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
