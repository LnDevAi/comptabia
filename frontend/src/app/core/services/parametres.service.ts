import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EntrepriseParametres } from '../models/parametres.model';

@Injectable({ providedIn: 'root' })
export class ParametresService {
  constructor(private http: HttpClient) {}

  get() {
    return this.http.get<EntrepriseParametres>('/api/parametres');
  }

  update(data: Partial<EntrepriseParametres>) {
    return this.http.put<EntrepriseParametres>('/api/parametres', data);
  }
}
