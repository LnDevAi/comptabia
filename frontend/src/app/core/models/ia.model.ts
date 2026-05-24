export type TypeDocument = 'FACTURE_ACHAT' | 'FACTURE_VENTE' | 'RECU' | 'AUTRE';

export interface LigneSuggeree {
  compteId: string | null;
  numeroCompte: string;
  libelleCompte: string;
  libelle: string;
  sens: 'DEBIT' | 'CREDIT';
  montant: number;
}

export interface ImputationSuggeree {
  libelleEcriture: string;
  journalSuggere: string;
  lignes: LigneSuggeree[];
}

export interface InvoiceAnalysis {
  typeDocument: TypeDocument;
  fournisseur: string;
  client: string;
  numeroDocument: string;
  dateDocument: string;
  description: string;
  montantHt: number;
  tauxTva: number;
  montantTva: number;
  montantTtc: number;
  devise: string;
  imputation: ImputationSuggeree;
  rawTextExtracted: string;
}

export const TYPE_DOCUMENT_LABELS: Record<TypeDocument, string> = {
  FACTURE_ACHAT: 'Facture d\'achat',
  FACTURE_VENTE: 'Facture de vente',
  RECU: 'Reçu de paiement',
  AUTRE: 'Autre document',
};

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  includeContext: boolean;
}

export interface ChatResponse {
  content: string;
}
