import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DashboardRh } from '../models/dashboard-rh.model';

@Injectable({ providedIn: 'root' })
export class DashboardRhService {
  constructor(private http: HttpClient) {}

  get() {
    return this.http.get<DashboardRh>('/api/dashboard-rh');
  }
}
