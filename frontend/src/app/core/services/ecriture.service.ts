import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Ecriture, EcritureRequest, PageResponse } from '../models/ecriture.model';

@Injectable({ providedIn: 'root' })
export class EcritureService {

  constructor(private http: HttpClient) {}

  findAll(page = 0, size = 20, from?: string, to?: string) {
    let params = new HttpParams().set('page', page).set('size', size);
    if (from) params = params.set('from', from);
    if (to)   params = params.set('to', to);
    return this.http.get<PageResponse<Ecriture>>('/api/ecritures', { params });
  }

  findOne(id: string) {
    return this.http.get<Ecriture>(`/api/ecritures/${id}`);
  }

  create(payload: EcritureRequest) {
    return this.http.post<Ecriture>('/api/ecritures', payload);
  }

  valider(id: string) {
    return this.http.post<Ecriture>(`/api/ecritures/${id}/valider`, {});
  }

  supprimer(id: string) {
    return this.http.delete<void>(`/api/ecritures/${id}`);
  }
}
