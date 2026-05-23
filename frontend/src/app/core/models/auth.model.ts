export interface AuthResponse {
  token: string;
  email: string;
  nom: string;
  role: 'ADMIN' | 'COMPTABLE' | 'LECTEUR';
  entrepriseId: string;
  nomEntreprise: string;
}

export interface LoginPayload {
  email: string;
  motDePasse: string;
}

export interface RegisterPayload {
  nomEntreprise: string;
  pays: string;
  nomUtilisateur: string;
  email: string;
  motDePasse: string;
}

export interface TokenPayload {
  sub: string;
  entrepriseId: string;
  role: string;
  exp: number;
}

export interface ProfileResponse {
  id: string;
  nom: string;
  email: string;
  role: 'ADMIN' | 'COMPTABLE' | 'LECTEUR';
  entrepriseId: string;
  nomEntreprise: string;
  pays: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  createdAt: string;
}

export interface UpdateProfilePayload {
  nom?: string;
  email?: string;
  motDePasseActuel?: string;
  nouveauMotDePasse?: string;
}

export const OHADA_PAYS: { code: string; label: string }[] = [
  { code: 'BJ', label: 'Bénin' },
  { code: 'BF', label: 'Burkina Faso' },
  { code: 'CM', label: 'Cameroun' },
  { code: 'CF', label: 'Centrafrique' },
  { code: 'KM', label: 'Comores' },
  { code: 'CG', label: 'Congo' },
  { code: 'CD', label: 'RD Congo' },
  { code: 'CI', label: "Côte d'Ivoire" },
  { code: 'GA', label: 'Gabon' },
  { code: 'GN', label: 'Guinée' },
  { code: 'GW', label: 'Guinée-Bissau' },
  { code: 'GQ', label: 'Guinée Équatoriale' },
  { code: 'ML', label: 'Mali' },
  { code: 'NE', label: 'Niger' },
  { code: 'SN', label: 'Sénégal' },
  { code: 'TD', label: 'Tchad' },
  { code: 'TG', label: 'Togo' },
];
