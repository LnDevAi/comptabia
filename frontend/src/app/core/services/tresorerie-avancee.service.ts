import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CompteBancaireResponse, CompteBancaireRequest, SoldeRequest,
  MouvementResponse, MouvementRequest, AlerteResponse,
  TresorerieDashboard, ImportOFXResult, PageResponse
} from '../models/tresorerie-avancee.model';

@Injectable({ providedIn: 'root' })
export class TresorerieAvanceeService {
  private http = inject(HttpClient);
  private base = '/api/tresorerie';

  dashboard(): Observable<TresorerieDashboard> {
    return this.http.get<TresorerieDashboard>(`${this.base}/dashboard`);
  }

  listComptes(): Observable<CompteBancaireResponse[]> {
    return this.http.get<CompteBancaireResponse[]>(`${this.base}/comptes`);
  }

  createCompte(dto: CompteBancaireRequest): Observable<CompteBancaireResponse> {
    return this.http.post<CompteBancaireResponse>(`${this.base}/comptes`, dto);
  }

  updateCompte(id: string, dto: CompteBancaireRequest): Observable<CompteBancaireResponse> {
    return this.http.put<CompteBancaireResponse>(`${this.base}/comptes/${id}`, dto);
  }

  updateSolde(id: string, dto: SoldeRequest): Observable<CompteBancaireResponse> {
    return this.http.patch<CompteBancaireResponse>(`${this.base}/comptes/${id}/solde`, dto);
  }

  deleteCompte(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/comptes/${id}`);
  }

  listMouvements(compteId?: string, page = 0, size = 30): Observable<PageResponse<MouvementResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (compteId) params = params.set('compteId', compteId);
    return this.http.get<PageResponse<MouvementResponse>>(`${this.base}/mouvements`, { params });
  }

  createMouvement(dto: MouvementRequest): Observable<MouvementResponse> {
    return this.http.post<MouvementResponse>(`${this.base}/mouvements`, dto);
  }

  deleteMouvement(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/mouvements/${id}`);
  }

  listAlertes(acquittees = false): Observable<AlerteResponse[]> {
    const params = new HttpParams().set('acquittees', acquittees);
    return this.http.get<AlerteResponse[]>(`${this.base}/alertes`, { params });
  }

  acquitter(id: string): Observable<AlerteResponse> {
    return this.http.patch<AlerteResponse>(`${this.base}/alertes/${id}/acquitter`, {});
  }

  importerOFX(compteNumero: string, file: File): Observable<ImportOFXResult> {
    const form = new FormData();
    form.append('file', file);
    const params = new HttpParams().set('compteNumero', compteNumero);
    return this.http.post<ImportOFXResult>(`${this.base}/import-ofx`, form, { params });
  }
}
