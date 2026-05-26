import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DossierResponse, DossierSaveRequest, DossierUpdateRequest,
  EtapeResponse, EtapeSaveRequest, HistoriqueCollaborateur
} from '../models/discipline.model';

@Injectable({ providedIn: 'root' })
export class DisciplineService {
  private http = inject(HttpClient);
  private base = '/api/discipline';

  findAll(): Observable<DossierResponse[]> {
    return this.http.get<DossierResponse[]>(this.base);
  }

  findEnCours(): Observable<DossierResponse[]> {
    return this.http.get<DossierResponse[]>(`${this.base}/en-cours`);
  }

  findByCollaborateur(collabId: string): Observable<DossierResponse[]> {
    return this.http.get<DossierResponse[]>(`${this.base}/collaborateur/${collabId}`);
  }

  historique(): Observable<HistoriqueCollaborateur[]> {
    return this.http.get<HistoriqueCollaborateur[]>(`${this.base}/historique`);
  }

  create(req: DossierSaveRequest): Observable<DossierResponse> {
    return this.http.post<DossierResponse>(this.base, req);
  }

  update(id: string, req: DossierUpdateRequest): Observable<DossierResponse> {
    return this.http.put<DossierResponse>(`${this.base}/${id}`, req);
  }

  cloture(id: string): Observable<DossierResponse> {
    return this.http.post<DossierResponse>(`${this.base}/${id}/cloture`, {});
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  findEtapes(dossierId: string): Observable<EtapeResponse[]> {
    return this.http.get<EtapeResponse[]>(`${this.base}/${dossierId}/etapes`);
  }

  addEtape(dossierId: string, req: EtapeSaveRequest): Observable<EtapeResponse> {
    return this.http.post<EtapeResponse>(`${this.base}/${dossierId}/etapes`, req);
  }

  deleteEtape(etapeId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/etapes/${etapeId}`);
  }
}
