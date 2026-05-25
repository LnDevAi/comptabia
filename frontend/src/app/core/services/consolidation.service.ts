import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  GroupeRequest, GroupeResponse,
  BilanConsolide, CompteResultatConsolide
} from '../models/consolidation.model';

@Injectable({ providedIn: 'root' })
export class ConsolidationService {
  private http = inject(HttpClient);
  private base = '/api/consolidation';

  listGroupes(): Observable<GroupeResponse[]> {
    return this.http.get<GroupeResponse[]>(`${this.base}/groupes`);
  }

  getGroupe(id: string): Observable<GroupeResponse> {
    return this.http.get<GroupeResponse>(`${this.base}/groupes/${id}`);
  }

  createGroupe(req: GroupeRequest): Observable<GroupeResponse> {
    return this.http.post<GroupeResponse>(`${this.base}/groupes`, req);
  }

  updateGroupe(id: string, req: GroupeRequest): Observable<GroupeResponse> {
    return this.http.put<GroupeResponse>(`${this.base}/groupes/${id}`, req);
  }

  deleteGroupe(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/groupes/${id}`);
  }

  getBilan(groupeId: string, exercice: number): Observable<BilanConsolide> {
    const params = new HttpParams().set('exercice', exercice);
    return this.http.get<BilanConsolide>(`${this.base}/groupes/${groupeId}/bilan`, { params });
  }

  getCompteResultat(groupeId: string, exercice: number): Observable<CompteResultatConsolide> {
    const params = new HttpParams().set('exercice', exercice);
    return this.http.get<CompteResultatConsolide>(`${this.base}/groupes/${groupeId}/compte-resultat`, { params });
  }
}
