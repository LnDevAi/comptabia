import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  GroupeRequest, GroupeResponse,
  BilanConsolide, CompteResultatConsolide, TFTConsolide,
  EliminationRequest, EliminationResponse
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

  listEliminations(groupeId: string, exercice: number): Observable<EliminationResponse[]> {
    const params = new HttpParams().set('exercice', exercice);
    return this.http.get<EliminationResponse[]>(`${this.base}/groupes/${groupeId}/eliminations`, { params });
  }

  addElimination(groupeId: string, req: EliminationRequest): Observable<EliminationResponse> {
    return this.http.post<EliminationResponse>(`${this.base}/groupes/${groupeId}/eliminations`, req);
  }

  deleteElimination(groupeId: string, elimId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/groupes/${groupeId}/eliminations/${elimId}`);
  }

  getBilan(groupeId: string, exercice: number): Observable<BilanConsolide> {
    const params = new HttpParams().set('exercice', exercice);
    return this.http.get<BilanConsolide>(`${this.base}/groupes/${groupeId}/bilan`, { params });
  }

  getCompteResultat(groupeId: string, exercice: number): Observable<CompteResultatConsolide> {
    const params = new HttpParams().set('exercice', exercice);
    return this.http.get<CompteResultatConsolide>(`${this.base}/groupes/${groupeId}/compte-resultat`, { params });
  }

  getTFT(groupeId: string, exercice: number): Observable<TFTConsolide> {
    const params = new HttpParams().set('exercice', exercice);
    return this.http.get<TFTConsolide>(`${this.base}/groupes/${groupeId}/tft`, { params });
  }
}
