import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PretResponse, PretRequest } from '../models/pret.model';

@Injectable({ providedIn: 'root' })
export class PretService {
  private base = '/api/prets';
  constructor(private http: HttpClient) {}

  findAll() {
    return this.http.get<PretResponse[]>(this.base);
  }

  findByCollaborateur(collabId: string) {
    return this.http.get<PretResponse[]>(`${this.base}/collaborateur/${collabId}`);
  }

  create(req: PretRequest) {
    return this.http.post<PretResponse>(this.base, req);
  }

  approuver(id: string) {
    return this.http.post<PretResponse>(`${this.base}/${id}/approuver`, {});
  }

  refuser(id: string) {
    return this.http.post<PretResponse>(`${this.base}/${id}/refuser`, {});
  }

  prelevEcheance(pretId: string, echeanceId: string) {
    return this.http.post<PretResponse>(`${this.base}/${pretId}/echeances/${echeanceId}/prelever`, {});
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
