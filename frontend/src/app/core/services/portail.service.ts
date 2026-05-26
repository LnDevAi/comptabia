import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PortailTableau } from '../models/portail.model';

@Injectable({ providedIn: 'root' })
export class PortailService {
  constructor(private http: HttpClient) {}

  getTableau() {
    return this.http.get<PortailTableau>('/api/portail');
  }
}
