import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ProduitIslamiqueResponse, CreateProduitRequest, UpdateProduitRequest,
  IslamiqueDashboard, ZakatResponse, ZakatCreateRequest, ZakatUpdateRequest,
  EtatResultatIslamique
} from '../models/finance-islamique.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FinanceIslamiqueService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/finance-islamique`;

  lister(): Observable<ProduitIslamiqueResponse[]> {
    return this.http.get<ProduitIslamiqueResponse[]>(`${this.base}/produits`);
  }

  getDashboard(exercice?: number): Observable<IslamiqueDashboard> {
    let params = new HttpParams();
    if (exercice) params = params.set('exercice', exercice);
    return this.http.get<IslamiqueDashboard>(`${this.base}/dashboard`, { params });
  }

  getEtatResultat(exercice?: number): Observable<EtatResultatIslamique> {
    let params = new HttpParams();
    if (exercice) params = params.set('exercice', exercice);
    return this.http.get<EtatResultatIslamique>(`${this.base}/etat-resultat`, { params });
  }

  creer(req: CreateProduitRequest): Observable<ProduitIslamiqueResponse> {
    return this.http.post<ProduitIslamiqueResponse>(`${this.base}/produits`, req);
  }

  mettrAJour(id: string, req: UpdateProduitRequest): Observable<ProduitIslamiqueResponse> {
    return this.http.patch<ProduitIslamiqueResponse>(`${this.base}/produits/${id}`, req);
  }

  supprimer(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/produits/${id}`);
  }

  listerZakat(): Observable<ZakatResponse[]> {
    return this.http.get<ZakatResponse[]>(`${this.base}/zakat`);
  }

  calculerZakat(req: ZakatCreateRequest): Observable<ZakatResponse> {
    return this.http.post<ZakatResponse>(`${this.base}/zakat`, req);
  }

  mettreAJourZakat(id: string, req: ZakatUpdateRequest): Observable<ZakatResponse> {
    return this.http.patch<ZakatResponse>(`${this.base}/zakat/${id}`, req);
  }
}
