import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DashboardStock, DepotRequest, DepotResponse,
  ArticleRequest, ArticleResponse, StatsArticle,
  MouvementRequest, MouvementResponse,
  LigneInventaire, AjustementInventaireRequest,
  PageResponse
} from '../models/stock.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StockService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/stocks`;

  getDashboard(): Observable<DashboardStock> {
    return this.http.get<DashboardStock>(`${this.base}/dashboard`);
  }

  // Dépôts
  listerDepots(): Observable<DepotResponse[]> {
    return this.http.get<DepotResponse[]>(`${this.base}/depots`);
  }

  creerDepot(req: DepotRequest): Observable<DepotResponse> {
    return this.http.post<DepotResponse>(`${this.base}/depots`, req);
  }

  mettreAJourDepot(id: string, req: DepotRequest): Observable<DepotResponse> {
    return this.http.put<DepotResponse>(`${this.base}/depots/${id}`, req);
  }

  // Articles
  listerArticles(params: { categorie?: string; actif?: boolean; search?: string; page?: number; size?: number }): Observable<PageResponse<ArticleResponse>> {
    let p = new HttpParams();
    if (params.categorie) p = p.set('categorie', params.categorie);
    if (params.actif !== undefined) p = p.set('actif', String(params.actif));
    if (params.search) p = p.set('search', params.search);
    if (params.page !== undefined) p = p.set('page', String(params.page));
    if (params.size !== undefined) p = p.set('size', String(params.size));
    return this.http.get<PageResponse<ArticleResponse>>(`${this.base}/articles`, { params: p });
  }

  statsArticle(id: string): Observable<StatsArticle> {
    return this.http.get<StatsArticle>(`${this.base}/articles/${id}/stats`);
  }

  creerArticle(req: ArticleRequest): Observable<ArticleResponse> {
    return this.http.post<ArticleResponse>(`${this.base}/articles`, req);
  }

  mettreAJourArticle(id: string, req: ArticleRequest): Observable<ArticleResponse> {
    return this.http.put<ArticleResponse>(`${this.base}/articles/${id}`, req);
  }

  supprimerArticle(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/articles/${id}`);
  }

  // Mouvements
  listerMouvements(params: {
    articleId?: string; type?: string;
    debut?: string; fin?: string;
    page?: number; size?: number
  }): Observable<PageResponse<MouvementResponse>> {
    let p = new HttpParams();
    if (params.articleId) p = p.set('articleId', params.articleId);
    if (params.type) p = p.set('type', params.type);
    if (params.debut) p = p.set('debut', params.debut);
    if (params.fin) p = p.set('fin', params.fin);
    if (params.page !== undefined) p = p.set('page', String(params.page));
    if (params.size !== undefined) p = p.set('size', String(params.size));
    return this.http.get<PageResponse<MouvementResponse>>(`${this.base}/mouvements`, { params: p });
  }

  enregistrerMouvement(req: MouvementRequest): Observable<MouvementResponse> {
    return this.http.post<MouvementResponse>(`${this.base}/mouvements`, req);
  }

  // Inventaire
  preparerInventaire(): Observable<LigneInventaire[]> {
    return this.http.get<LigneInventaire[]>(`${this.base}/inventaire`);
  }

  ajusterInventaire(req: AjustementInventaireRequest): Observable<MouvementResponse[]> {
    return this.http.post<MouvementResponse[]>(`${this.base}/inventaire/ajuster`, req);
  }
}
