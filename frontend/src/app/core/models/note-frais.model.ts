export type CategorieNoteFrais = 'TRANSPORT' | 'HEBERGEMENT' | 'REPAS' | 'COMMUNICATION' | 'AUTRE';
export type StatutNoteFrais = 'BROUILLON' | 'SOUMISE' | 'APPROUVEE' | 'REJETEE' | 'REMBOURSEE';

export interface NoteFraisResume {
  id:               string;
  titre:            string;
  categorie:        CategorieNoteFrais;
  montant:          number;
  dateDebut:        string;
  dateFin:          string;
  statut:           StatutNoteFrais;
  collaborateurNom: string;
  createdAt:        string;
}

export interface NoteFraisResponse {
  id:                       string;
  titre:                    string;
  categorie:                CategorieNoteFrais;
  description:              string | null;
  montant:                  number;
  compteCharge:             string;
  dateDebut:                string;
  dateFin:                  string;
  statut:                   StatutNoteFrais;
  commentaireRejet:         string | null;
  collaborateurId:          string;
  collaborateurNom:         string;
  ecritureApprobationId:    string | null;
  ecritureRemboursementId:  string | null;
  createdAt:                string;
}

export interface NoteFraisSaveRequest {
  titre:       string;
  categorie:   CategorieNoteFrais;
  description: string | null;
  montant:     number;
  dateDebut:   string;
  dateFin:     string;
}

export interface RejeterRequest {
  commentaire: string | null;
}
