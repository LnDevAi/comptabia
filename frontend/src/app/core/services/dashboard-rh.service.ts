import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ComparatifRh, DashboardRh } from '../models/dashboard-rh.model';

@Injectable({ providedIn: 'root' })
export class DashboardRhService {
  constructor(private http: HttpClient) {}

  get() {
    return this.http.get<DashboardRh>('/api/dashboard-rh');
  }

  getComparatif(annee?: number) {
    const params = annee ? new HttpParams().set('annee', annee) : undefined;
    return this.http.get<ComparatifRh>('/api/dashboard-rh/comparatif', { params });
  }
}
