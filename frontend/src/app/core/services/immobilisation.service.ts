import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  Immobilisation, ImmoRequest, ImmoStats, ImmoStatsCat,
  PlanAmortissement, DotationResult, CategorieImmo, StatutImmo
} from '../models/immobilisation.model';
import { PageResponse } from '../models/ecriture.model';

@Injectable({ providedIn: 'root' })
export class ImmobilisationService {

  constructor(private http: HttpClient) {}

  findAll(opts: {
    page?: number; size?: number;
    categorie?: CategorieImmo | '';
    statut?: StatutImmo | '';
    search?: string;
  } = {}) {
    let params = new HttpParams()
      .set('page', opts.page ?? 0)
      .set('size', opts.size ?? 20);
    if (opts.categorie) params = params.set('categorie', opts.categorie);
    if (opts.statut)    params = params.set('statut',    opts.statut);
    if (opts.search)    params = params.set('search',    opts.search);
    return this.http.get<PageResponse<Immobilisation>>('/api/immobilisations', { params });
  }

  stats() {
    return this.http.get<ImmoStats>('/api/immobilisations/stats');
  }

  statsParCategorie() {
    return this.http.get<ImmoStatsCat[]>('/api/immobilisations/stats-par-categorie');
  }

  plan(id: string) {
    return this.http.get<PlanAmortissement>(`/api/immobilisations/${id}/plan`);
  }

  create(payload: ImmoRequest) {
    return this.http.post<Immobilisation>('/api/immobilisations', payload);
  }

  update(id: string, payload: ImmoRequest) {
    return this.http.put<Immobilisation>(`/api/immobilisations/${id}`, payload);
  }

  ceder(id: string, dateCession: string) {
    return this.http.post<Immobilisation>(`/api/immobilisations/${id}/ceder`, null,
      { params: new HttpParams().set('dateCession', dateCession) });
  }

  doter(id: string, exercice: number) {
    return this.http.post<DotationResult>(`/api/immobilisations/${id}/doter`, null,
      { params: new HttpParams().set('exercice', exercice) });
  }

  delete(id: string) {
    return this.http.delete<void>(`/api/immobilisations/${id}`);
  }
}
