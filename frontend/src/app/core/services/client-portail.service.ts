import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PortailTokenResponse, FactureClientResponse } from '../models/client-portail.model';

@Injectable({ providedIn: 'root' })
export class ClientPortailService {

  private readonly http = inject(HttpClient);

  requestOtp(entrepriseId: string, email: string): Observable<void> {
    return this.http.post<void>(`/api/portail/${entrepriseId}/auth`, { email });
  }

  verify(entrepriseId: string, email: string, code: string): Observable<PortailTokenResponse> {
    return this.http.post<PortailTokenResponse>(`/api/portail/${entrepriseId}/verify`, { email, code });
  }

  getFactures(token: string): Observable<FactureClientResponse[]> {
    return this.http.get<FactureClientResponse[]>('/api/portail/factures', {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
    });
  }

  getFacture(token: string, id: string): Observable<FactureClientResponse> {
    return this.http.get<FactureClientResponse>(`/api/portail/factures/${id}`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
    });
  }
}
