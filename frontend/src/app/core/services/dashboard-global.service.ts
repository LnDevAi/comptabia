import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { DashboardGlobal } from '../models/dashboard-global.model';

@Injectable({ providedIn: 'root' })
export class DashboardGlobalService {
  constructor(private http: HttpClient) {}

  get(exercice: number) {
    return this.http.get<DashboardGlobal>('/api/dashboard-global',
      { params: new HttpParams().set('exercice', exercice) });
  }
}
