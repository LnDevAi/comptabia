export interface UtilisateurAdminResponse {
  id: string;
  nom: string;
  email: string;
  role: 'ADMIN' | 'COMPTABLE' | 'LECTEUR';
  actif: boolean;
  invitePending: boolean;
  totpEnabled: boolean;
  createdAt: string;
}

export interface InviteRequest {
  email: string;
  nom: string;
  role: 'ADMIN' | 'COMPTABLE' | 'LECTEUR';
}

export interface ChangeRoleRequest {
  role: 'ADMIN' | 'COMPTABLE' | 'LECTEUR';
}
