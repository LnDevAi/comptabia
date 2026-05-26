import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreditSfdResponse, CreateCreditRequest, UpdateCreditRequest,
  CreditSfdDashboard, EtatResultatSfd
} from '../models/credit-sfd.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CreditSfdService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/credits-sfd`;
  private etatsBase = `${environment.apiUrl}/etats/sfd`;

  lister(): Observable<CreditSfdResponse[]> {
    return this.http.get<CreditSfdResponse[]>(this.base);
  }

  getDashboard(exercice?: number): Observable<CreditSfdDashboard> {
    let params = new HttpParams();
    if (exercice) params = params.set('exercice', exercice);
    return this.http.get<CreditSfdDashboard>(`${this.base}/dashboard`, { params });
  }

  creer(req: CreateCreditRequest): Observable<CreditSfdResponse> {
    return this.http.post<CreditSfdResponse>(this.base, req);
  }

  mettrAJour(id: string, req: UpdateCreditRequest): Observable<CreditSfdResponse> {
    return this.http.patch<CreditSfdResponse>(`${this.base}/${id}`, req);
  }

  supprimer(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  getEtatResultat(exercice?: number): Observable<EtatResultatSfd> {
    let params = new HttpParams();
    if (exercice) params = params.set('exercice', exercice);
    return this.http.get<EtatResultatSfd>(`${this.etatsBase}/resultat`, { params });
  }
}
