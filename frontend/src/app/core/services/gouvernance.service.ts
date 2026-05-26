import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AssocieResponse, CreateAssocieRequest, UpdateAssocieRequest,
  AssembleeResponse, CreateAssembleeRequest, UpdateAssembleeRequest,
  PortailAssocieResponse
} from '../models/gouvernance.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GouvernanceService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/gouvernance`;

  // ─── Associés ──────────────────────────────────────────────────────────────

  listerAssocies(): Observable<AssocieResponse[]> {
    return this.http.get<AssocieResponse[]>(`${this.base}/associes`);
  }

  creerAssocie(req: CreateAssocieRequest): Observable<AssocieResponse> {
    return this.http.post<AssocieResponse>(`${this.base}/associes`, req);
  }

  mettreAJourAssocie(id: string, req: UpdateAssocieRequest): Observable<AssocieResponse> {
    return this.http.patch<AssocieResponse>(`${this.base}/associes/${id}`, req);
  }

  regenererToken(id: string): Observable<AssocieResponse> {
    return this.http.post<AssocieResponse>(`${this.base}/associes/${id}/regenerer-token`, {});
  }

  supprimerAssocie(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/associes/${id}`);
  }

  // ─── Assemblées ────────────────────────────────────────────────────────────

  listerAssemblees(): Observable<AssembleeResponse[]> {
    return this.http.get<AssembleeResponse[]>(`${this.base}/assemblees`);
  }

  getAssemblee(id: string): Observable<AssembleeResponse> {
    return this.http.get<AssembleeResponse>(`${this.base}/assemblees/${id}`);
  }

  creerAssemblee(req: CreateAssembleeRequest): Observable<AssembleeResponse> {
    return this.http.post<AssembleeResponse>(`${this.base}/assemblees`, req);
  }

  mettreAJourAssemblee(id: string, req: UpdateAssembleeRequest): Observable<AssembleeResponse> {
    return this.http.patch<AssembleeResponse>(`${this.base}/assemblees/${id}`, req);
  }

  supprimerAssemblee(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/assemblees/${id}`);
  }

  // ─── Portail associé (public) ──────────────────────────────────────────────

  getPortail(token: string): Observable<PortailAssocieResponse> {
    return this.http.get<PortailAssocieResponse>(
      `${environment.apiUrl}/portail-associe/${token}`
    );
  }
}
