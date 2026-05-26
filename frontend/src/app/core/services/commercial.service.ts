import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DashboardCommercial,
  PlanRequest, PlanResponse,
  AbonnementRequest, AbonnementResponse,
  FactureRequest, FactureResponse,
  PaiementRequest, PaiementResponse
} from '../models/commercial.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CommercialService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/commercial`;

  // Dashboard
  getDashboard(): Observable<DashboardCommercial> {
    return this.http.get<DashboardCommercial>(`${this.base}/dashboard`);
  }

  // Plans
  listerPlans(): Observable<PlanResponse[]> {
    return this.http.get<PlanResponse[]>(`${this.base}/plans`);
  }

  creerPlan(req: PlanRequest): Observable<PlanResponse> {
    return this.http.post<PlanResponse>(`${this.base}/plans`, req);
  }

  mettreAJourPlan(id: string, req: PlanRequest): Observable<PlanResponse> {
    return this.http.put<PlanResponse>(`${this.base}/plans/${id}`, req);
  }

  supprimerPlan(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/plans/${id}`);
  }

  // Abonnements
  listerAbonnements(): Observable<AbonnementResponse[]> {
    return this.http.get<AbonnementResponse[]>(`${this.base}/abonnements`);
  }

  creerAbonnement(req: AbonnementRequest): Observable<AbonnementResponse> {
    return this.http.post<AbonnementResponse>(`${this.base}/abonnements`, req);
  }

  mettreAJourAbonnement(id: string, req: AbonnementRequest): Observable<AbonnementResponse> {
    return this.http.put<AbonnementResponse>(`${this.base}/abonnements/${id}`, req);
  }

  supprimerAbonnement(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/abonnements/${id}`);
  }

  telechargerLicence(abonnementId: string): Observable<Blob> {
    return this.http.get(`${this.base}/abonnements/${abonnementId}/licence`, { responseType: 'blob' });
  }

  // Factures
  listerFactures(): Observable<FactureResponse[]> {
    return this.http.get<FactureResponse[]>(`${this.base}/factures`);
  }

  listerFacturesClient(abonnementId: string): Observable<FactureResponse[]> {
    return this.http.get<FactureResponse[]>(`${this.base}/abonnements/${abonnementId}/factures`);
  }

  genererFacture(req: FactureRequest): Observable<FactureResponse> {
    return this.http.post<FactureResponse>(`${this.base}/factures`, req);
  }

  changerStatutFacture(id: string, statut: string): Observable<FactureResponse> {
    return this.http.patch<FactureResponse>(`${this.base}/factures/${id}/statut`, null, {
      params: { statut }
    });
  }

  // Paiements
  enregistrerPaiement(req: PaiementRequest): Observable<PaiementResponse> {
    return this.http.post<PaiementResponse>(`${this.base}/paiements`, req);
  }
}
