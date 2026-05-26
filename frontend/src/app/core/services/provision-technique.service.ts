import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  ProvisionTechniqueResponse,
  CreateProvisionRequest,
  UpdateProvisionRequest,
  ProvisionDashboard,
  BilanCima,
  CompteResultatCima
} from '../models/provision-technique.model';

@Injectable({ providedIn: 'root' })
export class ProvisionTechniqueService {
  private base      = '/api/provisions-techniques';
  private etatsBase = '/api/etats/cima';

  constructor(private http: HttpClient) {}

  lister() {
    return this.http.get<ProvisionTechniqueResponse[]>(this.base);
  }

  listerParExercice(exercice: number) {
    return this.http.get<ProvisionTechniqueResponse[]>(`${this.base}/exercice/${exercice}`);
  }

  getDashboard(exercice: number) {
    const params = new HttpParams().set('exercice', exercice);
    return this.http.get<ProvisionDashboard>(`${this.base}/dashboard`, { params });
  }

  creer(req: CreateProvisionRequest) {
    return this.http.post<ProvisionTechniqueResponse>(this.base, req);
  }

  mettrAJour(id: string, req: UpdateProvisionRequest) {
    return this.http.patch<ProvisionTechniqueResponse>(`${this.base}/${id}`, req);
  }

  supprimer(id: string) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  getBilanCima(exercice: number) {
    const params = new HttpParams().set('exercice', exercice);
    return this.http.get<BilanCima>(`${this.etatsBase}/bilan`, { params });
  }

  getCompteResultatCima(exercice: number) {
    const params = new HttpParams().set('exercice', exercice);
    return this.http.get<CompteResultatCima>(`${this.etatsBase}/resultat-technique`, { params });
  }
}
