import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { DevisDetail, DevisResume, DevisSaveRequest, DevisStatut } from '../models/devis.model';
import { FactureDetail } from '../models/facture.model';

export interface PagedDevis {
  content:       DevisResume[];
  totalElements: number;
  totalPages:    number;
  number:        number;
}

@Injectable({ providedIn: 'root' })
export class DevisService {
  constructor(private http: HttpClient) {}

  findAll(statut?: DevisStatut, page = 0, size = 20) {
    let params = new HttpParams().set('page', page).set('size', size).set('sort', 'dateDevis,desc');
    if (statut) params = params.set('statut', statut);
    return this.http.get<PagedDevis>('/api/devis', { params });
  }

  findOne(id: string) {
    return this.http.get<DevisDetail>(`/api/devis/${id}`);
  }

  create(req: DevisSaveRequest) {
    return this.http.post<DevisDetail>('/api/devis', req);
  }

  update(id: string, req: DevisSaveRequest) {
    return this.http.put<DevisDetail>(`/api/devis/${id}`, req);
  }

  delete(id: string) {
    return this.http.delete<void>(`/api/devis/${id}`);
  }

  envoyer(id: string) {
    return this.http.post<DevisDetail>(`/api/devis/${id}/envoyer`, {});
  }

  changerStatut(id: string, statut: DevisStatut) {
    return this.http.post<DevisDetail>(`/api/devis/${id}/statut/${statut}`, {});
  }

  convertir(id: string) {
    return this.http.post<FactureDetail>(`/api/devis/${id}/convertir`, {});
  }
}
