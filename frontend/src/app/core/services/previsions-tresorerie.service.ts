import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  PrevisionResponse,
  FluxManuelForm,
  FluxManuelResponse
} from '../models/previsions-tresorerie.model';

@Injectable({ providedIn: 'root' })
export class PrevisionsTresorerieService {
  private http = inject(HttpClient);
  private base = '/api/previsions-tresorerie';

  getProjection(semaines = 13, seuil = 0): Observable<PrevisionResponse> {
    const params = new HttpParams()
      .set('semaines', semaines)
      .set('seuil', seuil);
    return this.http.get<PrevisionResponse>(this.base, { params });
  }

  listFlux(): Observable<FluxManuelResponse[]> {
    return this.http.get<FluxManuelResponse[]>(`${this.base}/flux`);
  }

  addFlux(req: FluxManuelForm): Observable<FluxManuelResponse> {
    return this.http.post<FluxManuelResponse>(`${this.base}/flux`, req);
  }

  deleteFlux(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/flux/${id}`);
  }
}
