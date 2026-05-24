export type UserRole = 'ADMIN' | 'COMPTABLE' | 'LECTEUR';

export interface UtilisateurAdmin {
  id: string;
  nom: string;
  email: string;
  role: UserRole;
  actif: boolean;
  createdAt: string;
}

export interface InviterRequest {
  nom: string;
  email: string;
  role: string;
  motDePasse: string;
}

export interface EntrepriseSettings {
  id: string;
  nom: string;
  pays: string;
  nif: string;
  plan: string;
  systemeComptable: 'NORMAL' | 'SMT';
}

export interface EntrepriseSettingsUpdate {
  nom?: string;
  pays?: string;
  nif?: string;
  systemeComptable?: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN:     'Administrateur',
  COMPTABLE: 'Comptable',
  LECTEUR:   'Lecteur',
};
