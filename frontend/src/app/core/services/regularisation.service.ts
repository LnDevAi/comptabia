import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RegularisationResponse, RegularisationSaveRequest } from '../models/regularisation.model';

@Injectable({ providedIn: 'root' })
export class RegularisationService {
  private http = inject(HttpClient);
  private base = '/api/regularisations';

  list(exercice: number): Observable<RegularisationResponse[]> {
    const params = new HttpParams().set('exercice', exercice);
    return this.http.get<RegularisationResponse[]>(this.base, { params });
  }

  create(req: RegularisationSaveRequest): Observable<RegularisationResponse> {
    return this.http.post<RegularisationResponse>(this.base, req);
  }

  update(id: string, req: RegularisationSaveRequest): Observable<RegularisationResponse> {
    return this.http.put<RegularisationResponse>(`${this.base}/${id}`, req);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  comptabiliser(id: string): Observable<RegularisationResponse> {
    return this.http.post<RegularisationResponse>(`${this.base}/${id}/comptabiliser`, {});
  }

  extourner(id: string): Observable<RegularisationResponse> {
    return this.http.post<RegularisationResponse>(`${this.base}/${id}/extourner`, {});
  }
}
