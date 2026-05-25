import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CongeResponse, CongeCalendrierItem,
  CongeSaveRequest, CongeRejeterRequest
} from '../models/conge.model';

@Injectable({ providedIn: 'root' })
export class CongeService {
  private http = inject(HttpClient);
  private base = '/api/conges';

  findAll(): Observable<CongeResponse[]> {
    return this.http.get<CongeResponse[]>(this.base);
  }

  mesConges(): Observable<CongeResponse[]> {
    return this.http.get<CongeResponse[]>(`${this.base}/mes-conges`);
  }

  soumises(): Observable<CongeResponse[]> {
    return this.http.get<CongeResponse[]>(`${this.base}/soumises`);
  }

  calendrier(annee: number, mois: number): Observable<CongeCalendrierItem[]> {
    return this.http.get<CongeCalendrierItem[]>(`${this.base}/calendrier`, {
      params: { annee, mois }
    });
  }

  create(req: CongeSaveRequest): Observable<CongeResponse> {
    return this.http.post<CongeResponse>(this.base, req);
  }

  update(id: string, req: CongeSaveRequest): Observable<CongeResponse> {
    return this.http.put<CongeResponse>(`${this.base}/${id}`, req);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  soumettre(id: string): Observable<CongeResponse> {
    return this.http.post<CongeResponse>(`${this.base}/${id}/soumettre`, {});
  }

  approuver(id: string): Observable<CongeResponse> {
    return this.http.post<CongeResponse>(`${this.base}/${id}/approuver`, {});
  }

  rejeter(id: string, req: CongeRejeterRequest): Observable<CongeResponse> {
    return this.http.post<CongeResponse>(`${this.base}/${id}/rejeter`, req);
  }
}
