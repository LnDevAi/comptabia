import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  UtilisateurAdminResponse,
  InviteRequest,
  ChangeRoleRequest
} from '../models/utilisateurs-admin.model';

@Injectable({ providedIn: 'root' })
export class UtilisateursAdminService {

  private readonly http = inject(HttpClient);

  lister(): Observable<UtilisateurAdminResponse[]> {
    return this.http.get<UtilisateurAdminResponse[]>('/api/admin/utilisateurs');
  }

  inviter(req: InviteRequest): Observable<UtilisateurAdminResponse> {
    return this.http.post<UtilisateurAdminResponse>('/api/admin/utilisateurs/invite', req);
  }

  changerRole(id: string, req: ChangeRoleRequest): Observable<UtilisateurAdminResponse> {
    return this.http.patch<UtilisateurAdminResponse>(`/api/admin/utilisateurs/${id}/role`, req);
  }

  activer(id: string): Observable<UtilisateurAdminResponse> {
    return this.http.post<UtilisateurAdminResponse>(`/api/admin/utilisateurs/${id}/activer`, {});
  }

  desactiver(id: string): Observable<UtilisateurAdminResponse> {
    return this.http.post<UtilisateurAdminResponse>(`/api/admin/utilisateurs/${id}/desactiver`, {});
  }

  supprimer(id: string): Observable<void> {
    return this.http.delete<void>(`/api/admin/utilisateurs/${id}`);
  }
}
