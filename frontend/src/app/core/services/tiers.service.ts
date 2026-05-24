import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Tiers, TiersRequest, TiersStats, TypeTiers } from '../models/tiers.model';
import { PageResponse } from '../models/ecriture.model';

@Injectable({ providedIn: 'root' })
export class TiersService {

  constructor(private http: HttpClient) {}

  findAll(opts: {
    page?: number; size?: number;
    type?: TypeTiers | '';
    search?: string;
    actifOnly?: boolean;
  } = {}) {
    let params = new HttpParams()
      .set('page', opts.page ?? 0)
      .set('size', opts.size ?? 20);
    if (opts.type)    params = params.set('type', opts.type);
    if (opts.search)  params = params.set('search', opts.search);
    if (opts.actifOnly) params = params.set('actifOnly', 'true');
    return this.http.get<PageResponse<Tiers>>('/api/tiers', { params });
  }

  stats() {
    return this.http.get<TiersStats>('/api/tiers/stats');
  }

  create(payload: TiersRequest) {
    return this.http.post<Tiers>('/api/tiers', payload);
  }

  update(id: string, payload: TiersRequest) {
    return this.http.put<Tiers>(`/api/tiers/${id}`, payload);
  }

  toggleActif(id: string) {
    return this.http.post<Tiers>(`/api/tiers/${id}/toggle-actif`, {});
  }

  delete(id: string) {
    return this.http.delete<void>(`/api/tiers/${id}`);
  }
}
