import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ObligationRefResponse, DeclarationFiscaleResponse, CalendrierFiscalItem,
  DeclarationFiscaleSaveRequest, DeclarationFiscaleUpdateRequest
} from '../models/fiscal.model';

@Injectable({ providedIn: 'root' })
export class GestionFiscaleService {
  private http = inject(HttpClient);
  private base = '/api/fiscal';

  refParPays(codePays: string): Observable<ObligationRefResponse[]> {
    return this.http.get<ObligationRefResponse[]>(`${this.base}/ref`, { params: { codePays } });
  }

  findAll(): Observable<DeclarationFiscaleResponse[]> {
    return this.http.get<DeclarationFiscaleResponse[]>(this.base);
  }

  findByAnnee(annee: number): Observable<DeclarationFiscaleResponse[]> {
    return this.http.get<DeclarationFiscaleResponse[]>(`${this.base}/annee/${annee}`);
  }

  calendrier(annee: number): Observable<CalendrierFiscalItem[]> {
    return this.http.get<CalendrierFiscalItem[]>(`${this.base}/calendrier/${annee}`);
  }

  create(req: DeclarationFiscaleSaveRequest): Observable<DeclarationFiscaleResponse> {
    return this.http.post<DeclarationFiscaleResponse>(this.base, req);
  }

  update(id: string, req: DeclarationFiscaleUpdateRequest): Observable<DeclarationFiscaleResponse> {
    return this.http.put<DeclarationFiscaleResponse>(`${this.base}/${id}`, req);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
