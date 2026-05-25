import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  TauxResponse, TauxLatest, SoldeDevise,
  TauxRequest, ConversionRequest, ConversionResponse
} from '../models/devise.model';

@Injectable({ providedIn: 'root' })
export class DeviseService {
  private http = inject(HttpClient);
  private base = '/api/devises';

  listTaux(): Observable<TauxResponse[]> {
    return this.http.get<TauxResponse[]>(`${this.base}/taux`);
  }

  tauxLatest(): Observable<TauxLatest[]> {
    return this.http.get<TauxLatest[]>(`${this.base}/taux/latest`);
  }

  upsertTaux(req: TauxRequest): Observable<TauxResponse> {
    return this.http.post<TauxResponse>(`${this.base}/taux`, req);
  }

  deleteTaux(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/taux/${id}`);
  }

  soldesParDevise(): Observable<SoldeDevise[]> {
    return this.http.get<SoldeDevise[]>(`${this.base}/soldes`);
  }

  convertir(req: ConversionRequest): Observable<ConversionResponse> {
    return this.http.post<ConversionResponse>(`${this.base}/convertir`, req);
  }
}
