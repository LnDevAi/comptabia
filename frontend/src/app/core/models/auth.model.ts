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
