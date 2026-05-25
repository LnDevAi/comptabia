export interface EntrepriseParametres {
  id: string;
  nom: string;
  pays: string;
  nif: string | null;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  siteWeb: string | null;
  logoUrl: string | null;
  devise: string;
  tauxTvaDefaut: number;
  debutExerciceMois: number;
  systemeComptable: string;
  plan: string;
}
