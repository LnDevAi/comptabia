import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  OffreResponse, OffreRequest, StatutOffre,
  CandidatureResponse, CandidatureRequest, StatutCandidature,
  PlanResponse, PlanRequest, TacheRequest
} from '../models/recrutement.model';

@Injectable({ providedIn: 'root' })
export class RecrutementService {
  private base = '/api/recrutement';
  constructor(private http: HttpClient) {}

  // Offres
  findOffres() {
    return this.http.get<OffreResponse[]>(`${this.base}/offres`);
  }

  createOffre(req: OffreRequest) {
    return this.http.post<OffreResponse>(`${this.base}/offres`, req);
  }

  updateStatutOffre(id: string, statut: StatutOffre) {
    const params = new HttpParams().set('statut', statut);
    return this.http.patch<OffreResponse>(`${this.base}/offres/${id}/statut`, {}, { params });
  }

  deleteOffre(id: string) {
    return this.http.delete<void>(`${this.base}/offres/${id}`);
  }

  // Candidatures
  findCandidatures() {
    return this.http.get<CandidatureResponse[]>(`${this.base}/candidatures`);
  }

  createCandidature(req: CandidatureRequest) {
    return this.http.post<CandidatureResponse>(`${this.base}/candidatures`, req);
  }

  avancerStatut(id: string, statut: StatutCandidature) {
    const params = new HttpParams().set('statut', statut);
    return this.http.patch<CandidatureResponse>(`${this.base}/candidatures/${id}/statut`, {}, { params });
  }

  deleteCandidature(id: string) {
    return this.http.delete<void>(`${this.base}/candidatures/${id}`);
  }

  // Onboarding
  findPlans() {
    return this.http.get<PlanResponse[]>(`${this.base}/onboarding`);
  }

  createPlan(req: PlanRequest) {
    return this.http.post<PlanResponse>(`${this.base}/onboarding`, req);
  }

  addTache(planId: string, req: TacheRequest) {
    return this.http.post<PlanResponse>(`${this.base}/onboarding/${planId}/taches`, req);
  }

  toggleTache(planId: string, tacheId: string) {
    return this.http.patch<PlanResponse>(`${this.base}/onboarding/${planId}/taches/${tacheId}/toggle`, {});
  }

  deleteTache(planId: string, tacheId: string) {
    return this.http.delete<void>(`${this.base}/onboarding/${planId}/taches/${tacheId}`);
  }

  deletePlan(id: string) {
    return this.http.delete<void>(`${this.base}/onboarding/${id}`);
  }
}
