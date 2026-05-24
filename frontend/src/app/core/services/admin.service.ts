import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  UtilisateurAdmin, InviterRequest, EntrepriseSettings, EntrepriseSettingsUpdate
} from '../models/admin.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly base = '/api/admin';
  constructor(private http: HttpClient) {}

  listerUtilisateurs()                          { return this.http.get<UtilisateurAdmin[]>(`${this.base}/utilisateurs`); }
  inviterUtilisateur(req: InviterRequest)        { return this.http.post<UtilisateurAdmin>(`${this.base}/utilisateurs/inviter`, req); }
  changerRole(id: string, role: string)          { return this.http.patch<UtilisateurAdmin>(`${this.base}/utilisateurs/${id}/role`, { role }); }
  changerActif(id: string, actif: boolean)       { return this.http.patch<UtilisateurAdmin>(`${this.base}/utilisateurs/${id}/actif`, { actif }); }

  getSettings()                                  { return this.http.get<EntrepriseSettings>(`${this.base}/entreprise`); }
  updateSettings(req: EntrepriseSettingsUpdate)  { return this.http.patch<EntrepriseSettings>(`${this.base}/entreprise`, req); }
}
