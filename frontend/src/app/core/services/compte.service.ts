import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Compte, CompteRequest } from '../models/compte.model';

@Injectable({ providedIn: 'root' })
export class CompteService {

  constructor(private http: HttpClient) {}

  findAll() {
    return this.http.get<Compte[]>('/api/comptes');
  }

  findByClasse(classe: number) {
    return this.http.get<Compte[]>(`/api/comptes/classe/${classe}`);
  }

  create(payload: CompteRequest) {
    return this.http.post<Compte>('/api/comptes', payload);
  }

  toggleActif(id: string) {
    return this.http.patch<void>(`/api/comptes/${id}/toggle`, {});
  }
}
