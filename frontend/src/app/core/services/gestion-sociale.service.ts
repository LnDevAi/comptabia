import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CotisationRefResponse, OrganismeResume, CalculRequest, CalculResult,
  DeclarationSocialeResponse, DeclarationSocialeSaveRequest, DeclarationSocialeUpdateRequest
} from '../models/social.model';

@Injectable({ providedIn: 'root' })
export class GestionSocialeService {
  private http = inject(HttpClient);
  private base = '/api/social';

  refParPays(codePays: string): Observable<CotisationRefResponse[]> {
    return this.http.get<CotisationRefResponse[]>(`${this.base}/ref`, { params: { codePays } });
  }

  organismesByPays(codePays: string): Observable<OrganismeResume[]> {
    return this.http.get<OrganismeResume[]>(`${this.base}/ref/organismes`, { params: { codePays } });
  }

  calculer(codePays: string, req: CalculRequest): Observable<CalculResult> {
    return this.http.post<CalculResult>(`${this.base}/calculer`, req, { params: { codePays } });
  }

  findAll(): Observable<DeclarationSocialeResponse[]> {
    return this.http.get<DeclarationSocialeResponse[]>(this.base);
  }

  findByAnnee(annee: number): Observable<DeclarationSocialeResponse[]> {
    return this.http.get<DeclarationSocialeResponse[]>(`${this.base}/annee/${annee}`);
  }

  create(req: DeclarationSocialeSaveRequest): Observable<DeclarationSocialeResponse> {
    return this.http.post<DeclarationSocialeResponse>(this.base, req);
  }

  update(id: string, req: DeclarationSocialeUpdateRequest): Observable<DeclarationSocialeResponse> {
    return this.http.put<DeclarationSocialeResponse>(`${this.base}/${id}`, req);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
