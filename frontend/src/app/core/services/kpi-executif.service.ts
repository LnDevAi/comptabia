import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { KpiExecutifResponse } from '../models/kpi-executif.model';

@Injectable({ providedIn: 'root' })
export class KpiExecutifService {
  private http = inject(HttpClient);

  get(exercice: number): Observable<KpiExecutifResponse> {
    const params = new HttpParams().set('exercice', exercice);
    return this.http.get<KpiExecutifResponse>('/api/kpi-executif', { params });
  }
}
