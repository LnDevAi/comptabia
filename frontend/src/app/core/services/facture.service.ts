import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  FactureDetail, FactureResume, FactureCreateRequest, FactureStatut,
  PayerRequest, NormalisationRequest
} from '../models/facture.model';

export interface PagedFactures {
  content:          FactureResume[];
  totalElements:    number;
  totalPages:       number;
  number:           number;
}

@Injectable({ providedIn: 'root' })
export class FactureService {
  constructor(private http: HttpClient) {}

  findAll(statut?: FactureStatut, page = 0, size = 20) {
    let params = new HttpParams().set('page', page).set('size', size).set('sort', 'dateFacture,desc');
    if (statut) params = params.set('statut', statut);
    return this.http.get<PagedFactures>('/api/factures', { params });
  }

  findOne(id: string) {
    return this.http.get<FactureDetail>(`/api/factures/${id}`);
  }

  create(req: FactureCreateRequest) {
    return this.http.post<FactureDetail>('/api/factures', req);
  }

  update(id: string, req: FactureCreateRequest) {
    return this.http.put<FactureDetail>(`/api/factures/${id}`, req);
  }

  delete(id: string) {
    return this.http.delete<void>(`/api/factures/${id}`);
  }

  emettre(id: string) {
    return this.http.post<FactureDetail>(`/api/factures/${id}/emettre`, {});
  }

  payer(id: string, req: PayerRequest) {
    return this.http.post<FactureDetail>(`/api/factures/${id}/payer`, req);
  }

  annuler(id: string) {
    return this.http.post<FactureDetail>(`/api/factures/${id}/annuler`, {});
  }

  normaliser(id: string, req: NormalisationRequest) {
    return this.http.post<FactureDetail>(`/api/factures/${id}/normaliser`, req);
  }
}
