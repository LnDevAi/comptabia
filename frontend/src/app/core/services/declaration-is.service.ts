import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DeclarationIs, SaveRequest } from '../models/declaration-is.model';

@Injectable({ providedIn: 'root' })
export class DeclarationIsService {
  constructor(private http: HttpClient) {}

  lister() {
    return this.http.get<DeclarationIs[]>('/api/is');
  }

  getOrCompute(exercice: number) {
    return this.http.get<DeclarationIs>(`/api/is/${exercice}`);
  }

  sauvegarder(exercice: number, req: SaveRequest) {
    return this.http.put<DeclarationIs>(`/api/is/${exercice}`, req);
  }

  valider(exercice: number) {
    return this.http.post<DeclarationIs>(`/api/is/${exercice}/valider`, {});
  }
}
