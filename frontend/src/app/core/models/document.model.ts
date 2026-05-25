export type EntiteType = 'ECRITURE' | 'FACTURE' | 'DEVIS';

export interface DocumentItem {
  id:          string;
  typeEntite:  string;
  entiteId:    string;
  nomFichier:  string;
  contentType: string;
  taille:      number;
  uploadedBy:  string | null;
  createdAt:   string;
}
